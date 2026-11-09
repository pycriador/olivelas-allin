import { supabase } from "@/integrations/supabase/client";

import type { PermissionKey } from "./types";

/**
 * PermissionService — single source of truth for RBAC in the UI.
 *
 * The permission matrix lives in `public.role_permissions` and is enforced by
 * the database (`has_permission` + RLS + security-definer functions).
 * Everything here is presentation only: hiding a button never grants access.
 */
export const PermissionService = {
  /** Permissions of the signed-in user inside a given organization. */
  async listMine(organizationId: string): Promise<PermissionKey[]> {
    const { data, error } = await supabase.rpc("my_permissions", { _org: organizationId });
    if (error) throw error;
    return ((data ?? []) as string[]) as PermissionKey[];
  },

  /** Full matrix (role → permissions), used by the roles & permissions reference table. */
  async matrix(): Promise<Record<string, PermissionKey[]>> {
    const { data, error } = await supabase.from("role_permissions").select("role, permission_key");
    if (error) throw error;
    const matrix: Record<string, PermissionKey[]> = {};
    for (const row of data ?? []) {
      const key = row.role as string;
      matrix[key] = [...(matrix[key] ?? []), row.permission_key as PermissionKey];
    }
    return matrix;
  },

  has(permissions: PermissionKey[] | undefined, permission: PermissionKey): boolean {
    return Boolean(permissions?.includes(permission));
  },

  hasAny(permissions: PermissionKey[] | undefined, wanted: PermissionKey[]): boolean {
    return wanted.some((p) => PermissionService.has(permissions, p));
  },
};
