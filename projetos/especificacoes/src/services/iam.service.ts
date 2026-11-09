// IAM: roles, groups, memberships, ACL and permission resolution.
import { userRepo, roleRepo, groupRepo, membershipRepo, aclRepo, groupMemberRepo } from "@/repositories/iam";
import { supabase } from "@/integrations/supabase/client";
import { auditService } from "./audit.service";
import { uid } from "@/lib/id";
import {
  SYSTEM_ROLES,
  SYSTEM_GROUPS,
  AuditEvent,
  UserStatus,
  type AclEntry,
  type Group,
  type Membership,
  type Role,
  type User,
} from "@/types/iam";

export async function ensureIamSeed(): Promise<void> {
  const roles = await roleRepo.all();
  if (roles.length === 0) await roleRepo.bulkPut(SYSTEM_ROLES);
  const groups = await groupRepo.all();
  if (groups.length === 0) await groupRepo.bulkPut(SYSTEM_GROUPS);
}

export interface PermissionContext {
  user: User;
  role: Role | undefined;
  memberships: Membership[];
  memberRoles: Role[];
  groupRoles: Role[];
  acl: AclEntry[];
}

export async function loadPermissionContext(userId: string): Promise<PermissionContext | null> {
  const user = await userRepo.byId(userId);
  if (!user) return null;
  const [role, memberships, acl, allRoles, allGroups] = await Promise.all([
    roleRepo.byId(user.roleId),
    membershipRepo.byUser(userId),
    aclRepo.byUser(userId),
    roleRepo.all(),
    groupRepo.all(),
  ]);
  const memberRoles = memberships
    .map((m) => allRoles.find((r) => r.id === m.roleId))
    .filter((r): r is Role => !!r);
  const groupRoles = (user.groupIds ?? [])
    .map((gid) => allGroups.find((g: Group) => g.id === gid)?.roleId)
    .map((rid) => allRoles.find((r) => r.id === rid))
    .filter((r): r is Role => !!r);
  return { user, role, memberships, memberRoles, groupRoles, acl };
}

function matches(pattern: string, resource: string, action: string): boolean {
  const [pr, pa] = pattern.split(":");
  return (pr === "*" || pr === resource) && (pa === "*" || pa === action);
}

/** Pure permission evaluation — no IO, easy to move to a backend later. */
export function evaluate(
  ctx: PermissionContext | null,
  resource: string,
  action: string,
  resourceId?: string,
): boolean {
  if (!ctx) return false;
  if (ctx.user.status !== UserStatus.Active) return false;

  if (resourceId) {
    const scoped = ctx.acl.filter((a) => a.resource === resource && a.resourceId === resourceId);
    const denied = scoped.find(
      (a) => a.effect === "deny" && (a.actions.includes("*") || a.actions.includes(action)),
    );
    if (denied) return false;
    const allowed = scoped.find(
      (a) => a.effect === "allow" && (a.actions.includes("*") || a.actions.includes(action)),
    );
    if (allowed) return true;
  }

  const roles = [ctx.role, ...ctx.memberRoles, ...ctx.groupRoles].filter((r): r is Role => !!r);
  return roles.some((r) => r.permissions.some((p) => matches(p, resource, action)));
}

export class ForbiddenError extends Error {
  constructor(public resource: string, public action: string) {
    super(`Permission denied: ${resource}:${action}`);
    this.name = "ForbiddenError";
  }
}

