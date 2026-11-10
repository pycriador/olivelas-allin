import type { ReactNode } from "react";
import { usePermissions } from "@/hooks/use-permissions";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

export function Can(props: {
  permission?: string;
  role?: AppRole | AppRole[];
  fallback?: ReactNode;
  children: ReactNode;
}) {
  const { can, hasAnyRole } = usePermissions();
  let ok = true;
  if (props.permission) ok = ok && can(props.permission);
  if (props.role) ok = ok && hasAnyRole(Array.isArray(props.role) ? props.role : [props.role]);
  return <>{ok ? props.children : (props.fallback ?? null)}</>;
}
