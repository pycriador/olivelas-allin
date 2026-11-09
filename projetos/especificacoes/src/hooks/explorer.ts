import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { explorerRepo } from "@/repositories/explorer";
import { explorerService } from "@/services/explorer.service";
import { useCloudReady } from "./data";
import { useHydrated } from "./use-hydrated";
import type { DocumentStatus, ExplorerNode, RelationshipType } from "@/types/explorer";

export function useProjectNodes(projectId: string | undefined) {
  const hydrated = useHydrated();
  const ready = useCloudReady();
  return useQuery({
    queryKey: ["nodes", projectId],
    queryFn: async () => {
      if (!projectId) return [] as ExplorerNode[];
      await explorerService.ensureProjectTree(projectId);
      return explorerRepo.byProject(projectId);
    },
    enabled: hydrated && ready && !!projectId,
  });
}

export function useAllNodes() {
  const hydrated = useHydrated();
  const ready = useCloudReady();
  return useQuery({
    queryKey: ["nodes", "all"],
    queryFn: () => explorerRepo.all(),
    enabled: hydrated && ready,
  });
}

function useNodeMutation<V, R = unknown>(fn: (v: V) => Promise<R>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["nodes"] });
      qc.invalidateQueries({ queryKey: ["activities"] });
    },
  });
}

export const useCreateFolder = () =>
  useNodeMutation((v: { projectId: string; parentId: string | null; name: string }) =>
    explorerService.createFolder(v.projectId, v.parentId, v.name),
  );

export const useCreateFile = () =>
  useNodeMutation((v: Parameters<typeof explorerService.createFile>[0]) => explorerService.createFile(v));

export const useCreateLink = () =>
  useNodeMutation((v: { projectId: string; parentId: string | null; name: string; url: string }) =>
    explorerService.createLink(v.projectId, v.parentId, v.name, v.url),
  );

export const useCreateShortcut = () =>
  useNodeMutation((v: { targetId: string; parentId: string | null }) =>
    explorerService.createShortcut(v.targetId, v.parentId),
  );

export const useRenameNode = () =>
  useNodeMutation((v: { id: string; name: string }) => explorerService.rename(v.id, v.name));

export const useUpdateNode = () =>
  useNodeMutation((v: { id: string; patch: Partial<ExplorerNode> }) => explorerService.update(v.id, v.patch));

export const useSaveNodeContent = () =>
  useNodeMutation((v: { id: string; content: string; expectedUpdatedAt?: number; force?: boolean }) =>
    explorerService.saveContent(v.id, v.content, v.expectedUpdatedAt, v.force),
  );

export const useMoveNode = () =>
  useNodeMutation((v: { id: string; parentId: string | null; order?: number }) =>
    explorerService.move(v.id, v.parentId, v.order),
  );

export const useDuplicateNode = () => useNodeMutation((id: string) => explorerService.duplicate(id));
export const useArchiveNode = () =>
  useNodeMutation((v: { id: string; archived: boolean }) => explorerService.setArchived(v.id, v.archived));
export const useDeleteNode = () => useNodeMutation((id: string) => explorerService.remove(id));
export const useRestoreNode = () => useNodeMutation((id: string) => explorerService.restore(id));
export const usePurgeNode = () => useNodeMutation((id: string) => explorerService.purge(id));
export const useToggleNodeLink = () =>
  useNodeMutation((v: { sourceId: string; targetId: string }) => explorerService.toggleLink(v.sourceId, v.targetId));

export const useSetNodeTags = () =>
  useNodeMutation((v: { id: string; tags: string[] }) => explorerService.setTags(v.id, v.tags));

export const useSetNodeStatus = () =>
  useNodeMutation((v: { id: string; status: DocumentStatus }) => explorerService.setStatus(v.id, v.status));

export function useNodeRelations(projectId: string | undefined) {
  const hydrated = useHydrated();
  const ready = useCloudReady();
  return useQuery({
    queryKey: ["node-relations", projectId],
    queryFn: () => (projectId ? explorerService.relations(projectId) : Promise.resolve([])),
    enabled: hydrated && ready && !!projectId,
  });
}

export function useNodeHistory(nodeId: string | undefined) {
  const hydrated = useHydrated();
  const ready = useCloudReady();
  return useQuery({
    queryKey: ["node-history", nodeId],
    queryFn: () => (nodeId ? explorerService.historyOf(nodeId) : Promise.resolve([])),
    enabled: hydrated && ready && !!nodeId,
  });
}

function useRelationMutation<V>(fn: (v: V) => Promise<unknown>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["node-relations"] }),
  });
}

export const useRelateNodes = () =>
  useRelationMutation((v: { sourceId: string; targetId: string; relationshipType: RelationshipType }) =>
    explorerService.relate(v.sourceId, v.targetId, v.relationshipType),
  );

export const useUnrelateNodes = () => useRelationMutation((id: string) => explorerService.unrelate(id));
