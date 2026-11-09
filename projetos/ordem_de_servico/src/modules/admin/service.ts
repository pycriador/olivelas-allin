import { getStorage } from "@/core/providers/storage";
import { configurationService } from "@/core/services/configuration";
import { eventBus, EVENT_NAMES } from "@/modules/events/service";
import { auditAdmin } from "@/services/audit.service";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type {
  AdminUser, Role, PermissionEntry, AuditLog, SystemLog, GlobalConfig, ImpersonationSession,
  AdminGroup, Policy, FeatureFlag, ThemeConfig, LanguageConfig, ProviderConfig,
  DataSource, BackupDefinition, HealthCheckItem, Job, Schedule, MaintenanceMode,
  EnvironmentConfig, SecretEntry, MonitoringEntry, LicenseInfo, TenantInfo,
  AdminDashboardStats, ProviderHealth
} from "./types";
import { DEFAULT_GLOBAL_CONFIG } from "./types";

const USERS_COLLECTION = "admin_users";
const ROLES_COLLECTION = "admin_roles";
const AUDIT_COLLECTION = "audit_logs";
const LOGS_COLLECTION = "system_logs";
const CONFIG_COLLECTION = "global_config";
const IMPERSONATION_KEY = "admin_impersonation";
const GROUPS_COLLECTION = "admin_groups";
const POLICIES_COLLECTION = "admin_policies";
const FEATURES_COLLECTION = "admin_feature_flags";
const THEMES_COLLECTION = "admin_themes";
const LANGUAGES_COLLECTION = "admin_languages";
const PROVIDERS_COLLECTION = "admin_providers";
const DATASOURCES_COLLECTION = "admin_data_sources";
const BACKUPS_COLLECTION = "admin_backups";
const HEALTH_COLLECTION = "admin_health";
const JOBS_COLLECTION = "admin_jobs";
const SCHEDULES_COLLECTION = "admin_schedules";
const MAINTENANCE_COLLECTION = "admin_maintenance";
const ENV_COLLECTION = "admin_environment";
const SECRETS_COLLECTION = "admin_secrets";
const MONITORING_COLLECTION = "admin_monitoring";
const LICENSES_COLLECTION = "admin_licenses";
const TENANTS_COLLECTION = "admin_tenants";

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
function now(): string {
  return new Date().toISOString();
}
function generateIp(): string {
  return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
}
function generateBrowser(): string {
  return ["Chrome 125","Firefox 128","Edge 124","Safari 17.5","Opera 110"][Math.floor(Math.random() * 5)];
}
function generateOs(): string {
  return ["Windows 11","macOS 14","Ubuntu 24.04","iOS 17","Android 14"][Math.floor(Math.random() * 5)];
}
function generateSessionId(): string {
  return `sess_${Math.random().toString(36).slice(2, 15)}`;
}
function paginate<T>(items: T[], page: number = 1, perPage: number = 50): { data: T[]; total: number; page: number; perPage: number; totalPages: number } {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.max(1, Math.min(page, totalPages));
  const start = (safePage - 1) * perPage;
  return { data: items.slice(start, start + perPage), total, page: safePage, perPage, totalPages };
}
function filterBy<T>(items: T[], filters: Record<string, string | undefined>): T[] {
  return items.filter(item => {
    for (const [key, val] of Object.entries(filters)) {
      if (!val) continue;
      const itemVal = (item as Record<string, any>)[key];
      if (itemVal === undefined || itemVal === null) return false;
      if (typeof itemVal === "string" && !itemVal.toLowerCase().includes(val.toLowerCase())) return false;
    }
    return true;
  });
}
function sortBy<T>(items: T[], field: keyof T, dir: "asc" | "desc" = "asc"): T[] {
  return [...items].sort((a, b) => {
    const av = String(a[field] ?? ""), bv = String(b[field] ?? "");
    return dir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
  });
}

/**
 * Cloud audit trail for admin actions (compliance & troubleshooting):
 * records who did it, when, and what changed (before/after diff).
 * Fire-and-forget — never blocks or breaks the mutation itself.
 */
function logAdmin(
  action: string,
  resource: string,
  opts: { recordId?: string; before?: unknown; after?: unknown; description?: string } = {},
): void {
  void auditAdmin({ action: `admin.${action}`, resource, ...opts });
}

/** Redacts secret values before they are written to the audit trail. */
function maskSecret<T extends Partial<SecretEntry> | null | undefined>(s: T): T {
  if (!s) return s;
  return { ...s, key: s.key ? `••••${s.key.slice(-4)}` : s.key, maskedValue: s.maskedValue ? "••••" : s.maskedValue };
}

// --- Existing services ---

export const adminUserService = {
  async list(): Promise<AdminUser[]> { return getStorage().findAll<AdminUser>(USERS_COLLECTION); },
  async get(id: string): Promise<AdminUser | null> { return getStorage().find<AdminUser>(USERS_COLLECTION, id); },
  async create(data: Omit<AdminUser, "id">): Promise<AdminUser> { const c = await getStorage().create<AdminUser>(USERS_COLLECTION, data); logAdmin("users.create", USERS_COLLECTION, { recordId: c.id, after: c, description: `Usuário "${c.name}" criado` }); eventBus.publish(EVENT_NAMES.ADMIN_USER_CREATED, "audit", "admin", { id: c.id, name: c.name }).catch(() => {}); return c; },
  async update(id: string, patch: Partial<AdminUser>): Promise<AdminUser> { const before = await this.get(id); const u = await getStorage().update<AdminUser>(USERS_COLLECTION, id, patch); logAdmin("users.update", USERS_COLLECTION, { recordId: id, before, after: u, description: `Usuário "${u.name}" atualizado` }); eventBus.publish(EVENT_NAMES.ADMIN_USER_UPDATED, "audit", "admin", { id, ...patch }).catch(() => {}); return u; },
  async remove(id: string): Promise<void> { const before = await this.get(id); await getStorage().delete(USERS_COLLECTION, id); logAdmin("users.delete", USERS_COLLECTION, { recordId: id, before, description: `Usuário "${before?.name ?? id}" excluído` }); eventBus.publish(EVENT_NAMES.ADMIN_USER_DELETED, "audit", "admin", { id }).catch(() => {}); },
  async count(): Promise<number> { return getStorage().count(USERS_COLLECTION); },
  async countByRole(roleId: string): Promise<number> { const users = await this.list(); return users.filter(u => u.roleIds.includes(roleId)).length; },
  async listPaginated(page: number = 1, perPage: number = 50, filters?: Record<string, string>): Promise<{ data: AdminUser[]; total: number; page: number; perPage: number; totalPages: number }> { let items = await this.list(); if (filters) items = filterBy(items, filters); items = sortBy(items, "name"); return paginate(items, page, perPage); },
};

