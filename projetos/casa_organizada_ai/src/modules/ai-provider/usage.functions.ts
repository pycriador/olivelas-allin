import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const trackAiUsage = createServerFn({ method: "POST" })
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

export const getAiUsageStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      days: z.number().int().min(1).max(365).default(30),
    }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    const since = new Date();
    since.setDate(since.getDate() - data.days);
    const { data: stats, error } = await context.supabase
      .from("ai_usage_stats")
      .select("*")
      .eq("user_id", context.userId)
      .gte("date", since.toISOString().split('T')[0])
      .order("date", { ascending: false });
    if (error) throw new Error(error.message);
    return stats ?? [];
  });
