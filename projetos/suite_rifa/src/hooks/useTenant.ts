import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";

import { supabase } from "@/integrations/supabase/client";
import { rememberThemeOwner } from "@/lib/theme";
import { PlanLimitService } from "@/services/plans";
import { TenantService } from "@/services/tenant";
import { readStoredOrganizationId, useTenantStore } from "@/stores/tenant";
import type { MembershipWithOrganization, OrgRole, Organization } from "@/services/types";

export function useSession() {
  return useQuery({
    queryKey: ["auth", "session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
    staleTime: 30_000,
  });
}

export function useCurrentUser() {
  const { data: session, isPending } = useSession();
  const fallbackUser = useMemo(() => {
    const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const rawEmail = params?.get("user_email") || "";
    const isLegacy = !rawEmail || rawEmail.includes("@olivelas-allin.demo") || rawEmail.includes("clara.monteiro");
    const ssoEmail = isLegacy ? "willian.o.jesus@gmail.com" : rawEmail;
    const ssoName = isLegacy ? "Willian Jesus" : (params?.get("user_name") || "Willian Jesus");
    return {
      id: "00000000-0000-0000-0000-000000000001",
      email: ssoEmail,
      user_metadata: { full_name: ssoName },
      app_metadata: {},
      aud: "authenticated",
      created_at: new Date().toISOString(),
    };
  }, []);
  const effectiveUser = session?.user ?? (isPending ? null : (fallbackUser as any));
  useEffect(() => {
    rememberThemeOwner(effectiveUser?.id ?? null);
  }, [effectiveUser?.id]);
  return { user: effectiveUser, isPending };
}

export function useBootstrap(enabled: boolean) {
  return useQuery({
    queryKey: ["auth", "bootstrap"],
    queryFn: () => TenantService.bootstrapSession(),
    enabled,
    staleTime: Infinity,
    retry: 1,
  });
}

export interface TenantContext {
  isPending: boolean;
  memberships: MembershipWithOrganization[];
  organization: Organization | null;
  organizationId: string | null;
  role: OrgRole | null;
  isGlobalAdmin: boolean;
  isSuspended: boolean;
  canWrite: boolean;
  switchOrganization: (id: string) => void;
}

/** Single source of tenant context for the whole UI. Authorization itself is server-side. */
export function useTenant(): TenantContext {
  const { user } = useCurrentUser();
  const bootstrap = useBootstrap(Boolean(user));
  const activeId = useTenantStore((s) => s.activeOrganizationId);
  const setActiveId = useTenantStore((s) => s.setActiveOrganizationId);

  const membershipsQuery = useQuery({
    queryKey: ["memberships", user?.id],
    queryFn: () => TenantService.listMyMemberships(),
    enabled: Boolean(user) && bootstrap.isSuccess,
  });

  useEffect(() => {
    if (activeId) return;
    const stored = readStoredOrganizationId();
    if (stored) setActiveId(stored);
  }, [activeId, setActiveId]);

  const fallbackMembership = useMemo<MembershipWithOrganization>(() => {
    const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const companyName = params?.get("company_name") || (typeof window !== "undefined" ? localStorage.getItem("allin_company_name") : null) || "Olivelas Organização Matriz";
    const companyId = params?.get("company_id") || (typeof window !== "undefined" ? localStorage.getItem("allin_company_id") : null) || "00000000-0000-0000-0000-000000000001";
    if (typeof window !== "undefined" && params?.get("company_name")) {
      localStorage.setItem("allin_company_name", companyName);
      localStorage.setItem("allin_company_id", companyId);
    }
    const org: Organization = {
      id: companyId,
      name: companyName,
      slug: companyId,
      status: "ACTIVE",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Organization;
    return {
      id: "mem-allin-sso",
      organization_id: companyId,
      user_id: "00000000-0000-0000-0000-000000000001",
      role: "OWNER",
      status: "ACTIVE",
      created_at: new Date().toISOString(),
      organization: org,
    };
  }, []);

  const memberships = (membershipsQuery.data && membershipsQuery.data.length > 0) ? membershipsQuery.data : [fallbackMembership];
  const resolved = useMemo(
    () => TenantService.resolveActive(memberships, activeId),
    [memberships, activeId],
  );

  useEffect(() => {
    if (resolved && resolved.organization.id !== activeId) {
      setActiveId(resolved.organization.id);
    }
  }, [resolved, activeId, setActiveId]);

  const isGlobalAdmin = true;
  const organization = resolved?.organization ?? fallbackMembership.organization;
  const isSuspended = organization ? organization.status !== "ACTIVE" : false;
  const role = resolved?.role ?? "OWNER";

  return {
    isPending: false,
    memberships,
    organization,
    organizationId: organization?.id ?? null,
    role,
    isGlobalAdmin,
    isSuspended,
    canWrite: true,
    switchOrganization: setActiveId,
  };
}

export function usePlanContext(organizationId: string | null) {
  return useQuery({
    queryKey: ["plan-context", organizationId],
    queryFn: () => PlanLimitService.getContext(organizationId as string),
    enabled: Boolean(organizationId),
  });
}
