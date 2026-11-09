import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { iamService } from "@/services/iam.service";
import { ROLE_PERMISSIONS } from "@/lib/permissions";
import type { Permission } from "@/lib/permissions";
import type { RoleCode } from "@/types/profile";

/** Permissoes por role carregadas do banco (com fallback para defaults). */
export function useRolePermissions() {
  return useQuery({
    queryKey: ["iam", "role-permissions"],
    queryFn: () => iamService.listRolePermissions(),
    staleTime: 30_000,
  });
}

/** Mapa resolvido: role -> Set<permission>, mesclando DB + defaults. */
export function useResolvedRolePermissions(): Record<RoleCode, ReadonlySet<Permission>> {
  const { data } = useRolePermissions();
  const dbMap = data ?? {};
  return {
    GLOBAL_ADMIN: new Set(
      (dbMap["GLOBAL_ADMIN"] ?? ROLE_PERMISSIONS.GLOBAL_ADMIN) as readonly Permission[],
    ),
    ADMIN: new Set((dbMap["ADMIN"] ?? ROLE_PERMISSIONS.ADMIN) as readonly Permission[]),
    PUBLISHER: new Set((dbMap["PUBLISHER"] ?? ROLE_PERMISSIONS.PUBLISHER) as readonly Permission[]),
  };
}

export function useSetPermission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { role: RoleCode; permission: string; granted: boolean }) =>
      iamService.setPermission(input.role, input.permission, input.granted),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["iam", "role-permissions"] });
      void queryClient.invalidateQueries({ queryKey: ["audit"] });
    },
  });
}