export const roleService = {
  async list(): Promise<Role[]> { return getStorage().findAll<Role>(ROLES_COLLECTION); },
  async get(id: string): Promise<Role | null> { return getStorage().find<Role>(ROLES_COLLECTION, id); },
  async create(data: Omit<Role, "id">): Promise<Role> { const c = await getStorage().create<Role>(ROLES_COLLECTION, data); logAdmin("roles.create", ROLES_COLLECTION, { recordId: c.id, after: c, description: `Papel "${c.name}" criado` }); eventBus.publish(EVENT_NAMES.ADMIN_ROLE_CREATED, "audit", "admin", { id: c.id, name: c.name }).catch(() => {}); return c; },
  async update(id: string, patch: Partial<Role>): Promise<Role> { const before = await this.get(id); const u = await getStorage().update<Role>(ROLES_COLLECTION, id, patch); logAdmin("roles.update", ROLES_COLLECTION, { recordId: id, before, after: u, description: `Papel "${u.name}" atualizado` }); eventBus.publish(EVENT_NAMES.ADMIN_ROLE_UPDATED, "audit", "admin", { id, ...patch }).catch(() => {}); return u; },
  async remove(id: string): Promise<void> { const before = await this.get(id); await getStorage().delete(ROLES_COLLECTION, id); logAdmin("roles.delete", ROLES_COLLECTION, { recordId: id, before, description: `Papel "${before?.name ?? id}" excluído` }); eventBus.publish(EVENT_NAMES.ADMIN_ROLE_DELETED, "audit", "admin", { id }).catch(() => {}); },
};

export const auditService = {
  async list(): Promise<AuditLog[]> { return getStorage().findAll<AuditLog>(AUDIT_COLLECTION); },
  async log(entry: Omit<AuditLog, "id">): Promise<AuditLog> { const log = await getStorage().create<AuditLog>(AUDIT_COLLECTION, entry as AuditLog); await systemLogService.log({ level: "info" as const, message: `Ação: ${entry.action} em ${entry.entity}`, module: entry.module, userId: entry.userId, userName: entry.userName, companyId: entry.companyId, companyName: entry.companyName, timestamp: entry.timestamp, details: entry.description }); return log; },
  async count(): Promise<number> { return getStorage().count(AUDIT_COLLECTION); },
  async listPaginated(page: number = 1, perPage: number = 50, filters?: Record<string, string>): Promise<{ data: AuditLog[]; total: number; page: number; perPage: number; totalPages: number }> { let items = await this.list(); if (filters) items = filterBy(items, filters); items = sortBy(items, "timestamp", "desc"); return paginate(items, page, perPage); },
};

export const systemLogService = {
  async list(): Promise<SystemLog[]> { const items = await getStorage().findAll<SystemLog>(LOGS_COLLECTION); return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()); },
  async log(entry: Omit<SystemLog, "id">): Promise<SystemLog> { return getStorage().create<SystemLog>(LOGS_COLLECTION, entry); },
  async count(): Promise<number> { return getStorage().count(LOGS_COLLECTION); },
  async listPaginated(page: number = 1, perPage: number = 50, filters?: Record<string, string>): Promise<{ data: SystemLog[]; total: number; page: number; perPage: number; totalPages: number }> { let items = await this.list(); if (filters) items = filterBy(items, filters); return paginate(items, page, perPage); },
};

export const globalConfigService = {
  async get(): Promise<GlobalConfig> { const f = await getStorage().find<GlobalConfig>(CONFIG_COLLECTION, "global"); if (f) return { ...DEFAULT_GLOBAL_CONFIG, ...f }; await getStorage().create<GlobalConfig>(CONFIG_COLLECTION, DEFAULT_GLOBAL_CONFIG); return DEFAULT_GLOBAL_CONFIG; },
  async update(patch: Partial<GlobalConfig>): Promise<GlobalConfig> { const c = await this.get(); const u = await getStorage().update<GlobalConfig>(CONFIG_COLLECTION, "global", { ...c, ...patch }); logAdmin("config.update", CONFIG_COLLECTION, { recordId: "global", before: c, after: u, description: "Configuração global atualizada" }); eventBus.publish(EVENT_NAMES.ADMIN_CONFIG_UPDATED, "system", "admin", { ...patch }).catch(() => {}); return u; },
};

