import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const listAvatars = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("avatars")
      .select("*")
      .eq("is_active", true)
      .order("sort", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getAvatar = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("avatars")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateUserAvatar = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      avatar_type: z.enum(['none', 'library', 'upload']),
      avatar_id: z.string().uuid().nullable().optional(),
      photo_url: z.string().max(2000).nullable().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const update: Record<string, unknown> = {
      avatar_type: data.avatar_type,
    };
    if (data.avatar_id !== undefined) update.avatar_id = data.avatar_id;
    else if (data.avatar_type !== 'library') update.avatar_id = null;
    if (data.photo_url !== undefined) update.photo_url = data.photo_url;
    else if (data.avatar_type !== 'upload') update.photo_url = null;

    const { error } = await context.supabase
      .from("profiles")
      .update(update as never)
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getUserProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("*, avatar:avatar_id(slug, name, category, style)")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

export const updateUserProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      full_name: z.string().max(200).nullable().optional(),
      bio: z.string().max(2000).nullable().optional(),
      locale: z.string().min(2).max(10).optional(),
      timezone: z.string().max(50).optional(),
      country: z.string().max(10).optional(),
      favorite_categories: z.array(z.string()).optional(),
      social_links: z.record(z.string(), z.string()).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const update: Record<string, unknown> = {};
    if (data.full_name !== undefined) update.full_name = data.full_name;
    if (data.bio !== undefined) update.bio = data.bio;
    if (data.locale !== undefined) update.locale = data.locale;
    if (data.timezone !== undefined) update.timezone = data.timezone;
    if (data.country !== undefined) update.country = data.country;
    if (data.favorite_categories !== undefined) update.favorite_categories = data.favorite_categories;
    if (data.social_links !== undefined) {
      const { data: current } = await context.supabase
        .from("profiles")
        .select("social_links")
        .eq("id", context.userId)
        .maybeSingle();
      update.social_links = { ...((current?.social_links as Record<string, string>) ?? {}), ...data.social_links };
    }
    const { error } = await context.supabase
      .from("profiles")
      .update(update as never)
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
