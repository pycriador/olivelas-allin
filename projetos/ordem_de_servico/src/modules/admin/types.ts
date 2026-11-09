export interface AdminUser {
  id: string;
  photoUrl: string;
  name: string;
  email: string;
  phone: string;
  cpf: string;
  position: string;
  status: "active" | "inactive";
  language: string;
  theme: string;
  primaryCompanyId: string;
  linkedCompanyIds: string[];
  roleIds: string[];
  specialPermissions: string[];
  lastAccess: string;
  createdAt: string;
  updatedAt: string;
  mfaEnabled?: boolean;
  sessions?: UserSession[];
  devices?: UserDevice[];
  preferences?: Record<string, string>;
}

export interface UserSession {
  id: string;
  ip: string;
  browser: string;
  os: string;
  startedAt: string;
  lastActivity: string;
  active: boolean;
}

export interface UserDevice {
  id: string;
  name: string;
  type: string;
  os: string;
  lastAccess: string;
  trusted: boolean;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  permissions: PermissionEntry[];
  status: "active" | "inactive";
  isSystem?: boolean;
}

export interface PermissionEntry {
  resource: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canPrint: boolean;
  canExport: boolean;
  canImport: boolean;
  canPublish: boolean;
  canAdmin: boolean;
}

export type PermissionCategory = "view" | "create" | "edit" | "delete" | "print" | "export" | "import" | "publish" | "administer";

export interface PermissionScope {
  resource: string;
  module: string;
  screen: string;
  action: string;
  field?: string;
  document?: string;
  workflow?: string;
  company?: string;
  api?: string;
  connector?: string;
  provider?: string;
  featureFlag?: string;
  inheritance?: "global" | "role" | "user";
}