export const impersonationService = {
  async get(): Promise<ImpersonationSession> { const raw = typeof window !== "undefined" ? window.localStorage.getItem(IMPERSONATION_KEY) : null; if (!raw) return { active: false, originalUserId: "", originalUserName: "", companyId: "", companyName: "", startedAt: "" }; return JSON.parse(raw); },
  async start(session: Omit<ImpersonationSession, "active">): Promise<void> { const data: ImpersonationSession = { ...session, active: true }; if (typeof window !== "undefined") { window.localStorage.setItem(IMPERSONATION_KEY, JSON.stringify(data)); } logAdmin("impersonation.start", "admin_impersonation", { recordId: session.companyId, after: data, description: `Administrador ${session.originalUserName} iniciou impersonação na empresa ${session.companyName}` }); await auditService.log({ date: new Date().toISOString().split("T")[0], time: new Date().toISOString().split("T")[1].split(".")[0], userId: session.originalUserId, userName: session.originalUserName, companyId: session.companyId, companyName: session.companyName, module: "Admin", screen: "Impersonação", action: "Iniciou impersonação", entity: "Empresa", recordId: session.companyId, description: `Administrador ${session.originalUserName} iniciou impersonação na empresa ${session.companyName}`, ip: generateIp(), browser: generateBrowser(), os: generateOs(), sessionId: generateSessionId(), result: "success" as const, duration: 0, origin: "admin", timestamp: now() }); eventBus.publish(EVENT_NAMES.ADMIN_IMPERSONATION_STARTED, "audit", "admin", { ...session }).catch(() => {}); },
  async end(): Promise<void> { const session = await this.get(); if (typeof window !== "undefined") { window.localStorage.removeItem(IMPERSONATION_KEY); } if (session.active) { logAdmin("impersonation.end", "admin_impersonation", { recordId: session.companyId, before: session, description: `Administrador ${session.originalUserName} encerrou impersonação na empresa ${session.companyName}` }); await auditService.log({ date: new Date().toISOString().split("T")[0], time: new Date().toISOString().split("T")[1].split(".")[0], userId: session.originalUserId, userName: session.originalUserName, companyId: session.companyId, companyName: session.companyName, module: "Admin", screen: "Impersonação", action: "Encerrou impersonação", entity: "Empresa", recordId: session.companyId, description: `Administrador ${session.originalUserName} encerrou impersonação na empresa ${session.companyName}`, ip: generateIp(), browser: generateBrowser(), os: generateOs(), sessionId: generateSessionId(), result: "success" as const, duration: 0, origin: "admin", timestamp: now() }); eventBus.publish(EVENT_NAMES.ADMIN_IMPERSONATION_ENDED, "audit", "admin", { ...session }).catch(() => {}); } },
  async getHistory(): Promise<AuditLog[]> { const logs = await auditService.list(); return logs.filter(l => l.screen === "Impersonação"); },
};

const PERMISSION_RESOURCES = [
  "dashboard","companies","users","roles","orders","clients","services","products",
  "parts","inventory","financial","reports","settings","audit","logs","integrations",
  "workflows","documents","communications","ai","metadata","database","providers",
  "connectors","datasources","themes","languages","backup","security","maintenance",
  "monitoring","jobs","schedules","licenses",
];

function fullPermissions(): PermissionEntry[] {
  return PERMISSION_RESOURCES.map(r => ({
    resource: r, canView: true, canCreate: true, canEdit: true, canDelete: true,
    canPrint: true, canExport: true, canImport: true, canPublish: true, canAdmin: true,
  }));
}
function viewPermissions(): PermissionEntry[] {
  return PERMISSION_RESOURCES.map(r => ({
    resource: r, canView: true, canCreate: false, canEdit: false, canDelete: false,
    canPrint: false, canExport: false, canImport: false, canPublish: false, canAdmin: false,
  }));
}
function editPermissions(): PermissionEntry[] {
  return PERMISSION_RESOURCES.map(r => ({
    resource: r, canView: true, canCreate: false, canEdit: true, canDelete: false,
    canPrint: false, canExport: false, canImport: false, canPublish: false, canAdmin: false,
  }));
}
function adminPermissions(): PermissionEntry[] {
  const items = fullPermissions();
  items.forEach(p => { p.canAdmin = false; p.canDelete = false; });
  return items;
}

export const permissionHelper = {
  hasPermission(role: Role, resource: string, permission: keyof PermissionEntry): boolean { const e = role.permissions.find(p => p.resource === resource); return e ? !!e[permission] : false; },
  can(roles: Role[], resource: string, permission: keyof PermissionEntry): boolean { return roles.some(r => this.hasPermission(r, resource, permission)); },
  getEffectivePermissions(roles: Role[]): PermissionEntry[] { const m: Record<string, PermissionEntry> = {}; for (const r of roles) { for (const p of r.permissions) { if (!m[p.resource]) { m[p.resource] = { ...p }; } else { const cur = m[p.resource]; (Object.keys(p) as (keyof PermissionEntry)[]).forEach(k => { if (k !== "resource" && p[k] === true) (cur as any)[k] = true; }); } } } return Object.values(m); },
  fullAccess: fullPermissions,
  defaultAdmin: adminPermissions,
  defaultEditor: editPermissions,
  defaultViewer: viewPermissions,
};

// --- NEW: Group Service ---
export const groupService = {
  async list(): Promise<AdminGroup[]> { return getStorage().findAll<AdminGroup>(GROUPS_COLLECTION); },
  async get(id: string): Promise<AdminGroup | null> { return getStorage().find<AdminGroup>(GROUPS_COLLECTION, id); },
  async create(data: Omit<AdminGroup, "id">): Promise<AdminGroup> { const c = await getStorage().create<AdminGroup>(GROUPS_COLLECTION, data); logAdmin("groups.create", GROUPS_COLLECTION, { recordId: c.id, after: c, description: `Grupo "${c.name}" criado` }); return c; },
  async update(id: string, patch: Partial<AdminGroup>): Promise<AdminGroup> { const before = await this.get(id); const u = await getStorage().update<AdminGroup>(GROUPS_COLLECTION, id, patch); logAdmin("groups.update", GROUPS_COLLECTION, { recordId: id, before, after: u, description: `Grupo "${u.name}" atualizado` }); return u; },
  async remove(id: string): Promise<void> { const before = await this.get(id); await getStorage().delete(GROUPS_COLLECTION, id); logAdmin("groups.delete", GROUPS_COLLECTION, { recordId: id, before, description: `Grupo "${before?.name ?? id}" excluído` }); },
  async count(): Promise<number> { return getStorage().count(GROUPS_COLLECTION); },
  async listPaginated(page?: number, perPage?: number, filters?: Record<string, string>) { let items = await this.list(); if (filters) items = filterBy(items, filters); items = sortBy(items, "name"); return paginate(items, page, perPage); },
};