export const iamService = {
  ensureIamSeed,
  loadPermissionContext,
  evaluate,

  /** Service-layer guard: throws when the actor lacks the permission. */
  async require(userId: string | undefined, resource: string, action: string, resourceId?: string) {
    const ctx = userId ? await loadPermissionContext(userId) : null;
    if (!evaluate(ctx, resource, action, resourceId)) {
      await auditService.log({
        event: AuditEvent.AccessDenied,
        entity: resource,
        ...(resourceId ? { entityId: resourceId } : {}),
        result: "failure",
        detail: `${resource}:${action}`,
      });
      throw new ForbiddenError(resource, action);
    }
  },

  listUsers: () => userRepo.all(),
  listRoles: () => roleRepo.all(),
  listGroups: () => groupRepo.all(),
  listAcl: () => aclRepo.all(),
  listMemberships: () => membershipRepo.all(),
  listGroupMembers: () => groupMemberRepo.all(),

  /** Approval is transactional server-side: activates the profile and attaches it to the workspace. */
  async approveUser(id: string, roleId = "role-editor") {
    const { error } = await supabase.rpc("approve_user", { _user_id: id, _role_id: roleId } as never);
    if (error) throw new Error(error.message);
    await auditService.log({ event: AuditEvent.Update, entity: "user", entityId: id, detail: "access approved" });
  },

  async rejectUser(id: string) {
    const user = await userRepo.byId(id);
    if (!user) throw new Error("User not found");
    await userRepo.put({ ...user, status: UserStatus.Rejected, updatedAt: Date.now() });
    await auditService.log({ event: AuditEvent.Update, entity: "user", entityId: id, detail: "access rejected" });
  },

  async updateUser(id: string, patch: Partial<Pick<User, "name" | "email" | "status" | "roleId" | "groupIds" | "avatar" | "mfaEnabled">>) {
    const user = await userRepo.byId(id);
    if (!user) throw new Error("User not found");
    const next: User = { ...user, ...patch, updatedAt: Date.now() };
    if (patch.status === UserStatus.Active) {
      next.failedAttempts = 0;
      delete next.lockedUntil;
    }
    await userRepo.put(next);
    await auditService.log({
      event: patch.roleId ? AuditEvent.RoleChange : AuditEvent.Update,
      entity: "user",
      entityId: id,
    });
    return next;
  },

  async removeUser(id: string) {
    const users = await userRepo.all();
    const target = users.find((u) => u.id === id);
    if (!target) return;
    if (target.roleId === "role-admin-global") {
      const admins = users.filter((u) => u.roleId === "role-admin-global");
      if (admins.length <= 1) throw new Error("Cannot delete the last Global Admin");
    }
    await userRepo.remove(id);
    await auditService.log({ event: AuditEvent.Delete, entity: "user", entityId: id });
  },

  async saveRole(role: Role) {
    await roleRepo.put(role);
    await auditService.log({ event: AuditEvent.PermissionChange, entity: "role", entityId: role.id });
  },

  async removeRole(id: string) {
    const role = await roleRepo.byId(id);
    if (role?.system) throw new Error("System roles cannot be deleted");
    await roleRepo.remove(id);
    await auditService.log({ event: AuditEvent.RoleChange, entity: "role", entityId: id });
  },

  async saveGroup(group: Group) {
    await groupRepo.put(group);
    await auditService.log({ event: AuditEvent.Update, entity: "group", entityId: group.id });
  },

  async removeGroup(id: string) {
    const g = await groupRepo.byId(id);
    if (g?.system) throw new Error("System groups cannot be deleted");
    await groupRepo.remove(id);
    await auditService.log({ event: AuditEvent.Delete, entity: "group", entityId: id });
  },

  async saveAcl(entry: Omit<AclEntry, "id"> & { id?: string }) {
    const row: AclEntry = { ...entry, id: entry.id ?? uid() };
    await aclRepo.put(row);
    await auditService.log({ event: AuditEvent.PermissionChange, entity: "acl", entityId: row.id, detail: `${row.effect} ${row.resource}:${row.actions.join(",")}` });
    return row;
  },

  async removeAcl(id: string) {
    await aclRepo.remove(id);
    await auditService.log({ event: AuditEvent.PermissionChange, entity: "acl", entityId: id, detail: "removed" });
  },

  async saveMembership(m: Omit<Membership, "id"> & { id?: string }) {
    const row: Membership = { ...m, id: m.id ?? uid() };
    await membershipRepo.put(row);
    await auditService.log({ event: AuditEvent.RoleChange, entity: "membership", entityId: row.id });
    return row;
  },

  removeMembership: (id: string) => membershipRepo.remove(id),
};
