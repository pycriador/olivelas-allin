export type OrgRole = "owner" | "admin" | "manager" | "editor" | "viewer";
export type MemberStatus = "active" | "invited" | "suspended";
export type InvitationStatus = "pending" | "accepted" | "cancelled" | "expired";
export type PlanTier = "free" | "pro" | "business" | "enterprise";
export type Severity = "info" | "success" | "warning" | "error";

export type OrgPermission =
  | "manage_organization"
  | "manage_members"
  | "manage_roles"
  | "manage_forms"
  | "publish_forms"
  | "view_responses"
  | "export_responses"
  | "view_analytics"
  | "manage_templates"
  | "manage_integrations"
  | "manage_api_keys"
  | "manage_webhooks"
  | "manage_automations"
  | "view_audit_logs";

export const ALL_ORG_PERMISSIONS: OrgPermission[] = [
  "manage_organization",
  "manage_members",
  "manage_roles",
  "manage_forms",
  "publish_forms",
  "view_responses",
  "export_responses",
  "view_analytics",
  "manage_templates",
  "manage_integrations",
  "manage_api_keys",
  "manage_webhooks",
  "manage_automations",
  "view_audit_logs",
];

export const ORG_ROLES: OrgRole[] = ["owner", "admin", "manager", "editor", "viewer"];

export interface Organization {
  id: string;
  name: string;
  slug: string;
  legalName: string;
  status: "active" | "inactive";
  logoUrl: string | null;
  plan: PlanTier;
  responseRetentionDays: number;
  auditRetentionDays: number;
  createdAt: string;
}

export interface OrgMember {
  id: string;
  organizationId: string;
  userId: string;
  role: OrgRole;
  status: MemberStatus;
  joinedAt: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

export interface OrgInvitation {
  id: string;
  organizationId: string;
  email: string;
  role: OrgRole;
  status: InvitationStatus;
  token: string;
  expiresAt: string;
  createdAt: string;
}

export interface OrgLimits {
  organizationId: string;
  maxUsers: number;
  maxForms: number;
  maxResponses: number;
  maxStorageMb: number;
  maxApiCalls: number;
  maxWebhooks: number;
  maxAutomations: number;
}

/** Events emitted by the platform, consumed by webhooks and automations. */
export const PLATFORM_EVENTS = [
  "form.created",
  "form.updated",
  "form.published",
  "form.deleted",
  "response.created",
  "response.completed",
  "user.created",
  "user.updated",
  "organization.member_added",
  "organization.member_removed",
] as const;
export type PlatformEvent = (typeof PLATFORM_EVENTS)[number];

export interface ApiKey {
  id: string;
  organizationId: string;
  name: string;
  prefix: string;
  status: "active" | "revoked" | "expired";
  scopes: string[];
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface Webhook {
  id: string;
  organizationId: string;
  name: string;
  url: string;
  events: string[];
  status: "active" | "paused" | "disabled";
  secret: string;
  maxRetries: number;
  createdAt: string;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: string;
  status: "pending" | "success" | "failed" | "retrying";
  httpStatus: number | null;
  attempt: number;
  durationMs: number | null;
  responseBody: string | null;
  error: string | null;
  createdAt: string;
}

export type IntegrationCategory = "crm" | "communication" | "storage" | "automation" | "analytics";

export interface IntegrationProvider {
  id: string;
  name: string;
  category: IntegrationCategory;
  description: string;
  /** Real credential flow available. When false the adapter runs in simulation. */
  available: boolean;
}

export interface Integration {
  id: string;
  organizationId: string;
  provider: string;
  category: string;
  status: "connected" | "disconnected" | "error";
  config: Record<string, unknown>;
  connectedAt: string | null;
}

export type TriggerType =
  | "response.created"
  | "response.completed"
  | "form.published"
  | "form.updated"
  | "user.created";

export type ActionType =
  | "send_notification"
  | "send_webhook"
  | "create_log"
  | "update_status";

export interface AutomationCondition {
  field: string;
  operator: "eq" | "neq" | "gt" | "lt" | "contains";
  value: string;
}

export interface AutomationAction {
  type: ActionType;
  config: Record<string, unknown>;
}

export interface AutomationRule {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  triggerType: TriggerType;
  formId: string | null;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  status: "active" | "paused" | "draft";
  lastRunAt: string | null;
  runCount: number;
  createdAt: string;
}

export interface AutomationExecution {
  id: string;
  ruleId: string;
  status: "success" | "failed" | "skipped";
  triggerType: string;
  error: string | null;
  durationMs: number | null;
  createdAt: string;
}

export interface FeatureFlag {
  id: string;
  key: string;
  description: string;
  enabled: boolean;
  organizationId: string | null;
  userId: string | null;
}

export interface SystemEvent {
  id: string;
  organizationId: string | null;
  source: string;
  severity: Severity;
  message: string;
  createdAt: string;
}
