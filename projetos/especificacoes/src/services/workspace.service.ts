// Workspace: the logical isolation boundary. All project data hangs off a workspace.
import { workspaceRepo } from "@/repositories";
import { membershipRepo, groupRepo, groupMemberRepo } from "@/repositories/iam";
import type { Workspace } from "@/types/domain";
import type { Group, GroupMember, Membership } from "@/types/iam";

export function slugify(value: string, seed = ""): string {
  const base = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const suffix = seed ? `-${seed.slice(0, 6)}` : "";
  return `${base || "item"}${suffix}`;
}

export const workspaceService = {
  /** Workspaces the signed-in user can actually see (RLS already filters). */
  list: (): Promise<Workspace[]> => workspaceRepo.all(),

  byId: (id: string) => workspaceRepo.byId(id),

  async members(workspaceId: string): Promise<Membership[]> {
    return membershipRepo.where("workspaceId", workspaceId);
  },

  async membershipsOf(userId: string): Promise<Membership[]> {
    return membershipRepo.byUser(userId);
  },

  async groups(workspaceId: string): Promise<Group[]> {
    return groupRepo.where("workspaceId", workspaceId);
  },

  async groupMembers(groupId: string): Promise<GroupMember[]> {
    return groupMemberRepo.byGroup(groupId);
  },

  /** Resolves the workspace the user should work in (first membership wins). */
  async resolveCurrent(userId: string | undefined): Promise<Workspace | undefined> {
    const all = await workspaceRepo.all();
    if (all.length === 0) return undefined;
    if (!userId) return all[0];
    const mine = await membershipRepo.byUser(userId);
    const match = all.find((w) => mine.some((m) => m.workspaceId === w.id && m.status !== "inactive"));
    return match ?? all[0];
  },

  async update(id: string, patch: Partial<Pick<Workspace, "name" | "description" | "avatar">>) {
    const current = await workspaceRepo.byId(id);
    if (!current) throw new Error("Workspace not found");
    await workspaceRepo.put({ ...current, ...patch, updatedAt: Date.now() });
  },
};