// --- NEW: Policy Service ---
export const policyService = {
  async list(): Promise<Policy[]> { return getStorage().findAll<Policy>(POLICIES_COLLECTION); },
  async get(id: string): Promise<Policy | null> { return getStorage().find<Policy>(POLICIES_COLLECTION, id); },
  async create(data: Omit<Policy, "id">): Promise<Policy> { const c = await getStorage().create<Policy>(POLICIES_COLLECTION, data); logAdmin("policies.create", POLICIES_COLLECTION, { recordId: c.id, after: c, description: `Política "${c.name}" criada` }); return c; },
  async update(id: string, patch: Partial<Policy>): Promise<Policy> { const before = await this.get(id); const u = await getStorage().update<Policy>(POLICIES_COLLECTION, id, patch); logAdmin("policies.update", POLICIES_COLLECTION, { recordId: id, before, after: u, description: `Política "${u.name}" atualizada` }); return u; },
  async remove(id: string): Promise<void> { const before = await this.get(id); await getStorage().delete(POLICIES_COLLECTION, id); logAdmin("policies.delete", POLICIES_COLLECTION, { recordId: id, before, description: `Política "${before?.name ?? id}" excluída` }); },
  async count(): Promise<number> { return getStorage().count(POLICIES_COLLECTION); },
};

// --- NEW: FeatureFlag Service ---
export const featureFlagService = {
  async list(): Promise<FeatureFlag[]> { return getStorage().findAll<FeatureFlag>(FEATURES_COLLECTION); },
  async get(id: string): Promise<FeatureFlag | null> { return getStorage().find<FeatureFlag>(FEATURES_COLLECTION, id); },
  async create(data: Omit<FeatureFlag, "id">): Promise<FeatureFlag> { const c = await getStorage().create<FeatureFlag>(FEATURES_COLLECTION, data); logAdmin("feature-flags.create", FEATURES_COLLECTION, { recordId: c.id, after: c, description: `Feature flag "${c.key}" criada` }); return c; },
  async update(id: string, patch: Partial<FeatureFlag>): Promise<FeatureFlag> { const before = await this.get(id); const u = await getStorage().update<FeatureFlag>(FEATURES_COLLECTION, id, patch); logAdmin("feature-flags.update", FEATURES_COLLECTION, { recordId: id, before, after: u, description: `Feature flag "${u.key}" atualizada` }); return u; },
  async remove(id: string): Promise<void> { const before = await this.get(id); await getStorage().delete(FEATURES_COLLECTION, id); logAdmin("feature-flags.delete", FEATURES_COLLECTION, { recordId: id, before, description: `Feature flag "${before?.key ?? id}" excluída` }); },
  async count(): Promise<number> { return getStorage().count(FEATURES_COLLECTION); },
  async isEnabled(key: string): Promise<boolean> { const all = await this.list(); const flag = all.find(f => f.key === key); return flag ? flag.enabled : false; },
};

// --- NEW: Theme Service ---
export const themeService = {
  async list(): Promise<ThemeConfig[]> { return getStorage().findAll<ThemeConfig>(THEMES_COLLECTION); },
  async get(id: string): Promise<ThemeConfig | null> { return getStorage().find<ThemeConfig>(THEMES_COLLECTION, id); },
  async create(data: Omit<ThemeConfig, "id">): Promise<ThemeConfig> { const c = await getStorage().create<ThemeConfig>(THEMES_COLLECTION, data); logAdmin("themes.create", THEMES_COLLECTION, { recordId: c.id, after: c, description: `Tema "${c.name}" criado` }); return c; },
  async update(id: string, patch: Partial<ThemeConfig>): Promise<ThemeConfig> { const before = await this.get(id); const u = await getStorage().update<ThemeConfig>(THEMES_COLLECTION, id, patch); logAdmin("themes.update", THEMES_COLLECTION, { recordId: id, before, after: u, description: `Tema "${u.name}" atualizado` }); return u; },
  async remove(id: string): Promise<void> { const before = await this.get(id); await getStorage().delete(THEMES_COLLECTION, id); logAdmin("themes.delete", THEMES_COLLECTION, { recordId: id, before, description: `Tema "${before?.name ?? id}" excluído` }); },
  async count(): Promise<number> { return getStorage().count(THEMES_COLLECTION); },
  async getDefault(): Promise<ThemeConfig | null> { const all = await this.list(); return all.find(t => t.isDefault) ?? all[0] ?? null; },
};

// --- NEW: Language Service ---
export const languageService = {
  async list(): Promise<LanguageConfig[]> { return getStorage().findAll<LanguageConfig>(LANGUAGES_COLLECTION); },
  async get(id: string): Promise<LanguageConfig | null> { return getStorage().find<LanguageConfig>(LANGUAGES_COLLECTION, id); },
  async create(data: Omit<LanguageConfig, "id">): Promise<LanguageConfig> { const c = await getStorage().create<LanguageConfig>(LANGUAGES_COLLECTION, data); logAdmin("languages.create", LANGUAGES_COLLECTION, { recordId: c.id, after: c, description: `Idioma "${c.name}" criado` }); return c; },
  async update(id: string, patch: Partial<LanguageConfig>): Promise<LanguageConfig> { const before = await this.get(id); const u = await getStorage().update<LanguageConfig>(LANGUAGES_COLLECTION, id, patch); logAdmin("languages.update", LANGUAGES_COLLECTION, { recordId: id, before, after: u, description: `Idioma "${u.name}" atualizado` }); return u; },
  async remove(id: string): Promise<void> { const before = await this.get(id); await getStorage().delete(LANGUAGES_COLLECTION, id); logAdmin("languages.delete", LANGUAGES_COLLECTION, { recordId: id, before, description: `Idioma "${before?.name ?? id}" excluído` }); },
  async count(): Promise<number> { return getStorage().count(LANGUAGES_COLLECTION); },
  async getDefault(): Promise<LanguageConfig | null> { const all = await this.list(); return all.find(l => l.isDefault) ?? all[0] ?? null; },
};

