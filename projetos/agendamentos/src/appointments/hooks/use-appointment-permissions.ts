/** Permission helpers mirroring the database rules (UI gating only). */
import { useCurrentProfile } from "@/shared/hooks/use-current-profile";
import { ROLE_PERMISSIONS } from "../constants";
import type { AppointmentPermission } from "../types";

export function useAppointmentPermissions() {
  const { data, isLoading } = useCurrentProfile();
  const roles = data?.roles ?? [];

  const can = (permission: AppointmentPermission): boolean =>
    roles.some((role) => {
      const granted = ROLE_PERMISSIONS[role];
      return granted === "all" || (granted?.includes(permission) ?? false);
    });

  return { can, roles, isLoading };
}
