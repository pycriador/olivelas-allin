import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const listAiProviders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("ai_providers")
      .select("*")
      .order("is_system", { ascending: false })
      .order("name", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getAiProvider = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("ai_providers")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });

export const saveAiProvider = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      id: z.string().uuid(),
      name: z.string().min(1).max(200).optional(),
      base_url: z.string().max(500).nullable().optional(),
      api_key: z.string().max(2000).nullable().optional(),
      models: z.array(z.object({ id: z.string(), label: z.string() })).optional(),
      config: z.record(z.string(), z.unknown()).optional(),
      is_active: z.boolean().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const update: Record<string, unknown> = {};
    if (data.name !== undefined) update.name = data.name;
    if (data.base_url !== undefined) update.base_url = data.base_url;
    if (data.api_key !== undefined) update.api_key = data.api_key;
    if (data.models !== undefined) update.models = data.models;
    if (data.config !== undefined) update.config = data.config;
    if (data.is_active !== undefined) update.is_active = data.is_active;
    const { error } = await context.supabase
      .from("ai_providers")
      .update(update as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const testAiProvider = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      provider_slug: z.string(),
      model: z.string(),
      message: z.string().default("Olá! Responda com 'OK' se estiver funcionando."),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: provider } = await context.supabase
      .from("ai_providers")
      .select("*")
      .eq("slug", data.provider_slug)
      .maybeSingle();
    if (!provider) throw new Error("Provider não encontrado");
    const start = Date.now();
    try {
      const response = await fetch(`${provider.base_url}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(provider.api_key ? { Authorization: `Bearer ${provider.api_key}` } : {}),
        } as Record<string, string>,
        body: JSON.stringify({
          model: data.model,
          messages: [{ role: 'user', content: data.message }],
          max_tokens: 50,
        }),
      });
      const elapsed = Date.now() - start;
      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}`, elapsed_ms: elapsed };
      }
      const json = await response.json();
      return {
        success: true,
        content: json.choices?.[0]?.message?.content ?? '',
        model: json.model ?? data.model,
        elapsed_ms: elapsed,
      };
    } catch (err) {
      return { success: false, error: (err as Error).message, elapsed_ms: Date.now() - start };
    }
  });