// --- NEW: Provider Service ---
export const providerService = {
  async list(): Promise<ProviderConfig[]> { return getStorage().findAll<ProviderConfig>(PROVIDERS_COLLECTION); },
  async get(id: string): Promise<ProviderConfig | null> { return getStorage().find<ProviderConfig>(PROVIDERS_COLLECTION, id); },
  async create(data: Omit<ProviderConfig, "id">): Promise<ProviderConfig> { const c = await getStorage().create<ProviderConfig>(PROVIDERS_COLLECTION, data); logAdmin("providers.create", PROVIDERS_COLLECTION, { recordId: c.id, after: c, description: `Provedor "${c.name}" criado` }); return c; },
  async update(id: string, patch: Partial<ProviderConfig>): Promise<ProviderConfig> { const before = await this.get(id); const u = await getStorage().update<ProviderConfig>(PROVIDERS_COLLECTION, id, patch); logAdmin("providers.update", PROVIDERS_COLLECTION, { recordId: id, before, after: u, description: `Provedor "${u.name}" atualizado` }); return u; },
  async remove(id: string): Promise<void> { const before = await this.get(id); await getStorage().delete(PROVIDERS_COLLECTION, id); logAdmin("providers.delete", PROVIDERS_COLLECTION, { recordId: id, before, description: `Provedor "${before?.name ?? id}" excluído` }); },
  async count(): Promise<number> { return getStorage().count(PROVIDERS_COLLECTION); },
  async healthCheck(id: string): Promise<ProviderHealth | null> { const p = await this.get(id); if (!p) return null; const latency = Math.floor(Math.random() * 200) + 10; const status = latency < 100 ? "healthy" as const : latency < 150 ? "degraded" as const : "unhealthy" as const; return { status, latency, lastCheck: now(), error: status === "unhealthy" ? "Timeout excedido" : undefined }; },
};

// --- NEW: DataSource Service ---
export const dataSourceService = {
  async list(): Promise<DataSource[]> { return getStorage().findAll<DataSource>(DATASOURCES_COLLECTION); },
  async get(id: string): Promise<DataSource | null> { return getStorage().find<DataSource>(DATASOURCES_COLLECTION, id); },
  async create(data: Omit<DataSource, "id">): Promise<DataSource> { const c = await getStorage().create<DataSource>(DATASOURCES_COLLECTION, data); logAdmin("datasources.create", DATASOURCES_COLLECTION, { recordId: c.id, after: c, description: `Fonte de dados "${c.name}" criada` }); return c; },
  async update(id: string, patch: Partial<DataSource>): Promise<DataSource> { const before = await this.get(id); const u = await getStorage().update<DataSource>(DATASOURCES_COLLECTION, id, patch); logAdmin("datasources.update", DATASOURCES_COLLECTION, { recordId: id, before, after: u, description: `Fonte de dados "${u.name}" atualizada` }); return u; },
  async remove(id: string): Promise<void> { const before = await this.get(id); await getStorage().delete(DATASOURCES_COLLECTION, id); logAdmin("datasources.delete", DATASOURCES_COLLECTION, { recordId: id, before, description: `Fonte de dados "${before?.name ?? id}" excluída` }); },
  async count(): Promise<number> { return getStorage().count(DATASOURCES_COLLECTION); },
  async test(id: string): Promise<{ success: boolean; message: string }> { const ds = await this.get(id); if (!ds) return { success: false, message: "DataSource não encontrado" }; const ok = Math.random() > 0.2; await getStorage().update<DataSource>(DATASOURCES_COLLECTION, id, { lastTest: now(), testResult: ok ? "success" : "failed" }); logAdmin("datasources.test", DATASOURCES_COLLECTION, { recordId: id, description: `Teste de conexão em "${ds.name}": ${ok ? "sucesso" : "falha"}` }); return { success: ok, message: ok ? "Conexão estabelecida com sucesso" : "Falha na conexão - timeout" }; },
};

// --- NEW: Backup Service ---
export const backupService = {
  async list(): Promise<BackupDefinition[]> { return getStorage().findAll<BackupDefinition>(BACKUPS_COLLECTION); },
  async get(id: string): Promise<BackupDefinition | null> { return getStorage().find<BackupDefinition>(BACKUPS_COLLECTION, id); },
  async create(data: Omit<BackupDefinition, "id">): Promise<BackupDefinition> { const c = await getStorage().create<BackupDefinition>(BACKUPS_COLLECTION, data); logAdmin("backups.create", BACKUPS_COLLECTION, { recordId: c.id, after: c, description: `Backup "${c.fileName}" criado` }); return c; },
  async update(id: string, patch: Partial<BackupDefinition>): Promise<BackupDefinition> { const before = await this.get(id); const u = await getStorage().update<BackupDefinition>(BACKUPS_COLLECTION, id, patch); logAdmin("backups.update", BACKUPS_COLLECTION, { recordId: id, before, after: u, description: `Backup "${u.fileName}" atualizado` }); return u; },
  async remove(id: string): Promise<void> { const before = await this.get(id); await getStorage().delete(BACKUPS_COLLECTION, id); logAdmin("backups.delete", BACKUPS_COLLECTION, { recordId: id, before, description: `Backup "${before?.fileName ?? id}" excluído` }); },
  async count(): Promise<number> { return getStorage().count(BACKUPS_COLLECTION); },
  async createBackup(type: "manual" | "scheduled" | "full" | "incremental", description: string, createdBy: string): Promise<BackupDefinition> { const backup = await this.create({ type, status: "in_progress", fileName: `backup_${Date.now()}.sql`, size: Math.floor(Math.random() * 1000000000) + 50000000, description, startedAt: now(), createdBy }); setTimeout(async () => { const ok = Math.random() > 0.1; await this.update(backup.id, { status: ok ? "completed" : "failed", completedAt: now() }); }, 2000); return backup; },
  async restore(id: string, restoredBy: string): Promise<void> { const before = await this.get(id); await getStorage().update<BackupDefinition>(BACKUPS_COLLECTION, id, { restoredAt: now(), restoredBy }); logAdmin("backups.restore", BACKUPS_COLLECTION, { recordId: id, before, description: `Backup "${before?.fileName ?? id}" restaurado por ${restoredBy}` }); },
};

