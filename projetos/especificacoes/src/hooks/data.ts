import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  workspaceRepo,
  projectRepo,
  specificationRepo,
  sprintRepo,
  templateRepo,
  deliveryRepo,
  activityRepo,
  metaRepo,
  tagRepo,
  snippetRepo,
} from "@/repositories";
import { specService } from "@/services/spec.service";
import { projectService, sprintService, deliveryService, specsByProject, deleteSpecCascade } from "@/services/project.service";
import { snippetService } from "@/services/snippet.service";
import { useAuthStore } from "@/stores/auth.store";
import { useHydrated } from "./use-hydrated";
import type { Block, DeliveryStatus, ProjectStatus, SpecStatus, SprintStatus, SpecType } from "@/types/domain";

/** Data queries only run once the cloud session is authenticated and approved. */
export function useCloudReady() {
  return useAuthStore((s) => s.phase === "ready");
}

function useGuarded<T>(key: readonly unknown[], fn: () => Promise<T>) {
  const hydrated = useHydrated();
  const ready = useCloudReady();
  return useQuery({
    queryKey: key,
    queryFn: fn,
    enabled: hydrated && ready,
    retry: 1,
  });
}
const guarded = useGuarded;

export const useWorkspaces = () => guarded(["workspaces"], () => workspaceRepo.all());
export const useProjects = () => guarded(["projects"], () => projectRepo.all());
export const useSprints = () => guarded(["sprints"], () => sprintRepo.all());
export const useDeliveries = () => guarded(["deliveries"], () => deliveryRepo.all());
export const useTemplates = () => guarded(["templates"], () => templateRepo.all());
export const useTags = () => guarded(["tags"], () => tagRepo.all());
export const useActivities = () => guarded(["activities"], () => activityRepo.recent(20));
export const useLastSync = () => guarded(["lastSync"], () => metaRepo.get("lastSync"));
export const useSpecs = () => guarded(["specs"], () => specificationRepo.active());
export const useFavorites = () => guarded(["specs", "favorites"], () => specificationRepo.favorites());
export const useTrashed = () => guarded(["specs", "trash"], () => specificationRepo.trashed());
export const useRecentSpecs = (limit = 6) =>
  guarded(["specs", "recent", limit], () => specificationRepo.recent(limit));
export const useProject = (id: string | undefined) =>
  guarded(["project", id], async () => (id ? projectRepo.byId(id) : undefined));
export const useSpec = (id: string | undefined) =>
  guarded(["spec", id], async () => (id ? specificationRepo.byId(id) : undefined));
export const useSpecDocument = (id: string | undefined) =>
  guarded(["specDoc", id], async () => (id ? specService.getDocument(id) : undefined));
export const useProjectDetail = (id: string | undefined) =>
  guarded(["projectDetail", id], async () => (id ? specsByProject(id) : { sprints: [], deliveries: [], specs: [] }));
export const useSnippets = () => guarded(["snippets"], () => snippetRepo.all());

function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["projects"] });
  qc.invalidateQueries({ queryKey: ["sprints"] });
  qc.invalidateQueries({ queryKey: ["deliveries"] });
  qc.invalidateQueries({ queryKey: ["specs"] });
  qc.invalidateQueries({ queryKey: ["activities"] });
  qc.invalidateQueries({ queryKey: ["projectDetail"] });
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => specService.toggleFavorite(id),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useSoftDelete() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => specService.softDelete(id),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useRestoreSpec() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => specService.restore(id),
    onSuccess: () => invalidateAll(qc),
  });
}

export function usePermanentDelete() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSpecCascade(id),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; description?: string; workspaceId: string; color?: string; status?: ProjectStatus }) =>
      projectService.create(input),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Parameters<typeof projectService.update>[1] }) =>
      projectService.update(id, patch),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => projectService.remove(id),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useCreateSprint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { projectId: string; title: string; status?: SprintStatus; startDate?: number; endDate?: number }) =>
      sprintService.create(input),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useDeleteSprint() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => sprintService.remove(id), onSuccess: () => invalidateAll(qc) });
}

export function useCreateDelivery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { sprintId: string; title: string; status?: DeliveryStatus }) => deliveryService.create(input),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useSetDeliveryStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: DeliveryStatus }) => deliveryService.setStatus(id, status),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useDeleteDelivery() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => deliveryService.remove(id), onSuccess: () => invalidateAll(qc) });
}

export function useCreateSpec() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { deliveryId: string; title: string; type: SpecType; description?: string; tags?: string[]; status?: SpecStatus }) =>
      specService.create(input),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useUpdateSpec() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Parameters<typeof specService.update>[1] }) =>
      specService.update(id, patch),
    onSuccess: (_r, v) => {
      invalidateAll(qc);
      qc.invalidateQueries({ queryKey: ["spec", v.id] });
    },
  });
}

export function useSaveDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ specId, blocks }: { specId: string; blocks: Block[] }) => specService.saveDocument(specId, blocks),
    onSuccess: (_r, v) => {
      qc.invalidateQueries({ queryKey: ["specDoc", v.specId] });
      qc.invalidateQueries({ queryKey: ["specs"] });
      qc.invalidateQueries({ queryKey: ["activities"] });
    },
  });
}

export function useCreateFromTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ templateId, deliveryId, title }: { templateId: string; deliveryId: string; title?: string }) =>
      specService.createFromTemplate(templateId, deliveryId, title),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useCreateSnippet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof snippetService.create>[0]) => snippetService.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["snippets"] }),
  });
}

export function useUpdateSnippet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Parameters<typeof snippetService.update>[1] }) =>
      snippetService.update(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["snippets"] }),
  });
}

export function useDeleteSnippet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => snippetService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["snippets"] }),
  });
}
