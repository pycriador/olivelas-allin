// Project / Sprint / Delivery orchestration.
import {
  projectRepo,
  roadmapRepo,
  sprintRepo,
  deliveryRepo,
  workspaceRepo,
  specificationRepo,
  documentRepo,
  activityRepo,
} from "@/repositories";
import { uid } from "@/lib/id";
import { requirePermission } from "./guard";
import { slugify } from "./workspace.service";
import { explorerService } from "./explorer.service";
import { authService } from "./auth.service";
import {
  type Project,
  type Sprint,
  type Delivery,
  type Roadmap,
  ProjectStatus,
  SprintStatus,
  DeliveryStatus,
} from "@/types/domain";

async function getOrCreateRoadmap(projectId: string): Promise<Roadmap> {
  const existing = (await roadmapRepo.all()).find((r) => r.projectId === projectId);
  if (existing) return existing;
  const rm: Roadmap = { id: uid(), projectId, name: "Roadmap", order: 0 };
  await roadmapRepo.put(rm);
  return rm;
}

async function log(
  targetType: "project" | "sprint" | "delivery",
  targetId: string,
  action: string,
  summary: string,
) {
  await activityRepo.put({
    id: uid(),
    at: Date.now(),
    actor: "you",
    action,
    targetType,
    targetId,
    summary,
  });
}

export const projectService = {
  async create(input: {
    name: string;
    description?: string;
    workspaceId: string;
    color?: string;
    status?: ProjectStatus;
  }): Promise<Project> {
    await requirePermission("project", "create");
    const now = Date.now();
    const workspaceId = input.workspaceId || (await workspaceRepo.all())[0]?.id;
    if (!workspaceId) throw new Error("Nenhum workspace disponível para criar o projeto.");
    const ownerId = authService.current()?.userId;
    if (!ownerId) throw new Error("Sessão expirada. Faça login novamente.");
    const id = uid();
    const project: Project = {
      id,
      workspaceId,
      name: input.name,
      slug: slugify(input.name, id.replace(/-/g, "")),
      description: input.description,
      status: input.status ?? ProjectStatus.Active,
      color: input.color ?? "#3b82f6",
      ownerId,
      createdAt: now,
      updatedAt: now,
    };
    await projectRepo.put(project);
    await getOrCreateRoadmap(project.id);
    await explorerService.ensureProjectTree(project.id);
    await log("project", project.id, "created", `Created project "${project.name}"`);
    return project;
  },
  async update(id: string, patch: Partial<Omit<Project, "id" | "createdAt">>): Promise<void> {
    await requirePermission("project", "update");
    const current = await projectRepo.byId(id);
    if (!current) return;
    const { name, description, status, color, workspaceId } = patch;
    const safe: Partial<Project> = {};
    if (name !== undefined) safe.name = name;
    if (description !== undefined) safe.description = description;
    if (status !== undefined) safe.status = status;
    if (color !== undefined) safe.color = color;
    if (workspaceId !== undefined) safe.workspaceId = workspaceId;
    await projectRepo.put({ ...current, ...safe, updatedAt: Date.now() });
    await log("project", id, "updated", `Updated project "${current.name}"`);
  },
  async remove(id: string): Promise<void> {
    await requirePermission("project", "delete");
    const p = await projectRepo.byId(id);
    if (!p) return;
    await projectRepo.remove(id);
    await log("project", id, "deleted", `Deleted project "${p.name}"`);
  },
};

export const sprintService = {
  async create(input: {
    projectId: string;
    title: string;
    status?: SprintStatus;
    startDate?: number;
    endDate?: number;
  }): Promise<Sprint> {
    await requirePermission("sprint", "create");
    const rm = await getOrCreateRoadmap(input.projectId);
    const siblings = (await sprintRepo.all()).filter((s) => s.roadmapId === rm.id);
    const sprint: Sprint = {
      id: uid(),
      roadmapId: rm.id,
      title: input.title,
      status: input.status ?? SprintStatus.Planned,
      startDate: input.startDate,
      endDate: input.endDate,
      order: siblings.length,
    };
    await sprintRepo.put(sprint);
    await log("sprint", sprint.id, "created", `Created sprint "${sprint.title}"`);
    return sprint;
  },
  async update(id: string, patch: Partial<Sprint>): Promise<void> {
    await requirePermission("sprint", "update");
    const s = await sprintRepo.byId(id);
    if (!s) return;
    const { title, status, startDate, endDate, order } = patch;
    const safe: Partial<Sprint> = {};
    if (title !== undefined) safe.title = title;
    if (status !== undefined) safe.status = status;
    if (startDate !== undefined) safe.startDate = startDate;
    if (endDate !== undefined) safe.endDate = endDate;
    if (order !== undefined) safe.order = order;
    await sprintRepo.put({ ...s, ...safe });
  },
  async remove(id: string): Promise<void> {
    await requirePermission("sprint", "delete");
    await sprintRepo.remove(id);
  },
};

export const deliveryService = {
  async create(input: { sprintId: string; title: string; status?: DeliveryStatus }): Promise<Delivery> {
    await requirePermission("delivery", "create");
    const siblings = (await deliveryRepo.all()).filter((d) => d.sprintId === input.sprintId);
    const delivery: Delivery = {
      id: uid(),
      sprintId: input.sprintId,
      title: input.title,
      status: input.status ?? DeliveryStatus.Todo,
      order: siblings.length,
    };
    await deliveryRepo.put(delivery);
    await log("delivery", delivery.id, "created", `Created delivery "${delivery.title}"`);
    return delivery;
  },
  async update(id: string, patch: Partial<Delivery>): Promise<void> {
    await requirePermission("delivery", "update");
    const d = await deliveryRepo.byId(id);
    if (!d) return;
    const { title, status, order } = patch;
    const safe: Partial<Delivery> = {};
    if (title !== undefined) safe.title = title;
    if (status !== undefined) safe.status = status;
    if (order !== undefined) safe.order = order;
    await deliveryRepo.put({ ...d, ...safe });
  },
  async setStatus(id: string, status: DeliveryStatus): Promise<void> {
    await requirePermission("delivery", "update");
    await this.update(id, { status });
  },
  async remove(id: string): Promise<void> {
    await requirePermission("delivery", "delete");
    await deliveryRepo.remove(id);
  },
};

// Utility: resolve sprint/deliveries belonging to a project.
export async function specsByProject(projectId: string) {
  const rms = (await roadmapRepo.all()).filter((r) => r.projectId === projectId);
  const rmIds = new Set(rms.map((r) => r.id));
  const sprints = (await sprintRepo.all()).filter((s) => rmIds.has(s.roadmapId));
  const sprintIds = new Set(sprints.map((s) => s.id));
  const deliveries = (await deliveryRepo.all()).filter((d) => sprintIds.has(d.sprintId));
  const deliveryIds = new Set(deliveries.map((d) => d.id));
  const specs = (await specificationRepo.active()).filter((s) => deliveryIds.has(s.deliveryId));
  return { sprints, deliveries, specs };
}

export async function deleteSpecCascade(id: string): Promise<void> {
  const docs = (await documentRepo.all()).filter((d) => d.specificationId === id);
  for (const d of docs) await documentRepo.remove(d.id);
  await specificationRepo.remove(id);
}
