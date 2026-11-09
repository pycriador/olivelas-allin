// IAM / audit / versioning repositories backed by the cloud database.
import { cloudTable } from "@/lib/sb";
import type { User, Group, GroupMember, Role, Membership, AclEntry, AuditLog, SpecVersion } from "@/types/iam";

const users = cloudTable<User>("profiles");
export const userRepo = {
  ...users,
  byEmail: async (email: string) => {
    const rows = await users.query((q) => q.ilike("email", email.trim()));
    return rows[0];
  },
};

export const groupRepo = cloudTable<Group>("groups");
export const roleRepo = cloudTable<Role>("roles");

const memberships = cloudTable<Membership>("memberships");
export const membershipRepo = {
  ...memberships,
  byUser: (userId: string) => memberships.where("userId", userId),
};

const acl = cloudTable<AclEntry>("acl");
export const aclRepo = {
  ...acl,
  byUser: (userId: string) => acl.where("userId", userId),
};

const audit = cloudTable<AuditLog>("audit_logs");
export const auditRepo = {
  ...audit,
  recent: (limit = 100) => audit.query((q) => q.order("at", { ascending: false }).limit(limit)),
  since: (ts: number) => audit.query((q) => q.gt("at", ts)),
  purgeOlderThan: async (ts: number) => {
    const old = await audit.query((q) => q.lt("at", ts).limit(1000));
    await audit.bulkRemove(old.map((r) => r.id));
    return old.length;
  },
};

const versions = cloudTable<SpecVersion>("spec_versions");
export const specVersionRepo = {
  ...versions,
  bySpec: (specId: string) =>
    versions.query((q) => q.eq("specification_id", specId).order("version", { ascending: false })),
};

const groupMembers = cloudTable<GroupMember>("group_members");
export const groupMemberRepo = {
  ...groupMembers,
  byGroup: (groupId: string) => groupMembers.where("groupId", groupId),
  byUser: (userId: string) => groupMembers.where("userId", userId),
};
