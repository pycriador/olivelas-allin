// IAM, audit and versioning domain types. UI-independent.
import type { Block, ID } from "./domain";

export const UserStatus = {
  Pending: "pending",
  Active: "active",
  Suspended: "suspended",
  Inactive: "inactive",
  Rejected: "rejected",
  Locked: "locked",
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export interface User {
  id: ID;
  name: string;
  email: string;
  avatar?: string;
  status: UserStatus;
  roleId: ID;
  groupIds: ID[];
  failedAttempts: number;
  lockedUntil?: number;
  mfaEnabled: boolean;
  lastLogin?: number;
  createdAt: number;
  updatedAt: number;
}

export interface Group {
  id: ID;
  workspaceId?: ID;
  name: string;
  description?: string;
  status?: string;
  system: boolean;
  roleId?: ID;
}

export interface GroupMember {
  id: ID;
  groupId: ID;
  userId: ID;
  createdAt?: number;
}

/** Canonical resources & actions. */
export const Resource = {
  Workspace: "workspace",
  Project: "project",
  Sprint: "sprint",
  Delivery: "delivery",
  Spec: "spec",
  Template: "template",
  Snippet: "snippet",
  User: "user",
  Group: "group",
  Role: "role",
  Permission: "permission",
  Audit: "audit",
  Backup: "backup",
  Settings: "settings",
  Version: "version",
} as const;
export type Resource = (typeof Resource)[keyof typeof Resource];

export const Action = {
  Read: "read",
  Create: "create",
  Update: "update",
  Delete: "delete",
  Approve: "approve",
  Comment: "comment",
  Manage: "manage",
} as const;
export type Action = (typeof Action)[keyof typeof Action];

export interface Permission {
  id: ID;
  resource: string;
  action: string;
}

export interface Role {
  id: ID;
  name: string;
  description: string;
  system: boolean;
  /** "resource:action" strings; "*:*" = full access. */
  permissions: string[];
}

export interface Membership {
  id: ID;
  workspaceId: ID;
  userId: ID;
  roleId: ID;
  status?: string;
  joinedAt?: number;
}

/** Fine-grained per-resource override (ACL). Deny always wins. */
export interface AclEntry {
  id: ID;
  userId: ID;
  resource: string;
  resourceId: ID;
  actions: string[];
  effect: "allow" | "deny";
}

export const AuditEvent = {
  Login: "login",
  LoginFailed: "login_failed",
  Logout: "logout",
  Create: "create",
  Update: "update",
  Delete: "delete",
  Restore: "restore",
  Export: "export",
  Import: "import",
  Version: "version",
  PermissionChange: "permission_change",
  RoleChange: "role_change",
  Error: "error",
  HealthCheck: "health_check",
  AccessDenied: "access_denied",
} as const;
export type AuditEvent = (typeof AuditEvent)[keyof typeof AuditEvent];

export interface AuditLog {
  id: ID;
  at: number;
  userId?: ID;
  userName: string;
  ip?: string;
  event: string;
  entity: string;
  entityId?: ID;
  result: "success" | "failure";
  durationMs: number;
  detail?: string;
}

export interface SpecVersion {
  id: ID;
  specificationId: ID;
  version: number;
  blocks: Block[];
  title: string;
  authorId?: ID;
  authorName: string;
  comment?: string;
  createdAt: number;
}

export interface AppSettings {
  sessionMinutes: number;
  autoBackup: boolean;
  autoBackupDays: number;
  maxFailedAttempts: number;
  singleSession: boolean;
  reauthForCritical: boolean;
  logRetentionDays: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  sessionMinutes: 60,
  autoBackup: false,
  autoBackupDays: 7,
  maxFailedAttempts: 5,
  singleSession: false,
  reauthForCritical: true,
  logRetentionDays: 90,
};

export const SYSTEM_ROLES: Role[] = [
  {
    id: "role-admin-global",
    name: "Admin Global",
    description: "Full access to every resource, including IAM, backups and audit.",
    system: true,
    permissions: ["*:*"],
  },
  {
    id: "role-workspace-owner",
    name: "Workspace Owner",
    description: "Controls an entire workspace.",
    system: true,
    permissions: [
      "workspace:*",
      "project:*",
      "sprint:*",
      "delivery:*",
      "spec:*",
      "version:*",
      "template:*",
      "snippet:*",
      "user:read",
      "audit:read",
      "backup:*",
      "settings:read",
    ],
  },
  {
    id: "role-workspace-admin",
    name: "Workspace Admin",
    description: "Manages users and content of a workspace.",
    system: true,
    permissions: [
      "workspace:read",
      "project:*",
      "sprint:*",
      "delivery:*",
      "spec:*",
      "version:*",
      "template:*",
      "snippet:*",
      "user:read",
      "user:update",
      "user:create",
      "audit:read",
      "settings:read",
    ],
  },
  {
    id: "role-project-owner",
    name: "Project Owner",
    description: "Controls a single project and everything inside it.",
    system: true,
    permissions: [
      "workspace:read",
      "project:read",
      "project:update",
      "sprint:*",
      "delivery:*",
      "spec:*",
      "version:*",
      "template:read",
      "snippet:*",
      "settings:read",
    ],
  },
  {
    id: "role-editor",
    name: "Editor",
    description: "Create, edit and move content.",
    system: true,
    permissions: [
      "workspace:read",
      "project:read",
      "project:create",
      "sprint:read",
      "sprint:create",
      "sprint:update",
      "delivery:read",
      "delivery:create",
      "delivery:update",
      "spec:read",
      "spec:create",
      "spec:update",
      "spec:delete",
      "version:read",
      "version:create",
      "template:read",
      "snippet:*",
      "settings:read",
    ],
  },
  {
    id: "role-reviewer",
    name: "Reviewer",
    description: "Review, approve and comment only.",
    system: true,
    permissions: [
      "workspace:read",
      "project:read",
      "sprint:read",
      "delivery:read",
      "spec:read",
      "spec:approve",
      "spec:comment",
      "version:read",
      "template:read",
      "snippet:read",
      "settings:read",
    ],
  },
  {
    id: "role-viewer",
    name: "Viewer",
    description: "Read-only access.",
    system: true,
    permissions: [
      "workspace:read",
      "project:read",
      "sprint:read",
      "delivery:read",
      "spec:read",
      "version:read",
      "template:read",
      "snippet:read",
      "settings:read",
    ],
  },
];

export const SYSTEM_GROUPS: Group[] = [
  { id: "group-administrators", name: "Administrators", description: "Global administrators", system: true, roleId: "role-admin-global" },
  { id: "group-engineering", name: "Engineering", description: "Editors of specifications", system: true, roleId: "role-editor" },
  { id: "group-stakeholders", name: "Stakeholders", description: "Read-only stakeholders", system: true, roleId: "role-viewer" },
];

export const ALL_PERMISSIONS: Permission[] = Object.values(Resource).flatMap((r) =>
  Object.values(Action).map((a) => ({ id: `${r}:${a}`, resource: r, action: a })),
);