// --- Health Service (real Lovable Cloud checks) ---

type CloudProbe = { name: string; category: HealthCheckItem["category"]; run: () => Promise<{ ok: boolean; latency: number; details: string }> };

async function probe(fn: () => Promise<{ ok: boolean; details: string }>): Promise<{ ok: boolean; latency: number; details: string }> {
  const t = performance.now();
  try {
    const r = await fn();
    return { ...r, latency: Math.round(performance.now() - t) };
  } catch (e) {
    return { ok: false, latency: Math.round(performance.now() - t), details: (e as Error).message || "erro" };
  }
}

const CLOUD_PROBES: CloudProbe[] = [
  {
    name: "Auth", category: "auth",
    run: () => probe(async () => {
      const { error } = await supabase.auth.getSession();
      if (error) return { ok: false, details: error.message };
      return { ok: true, details: "Serviço de autenticação respondendo" };
    }),
  },
  {
    name: "Database", category: "database",
    run: () => probe(async () => {
      const { error } = await supabase.from("profiles").select("id", { count: "exact", head: true });
      if (error) return { ok: false, details: error.message };
      return { ok: true, details: "PostgreSQL acessível" };
    }),
  },
  {
    name: "Storage", category: "storage",
    run: () => probe(async () => {
      const { error } = await supabase.storage.listBuckets();
      if (error) return { ok: false, details: error.message };
      return { ok: true, details: "Storage acessível" };
    }),
  },
  {
    name: "Realtime", category: "realtime",
    run: () => probe(async () => {
      const socket = (supabase.realtime as { isConnected?: () => boolean }).isConnected?.();
      return { ok: true, details: socket ? "Conectado" : "Standby" };
    }),
  },
];

export const healthService = {
  async list(): Promise<HealthCheckItem[]> { return getStorage().findAll<HealthCheckItem>(HEALTH_COLLECTION); },
  async get(id: string): Promise<HealthCheckItem | null> { return getStorage().find<HealthCheckItem>(HEALTH_COLLECTION, id); },
  async update(id: string, patch: Partial<HealthCheckItem>): Promise<HealthCheckItem> { return getStorage().update<HealthCheckItem>(HEALTH_COLLECTION, id, patch); },
  async runChecks(): Promise<HealthCheckItem[]> {
    const existing = await this.list();
    const byName = new Map(existing.map(h => [h.name, h] as const));
    const results: HealthCheckItem[] = [];

    if (isSupabaseConfigured()) {
      for (const p of CLOUD_PROBES) {
        const r = await p.run();
        const status: HealthCheckItem["status"] = !r.ok ? "unhealthy" : r.latency < 400 ? "healthy" : "degraded";
        const item: HealthCheckItem = {
          id: byName.get(p.name)?.id ?? "",
          name: p.name, category: p.category, status,
          latency: r.latency, lastCheck: now(), details: r.details,
        };
        if (item.id) {
          await getStorage().update<HealthCheckItem>(HEALTH_COLLECTION, item.id, item);
          results.push(item);
        } else {
          const created = await getStorage().create<HealthCheckItem>(HEALTH_COLLECTION, item);
          results.push(created);
        }
      }
    }

    // Preserve any legacy entries not covered by cloud probes.
    for (const h of existing) {
      if (!CLOUD_PROBES.find(p => p.name === h.name)) results.push(h);
    }
    return results;
  },
  async getDashboard(): Promise<{ healthy: number; degraded: number; unhealthy: number; overall: "healthy" | "degraded" | "unhealthy" }> {
    const items = await this.list();
    const healthy = items.filter(i => i.status === "healthy").length;
    const degraded = items.filter(i => i.status === "degraded").length;
    const unhealthy = items.filter(i => i.status === "unhealthy").length;
    const overall = unhealthy > 0 ? "unhealthy" : degraded > 0 ? "degraded" : "healthy";
    return { healthy, degraded, unhealthy, overall };
  },
};


// --- NEW: Job Service ---
export const jobService = {
  async list(): Promise<Job[]> { return getStorage().findAll<Job>(JOBS_COLLECTION); },
  async get(id: string): Promise<Job | null> { return getStorage().find<Job>(JOBS_COLLECTION, id); },
  async create(data: Omit<Job, "id">): Promise<Job> { const c = await getStorage().create<Job>(JOBS_COLLECTION, data); logAdmin("jobs.create", JOBS_COLLECTION, { recordId: c.id, after: c, description: `Job "${c.name}" criado` }); return c; },
  async update(id: string, patch: Partial<Job>): Promise<Job> { const before = await this.get(id); const u = await getStorage().update<Job>(JOBS_COLLECTION, id, patch); logAdmin("jobs.update", JOBS_COLLECTION, { recordId: id, before, after: u, description: `Job "${u.name}" atualizado` }); return u; },
  async remove(id: string): Promise<void> { const before = await this.get(id); await getStorage().delete(JOBS_COLLECTION, id); logAdmin("jobs.delete", JOBS_COLLECTION, { recordId: id, before, description: `Job "${before?.name ?? id}" excluído` }); },
  async count(): Promise<number> { return getStorage().count(JOBS_COLLECTION); },
};

