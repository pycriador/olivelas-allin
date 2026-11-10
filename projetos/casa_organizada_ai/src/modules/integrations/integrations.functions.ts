import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const listIntegrations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("integrations")
      .select("*")
      .eq("user_id", context.userId)
      .order("provider", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getIntegration = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("integrations")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });

export const connectIntegration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      provider: z.enum(['google_calendar','outlook_calendar','google_drive','onedrive','dropbox','gmail','outlook_mail','zapier','make','n8n','custom']),
      name: z.string().min(1).max(200),
      config: z.record(z.string(), z.unknown()).default({}),
      credentials: z.record(z.string(), z.unknown()).default({}),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: integration, error } = await context.supabase
      .from("integrations")
      .insert({
        user_id: context.userId,
        provider: data.provider,
        name: data.name,
        config: data.config as never,
        credentials: data.credentials as never,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return integration;
  });

export const updateIntegration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      id: z.string().uuid(),
      name: z.string().min(1).max(200).optional(),
      config: z.record(z.string(), z.unknown()).optional(),
      credentials: z.record(z.string(), z.unknown()).optional(),
      is_active: z.boolean().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const update: Record<string, unknown> = {};
    if (data.name !== undefined) update.name = data.name;
    if (data.config !== undefined) update.config = data.config;
    if (data.credentials !== undefined) update.credentials = data.credentials;
    if (data.is_active !== undefined) update.is_active = data.is_active;
    const { error } = await context.supabase
      .from("integrations")
      .update(update as never)
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteIntegration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("integrations")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getIntegrationLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ integration_id: z.string().uuid(), limit: z.number().int().min(1).max(50).default(20) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: logs, error } = await context.supabase
      .from("integration_logs")
      .select("*")
      .eq("integration_id", data.integration_id)
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (error) throw new Error(error.message);
    return logs ?? [];
  });
