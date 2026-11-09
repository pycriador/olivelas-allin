import type { ReactNode } from "react";

import { ForbiddenState } from "@/components/common/status-states";
import { LoadingState } from "@/components/common/loading-state";
import { usePermissions } from "@/hooks/use-permissions";
import type { Permission } from "@/lib/permissions";

interface PermissionGuardProps {
  permission?: Permission;
  anyOf?: readonly Permission[];
  children: ReactNode;
  fallback?: ReactNode;
}

/** Protege uma página inteira, exibindo loading e estado de acesso negado. */
export function PermissionGuard({ permission, anyOf, children, fallback }: PermissionGuardProps) {
  const { can, canAny, isLoading } = usePermissions();

  if (isLoading) return <LoadingState />;

  const allowed = (permission ? can(permission) : true) && (anyOf ? canAny(anyOf) : true);
  if (!allowed) return <>{fallback ?? <ForbiddenState />}</>;

  return <>{children}</>;
}