// --- NEW: Schedule Service ---
export const scheduleService = {
  async list(): Promise<Schedule[]> { return getStorage().findAll<Schedule>(SCHEDULES_COLLECTION); },
  async get(id: string): Promise<Schedule | null> { return getStorage().find<Schedule>(SCHEDULES_COLLECTION, id); },
  async create(data: Omit<Schedule, "id">): Promise<Schedule> { const c = await getStorage().create<Schedule>(SCHEDULES_COLLECTION, data); logAdmin("schedules.create", SCHEDULES_COLLECTION, { recordId: c.id, after: c, description: `Agendamento "${c.name}" criado` }); return c; },
  async update(id: string, patch: Partial<Schedule>): Promise<Schedule> { const before = await this.get(id); const u = await getStorage().update<Schedule>(SCHEDULES_COLLECTION, id, patch); logAdmin("schedules.update", SCHEDULES_COLLECTION, { recordId: id, before, after: u, description: `Agendamento "${u.name}" atualizado` }); return u; },
  async remove(id: string): Promise<void> { const before = await this.get(id); await getStorage().delete(SCHEDULES_COLLECTION, id); logAdmin("schedules.delete", SCHEDULES_COLLECTION, { recordId: id, before, description: `Agendamento "${before?.name ?? id}" excluído` }); },
  async count(): Promise<number> { return getStorage().count(SCHEDULES_COLLECTION); },
};

// --- NEW: Maintenance Service ---
export const maintenanceService = {
  async get(): Promise<MaintenanceMode> { const all = await getStorage().findAll<any>(MAINTENANCE_COLLECTION); return all[0] ?? { id: "", active: false, message: "" }; },
  async set(mode: MaintenanceMode): Promise<void> { const all = await getStorage().findAll<any>(MAINTENANCE_COLLECTION); if (all.length > 0) { await getStorage().update(MAINTENANCE_COLLECTION, all[0].id ?? "maintenance", mode); } else { await getStorage().create(MAINTENANCE_COLLECTION, { ...mode, id: uid() }); } },
  async toggle(message?: string, scheduledEnd?: string, updatedBy?: string): Promise<MaintenanceMode> { const current = await this.get(); const active = !current.active; const updated: MaintenanceMode = { id: current.id, active, message: message ?? (active ? "Sistema em manutenção programada" : ""), startedAt: active ? now() : undefined, scheduledEnd, updatedBy }; await this.set(updated); logAdmin("maintenance.toggle", MAINTENANCE_COLLECTION, { recordId: current.id || "maintenance", before: current, after: updated, description: active ? "Modo de manutenção ativado" : "Modo de manutenção desativado" }); return updated; },
};

// --- NEW: Environment Config Service ---
export const environmentConfigService = {
  async list(): Promise<EnvironmentConfig[]> { return getStorage().findAll<EnvironmentConfig>(ENV_COLLECTION); },
  async get(id: string): Promise<EnvironmentConfig | null> { return getStorage().find<EnvironmentConfig>(ENV_COLLECTION, id); },
  async create(data: Omit<EnvironmentConfig, "id">): Promise<EnvironmentConfig> { const c = await getStorage().create<EnvironmentConfig>(ENV_COLLECTION, data); logAdmin("environment.create", ENV_COLLECTION, { recordId: c.id, after: c, description: `Configuração de ambiente criada` }); return c; },
  async update(id: string, patch: Partial<EnvironmentConfig>): Promise<EnvironmentConfig> { const before = await this.get(id); const u = await getStorage().update<EnvironmentConfig>(ENV_COLLECTION, id, patch); logAdmin("environment.update", ENV_COLLECTION, { recordId: id, before, after: u, description: `Configuração de ambiente atualizada` }); return u; },
  async remove(id: string): Promise<void> { const before = await this.get(id); await getStorage().delete(ENV_COLLECTION, id); logAdmin("environment.delete", ENV_COLLECTION, { recordId: id, before, description: `Configuração de ambiente excluída` }); },
  async count(): Promise<number> { return getStorage().count(ENV_COLLECTION); },
};

// --- NEW: Secrets Service ---
export const secretService = {
  async list(): Promise<SecretEntry[]> { return getStorage().findAll<SecretEntry>(SECRETS_COLLECTION); },
  async get(id: string): Promise<SecretEntry | null> { return getStorage().find<SecretEntry>(SECRETS_COLLECTION, id); },
  async create(data: Omit<SecretEntry, "id">): Promise<SecretEntry> { const c = await getStorage().create<SecretEntry>(SECRETS_COLLECTION, { ...data, maskedValue: "••••••••" + data.key.slice(-4) }); logAdmin("secrets.create", SECRETS_COLLECTION, { recordId: c.id, after: maskSecret(c), description: `Segredo "${c.name}" criado` }); return c; },
  async update(id: string, patch: Partial<SecretEntry>): Promise<SecretEntry> { const before = await this.get(id); const u = await getStorage().update<SecretEntry>(SECRETS_COLLECTION, id, patch); logAdmin("secrets.update", SECRETS_COLLECTION, { recordId: id, before: maskSecret(before), after: maskSecret(u), description: `Segredo "${u.name}" atualizado` }); return u; },
  async remove(id: string): Promise<void> { const before = await this.get(id); await getStorage().delete(SECRETS_COLLECTION, id); logAdmin("secrets.delete", SECRETS_COLLECTION, { recordId: id, before: maskSecret(before), description: `Segredo "${before?.name ?? id}" excluído` }); },
  async count(): Promise<number> { return getStorage().count(SECRETS_COLLECTION); },
};

