export type Role = "admin" | "manager" | "user";

export type Permission =
  | "manage_users"
  | "manage_groups"
  | "manage_permissions"
  | "view_dashboard"
  | "create_forms"
  | "edit_forms"
  | "delete_forms"
  | "publish_forms"
  | "view_responses"
  | "export_responses"
  | "view_analytics"
  | "manage_templates"
  | "view_audit_logs"
  | "manage_settings";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  groupId: string | null;
  status: "active" | "inactive";
  lastLoginAt: string | null;
  createdAt: string;
  avatarUrl?: string | null;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  status: "active" | "inactive";
  permissions: Permission[];
  memberIds: string[];
  createdAt: string;
}

export const ALL_PERMISSIONS: Permission[] = [
  "manage_users",
  "manage_groups",
  "manage_permissions",
  "view_dashboard",
  "create_forms",
  "edit_forms",
  "delete_forms",
  "publish_forms",
  "view_responses",
  "export_responses",
  "view_analytics",
  "manage_templates",
  "view_audit_logs",
  "manage_settings",
];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: ALL_PERMISSIONS,
  manager: [
    "view_dashboard",
    "manage_users",
    "manage_groups",
    "create_forms",
    "edit_forms",
    "publish_forms",
    "view_responses",
    "export_responses",
    "view_analytics",
  ],
  user: [
    "view_dashboard",
    "create_forms",
    "edit_forms",
    "publish_forms",
    "view_responses",
    "export_responses",
    "view_analytics",
  ],
};
