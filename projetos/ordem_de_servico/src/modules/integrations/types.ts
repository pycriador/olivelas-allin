export type ConnectorCategory =
  | "database" | "rest-api" | "webhook" | "cloud-storage" | "messaging"
  | "communication" | "erp" | "crm" | "financial" | "marketplace" | "ai" | "infrastructure";

export type ConnectorType =
  | "postgresql" | "mariadb" | "sqlite" | "supabase" | "openai" | "gemini" | "claude"
  | "slack" | "microsoft-teams" | "whatsapp-business" | "telegram"
  | "google-drive" | "onedrive" | "dropbox" | "smtp" | "amazon-s3"
  | "rest-api" | "webhook" | "json" | "csv" | "excel" | "xml"
  | "custom";

export type ConnectorStatus = "active" | "inactive" | "error" | "installing" | "uninstalled";
export type EnvironmentType = "production" | "staging" | "development" | "testing";

export interface ConnectorDefinition {
  id: string;
  name: string;
  type: ConnectorType;
  category: ConnectorCategory;
  version: string;
  description: string;
  icon: string;
  provider: string;
  docs: string;
  tags: string[];
  permissions: string[];
  dependencies: string[];
  isGlobal: boolean;
  isInstalled: boolean;
  status: ConnectorStatus;
  configSchema: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface ConnectorInstance {
  id: string;
  definitionId: string;
  name: string;
  type: ConnectorType;
  category: ConnectorCategory;
  version: string;
  companyId?: string;
  environment: EnvironmentType;
  status: ConnectorStatus;
  config: Record<string, string>;
  tags: string[];
  isFavorite: boolean;
  lastUsedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type AuthType =
  | "bearer" | "oauth2" | "jwt" | "basic" | "api-key"
  | "client-credentials" | "refresh-token" | "custom-headers";

export interface AuthConfig {
  type: AuthType;
  config: Record<string, string>;
  headers?: Record<string, string>;
  tokenUrl?: string;
  scopes?: string[];
  expiresAt?: string;
}

export interface SecretEntry {
  id: string;
  name: string;
  encryptedValue: string;
  connectorId?: string;
  connectionId?: string;
  companyId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Connection {
  id: string;
  connectorInstanceId: string;
  name: string;
  baseUrl?: string;
  auth: AuthConfig;
  status: "active" | "inactive" | "error" | "testing";
  environment: EnvironmentType;
  timeout: number;
  retryCount: number;
  rateLimit: number;
  headers: Record<string, string>;
  tags: string[];
  isFavorite: boolean;
  lastTestedAt?: string;
  lastUsedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type WebhookMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
export type WebhookStatus = "active" | "inactive" | "error";
export type WebhookFormat = "json" | "xml" | "form-data";

export interface Webhook {
  id: string;
  name: string;
  url: string;
  method: WebhookMethod;
  format: WebhookFormat;
  headers: Record<string, string>;
  secret?: string;
  status: WebhookStatus;
  companyId?: string;
  connectorId?: string;
  eventType: string;
  retryCount: number;
  timeout: number;
  version: number;
  history: WebhookLog[];
  createdAt?: string;
  updatedAt?: string;
}

export interface WebhookLog {
  id: string;
  webhookId: string;
  status: "sent" | "received" | "processing" | "completed" | "error";
  requestPayload?: string;
  responsePayload?: string;
  responseCode?: number;
  processingTime: number;
  error?: string;
  createdAt?: string;
}

export interface APIEndpoint {
  id: string;
  name: string;
  baseUrl: string;
  method: WebhookMethod;
  path: string;
  headers: Record<string, string>;
  auth: AuthConfig;
  timeout: number;
  retryCount: number;
  rateLimit: number;
  version: string;
  status: "active" | "inactive" | "error";
  connectorId?: string;
  companyId?: string;
  tags: string[];
  monitoring: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type SyncType = "manual" | "scheduled" | "event" | "webhook" | "import" | "export" | "bidirectional" | "incremental" | "full";
export type SyncStatus = "idle" | "running" | "completed" | "error" | "cancelled" | "conflict";
export type ConflictResolution = "source-wins" | "destination-wins" | "newest-wins" | "manual" | "custom-rule";

export interface SyncJob {
  id: string;
  name: string;
  type: SyncType;
  status: SyncStatus;
  sourceId: string;
  destinationId: string;
  mapping: SyncMapping[];
  conflictResolution: ConflictResolution;
  schedule?: string;
  lastRunAt?: string;
  nextRunAt?: string;
  retryCount: number;
  maxRetries: number;
  progress: number;
  totalRecords: number;
  processedRecords: number;
  errorRecords: number;
  companyId?: string;
  connectorId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SyncMapping {
  id: string;
  sourceField: string;
  sourceType: string;
  destinationField: string;
  destinationType: string;
  transform?: string;
  validation?: string;
  required: boolean;
  defaultValue?: string;
}

export interface IntegrationLog {
  id: string;
  type: "request" | "response" | "webhook" | "sync" | "auth" | "error" | "health";
  connectorId?: string;
  connectionId?: string;
  webhookId?: string;
  syncJobId?: string;
  status: "success" | "error" | "warning";
  method?: string;
  url?: string;
  requestPayload?: string;
  responsePayload?: string;
  responseCode?: number;
  processingTime: number;
  error?: string;
  retryCount: number;
  userId?: string;
  companyId?: string;
  createdAt?: string;
}

export interface HealthCheckResult {
  id: string;
  connectorId?: string;
  connectionId?: string;
  status: "healthy" | "degraded" | "unhealthy";
  auth: boolean;
  connectivity: boolean;
  latency: number;
  availability: number;
  permissions: boolean;
  version: string;
  rateLimit: boolean;
  error?: string;
  checkedAt: string;
}

export interface MonitoringStats {
  activeConnectors: number;
  errorConnectors: number;
  totalSyncs: number;
  completedSyncs: number;
  failedSyncs: number;
  avgProcessingTime: number;
  totalVolume: number;
  totalRetries: number;
  avgLatency: number;
  availability: number;
  lastUpdated: string;
}

export interface ConnectorTemplate {
  id: string;
  name: string;
  category: ConnectorCategory;
  type: ConnectorType;
  description: string;
  configTemplate: Record<string, string>;
  authType: AuthType;
  isGlobal: boolean;
  companyId?: string;
  version: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MarketplaceEntry {
  id: string;
  definitionId: string;
  name: string;
  type: ConnectorType;
  category: ConnectorCategory;
  description: string;
  icon: string;
  version: string;
  author: string;
  downloads: number;
  rating: number;
  isInstalled: boolean;
  isOfficial: boolean;
  tags: string[];
  docsUrl?: string;
  createdAt?: string;
}