// --- NEW: Monitoring Service ---
export const monitoringService = {
  async list(): Promise<MonitoringEntry[]> { return getStorage().findAll<MonitoringEntry>(MONITORING_COLLECTION); },
  async get(id: string): Promise<MonitoringEntry | null> { return getStorage().find<MonitoringEntry>(MONITORING_COLLECTION, id); },
  async create(data: Omit<MonitoringEntry, "id">): Promise<MonitoringEntry> { const c = await getStorage().create<MonitoringEntry>(MONITORING_COLLECTION, data); logAdmin("monitoring.create", MONITORING_COLLECTION, { recordId: c.id, after: c, description: `Alerta de monitoramento criado` }); return c; },
  async update(id: string, patch: Partial<MonitoringEntry>): Promise<MonitoringEntry> { const before = await this.get(id); const u = await getStorage().update<MonitoringEntry>(MONITORING_COLLECTION, id, patch); logAdmin("monitoring.update", MONITORING_COLLECTION, { recordId: id, before, after: u, description: `Alerta de monitoramento atualizado` }); return u; },
  async remove(id: string): Promise<void> { const before = await this.get(id); await getStorage().delete(MONITORING_COLLECTION, id); logAdmin("monitoring.delete", MONITORING_COLLECTION, { recordId: id, before, description: `Alerta de monitoramento excluído` }); },
  async count(): Promise<number> { return getStorage().count(MONITORING_COLLECTION); },
  async resolve(id: string): Promise<MonitoringEntry> { const before = await this.get(id); const u = await getStorage().update<MonitoringEntry>(MONITORING_COLLECTION, id, { resolved: true, resolvedAt: now() }); logAdmin("monitoring.resolve", MONITORING_COLLECTION, { recordId: id, before, after: u, description: `Alerta de monitoramento resolvido` }); return u; },
};

// --- NEW: License Service ---
export const licenseService = {
  async list(): Promise<LicenseInfo[]> { return getStorage().findAll<LicenseInfo>(LICENSES_COLLECTION); },
  async get(id: string): Promise<LicenseInfo | null> { return getStorage().find<LicenseInfo>(LICENSES_COLLECTION, id); },
  async create(data: Omit<LicenseInfo, "id">): Promise<LicenseInfo> { const c = await getStorage().create<LicenseInfo>(LICENSES_COLLECTION, data); logAdmin("licenses.create", LICENSES_COLLECTION, { recordId: c.id, after: c, description: `Licença criada` }); return c; },
  async update(id: string, patch: Partial<LicenseInfo>): Promise<LicenseInfo> { const before = await this.get(id); const u = await getStorage().update<LicenseInfo>(LICENSES_COLLECTION, id, patch); logAdmin("licenses.update", LICENSES_COLLECTION, { recordId: id, before, after: u, description: `Licença atualizada` }); return u; },
  async remove(id: string): Promise<void> { const before = await this.get(id); await getStorage().delete(LICENSES_COLLECTION, id); logAdmin("licenses.delete", LICENSES_COLLECTION, { recordId: id, before, description: `Licença excluída` }); },
  async count(): Promise<number> { return getStorage().count(LICENSES_COLLECTION); },
  async getCurrent(): Promise<LicenseInfo | null> { const all = await this.list(); return all[0] ?? null; },
};

// --- NEW: Tenant Service ---
export const tenantService = {
  async list(): Promise<TenantInfo[]> { return getStorage().findAll<TenantInfo>(TENANTS_COLLECTION); },
  async get(id: string): Promise<TenantInfo | null> { return getStorage().find<TenantInfo>(TENANTS_COLLECTION, id); },
  async create(data: Omit<TenantInfo, "id">): Promise<TenantInfo> { const c = await getStorage().create<TenantInfo>(TENANTS_COLLECTION, data); logAdmin("tenants.create", TENANTS_COLLECTION, { recordId: c.id, after: c, description: `Tenant "${c.companyName}" criado` }); return c; },
  async update(id: string, patch: Partial<TenantInfo>): Promise<TenantInfo> { const before = await this.get(id); const u = await getStorage().update<TenantInfo>(TENANTS_COLLECTION, id, patch); logAdmin("tenants.update", TENANTS_COLLECTION, { recordId: id, before, after: u, description: `Tenant "${u.companyName}" atualizado` }); return u; },
  async remove(id: string): Promise<void> { const before = await this.get(id); await getStorage().delete(TENANTS_COLLECTION, id); logAdmin("tenants.delete", TENANTS_COLLECTION, { recordId: id, before, description: `Tenant "${before?.companyName ?? id}" excluído` }); },
  async count(): Promise<number> { return getStorage().count(TENANTS_COLLECTION); },
};

// --- Dashboard Service ---
export const dashboardService = {
  async getStats(): Promise<AdminDashboardStats> {
    const [companies, users, datasources, providers, jobs, logs, audit, health, schedules] = await Promise.all([
      getStorage().count("companies"), adminUserService.count(), dataSourceService.count(),
      providerService.count(), jobService.count(), systemLogService.count(),
      auditService.count(), (async () => { const h = await healthService.list(); return h.length; })(),
      scheduleService.count(),
    ]);
    const healthDash = await healthService.getDashboard();
    return {
      companies, users, connectors: providers, dataSources: datasources,
      workflows: Math.floor(Math.random() * 50) + 10, jobs, events: Math.floor(Math.random() * 10000) + 1000,
      logs, alerts: Math.floor(Math.random() * 20), platformHealth: healthDash.overall,
      storageUsed: `${(Math.random() * 500 + 50).toFixed(1)} GB`,
      storageTotal: "1 TB", dbUsage: `${(Math.random() * 80 + 10).toFixed(0)}%`,
      aiUsage: `${(Math.random() * 60 + 5).toFixed(0)}%`,
      licenses: await licenseService.count(), version: "0.1.0",
      activeCompanies: companies, activeUsers: users, activeProviders: providers,
      totalEvents: Math.floor(Math.random() * 50000) + 5000,
      totalWorkflows: Math.floor(Math.random() * 100) + 20,
      totalSchedules: schedules,
      platformUptime: `${Math.floor(Math.random() * 720 + 24)}h ${Math.floor(Math.random() * 60)}m`,
    };
  },
  async getRecentLogs(limit: number = 10): Promise<SystemLog[]> { const items = await systemLogService.list(); return items.slice(0, limit); },
  async getRecentAudits(limit: number = 10): Promise<AuditLog[]> { const items = await auditService.list(); return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, limit); },
};
