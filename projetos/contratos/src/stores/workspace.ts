import { create } from "zustand";
import type { Permission, Workspace, WorkspaceMember, UserRole } from "@/types";

export interface PermissionMap {
  has: (key: string) => boolean;
  hasAny: (keys: string[]) => boolean;
  hasAll: (keys: string[]) => boolean;
}

interface WorkspaceState {
  workspace: Workspace | null;
  membership: WorkspaceMember | null;
  roles: UserRole[];
  permissions: Permission[];
  permissionMap: PermissionMap;
  isLoading: boolean;
  error: string | null;
  setWorkspace: (
    workspace: Workspace | null,
    membership: WorkspaceMember | null,
    roles: UserRole[],
    permissions: Permission[],
  ) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

function buildPermissionMap(permissions: Permission[]): PermissionMap {
  const set = new Set(permissions.map((p) => p.key));
  return {
    has: (key) => set.has(key),
    hasAny: (keys) => keys.some((k) => set.has(k)),
    hasAll: (keys) => keys.every((k) => set.has(k)),
  };
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  workspace: null,
  membership: null,
  roles: [],
  permissions: [],
  permissionMap: { has: () => false, hasAny: () => false, hasAll: () => false },
  isLoading: true,
  error: null,
  setWorkspace: (workspace, membership, roles, permissions) =>
    set({
      workspace,
      membership,
      roles,
      permissions,
      permissionMap: buildPermissionMap(permissions),
    }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  reset: () =>
    set({
      workspace: null,
      membership: null,
      roles: [],
      permissions: [],
      permissionMap: { has: () => false, hasAny: () => false, hasAll: () => false },
      isLoading: false,
      error: null,
    }),
}));
