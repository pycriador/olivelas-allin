import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const logAiAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      action_type: z.string(),
      source: z.enum(['assistant','suggestion','auto','insight','action']).default('assistant'),
      input_data: z.record(z.string(), z.unknown()).default({}),
      output_data: z.record(z.string(), z.unknown()).default({}),
      model_used: z.string().nullable().optional(),
      provider_slug: z.string().nullable().optional(),
      tokens_used: z.number().int().nullable().optional(),
      execution_time_ms: z.number().int().nullable().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("user_ai_actions")
      .insert({
        user_id: context.userId,
        action_type: data.action_type,
        source: data.source,
        input_data: data.input_data as never,
        output_data: data.output_data as never,
        model_used: data.model_used ?? null,
        provider_slug: data.provider_slug ?? null,
        tokens_used: data.tokens_used ?? null,
        execution_time_ms: data.execution_time_ms ?? null,
      });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listUserAiActions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      limit: z.number().int().min(1).max(100).default(20),
      action_type: z.string().optional(),
    }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    let query = context.supabase
      .from("user_ai_actions")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.action_type) {
      query = query.eq("action_type", data.action_type);
    }
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const trackActionUsage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      provider_slug: z.string(),
      model_used: z.string(),
      tokens: z.number().int().default(0),
      execution_time_ms: z.number().int().default(0),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const today = new Date().toISOString().split('T')[0];
    const { data: existing } = await context.supabase
      .from("ai_usage_stats")
      .select("id, requests_count, total_tokens, total_execution_ms")
      .eq("user_id", context.userId)
      .eq("date", today)
      .eq("provider_slug", data.provider_slug)
      .eq("model_used", data.model_used)
      .maybeSingle();
    if (existing) {
      await context.supabase
        .from("ai_usage_stats")
        .update({
          requests_count: existing.requests_count + 1,
          total_tokens: existing.total_tokens + data.tokens,
          total_execution_ms: existing.total_execution_ms + data.execution_time_ms,
        })
        .eq("id", existing.id);
    } else {
      await context.supabase
        .from("ai_usage_stats")
        .insert({
          user_id: context.userId,
          date: today,
          provider_slug: data.provider_slug,
          model_used: data.model_used,
          requests_count: 1,
          total_tokens: data.tokens,
          total_execution_ms: data.execution_time_ms,
        });
    }
    return { ok: true };
  });
