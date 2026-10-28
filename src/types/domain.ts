export type LanguageCode = 'pt-BR' | 'en' | 'es';
export type Locale = LanguageCode;
export type CurrencyCode = 'BRL' | 'USD' | 'EUR';
export type ThemeMode = 'system' | 'light' | 'dark' | (string & {});

export type PermissionAction =
  | 'view'
  | 'create'
  | 'edit'
  | 'archive'
  | 'export'
  | 'approve'
  | 'administer';

export type PermissionScope = 'global' | 'company' | 'resource';

export type PermissionResource =
  | 'dashboard'
  | 'companies'
  | 'users'
  | 'roles'
  | 'modules'
  | 'contracts'
  | 'finance'
  | 'payment_methods'
  | 'api_hub'
  | 'tickets'
  | 'audit'
  | 'reports'
  | 'inventory'
  | 'crm'
  | 'orders';

export type ResourceKey = PermissionResource;

export interface ArchiveMetadata {
  isArchived: boolean;
  archivedAt?: string;
  archivedByUserId?: string;
  archivedByUserName?: string;
  archiveReason?: string;
  restoredAt?: string;
  restoredByUserId?: string;
  previousStatus?: string;
}

export interface ChangeHistoryEntry {
  id: string;
  timestamp: string;
  actorUserId?: string;
  actorName?: string;
  userId?: string;
  userName?: string;
  action: string;
  summary: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
}

export interface BaseBusinessEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
  archiveMetadata: ArchiveMetadata;
  changeHistory: ChangeHistoryEntry[];
}

export interface PermissionGrant {
  resource: PermissionResource;
  action: PermissionAction;
  scope: PermissionScope;
  moduleCode?: string;
}

export type RoleSystemCode =
  | 'super_admin'
  | 'admin'
  | 'financeiro'
  | 'cliente'
  | 'gerente'
  | 'funcionario'
  | string;

export interface RoleEntity {
  id: string;
  code: RoleSystemCode;
  name: Record<LanguageCode, string>;
  description: Record<LanguageCode, string>;
  hierarchyLevel: number; // 1 = Super Admin (highest authority), 2 = Admin, 3 = Financeiro, 4 = Cliente, 5 = Gerente, 6 = Funcionario
  parentRoleId?: string | null;
  scope: PermissionScope;
  companyId?: string;
  isSystemRole?: boolean;
  isSystem?: boolean;
  status: 'active' | 'inactive' | 'archived';
  permissions: PermissionGrant[];
  createdAt: string;
  updatedAt: string;
  archiveMetadata: ArchiveMetadata;
  changeHistory: ChangeHistoryEntry[];
}

export interface IndividualPermissionOverride {
  id: string;
  resource: PermissionResource;
  action: PermissionAction;
  scope: PermissionScope;
  companyId?: string;
  effect: 'allow' | 'deny';
  grantedByUserId: string;
  grantedByUserName: string;
  reason: string;
  createdAt: string;
}

export interface EffectivePermissionCell {
  resource: PermissionResource;
  action: PermissionAction;
  allowed: boolean;
  scope: PermissionScope;
  originType: 'role_direct' | 'role_inherited' | 'individual_allow' | 'individual_deny' | 'none';
  originLabel: string;
  roleId?: string;
}

export type CompanyStatus = 'pending' | 'active' | 'suspended' | 'archived';

export interface CompanyContact {
  name: string;
  role: string;
  email: string;
  phone: string;
}

