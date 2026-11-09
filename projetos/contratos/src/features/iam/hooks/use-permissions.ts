import { useWorkspaceStore } from "@/stores/workspace";
import { useAuthStore } from "@/stores/auth";

export function usePermissions() {
  const permissionMap = useWorkspaceStore((s) => s.permissionMap);
  const isGlobalAdmin = useAuthStore((s) => s.isGlobalAdmin);

  return {
    isGlobalAdmin,
    has: (key: string) => isGlobalAdmin || permissionMap.has(key),
    hasAny: (keys: string[]) => isGlobalAdmin || permissionMap.hasAny(keys),
    hasAll: (keys: string[]) => isGlobalAdmin || permissionMap.hasAll(keys),
  };
}
