import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { authService } from "@/services/auth.service";
import { iamService } from "@/services/iam.service";
import { auditService } from "@/services/audit.service";
import { versionService } from "@/services/version.service";
import { backupService } from "@/services/backup.service";
import { userRepo } from "@/repositories/iam";
import type { AclEntry, Group, Role } from "@/types/iam";

export function useSession() {
  return useAuthStore((s) => s.session);
}

export function useCan() {
  return useAuthStore((s) => s.can);
}

export function usePermission(resource: string, action: string, resourceId?: string) {
  const can = useAuthStore((s) => s.can);
  return can(resource, action, resourceId);
}

/** Keeps the session alive on activity and locks it on expiry. */
export function useSessionWatcher() {
  const session = useAuthStore((s) => s.session);
  const lock = useAuthStore((s) => s.lock);
  useEffect(() => {
    if (!session) return;
    const timer = window.setInterval(() => {
      const s = authService.current();
      if (!s || s.expiresAt <= Date.now()) lock();
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [session, lock]);
}

export const useUsers = () => useQuery({ queryKey: ["iam", "users"], queryFn: () => iamService.listUsers() });
export const useRoles = () => useQuery({ queryKey: ["iam", "roles"], queryFn: () => iamService.listRoles() });
export const useGroups = () => useQuery({ queryKey: ["iam", "groups"], queryFn: () => iamService.listGroups() });
export const useMemberships = () =>
  useQuery({ queryKey: ["iam", "memberships"], queryFn: () => iamService.listMemberships() });
export const useGroupMembers = () =>
  useQuery({ queryKey: ["iam", "groupMembers"], queryFn: () => iamService.listGroupMembers() });
export const useAcl = () => useQuery({ queryKey: ["iam", "acl"], queryFn: () => iamService.listAcl() });
export const useAuditLogs = (limit = 200) =>
  useQuery({ queryKey: ["audit", limit], queryFn: () => auditService.list(limit) });
export const useAppSettings = () =>
  useQuery({ queryKey: ["appSettings"], queryFn: () => authService.getSettings() });
export const useSpecVersions = (specId: string | undefined) =>
  useQuery({
    queryKey: ["specVersions", specId],
    queryFn: () => (specId ? versionService.list(specId) : Promise.resolve([])),
    enabled: !!specId,
  });
export const useCurrentUser = () => {
  const session = useSession();
  return useQuery({
    queryKey: ["currentUser", session?.userId],
    queryFn: async () => (session ? ((await userRepo.byId(session.userId)) ?? null) : null),
    enabled: !!session,
  });
};
export const useStorageEstimate = () =>
  useQuery({ queryKey: ["storage"], queryFn: () => backupService.storageEstimate() });
export const useLastBackup = () =>
  useQuery({ queryKey: ["lastBackup"], queryFn: () => backupService.lastBackupAt() });

function useIamMutation<V>(fn: (v: V) => Promise<unknown>) {
  const qc = useQueryClient();
  const refresh = useAuthStore((s) => s.refresh);
  return useMutation({
    mutationFn: fn,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["iam"] });
      await qc.invalidateQueries({ queryKey: ["audit"] });
      await qc.invalidateQueries({ queryKey: ["currentUser"] });
      await refresh();
    },
  });
}

export const useApproveUser = () =>
  useIamMutation(({ id, roleId }: { id: string; roleId?: string }) => iamService.approveUser(id, roleId));
export const useUpdateUser = () =>
  useIamMutation(({ id, patch }: { id: string; patch: Parameters<typeof iamService.updateUser>[1] }) =>
    iamService.updateUser(id, patch),
  );
export const useRejectUser = () => useIamMutation((id: string) => iamService.rejectUser(id));
export const useDeleteUser = () => useIamMutation((id: string) => iamService.removeUser(id));
export const useSaveRole = () => useIamMutation((role: Role) => iamService.saveRole(role));
export const useDeleteRole = () => useIamMutation((id: string) => iamService.removeRole(id));
export const useSaveGroup = () => useIamMutation((g: Group) => iamService.saveGroup(g));
export const useDeleteGroup = () => useIamMutation((id: string) => iamService.removeGroup(id));
export const useSaveAcl = () =>
  useIamMutation((e: Omit<AclEntry, "id"> & { id?: string }) => iamService.saveAcl(e));
export const useDeleteAcl = () => useIamMutation((id: string) => iamService.removeAcl(id));

export function useSaveSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Parameters<typeof authService.saveSettings>[0]) => authService.saveSettings(patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["appSettings"] }),
  });
}

export function useRestoreVersion() {
  const qc = useQueryClient();
  const session = useSession();
  return useMutation({
    mutationFn: (versionId: string) =>
      versionService.restore(versionId, { name: session?.name ?? "system", ...(session ? { id: session.userId } : {}) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["specVersions"] });
      qc.invalidateQueries({ queryKey: ["spec"] });
      qc.invalidateQueries({ queryKey: ["specDoc"] });
      qc.invalidateQueries({ queryKey: ["specs"] });
      qc.invalidateQueries({ queryKey: ["audit"] });
    },
  });
}

export function useHealthCheck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => backupService.healthCheck(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["audit"] }),
  });
}
