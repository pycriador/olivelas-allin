import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const getDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const userId = context.userId;

    // Get form count
    const { count: formsCount } = await context.supabase
      .from("forms")
      .select("*", { count: "exact", head: true })
      .eq("owner_id", userId);

    // Get AI actions count (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const { count: aiActionsCount } = await context.supabase
      .from("user_ai_actions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", thirtyDaysAgo.toISOString());

    // Get AI threads count
    const { count: threadsCount } = await context.supabase
      .from("ai_threads")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    // Get template downloads count
    const { count: downloadsCount } = await context.supabase
      .from("template_downloads")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    // Get recent insights
    const { data: recentInsights } = await context.supabase
      .from("user_insights")
      .select("*")
      .eq("user_id", userId)
      .order("generated_at", { ascending: false })
      .limit(3);

    // Get recent AI actions by type
    const { data: recentActions } = await context.supabase
      .from("user_ai_actions")
      .select("action_type")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    // Calculate action type distribution
    const actionCounts: Record<string, number> = {};
    for (const action of recentActions ?? []) {
      actionCounts[action.action_type] = (actionCounts[action.action_type] ?? 0) + 1;
    }

    // Get AI usage stats
    const { data: usageStats } = await context.supabase
      .from("ai_usage_stats")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(30);

    const totalTokensUsed = (usageStats ?? []).reduce((sum, s) => sum + s.total_tokens, 0);
    const totalRequests = (usageStats ?? []).reduce((sum, s) => sum + s.requests_count, 0);

    return {
      formsCount: formsCount ?? 0,
      aiActionsCount: aiActionsCount ?? 0,
      threadsCount: threadsCount ?? 0,
      downloadsCount: downloadsCount ?? 0,
      recentInsights: recentInsights ?? [],
      actionCounts,
      totalTokensUsed,
      totalRequests,
      usageStats: usageStats ?? [],
    };
  });

export const generateInsight = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      period: z.enum(['daily', 'weekly', 'monthly']),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const now = new Date();
    let periodStart: Date;
    let periodEnd: Date;

    if (data.period === 'daily') {
      periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      periodEnd = new Date(periodStart);
      periodEnd.setDate(periodEnd.getDate() + 1);
    } else if (data.period === 'weekly') {
      periodStart = new Date(now);
      periodStart.setDate(now.getDate() - now.getDay());
      periodStart.setHours(0, 0, 0, 0);
      periodEnd = new Date(periodStart);
      periodEnd.setDate(periodEnd.getDate() + 7);
    } else {
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    }

    // Check if already exists
    const { data: existing } = await context.supabase
      .from("user_insights")
      .select("id, summary")
      .eq("user_id", context.userId)
      .eq("period", data.period)
      .eq("period_start", periodStart.toISOString().split('T')[0])
      .maybeSingle();

    if (existing) return existing;

    // Gather data for insight generation
    const { count: formsCreated } = await context.supabase
      .from("forms")
      .select("*", { count: "exact", head: true })
      .eq("owner_id", context.userId)
      .gte("created_at", periodStart.toISOString());

    const { count: aiInteractions } = await context.supabase
      .from("user_ai_actions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", context.userId)
      .gte("created_at", periodStart.toISOString());

    const summary = `Resumo ${data.period === 'daily' ? 'diário' : data.period === 'weekly' ? 'semanal' : 'mensal'}: ${formsCreated} formulários criados, ${aiInteractions} interações com IA.`;

    const { data: insight, error } = await context.supabase
      .from("user_insights")
      .insert({
        user_id: context.userId,
        period: data.period,
        period_start: periodStart.toISOString().split('T')[0],
        period_end: periodEnd.toISOString().split('T')[0],
        summary,
        indicators: {
          formsCreated,
          aiInteractions,
        },
        suggestions: formsCreated === 0 ? ['Crie seu primeiro formulário'] : [],
      })
      .select("id, summary, indicators, suggestions, generated_at")
      .single();

    if (error) throw new Error(error.message);
    return insight;
  });

export const listInsights = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ period: z.enum(['daily', 'weekly', 'monthly']).optional() }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    let query = context.supabase
      .from("user_insights")
      .select("*")
      .eq("user_id", context.userId)
      .order("generated_at", { ascending: false })
      .limit(30);
    if (data.period) query = query.eq("period", data.period);
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });
