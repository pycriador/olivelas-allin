import { useMemo } from "react";

import { useAuth } from "@/contexts/auth-context";
import { useRolePermissions } from "@/hooks/use-iam";
import { ROLE_PERMISSIONS, type Permission } from "@/lib/permissions";
import type { RoleCode } from "@/types/profile";

export interface PermissionsApi {
  role: RoleCode | null;
  isGlobalAdmin: boolean;
  isLoading: boolean;
  permissions: readonly Permission[];
  can: (permission: Permission) => boolean;
  canAny: (permissions: readonly Permission[]) => boolean;
  canAll: (permissions: readonly Permission[]) => boolean;
}

export function usePermissions(): PermissionsApi {
  const { role, isProfileLoading, isLoading } = useAuth();
  const { data: dbPerms, isLoading: permsLoading } = useRolePermissions();

  return useMemo<PermissionsApi>(() => {
    const db = dbPerms as Record<string, readonly Permission[]> | undefined;
    const fallback = role ? ROLE_PERMISSIONS[role] : [];

    // GLOBAL_ADMIN always has ALL permissions regardless of what's stored in DB
    const permissions =
      role === "GLOBAL_ADMIN"
        ? ROLE_PERMISSIONS.GLOBAL_ADMIN
        : role && db && db[role] && db[role].length > 0
          ? db[role]
          : (fallback as readonly Permission[]);

    return {
      role,
      isGlobalAdmin: role === "GLOBAL_ADMIN",
      isLoading: isLoading || isProfileLoading || permsLoading,
      permissions,
      can: (permission) => permissions.includes(permission),
      canAny: (perms) => perms.some((p) => permissions.includes(p)),
      canAll: (perms) => perms.every((p) => permissions.includes(p)),
    };
  }, [role, isLoading, isProfileLoading, permsLoading, dbPerms]);
}
