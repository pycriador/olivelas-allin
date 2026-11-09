// Legacy: kept for backward compatibility with existing code.
// New IAM models are defined below as Role, Plan, and User.

/** @deprecated Use RoleCode instead */
export type AppRole = "GLOBAL_ADMIN" | "USER";
export type ProfileStatus = "ACTIVE" | "DISABLED" | "INACTIVE" | "PENDING" | "SUSPENDED";

// ---- Legacy profile types (keep existing code working) ----

export interface Profile {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  status: ProfileStatus;
  created_at: string;
  updated_at: string;
  last_login: string | null;
  deleted_at: string | null;
  role_id: string | null;
  plan_id: string | null;
}

export interface ProfileWithRole extends Profile {
  role: AppRole | RoleCode;
}

// ---- IAM Sprint 1 types ----

export type RoleCode = "GLOBAL_ADMIN" | "ADMIN" | "PUBLISHER";

export type PlanCode = "FREE" | "STANDARD" | "PRO";

export type UserStatus = "ACTIVE" | "INACTIVE" | "PENDING" | "SUSPENDED";

export interface Role {
  id: string;
  code: RoleCode;
  name: string;
  description: string | null;
  is_system_role: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface Plan {
  id: string;
  code: PlanCode;
  name: string;
  description: string | null;
  max_campaigns: number;
  max_gallery_images_per_campaign: number;
  max_cover_images_per_campaign: number;
  active: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface CurrentUser {
  id: string;
  authUserId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: RoleCode;
  roleId: string;
  plan: PlanCode | null;
  planId: string | null;
  planDetails: Plan | null;
  status: UserStatus;
  isActive: boolean;
}

export const ROLE_LABELS: Record<RoleCode, string> = {
  GLOBAL_ADMIN: "Global Admin",
  ADMIN: "Administrador",
  PUBLISHER: "Criador",
};

export const PLAN_LABELS: Record<PlanCode, string> = {
  FREE: "Free",
  STANDARD: "Standard",
  PRO: "Pro",
};

export const STATUS_LABELS: Record<UserStatus, string> = {
  ACTIVE: "Ativo",
  INACTIVE: "Inativo",
  PENDING: "Pendente",
  SUSPENDED: "Suspenso",
};
