import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const listUserMemory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ memory_type: z.string().optional() }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    let query = context.supabase
      .from("user_memory")
      .select("*")
      .eq("user_id", context.userId)
      .order("updated_at", { ascending: false });
    if (data.memory_type) {
      query = query.eq("memory_type", data.memory_type);
    }
    const { data: rows, error } = await query.limit(100);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const setMemory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      memory_type: z.enum(['preference','project','planner','category','style','fact','routine','note']),
      key: z.string().min(1).max(200),
      value: z.record(z.string(), z.unknown()),
      confidence: z.number().min(0).max(1).default(1.0),
      source: z.string().max(100).default('manual'),
      expires_at: z.string().nullable().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("user_memory")
      .upsert({
        user_id: context.userId,
        memory_type: data.memory_type,
        key: data.key,
        value: data.value as never,
        confidence: data.confidence,
        source: data.source,
        expires_at: data.expires_at ?? null,
      }, { onConflict: "user_id,memory_type,key" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteMemory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("user_memory")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const clearMemory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ memory_type: z.string().optional() }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    let query = context.supabase
      .from("user_memory")
      .delete()
      .eq("user_id", context.userId);
    if (data.memory_type) {
      query = query.eq("memory_type", data.memory_type);
    }
    const { error } = await query;
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Build user preferences summary from memory
export const getUserPreferences = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: rows } = await context.supabase
      .from("user_memory")
      .select("*")
      .eq("user_id", context.userId)
      .eq("memory_type", "preference")
      .gte("confidence", 0.5);
    const prefs: Record<string, unknown> = {};
    for (const row of rows ?? []) {
      prefs[row.key] = row.value;
    }
    // Also fetch profile preferences
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("favorite_categories, timezone, locale")
      .eq("id", context.userId)
      .maybeSingle();
    return {
      ...prefs,
      favoriteCategories: profile?.favorite_categories ?? [],
      timezone: profile?.timezone ?? 'America/Sao_Paulo',
      locale: profile?.locale ?? 'pt-BR',
    };
  });

// RAG connectors
export const listRagConnectors = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("rag_connectors")
      .select("*")
      .eq("is_active", true);
    if (error) throw new Error(error.message);
    return data ?? [];
  });
