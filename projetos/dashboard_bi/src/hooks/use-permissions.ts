import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrg } from "./use-current-org";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

export function usePermissions() {
  const { org } = useCurrentOrg();
  const q = useQuery({
    queryKey: ["permissions", org?.id],
    enabled: !!org?.id,
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user || !org) return { roles: [] as AppRole[], keys: new Set<string>() };
      const [rolesRes, groupsRes] = await Promise.all([
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userData.user.id)
          .eq("organization_id", org.id),
        supabase.from("group_members").select("group_id").eq("user_id", userData.user.id),
      ]);
      const roles = (rolesRes.data ?? []).map((r) => r.role as AppRole);
      const keys = new Set<string>();
      if (roles.length) {
        const { data: rp } = await supabase
          .from("role_permissions")
          .select("permission_key")
          .in("role", roles);
        rp?.forEach((r) => keys.add(r.permission_key));
      }
      const groupIds = (groupsRes.data ?? []).map((g) => g.group_id);
      if (groupIds.length) {
        const { data: gp } = await supabase
          .from("group_permissions")
          .select("permission_key, group_id")
          .in("group_id", groupIds);
        gp?.forEach((r) => keys.add(r.permission_key));
      }
      return { roles, keys };
    },
  });
  const roles = q.data?.roles ?? [];
  const keys = q.data?.keys ?? new Set<string>();
  return {
    isLoading: q.isLoading,
    roles,
    hasRole: (r: AppRole) => roles.includes(r),
    hasAnyRole: (rs: AppRole[]) => rs.some((r) => roles.includes(r)),
    isAdmin: roles.includes("administrator"),
    can: (key: string) => roles.includes("administrator") || keys.has(key),
  };
}
