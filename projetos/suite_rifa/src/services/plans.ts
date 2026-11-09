import { supabase } from "@/integrations/supabase/client";

import type { Plan, SubscriptionWithPlan } from "./types";

export interface PlanFeature {
  id: string;
  plan_id: string;
  feature_key: string;
  enabled: boolean;
}

export interface PlanLimit {
  id: string;
  plan_id: string;
  limit_key: string;
  limit_value: number;
}

export interface UsageRow {
  usage_key: string;
  usage_value: number;
}

export interface PlanContext {
  subscription: SubscriptionWithPlan | null;
  features: Record<string, boolean>;
  limits: Record<string, number>;
  usage: Record<string, number>;
}

/**
 * PlanLimitService — reads plan entitlements and current usage for a tenant.
 * These checks drive the UI. The same rules are re-validated server-side
 * (see invite_member / org_limit in the database) so the frontend is never authoritative.
 */
export const PlanLimitService = {
  async listPlans(): Promise<Plan[]> {
    const { data, error } = await supabase
      .from("plans")
      .select("*")
      .order("price_monthly", { ascending: true });
    if (error) throw error;
    return (data ?? []) as unknown as Plan[];
  },

  async listPlanFeatures(): Promise<PlanFeature[]> {
    const { data, error } = await supabase.from("plan_features").select("*");
    if (error) throw error;
    return (data ?? []) as unknown as PlanFeature[];
  },

  async listPlanLimits(): Promise<PlanLimit[]> {
    const { data, error } = await supabase.from("plan_limits").select("*");
    if (error) throw error;
    return (data ?? []) as unknown as PlanLimit[];
  },

  async getContext(organizationId: string): Promise<PlanContext> {
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("*, plan:plans(*)")
      .eq("organization_id", organizationId)
      .maybeSingle();
    if (subError) throw subError;

    const sub = (subscription as unknown as SubscriptionWithPlan | null) ?? null;

    const features: Record<string, boolean> = {};
    const limits: Record<string, number> = {};

    if (sub) {
      const [{ data: featureRows }, { data: limitRows }] = await Promise.all([
        supabase.from("plan_features").select("feature_key, enabled").eq("plan_id", sub.plan_id),
        supabase.from("plan_limits").select("limit_key, limit_value").eq("plan_id", sub.plan_id),
      ]);
      for (const row of featureRows ?? []) features[row.feature_key] = row.enabled;
      for (const row of limitRows ?? []) limits[row.limit_key] = Number(row.limit_value);
    }

    const { data: usageRows } = await supabase
      .from("organization_usage")
      .select("usage_key, usage_value")
      .eq("organization_id", organizationId);

    const usage: Record<string, number> = {};
    for (const row of (usageRows ?? []) as UsageRow[]) usage[row.usage_key] = Number(row.usage_value);

    return { subscription: sub, features, limits, usage };
  },

  canUseFeature(ctx: PlanContext | undefined, key: string): boolean {
    return Boolean(ctx?.features[key]);
  },

  remaining(ctx: PlanContext | undefined, limitKey: string, usageKey: string): number | null {
    if (!ctx) return null;
    const limit = ctx.limits[limitKey];
    if (limit === undefined) return null;
    const used = ctx.usage[usageKey] ?? 0;
    return limit - used;
  },

  canInviteUser(ctx: PlanContext | undefined): boolean {
    const remaining = PlanLimitService.remaining(ctx, "max_users", "users");
    return remaining === null || remaining > 0;
  },

  canCreateCampaign(ctx: PlanContext | undefined): boolean {
    const remaining = PlanLimitService.remaining(ctx, "max_campaigns", "campaigns");
    return remaining === null || remaining > 0;
  },

  canAddNumbers(ctx: PlanContext | undefined, amount = 1): boolean {
    const remaining = PlanLimitService.remaining(ctx, "max_numbers_per_campaign", "numbers");
    return remaining === null || remaining >= amount;
  },
};