export interface CompanyEntity {
  id: string;
  legalName: string;
  tradeName: string;
  taxId?: string;
  country: string;
  defaultLanguage: LanguageCode;
  timezone: string;
  currency: CurrencyCode;
  registrationStatus: CompanyStatus;
  operationalStatus: CompanyStatus;
  contacts: CompanyContact[];
  address: {
    street: string;
    number: string;
    complement?: string;
    district: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  createdAt: string;
  updatedAt: string;
  archiveMetadata: ArchiveMetadata;
  changeHistory: ChangeHistoryEntry[];
}

export type UserStatus = 'active' | 'pending' | 'suspended' | 'inactive' | 'archived';

export interface UserEntity {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: UserStatus;
  language: LanguageCode;
  roleIds: string[];
  companyIds: string[];
  assignedCompanyIds?: string[];
  individualPermissions: IndividualPermissionOverride[];
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
  archiveMetadata: ArchiveMetadata;
  changeHistory: ChangeHistoryEntry[];
}

export type ModuleCategory =
  | 'core'
  | 'operations'
  | 'finance'
  | 'commercial'
  | 'people'
  | 'technical'
  | 'governance'
  | 'support'
  | 'intelligence';

export type ModuleCommercialStatus = 'active' | 'draft' | 'deprecated' | 'archived';

export interface CatalogModuleEntity {
  id: string;
  code: string;
  name: Record<LanguageCode, string>;
  description: Record<LanguageCode, string>;
  category: ModuleCategory;
  priceMonthly: number;
  priceYearly: number;
  currency: CurrencyCode;
  usageLimits: string;
  dependencies: string[];
  commercialStatus: ModuleCommercialStatus;
  version: string;
  effectiveDate: string;
  isCore?: boolean;
  createdAt: string;
  updatedAt: string;
  archiveMetadata: ArchiveMetadata;
  changeHistory: ChangeHistoryEntry[];
}

export type CompanyModuleStatus = 'active' | 'suspended' | 'cancelled' | 'archived';

export interface CompanyModuleSubscription {
  id: string;
  companyId: string;
  moduleId: string;
  moduleCode: string;
  status: CompanyModuleStatus;
  contractId?: string;
  billingCycle: 'monthly' | 'yearly';
  agreedPrice: number;
  currency: CurrencyCode;
  activatedAt: string;
  renewalDate: string;
}

export type ContractStatus =
  | 'draft'
  | 'pending_signature'
  | 'active'
  | 'suspended'
  | 'expired'
  | 'cancelled'
  | 'archived';

export interface ContractVersionSnapshot {
  version: number;
  createdAt: string;
  createdBy: string;
  summary: string;
  totalValue: number;
  moduleIds: string[];
}

export interface ContractSignatureRecord {
  id: string;
  signerName: string;
  signerEmail: string;
  signerDocument: string;
  signedAt: string;
  ipAddressSimulated: string;
  acceptanceHash: string;
  isSimulated: boolean;
}

export interface ContractAttachmentRecord {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
  uploadedBy: string;
  isSimulated: boolean;
}

export interface ContractEntity {
  id: string;
  code: string;
  companyId: string;
  companyName: string;
  planName: string;
  moduleIds: string[];
  startDate: string;
  endDate: string;
  billingCycle: 'monthly' | 'yearly';
  totalValue: number;
  discountValue: number;
  finalValue: number;
  currency: CurrencyCode;
  status: ContractStatus;
  commercialResponsible: string;
  clausesText: string;
  version: number;
  versionHistory: ContractVersionSnapshot[];
  signatures: ContractSignatureRecord[];
  attachments: ContractAttachmentRecord[];
  createdAt: string;
  updatedAt: string;
  archiveMetadata: ArchiveMetadata;
  changeHistory: ChangeHistoryEntry[];
}

export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'paid'
  | 'overdue'
  | 'failed'
  | 'cancelled'
  | 'refunded'
  | 'archived';

export type PaymentMethodType = 'pix' | 'boleto' | 'credit_card' | 'bank_transfer';

export interface ChargeEntity {
  id: string;
  code: string;
  companyId: string;
  companyName: string;
  contractId: string;
  description: string;
  amount: number;
  currency: CurrencyCode;
  dueDate: string;
  status: PaymentStatus;
  paymentMethodType: PaymentMethodType;
  installmentTotal: number;
  reconciled: boolean;
  reconciledAt?: string;
  reconciledBy?: string;
  createdAt: string;
  updatedAt: string;
  archiveMetadata: ArchiveMetadata;
  changeHistory: ChangeHistoryEntry[];
}

export interface PaymentRecordEntity {
  id: string;
  chargeId: string;
  chargeCode: string;
  companyId: string;
  companyName: string;
  amountPaid: number;
  currency: CurrencyCode;
  paidAt: string;
  methodType: PaymentMethodType;
  referenceCode: string;
  notes?: string;
  reconciled: boolean;
  createdAt: string;
  updatedAt: string;
  archiveMetadata: ArchiveMetadata;
  changeHistory: ChangeHistoryEntry[];
}

export interface InstallmentEntity {
  id: string;
  chargeId: string;
  chargeCode: string;
  companyId: string;
  companyName: string;
  installmentNumber: number;
  totalInstallments: number;
  amount: number;
  currency: CurrencyCode;
  dueDate: string;
  status: PaymentStatus;
  paidAt?: string;
}

export interface PaymentMethodConfigEntity {
  id: string;
  name: string;
  type: PaymentMethodType;
  providerName: string;
  environment: 'sandbox_mock' | 'production_disabled';
  status: 'active' | 'inactive' | 'archived';
  maskedCredentialPreview: string;
  feePercentage: number;
  settlementDays: number;
  instructions: string;
  createdAt: string;
  updatedAt: string;
  archiveMetadata: ArchiveMetadata;
  changeHistory: ChangeHistoryEntry[];
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface KeyValueRow {
  key: string;
  value: string;
  enabled: boolean;
  description?: string;
}

export interface ExpectedResponseScenario {
  statusCode: number;
  label: string;
  latencyMs: number;
  headers: Record<string, string>;
  bodyJson: string;
}

export interface ApiCollectionEntity {
  id: string;
  name: string;
  description: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  archiveMetadata: ArchiveMetadata;
  changeHistory: ChangeHistoryEntry[];
}

export interface ApiEnvironmentEntity {
  id: string;
  name: string;
  slug: string;
  baseUrl: string;
  variables: Record<string, string>;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  archiveMetadata: ArchiveMetadata;
  changeHistory: ChangeHistoryEntry[];
}

export interface ApiServiceEntity {
  id: string;
  collectionId: string;
  name: string;
  description: string;
  method: HttpMethod;
  baseUrl: string;
  path: string;
  defaultHeaders: KeyValueRow[];
  queryParams: KeyValueRow[];
  authType: 'none' | 'bearer_token' | 'api_key';
  bodyType: 'none' | 'json' | 'text';
  bodyTemplate: string;
  timeoutMs: number;
  expectedResponses: ExpectedResponseScenario[];
  createdAt: string;
  updatedAt: string;
  archiveMetadata: ArchiveMetadata;
  changeHistory: ChangeHistoryEntry[];
}

export interface ApiTokenEntity {
  id: string;
  name: string;
  maskedPreview: string;
  scope: PermissionScope;
  companyId?: string;
  companyName?: string;
  permissions: string[];
  expiresAt: string;
  status: 'active' | 'revoked' | 'expired' | 'archived';
  createdByUserId: string;
  createdByUserName: string;
  lastUsedAt?: string;
  revokedAt?: string;
  revokedReason?: string;
  createdAt: string;
  updatedAt: string;
  archiveMetadata: ArchiveMetadata;
  changeHistory: ChangeHistoryEntry[];
}

export interface ApiExecutionHistoryEntity {
  id: string;
  serviceId: string;
  serviceName: string;
  environmentId: string;
  environmentName: string;
  tokenId?: string;
  method: HttpMethod;
  resolvedUrl: string;
  requestHeaders: Record<string, string>;
  requestBody: string;
  responseStatus: number;
  responseLatencyMs: number;
  responseHeaders: Record<string, string>;
  responseBody: string;
  executedByUserId: string;
  executedByUserName: string;
  executedAt: string;
  isSimulated: boolean;
}

export type TicketStatus =
  | 'open'
  | 'in_progress'
  | 'waiting_customer'
  | 'resolved'
  | 'closed'
  | 'archived';

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TicketCategory =
  | 'access'
  | 'billing'
  | 'technical'
  | 'module_request'
  | 'general';

export interface TicketComment {
  id: string;
  authorUserId: string;
  authorName: string;
  authorRoleLabel: string;
  visibility: 'public' | 'internal';
  content: string;
  createdAt: string;
}

export interface TicketAttachment {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedBy: string;
  uploadedAt: string;
  isSimulated: boolean;
}

export interface TicketEntity {
  id: string;
  code: string;
  companyId: string;
  companyName: string;
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  relatedModuleCode?: string;
  openedByUserId: string;
  openedByUserName: string;
  assignedToUserId?: string;
  assignedToUserName?: string;
  slaDueAt: string;
  comments: TicketComment[];
  attachments: TicketAttachment[];
  createdAt: string;
  updatedAt: string;
  archiveMetadata: ArchiveMetadata;
  changeHistory: ChangeHistoryEntry[];
}

export type AuditActionType =
  | 'create'
  | 'update'
  | 'archive'
  | 'restore'
  | 'login'
  | 'logout'
  | 'switch_context'
  | 'impersonate_company'
  | 'impersonate_start'
  | 'impersonate_end'
  | 'grant_permission'
  | 'revoke_permission'
  | 'sign_contract'
  | 'reconcile_payment'
  | 'revoke_token'
  | 'execute_api'
  | 'reset_demo_data';

export interface AuditEventEntity {
  id: string;
  timestamp: string;
  actorUserId: string;
  actorName: string;
  actorRole: string;
  companyId?: string;
  companyName?: string;
  module: PermissionResource | 'auth' | 'system' | string;
  action: AuditActionType;
  entityType: string;
  entityId: string;
  summary: string;
  previousValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  origin: 'web_ui' | 'support_impersonation' | 'api_simulator' | 'system_seed';
  correlationId: string;
}

export interface SupportImpersonationSession {
  isActive?: boolean;
  targetCompanyId: string;
  targetCompanyName: string;
  startedAt: string;
  reason: string;
  actorUserId?: string;
  actorName?: string;
}

export interface SessionContextState {
  currentUserId: string | null;
  activeScope: 'global' | 'company';
  activeCompanyId: string;
  impersonation: SupportImpersonationSession | null;
  language: LanguageCode;
  theme: ThemeMode;
}

export interface ListQueryParams {
  search: string;
  status: string;
  includeArchived: 'true' | 'false' | 'only';
  sort: string;
  order: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

export interface OperationalItemEntity {
  id: string;
  companyId: string;
  moduleType: 'inventory' | 'orders' | 'crm';
  code: string;
  title: string;
  category: string;
  status: 'active' | 'pending' | 'archived';
  quantity: number;
  amount: number;
  currency: CurrencyCode;
  createdAt: string;
  updatedAt: string;
  archiveMetadata: ArchiveMetadata;
  changeHistory: ChangeHistoryEntry[];
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
