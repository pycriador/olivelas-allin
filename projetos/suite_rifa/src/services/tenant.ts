import { supabase } from "@/integrations/supabase/client";

import type { MembershipWithOrganization, OrgRole, Organization } from "./types";

/**
 * TenantService — the single place that resolves tenant context.
 * Components must never implement their own tenant/authorization rules.
 * Authoritative authorization always happens in the database (RLS + definer functions).
 */
export const TenantService = {
  /** Creates/refreshes the profile and promotes the very first platform user to GLOBAL_ADMIN (server-side). */
  async bootstrapSession() {
    const { data, error } = await supabase.rpc("bootstrap_session");
    if (error) throw error;
    return data as { user_id: string; is_global_admin: boolean; promoted: boolean };
  },

  async isGlobalAdmin(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from("platform_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "GLOBAL_ADMIN")
      .maybeSingle();
    if (error) throw error;
    return Boolean(data);
  },

  /** Organizations the signed-in user actually has an ACTIVE membership in. */
  async listMyMemberships(): Promise<MembershipWithOrganization[]> {
    const { data, error } = await supabase
      .from("organization_memberships")
      .select(
        "id, organization_id, user_id, role, status, created_at, organization:organizations(*)",
      )
      .eq("status", "ACTIVE")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return ((data ?? []) as unknown as MembershipWithOrganization[]).filter((m) => m.organization);
  },

  /** Resolves the active tenant, always validating membership server-side via RLS. */
  resolveActive(
    memberships: MembershipWithOrganization[],
    desiredId: string | null,
  ): { organization: Organization; role: OrgRole } | null {
    if (memberships.length === 0) return null;
    const match = desiredId ? memberships.find((m) => m.organization_id === desiredId) : undefined;
    const chosen = match ?? memberships[0];
    if (!chosen) return null;
    return { organization: chosen.organization, role: chosen.role };
  },
};

export const ROLE_RANK: Record<OrgRole, number> = { OWNER: 4, ADMIN: 3, MEMBER: 2, VIEWER: 1 };

export function roleAtLeast(role: OrgRole | null | undefined, min: OrgRole): boolean {
  if (!role) return false;
  return ROLE_RANK[role] >= ROLE_RANK[min];
}
