import type { ReactNode } from "react";

import { usePermissions } from "@/hooks/use-permissions";
import type { Permission } from "@/lib/permissions";

interface CanProps {
  /** Permissão exigida. */
  permission?: Permission;
  /** Basta uma das permissões listadas. */
  anyOf?: readonly Permission[];
  /** Todas as permissões listadas são exigidas. */
  allOf?: readonly Permission[];
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * Renderização condicional por permissão.
 * `<Can permission="users.edit">...</Can>`
 */
export function Can({ permission, anyOf, allOf, fallback = null, children }: CanProps) {
  const { can, canAny, canAll } = usePermissions();

  const allowed =
    (permission ? can(permission) : true) &&
    (anyOf ? canAny(anyOf) : true) &&
    (allOf ? canAll(allOf) : true);

  return <>{allowed ? children : fallback}</>;
}
