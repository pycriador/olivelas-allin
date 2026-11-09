import { useCallback, useEffect } from "react";
import { useAuthStore } from "@/stores/auth";
import { useWorkspaceStore } from "@/stores/workspace";
import { workspaceService, roleService, profileService } from "@/services/workspace";

export function useWorkspace() {
  const session = useAuthStore((s) => s.session);
  const user = session?.user ?? null;
  const {
    workspace,
    membership,
    roles,
    permissions,
    permissionMap,
    isLoading,
    error,
    setWorkspace,
    setLoading,
    setError,
    reset,
  } = useWorkspaceStore();

  const loadWorkspace = useCallback(async () => {
    if (!user) {
      reset();
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const defaultWorkspace = await workspaceService.getDefaultWorkspace(user.id);
      if (!defaultWorkspace) {
        useWorkspaceStore.getState().setWorkspace(null, null, [], []);
        setLoading(false);
        return;
      }

      const [memberships, userRoles, allPermissions] = await Promise.all([
        workspaceService.listByUser(user.id),
        roleService.listRolesForWorkspace(user.id, defaultWorkspace.id),
        roleService.listPermissions(),
      ]);

      const currentMembership =
        memberships.find((m) => m.workspace_id === defaultWorkspace.id && m.is_default) ??
        memberships.find((m) => m.workspace_id === defaultWorkspace.id) ??
        null;

      setWorkspace(defaultWorkspace, currentMembership, userRoles, allPermissions);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar workspace");
    } finally {
      setLoading(false);
    }
  }, [user, setWorkspace, setLoading, setError, reset]);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const profile = await profileService.getById(user.id);
    useAuthStore.getState().setProfile(profile);
    return profile;
  }, [user]);

  return {
    workspace,
    membership,
    roles,
    permissions,
    permissionMap,
    isLoading,
    error,
    refreshProfile,
    reload: loadWorkspace,
  };
}

export function usePermission(key: string) {
  return useWorkspaceStore((s) => s.permissionMap.has(key));
}

export function usePermissionAny(keys: string[]) {
  return useWorkspaceStore((s) => s.permissionMap.hasAny(keys));
}

export function usePermissionAll(keys: string[]) {
  return useWorkspaceStore((s) => s.permissionMap.hasAll(keys));
}

export function useAuthRoles() {
  return useAuthStore((s) => s.roles);
}
