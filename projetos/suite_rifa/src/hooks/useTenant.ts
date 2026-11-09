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
  useEffect(() => {
    rememberThemeOwner(session?.user?.id ?? null);
  }, [session?.user?.id]);
  return { user: session?.user ?? null, isPending };
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

  const memberships = membershipsQuery.data ?? [];
  const resolved = useMemo(
    () => TenantService.resolveActive(memberships, activeId),
    [memberships, activeId],
  );

  useEffect(() => {
    if (resolved && resolved.organization.id !== activeId) {
      setActiveId(resolved.organization.id);
    }
  }, [resolved, activeId, setActiveId]);

  const isGlobalAdmin = Boolean(bootstrap.data?.is_global_admin);
  const organization = resolved?.organization ?? null;
  const isSuspended = organization ? organization.status !== "ACTIVE" : false;
  const role = resolved?.role ?? null;

  return {
    isPending: bootstrap.isPending || membershipsQuery.isPending,
    memberships,
    organization,
    organizationId: organization?.id ?? null,
    role,
    isGlobalAdmin,
    isSuspended,
    canWrite: Boolean(organization) && !isSuspended && role !== "VIEWER",
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
