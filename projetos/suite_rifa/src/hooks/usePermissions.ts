import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { useTenant } from "@/hooks/useTenant";
import { PermissionService } from "@/services/permissions";
import type { PermissionKey } from "@/services/types";

/**
 * Reads the permissions of the signed-in user for the active organization.
 * UI-only: the database re-validates every read and write.
 */
export function usePermissions() {
  const { organizationId, isGlobalAdmin, isSuspended, role } = useTenant();

  const query = useQuery({
    queryKey: ["permissions", organizationId],
    queryFn: () => PermissionService.listMine(organizationId as string),
    enabled: Boolean(organizationId),
    staleTime: 60_000,
  });

  const permissions = query.data ?? [];

  return useMemo(
    () => ({
      isPending: query.isPending,
      permissions,
      role,
      isGlobalAdmin,
      /** Suspended organizations are read-only for everyone but the platform admin. */
      can(permission: PermissionKey): boolean {
        if (isGlobalAdmin) return true;
        return permissions.includes(permission);
      },
      canWrite(permission: PermissionKey): boolean {
        if (isGlobalAdmin) return true;
        if (isSuspended) return false;
        return permissions.includes(permission);
      },
      canAny(wanted: PermissionKey[]): boolean {
        if (isGlobalAdmin) return true;
        return wanted.some((p) => permissions.includes(p));
      },
    }),
    [permissions, query.isPending, isGlobalAdmin, isSuspended, role],
  );
}

export function useRolePermissionMatrix() {
  return useQuery({
    queryKey: ["role-permission-matrix"],
    queryFn: () => PermissionService.matrix(),
    staleTime: Infinity,
  });
}