export interface AdminGroup {
  id: string;
  name: string;
  description: string;
  type: "system" | "custom";
  memberIds: string[];
  roleId?: string;
  companyId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Policy {
  id: string;
  name: string;
  description: string;
  category: "password" | "session" | "login" | "timeout" | "upload" | "export" | "print" | "audit" | "lgpd" | "retention" | "other";
  rules: PolicyRule[];
  scope: "global" | "company";
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PolicyRule {
  key: string;
  value: string | number | boolean;
  operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "contains";
}

export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  key: string;
  enabled: boolean;
  scope: "global" | "company" | "user" | "environment" | "version";
  companyIds?: string[];
  userIds?: string[];
  environment?: string;
  version?: string;
  rolloutPercentage?: number;
  createdAt: string;
  updatedAt: string;
}

export interface TenantInfo {
  id: string;
  companyId: string;
  companyName: string;
  limits: TenantLimits;
  usage: TenantUsage;
  licensing: LicenseInfo;
  storage: { used: number; total: number; unit: string };
  users: number;
  history: TenantEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface TenantLimits {
  maxUsers: number;
  maxStorage: number;
  maxCompanies: number;
  maxConnectors: number;
  maxAiRequests: number;
  maxDocuments: number;
  maxWorkflows: number;
  maxReports: number;
}

export interface TenantUsage {
  currentUsers: number;
  currentStorage: number;
  currentConnectors: number;
  currentAiRequests: number;
  currentDocuments: number;
  currentWorkflows: number;
  currentReports: number;
}

export interface TenantEvent {
  id: string;
  type: string;
  description: string;
  timestamp: string;
}

export interface LicenseInfo {
  id: string;
  plan: "free" | "starter" | "professional" | "enterprise";
  status: "active" | "expired" | "suspended";
  validFrom: string;
  validTo: string;
  maxUsers: number;
  maxStorage: number;
  maxCompanies: number;
  maxConnectors: number;
  maxAiRequests: number;
  maxDocuments: number;
  maxWorkflows: number;
  maxReports: number;
  features: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ThemeConfig {
  id: string;
  name: string;
  description: string;
  companyId?: string;
  isGlobal: boolean;
  isDefault: boolean;
  logo: string;
  favicon: string;
  colors: ThemeColors;
  fonts: ThemeFonts;
  cssTokens: Record<string, string>;
  darkMode: boolean;
  lightMode: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  muted: string;
  border: string;
  destructive: string;
  success: string;
  warning: string;
}

export interface ThemeFonts {
  heading: string;
  body: string;
  mono: string;
}

export interface LanguageConfig {
  id: string;
  code: string;
  name: string;
  nativeName: string;
  enabled: boolean;
  isDefault: boolean;
  direction: "ltr" | "rtl";
  dateFormat: string;
  timeFormat: string;
  currency: string;
  decimalSeparator: string;
  thousandsSeparator: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProviderConfig {
  id: string;
  name: string;
  type: "ai" | "database" | "storage" | "mail" | "auth" | "connector";
  provider: string;
  status: "active" | "inactive" | "error";
  priority: number;
  fallback: boolean;
  config: Record<string, string>;
  healthCheck?: ProviderHealth;
  createdAt: string;
  updatedAt: string;
}

export interface ProviderHealth {
  status: "healthy" | "degraded" | "unhealthy";
  latency: number;
  lastCheck: string;
  error?: string;
}

export interface DataSource {
  id: string;
  name: string;
  description: string;
  type: string;
  config: Record<string, string>;
  status: "active" | "inactive" | "error";
  lastSync?: string;
  lastTest?: string;
  testResult?: "success" | "failed";
  createdAt: string;
  updatedAt: string;
}

export interface BackupDefinition {
  id: string;
  type: "manual" | "scheduled" | "full" | "incremental";
  status: "completed" | "failed" | "in_progress";
  fileName: string;
  size: number;
  description: string;
  startedAt: string;
  completedAt?: string;
  createdBy: string;
  restoredAt?: string;
  restoredBy?: string;
}

export interface HealthCheckItem {
  id: string;
  name: string;
  category: "database" | "storage" | "provider" | "connector" | "queue" | "events" | "jobs" | "workflows" | "performance" | "cache" | "availability" | "auth" | "realtime";
  status: "healthy" | "degraded" | "unhealthy";
  latency: number;
  lastCheck: string;
  details: string;
}

export interface Job {
  id: string;
  name: string;
  type: string;
  status: "running" | "completed" | "failed" | "pending" | "scheduled";
  progress: number;
  startedAt: string;
  completedAt?: string;
  error?: string;
  createdBy: string;
}

export interface Schedule {
  id: string;
  name: string;
  jobType: string;
  cron: string;
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
  config: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceMode {
  id?: string;
  active: boolean;
  message: string;
  startedAt?: string;
  scheduledEnd?: string;
  updatedBy?: string;
  version?: string;
}

export interface EnvironmentConfig {
  id: string;
  name: string;
  key: string;
  value: string;
  type: "string" | "number" | "boolean" | "json";
  scope: "global" | "company" | "module";
  module?: string;
  encrypted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SecretEntry {
  id: string;
  name: string;
  key: string;
  description: string;
  maskedValue: string;
  scope: "global" | "company";
  companyId?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MonitoringEntry {
  id: string;
  type: "metric" | "event" | "alert" | "exception";
  source: string;
  title: string;
  description: string;
  severity: "info" | "warning" | "critical";
  timestamp: string;
  resolved: boolean;
  resolvedAt?: string;
}

export interface AdminDashboardStats {
  companies: number;
  users: number;
  connectors: number;
  dataSources: number;
  workflows: number;
  jobs: number;
  events: number;
  logs: number;
  alerts: number;
  platformHealth: "healthy" | "degraded" | "unhealthy";
  storageUsed: string;
  storageTotal: string;
  dbUsage: string;
  aiUsage: string;
  licenses: number;
  version: string;
  activeCompanies: number;
  activeUsers: number;
  activeProviders: number;
  totalEvents: number;
  totalWorkflows: number;
  totalSchedules: number;
  platformUptime: string;
}

export interface AuditLog {
  id: string;
  date: string;
  time: string;
  userId: string;
  userName: string;
  companyId: string | null;
  companyName: string;
  module: string;
  screen: string;
  action: string;
  entity: string;
  recordId: string;
  description: string;
  ip: string;
  browser: string;
  os: string;
  sessionId: string;
  result: "success" | "error" | "warning";
  duration: number;
  origin: string;
  timestamp: string;
}

export interface SystemLog {
  id: string;
  level: "info" | "warning" | "error" | "debug";
  message: string;
  module: string;
  userId: string | null;
  userName: string | null;
  companyId: string | null;
  companyName: string | null;
  timestamp: string;
  details: string;
}

export interface BackupRecord {
  id: string;
  fileName: string;
  size: string;
  createdAt: string;
  status: "completed" | "failed" | "in_progress";
  type: "full" | "partial";
  description: string;
}

export interface ImpersonationSession {
  active: boolean;
  originalUserId: string;
  originalUserName: string;
  companyId: string;
  companyName: string;
  startedAt: string;
  reason?: string;
  duration?: number;
}

export interface GlobalConfig {
  id: "global";
  systemName: string;
  systemDescription: string;
  systemVersion: string;
  defaultLanguage: string;
  defaultTheme: string;
  timezone: string;
  dateFormat: string;
  sessionTimeout: number;
  maxLoginAttempts: number;
  requireMfa: boolean;
  maintenanceMode: boolean;
  allowRegistration: boolean;
  defaultRoleId: string;
  backupEnabled: boolean;
  backupInterval: string;
  backupRetention: number;
  logRetention: number;
  auditRetention: number;
  companyDefaults: {
    defaultTheme: string;
    defaultLanguage: string;
    logoUrl: string;
    primaryColor: string;
    secondaryColor: string;
    documentFooter: string;
    defaultMessage: string;
  };
}

export const DEFAULT_GLOBAL_CONFIG: GlobalConfig = {
  id: "global",
  systemName: "ServiceForge",
  systemDescription: "Plataforma de Gestão de Assistência Técnica",
  systemVersion: "0.1.0",
  defaultLanguage: "pt-BR",
  defaultTheme: "system",
  timezone: "America/Sao_Paulo",
  dateFormat: "DD/MM/YYYY",
  sessionTimeout: 60,
  maxLoginAttempts: 5,
  requireMfa: false,
  maintenanceMode: false,
  allowRegistration: false,
  defaultRoleId: "",
  backupEnabled: true,
  backupInterval: "daily",
  backupRetention: 30,
  logRetention: 90,
  auditRetention: 365,
  companyDefaults: {
    defaultTheme: "system",
    defaultLanguage: "pt-BR",
    logoUrl: "",
    primaryColor: "#0066CC",
    secondaryColor: "#00AA88",
    documentFooter: "ServiceForge - Todos os direitos reservados",
    defaultMessage: "Obrigado por escolher nossos serviços!",
  },
};
