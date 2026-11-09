export type OrgRole = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
export type OrgStatus = "ACTIVE" | "SUSPENDED" | "INACTIVE";
export type MembershipStatus = "ACTIVE" | "INVITED" | "SUSPENDED" | "REMOVED";
export type InvitationStatus = "INVITED" | "ACCEPTED" | "EXPIRED" | "REVOKED";
export type SubscriptionStatus =
  | "TRIALING"
  | "ACTIVE"
  | "PAST_DUE"
  | "CANCELLED"
  | "EXPIRED"
  | "SUSPENDED";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  legal_name: string | null;
  document: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  timezone: string;
  locale: string;
  currency: string;
  date_format: string;
  status: OrgStatus;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Membership {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrgRole;
  status: MembershipStatus;
  created_at: string;
}

export interface MembershipWithOrganization extends Membership {
  organization: Organization;
}

export interface MemberRow extends Membership {
  profile: { id: string; full_name: string | null; email: string | null; avatar_url: string | null } | null;
}

/** Row shape returned by the paginated `list_organization_members` database function. */
export interface MemberListRow {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrgRole;
  status: MembershipStatus;
  created_at: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  last_seen_at: string | null;
}

export interface Paginated<T> {
  total: number;
  rows: T[];
}

export interface Invitation {
  id: string;
  organization_id: string;
  email: string;
  role: OrgRole;
  status: InvitationStatus;
  message: string | null;
  expires_at: string;
  accepted_at: string | null;
  last_sent_at: string;
  resend_count: number;
  created_at: string;
}

export interface InvitationTicket {
  invitation_id: string;
  token: string;
  expires_in_days: number;
}

export type InvitationPreviewState = "VALID" | "EXPIRED" | "REVOKED" | "ACCEPTED" | "NOT_FOUND";

export interface InvitationPreview {
  state: InvitationPreviewState;
  email?: string;
  role?: OrgRole;
  message?: string | null;
  expires_at?: string;
  organization_name?: string;
  organization_slug?: string;
}

export interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  currency: string;
  trial_days: number;
  status: "ACTIVE" | "INACTIVE";
}

export interface Subscription {
  id: string;
  organization_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  billing_interval: "MONTHLY" | "YEARLY";
  trial_start: string | null;
  trial_end: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancelled_at: string | null;
}

export interface SubscriptionWithPlan extends Subscription {
  plan: Plan;
}

export interface AuditLog {
  id: string;
  organization_id: string | null;
  actor_user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AuditLogRow {
  id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  actor_user_id: string | null;
  actor_name: string | null;
  actor_email: string | null;
}

/** Permission keys mirror `public.role_permissions`. The database is always authoritative. */
export type PermissionKey =
  | "organization.view"
  | "organization.update"
  | "organization.suspend"
  | "ownership.transfer"
  | "users.view"
  | "users.invite"
  | "users.update"
  | "users.remove"
  | "roles.view"
  | "roles.update"
  | "billing.view"
  | "usage.view"
  | "audit.view"
  | "campaigns.view"
  | "campaigns.create"
  | "campaigns.update"
  | "campaigns.publish"
  | "campaigns.pause"
  | "campaigns.finish"
  | "campaigns.archive"
  | "campaigns.restore"
  | "campaigns.manage_images"
  | "numbers.view"
  | "numbers.manage"
  | "reservations.view"
  | "reservations.manage"
  | "participants.view"
  | "participants.manage"
  | "sales.view"
  | "sales.manage"
  | "payments.view"
  | "payments.manage";

export const PERMISSION_LABEL: Record<PermissionKey, string> = {
  "organization.view": "Ver organização",
  "organization.update": "Editar organização",
  "organization.suspend": "Suspender organização",
  "ownership.transfer": "Transferir propriedade",
  "users.view": "Ver usuários",
  "users.invite": "Convidar usuários",
  "users.update": "Editar usuários",
  "users.remove": "Remover usuários",
  "roles.view": "Ver papéis",
  "roles.update": "Alterar papéis",
  "billing.view": "Ver cobrança",
  "usage.view": "Ver uso",
  "audit.view": "Ver auditoria",
  "campaigns.view": "Ver campanhas",
  "campaigns.create": "Criar campanhas",
  "campaigns.update": "Editar campanhas",
  "campaigns.publish": "Publicar campanhas",
  "campaigns.pause": "Pausar campanhas",
  "campaigns.finish": "Finalizar campanhas",
  "campaigns.archive": "Arquivar campanhas",
  "campaigns.restore": "Restaurar campanhas",
  "campaigns.manage_images": "Gerenciar imagens",
  "numbers.view": "Ver números",
  "numbers.manage": "Gerenciar números",
  "reservations.view": "Ver reservas",
  "reservations.manage": "Gerenciar reservas",
  "participants.view": "Ver participantes",
  "participants.manage": "Gerenciar participantes",
  "sales.view": "Ver vendas",
  "sales.manage": "Gerenciar vendas",
  "payments.view": "Ver pagamentos",
  "payments.manage": "Gerenciar pagamentos",
};


export const ROLE_LABEL: Record<OrgRole, string> = {
  OWNER: "Proprietário",
  ADMIN: "Administrador",
  MEMBER: "Membro",
  VIEWER: "Leitor",
};

export const ROLE_DESCRIPTION: Record<OrgRole, string> = {
  OWNER: "Controle total, incluindo propriedade e suspensão da organização.",
  ADMIN: "Gerencia configurações, usuários e convites.",
  MEMBER: "Opera o dia a dia da organização.",
  VIEWER: "Apenas visualiza dados e indicadores.",
};

/** Roles that can be assigned through invitations or role changes (OWNER uses transfer). */
export const ASSIGNABLE_ROLES: OrgRole[] = ["ADMIN", "MEMBER", "VIEWER"];

export const ORG_STATUS_LABEL: Record<OrgStatus, string> = {
  ACTIVE: "Ativa",
  SUSPENDED: "Suspensa",
  INACTIVE: "Inativa",
};

export const MEMBERSHIP_STATUS_LABEL: Record<MembershipStatus, string> = {
  ACTIVE: "Ativo",
  INVITED: "Convidado",
  SUSPENDED: "Suspenso",
  REMOVED: "Removido",
};

export const INVITATION_STATUS_LABEL: Record<InvitationStatus, string> = {
  INVITED: "Pendente",
  ACCEPTED: "Aceito",
  EXPIRED: "Expirado",
  REVOKED: "Cancelado",
};

export const SUBSCRIPTION_STATUS_LABEL: Record<SubscriptionStatus, string> = {
  TRIALING: "Em teste",
  ACTIVE: "Ativa",
  PAST_DUE: "Pagamento pendente",
  CANCELLED: "Cancelada",
  EXPIRED: "Expirada",
  SUSPENDED: "Suspensa",
};

export const LIMIT_LABEL: Record<string, string> = {
  max_users: "Usuários",
  max_campaigns: "Campanhas",
  max_active_campaigns: "Campanhas ativas",
  max_numbers_per_campaign: "Números por campanha",
  max_participants: "Participantes",
  max_storage: "Armazenamento",
  max_exports_per_month: "Exportações por mês",
  max_campaign_images: "Imagens por campanha",

};

export const FEATURE_LABEL: Record<string, string> = {
  campaigns: "Campanhas",
  multiple_users: "Múltiplos usuários",
  advanced_reports: "Relatórios avançados",
  custom_branding: "Branding personalizado",
  payment_gateways: "Gateways de pagamento",
  exports: "Exportações",
  api_access: "Acesso via API",
};

export const USAGE_FOR_LIMIT: Record<string, string> = {
  max_users: "users",
  max_campaigns: "campaigns",
  max_active_campaigns: "active_campaigns",
  max_participants: "participants",
  max_numbers_per_campaign: "numbers",
  max_storage: "storage",
  max_exports_per_month: "exports",
};

export const AUDIT_ACTION_LABEL: Record<string, string> = {
  GLOBAL_ADMIN_BOOTSTRAPPED: "Administrador global definido",
  ORGANIZATION_CREATED: "Organização criada",
  ORGANIZATION_UPDATED: "Organização atualizada",
  ORGANIZATION_SUSPENDED: "Organização suspensa",
  ORGANIZATION_REACTIVATED: "Organização reativada",
  LOGO_UPDATED: "Logo atualizada",
  USER_INVITED: "Usuário convidado",
  INVITE_RESENT: "Convite reenviado",
  INVITE_REVOKED: "Convite cancelado",
  INVITE_ACCEPTED: "Convite aceito",
  USER_ROLE_CHANGED: "Papel alterado",
  USER_SUSPENDED: "Usuário suspenso",
  USER_REACTIVATED: "Usuário reativado",
  USER_REMOVED: "Usuário removido",
  OWNERSHIP_TRANSFERRED: "Propriedade transferida",
  MEMBER_INVITED: "Usuário convidado",
  MEMBER_ACCEPTED: "Convite aceito",
  MEMBER_REMOVED: "Usuário removido",
  MEMBER_ROLE_CHANGED: "Papel alterado",
  OWNER_TRANSFERRED: "Propriedade transferida",
  PLAN_CHANGED: "Plano alterado",
  SUBSCRIPTION_CHANGED: "Assinatura alterada",
  CAMPAIGN_CREATED: "Campanha criada",
  CAMPAIGN_UPDATED: "Campanha atualizada",
  CAMPAIGN_PUBLISHED: "Campanha publicada",
  CAMPAIGN_PAUSED: "Campanha pausada",
  CAMPAIGN_RESUMED: "Campanha retomada",
  CAMPAIGN_FINISHED: "Campanha finalizada",
  CAMPAIGN_ARCHIVED: "Campanha arquivada",
  CAMPAIGN_RESTORED: "Campanha restaurada",
  CAMPAIGN_COVER_UPDATED: "Capa da campanha atualizada",
  CAMPAIGN_GALLERY_UPDATED: "Galeria da campanha atualizada",
  NUMBERS_GENERATED: "Números gerados",
  NUMBERS_RESERVED: "Números reservados",
  NUMBERS_BLOCKED: "Números bloqueados",
  NUMBERS_UNBLOCKED: "Números desbloqueados",
  RESERVATION_CANCELLED: "Reserva cancelada",
  RESERVATION_EXPIRED: "Reserva expirada",
  ADMIN_RESERVATION_CANCELLED: "Reserva cancelada (admin)",
  PARTICIPANT_CREATED: "Participante criado",
  PARTICIPANT_UPDATED: "Participante atualizado",
  SALE_CREATED: "Venda registrada",
  SALE_UPDATED: "Venda atualizada",
  SALE_CANCELLED: "Venda cancelada",
  NUMBERS_TRANSFERRED: "Números transferidos",
  PAYMENT_CREATED: "Pagamento criado",
  PAYMENT_STATUS_CHANGED: "Status do pagamento alterado",
  PAYMENT_CONFIRMED: "Pagamento confirmado",
  PAYMENT_CANCELLED: "Pagamento cancelado",
  PAYMENT_EXPIRED: "Pagamento expirado",
  PAYMENT_GATEWAY_CREATED: "Gateway de pagamento criado",
  PAYMENT_GATEWAY_UPDATED: "Gateway de pagamento atualizado",
  PAYMENT_GATEWAY_DELETED: "Gateway de pagamento removido",
  WEBHOOK_RECEIVED: "Webhook recebido",
};

export function describeAuditAction(action: string): string {
  return AUDIT_ACTION_LABEL[action] ?? action;
}

/** Maps database/RPC error codes to human messages (no browser-native alerts). */
export function describeError(error: unknown): string {
  const raw =
    typeof error === "object" && error !== null && "message" in error
      ? String((error as { message: unknown }).message)
      : String(error ?? "");

  if (raw.includes("LAST_OWNER"))
    return "A organização precisa possuir pelo menos um proprietário. Transfira a propriedade antes de remover este usuário.";
  if (raw.includes("USE_OWNERSHIP_TRANSFER"))
    return "Para tornar alguém proprietário, use a transferência de propriedade.";
  if (raw.includes("OWNER_PROTECTED"))
    return "Somente o proprietário pode alterar outro proprietário.";
  if (raw.includes("CANNOT_SUSPEND_SELF")) return "Você não pode suspender o seu próprio acesso.";
  if (raw.includes("MEMBER_NOT_ACTIVE")) return "Este usuário precisa estar ativo para receber a propriedade.";
  if (raw.includes("ALREADY_OWNER")) return "Este usuário já é o proprietário atual.";
  if (raw.includes("CONFIRMATION_MISMATCH"))
    return "A confirmação não corresponde ao nome da organização.";
  if (raw.includes("CAMPAIGN_SLUG_TAKEN"))
    return "O slug informado já está sendo utilizado nesta organização.";
  if (raw.includes("SLUG_LOCKED_AFTER_PUBLISH"))
    return "O slug não pode ser alterado depois da primeira publicação, para não quebrar o link público.";
  if (raw.includes("CRITICAL_FIELD_LOCKED"))
    return "Quantidade de números e valor não podem ser alterados nesta situação da campanha.";
  if (raw.includes("CAMPAIGN_ARCHIVED_READONLY"))
    return "Esta campanha está arquivada. Restaure-a antes de editar.";
  if (raw.includes("INVALID_STATUS_TRANSITION")) return "Esta transição de situação não é permitida.";
  if (raw.includes("CAMPAIGN_PRODUCT_REQUIRED"))
    return "Informe o produto da campanha antes de publicar.";
  if (raw.includes("INVALID_TOTAL_NUMBERS")) return "A quantidade de números deve ser maior que zero.";
  if (raw.includes("INVALID_PRICE")) return "O valor por número deve ser maior que zero.";
  if (raw.includes("INVALID_DATE_RANGE")) return "A data final deve ser posterior à data inicial.";
  if (raw.includes("SUBSCRIPTION_NOT_ACTIVE"))
    return "A assinatura desta organização não permite publicar campanhas no momento.";
  if (raw.includes("PLAN_LIMIT_REACHED_max_active_campaigns"))
    return "Você atingiu o limite de campanhas ativas do seu plano.";
  if (raw.includes("PLAN_LIMIT_REACHED_max_campaigns"))
    return "Você atingiu o limite de campanhas do seu plano.";
  if (raw.includes("PLAN_LIMIT_REACHED_max_numbers_per_campaign"))
    return "A quantidade de números excede o limite do seu plano.";
  if (raw.includes("PLAN_LIMIT_REACHED_max_campaign_images"))
    return "Você atingiu o limite de imagens por campanha do seu plano.";
  if (raw.includes("CAMPAIGN_NOT_LIVE"))
    return "Esta campanha não está disponível para o público.";
  if (raw.includes("NUMBER_NOT_AVAILABLE"))
    return "Um ou mais números não estão disponíveis. Atualize a página e tente novamente.";
  if (raw.includes("NO_NUMBERS_SELECTED"))
    return "Selecione pelo menos um número.";
  if (raw.includes("TOO_MANY_NUMBERS"))
    return "O número de seleções excede o limite permitido.";
  if (raw.includes("RESERVATION_NOT_ACTIVE"))
    return "Esta reserva não está mais ativa.";
  if (raw.includes("SALE_CANCELLED"))
    return "Esta venda já foi cancelada.";
  if (raw.includes("SALE_ALREADY_CANCELLED"))
    return "Esta venda já foi cancelada anteriormente.";
  if (raw.includes("NUMBER_NOT_IN_SALE"))
    return "O número informado não pertence a esta venda.";
  if (raw.includes("PARTICIPANT_NOT_FOUND"))
    return "Participante não encontrado.";
  if (raw.includes("BUYER_INFO_REQUIRED"))
    return "Informe os dados do comprador para confirmar o pagamento.";
  if (raw.includes("PAYMENT_NOT_CONFIRMABLE"))
    return "Este pagamento não pode ser confirmado no momento.";
  if (raw.includes("PAYMENT_ALREADY_CONFIRMED"))
    return "Este pagamento já foi confirmado.";
  if (raw.includes("PAYMENT_ALREADY_CANCELLED"))
    return "Este pagamento já foi cancelado.";
  if (raw.includes("GATEWAY_NOT_FOUND"))
    return "Gateway de pagamento não encontrado ou inativo.";
  if (raw.includes("GATEWAY_HAS_ACTIVE_PAYMENTS"))
    return "Este gateway possui pagamentos ativos e não pode ser removido.";
  if (raw.includes("INVALID_NAME"))
    return "Informe um nome válido.";
  if (raw.includes("SLUG_TAKEN")) return "Este identificador (slug) já está em uso.";

  if (raw.includes("INVALID_SLUG")) return "Informe um identificador válido com pelo menos 3 caracteres.";
  if (raw.includes("INVALID_EMAIL")) return "Informe um e-mail válido.";
  if (raw.includes("INVALID_STATUS")) return "Situação inválida para este usuário.";
  if (raw.includes("ROLE_NOT_INVITABLE")) return "Este papel não pode ser atribuído por convite.";
  if (raw.includes("ALREADY_MEMBER")) return "Este e-mail já pertence à organização.";
  if (raw.includes("INVITE_ALREADY_PENDING"))
    return "Já existe um convite pendente para este e-mail. Reenvie ou cancele o convite existente.";
  if (raw.includes("INVITE_RATE_LIMIT"))
    return "Muitos convites enviados na última hora. Aguarde um pouco antes de enviar novos convites.";
  if (raw.includes("PLAN_LIMIT_REACHED_max_users"))
    return "Limite de usuários do plano atingido. Faça upgrade para convidar mais pessoas.";
  if (raw.includes("PLAN_LIMIT_REACHED")) return "Limite do plano atingido.";
  if (raw.includes("ORGANIZATION_NOT_ACTIVE"))
    return "Esta organização não está disponível no momento (suspensa ou inativa).";
  if (raw.includes("ONLY_GLOBAL_ADMIN_CAN_CHANGE_STATUS"))
    return "Somente o administrador da plataforma pode alterar a situação da organização.";
  if (raw.includes("ONLY_OWNER_CAN_CHANGE_SLUG"))
    return "Somente o proprietário pode alterar o identificador da organização.";
  if (raw.includes("INVITATION_EMAIL_MISMATCH"))
    return "Este convite foi enviado para outro e-mail. Entre com a conta convidada.";
  if (raw.includes("INVITATION_EXPIRED")) return "Este convite expirou. Solicite um novo.";
  if (raw.includes("INVITATION_NOT_AVAILABLE")) return "Este convite não está mais disponível.";
  if (raw.includes("INVITATION_NOT_FOUND")) return "Convite não encontrado.";
  if (raw.includes("FORBIDDEN") || raw.includes("row-level security") || raw.includes("permission denied"))
    return "Você não possui permissão para executar esta ação.";
  if (raw.includes("NOT_AUTHENTICATED")) return "Sua sessão expirou. Entre novamente.";
  if (raw.includes("NOT_FOUND")) return "Registro não encontrado.";

  return raw || "Ocorreu um erro inesperado.";
}

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatLimitValue(key: string, value: number): string {
  if (key === "max_storage") {
    if (value >= 1024 ** 3) return `${(value / 1024 ** 3).toFixed(0)} GB`;
    return `${Math.round(value / 1024 ** 2)} MB`;
  }
  return new Intl.NumberFormat("pt-BR").format(value);
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(
    new Date(value),
  );
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(value));
}

export const TIMEZONE_OPTIONS = [
  "America/Sao_Paulo",
  "America/Manaus",
  "America/Belem",
  "America/Fortaleza",
  "America/Cuiaba",
  "America/Rio_Branco",
  "UTC",
];

export const LOCALE_OPTIONS = [
  { value: "pt-BR", label: "Português (Brasil)" },
  { value: "en-US", label: "English (US)" },
  { value: "es-ES", label: "Español" },
];

export const CURRENCY_OPTIONS = [
  { value: "BRL", label: "Real brasileiro (R$)" },
  { value: "USD", label: "Dólar americano (US$)" },
  { value: "EUR", label: "Euro (€)" },
];

export const DATE_FORMAT_OPTIONS = [
  { value: "dd/MM/yyyy", label: "31/12/2026" },
  { value: "yyyy-MM-dd", label: "2026-12-31" },
  { value: "MM/dd/yyyy", label: "12/31/2026" },
];

/* ============================ CAMPAIGNS ============================ */

export type CampaignStatus = "DRAFT" | "PUBLISHED" | "PAUSED" | "FINISHED" | "ARCHIVED";
export type CampaignImageType = "COVER" | "GALLERY";
export type NumberStatus = "AVAILABLE" | "RESERVED" | "SOLD" | "BLOCKED";
export type ReservationStatus = "ACTIVE" | "EXPIRED" | "CANCELLED" | "COMPLETED";
export type PaymentMethod = "PIX" | "CASH" | "CARD" | "TRANSFER" | "OTHER";

/* ============================ PAYMENTS ============================ */

export type PaymentStatus = "PENDING" | "PROCESSING" | "CONFIRMED" | "FAILED" | "CANCELLED" | "EXPIRED" | "REFUNDED";
export type PaymentGatewayProvider = "INFINITY_PAY" | "MERCADO_PAGO" | "PAGBANK";
export type PaymentMethodOnline = "PIX" | "CREDIT_CARD" | "BOLETO";

export interface PaymentGateway {
  id: string;
  organization_id: string;
  provider: PaymentGatewayProvider;
  label: string;
  enabled: boolean;
  settings: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  organization_id: string;
  campaign_id: string;
  reservation_id: string | null;
  gateway_id: string | null;
  provider: PaymentGatewayProvider;
  provider_payment_id: string | null;
  method: PaymentMethodOnline;
  status: PaymentStatus;
  amount: number;
  currency: string;
  pix_code: string | null;
  pix_qr_base64: string | null;
  pix_expires_at: string | null;
  buyer_name: string | null;
  buyer_phone: string | null;
  buyer_email: string | null;
  buyer_document: string | null;
  gateway_response: Record<string, unknown> | null;
  paid_at: string | null;
  sale_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentWithDetails extends Payment {
  numbers_count: number;
  campaign_name: string | null;
}

export interface CampaignPaymentMetrics {
  total_revenue: number;
  confirmed_count: number;
  pending_count: number;
  failed_count: number;
  cancelled_count: number;
  refunded_count: number;
  total_count: number;
}

export interface PublicPaymentView {
  id: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  method: PaymentMethodOnline;
  pix_code: string | null;
  pix_qr_base64: string | null;
  pix_expires_at: string | null;
  buyer_name: string | null;
  paid_at: string | null;
  sale_id: string | null;
}

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  PENDING: "Pendente",
  PROCESSING: "Processando",
  CONFIRMED: "Confirmado",
  FAILED: "Falhou",
  CANCELLED: "Cancelado",
  EXPIRED: "Expirado",
  REFUNDED: "Reembolsado",
};

export const PAYMENT_STATUS_TONE: Record<PaymentStatus, string> = {
  PENDING: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  PROCESSING: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
  CONFIRMED: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  FAILED: "bg-destructive/10 text-destructive",
  CANCELLED: "bg-muted text-muted-foreground",
  EXPIRED: "bg-muted text-muted-foreground",
  REFUNDED: "bg-orange-500/15 text-orange-700 dark:text-orange-400",
};

export const PAYMENT_GATEWAY_PROVIDER_LABEL: Record<PaymentGatewayProvider, string> = {
  INFINITY_PAY: "InfinityPay",
  MERCADO_PAGO: "Mercado Pago",
  PAGBANK: "PagBank",
};

export const PAYMENT_METHOD_ONLINE_LABEL: Record<PaymentMethodOnline, string> = {
  PIX: "PIX",
  CREDIT_CARD: "Cartão de crédito",
  BOLETO: "Boleto",
};

export interface Campaign {
  id: string;
  organization_id: string;
  created_by: string;
  name: string;
  slug: string;
  description: string | null;
  product_name: string;
  product_description: string | null;
  cover_image_url: string | null;
  total_numbers: number;
  number_price: number;
  currency: string;
  status: CampaignStatus;
  start_at: string | null;
  end_at: string | null;
  published_at: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CampaignImage {
  id: string;
  campaign_id: string;
  organization_id: string;
  storage_path: string;
  url: string;
  type: CampaignImageType;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/** Only the fields the public page is allowed to know about. */
export interface PublicCampaignView {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  product_name: string;
  product_description: string | null;
  cover_image_url: string | null;
  total_numbers: number;
  number_price: number;
  currency: string;
  status: Extract<CampaignStatus, "PUBLISHED" | "PAUSED" | "FINISHED">;
  start_at: string | null;
  end_at: string | null;
  images: { id: string; url: string; type: CampaignImageType; sort_order: number }[];
}

export interface CampaignMetrics {
  total: number;
  published: number;
  draft: number;
  paused: number;
  finished: number;
  archived: number;
}

/* ============================ NUMBERS ============================ */

export interface CampaignNumber {
  id: string;
  number: number;
  status: NumberStatus;
  reserved_by: string | null;
  reserved_at: string | null;
  reservation_expires_at: string | null;
  sold_at: string | null;
  created_at: string;
  reserved_by_name?: string | null;
}

export interface CampaignNumberMetrics {
  sold: number;
  reserved: number;
  blocked: number;
  available: number;
  total: number;
}

export interface NumberReservation {
  id: string;
  status: ReservationStatus;
  expires_at: string;
  numbers: number[];
}

/* ============================ PARTICIPANTS ============================ */

export interface Participant {
  id: string;
  organization_id: string;
  campaign_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  document: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ParticipantWithStats extends Participant {
  numbers_count: number;
  total_spent: number;
  last_purchase: string | null;
}

/* ============================ SALES ============================ */

export interface ManualSale {
  id: string;
  organization_id: string;
  campaign_id: string;
  participant_id: string;
  created_by: string | null;
  payment_method: PaymentMethod;
  amount: number;
  notes: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ManualSaleItem {
  id: string;
  sale_id: string;
  campaign_number_id: string;
  number: number;
  unit_price: number;
  created_at: string;
}

export interface SaleWithDetails extends ManualSale {
  participant_name: string | null;
  participant_phone: string | null;
  numbers_count: number;
  numbers: number[];
}

export interface CampaignSalesMetrics {
  revenue: number;
  average_ticket: number;
  participants_count: number;
  numbers_sold: number;
  total_sales: number;
}

export const CAMPAIGN_STATUS_LABEL: Record<CampaignStatus, string> = {
  DRAFT: "Rascunho",
  PUBLISHED: "Publicada",
  PAUSED: "Pausada",
  FINISHED: "Finalizada",
  ARCHIVED: "Arquivada",
};

export const CAMPAIGN_STATUS_TONE: Record<CampaignStatus, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  PUBLISHED: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  PAUSED: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  FINISHED: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
  ARCHIVED: "bg-destructive/10 text-destructive",
};

export const NUMBER_STATUS_LABEL: Record<NumberStatus, string> = {
  AVAILABLE: "Disponível",
  RESERVED: "Reservado",
  SOLD: "Vendido",
  BLOCKED: "Bloqueado",
};

export const NUMBER_STATUS_TONE: Record<NumberStatus, string> = {
  AVAILABLE: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  RESERVED: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  SOLD: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
  BLOCKED: "bg-destructive/10 text-destructive",
};

export const RESERVATION_STATUS_LABEL: Record<ReservationStatus, string> = {
  ACTIVE: "Ativa",
  EXPIRED: "Expirada",
  CANCELLED: "Cancelada",
  COMPLETED: "Concluída",
};

export const RESERVATION_STATUS_TONE: Record<ReservationStatus, string> = {
  ACTIVE: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  EXPIRED: "bg-muted text-muted-foreground",
  CANCELLED: "bg-destructive/10 text-destructive",
  COMPLETED: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  PIX: "PIX",
  CASH: "Dinheiro",
  CARD: "Cartão",
  TRANSFER: "Transferência",
  OTHER: "Outro",
};

export const CAMPAIGN_SORT_OPTIONS = [
  { value: "created_at", label: "Data de criação" },
  { value: "updated_at", label: "Data de atualização" },
  { value: "published_at", label: "Data de publicação" },
  { value: "name", label: "Nome" },
  { value: "status", label: "Situação" },
] as const;

/** Allowed status transitions — mirrors `set_campaign_status` in the database. */
export const CAMPAIGN_TRANSITIONS: Record<CampaignStatus, CampaignStatus[]> = {
  DRAFT: ["PUBLISHED", "ARCHIVED"],
  PUBLISHED: ["PAUSED", "FINISHED"],
  PAUSED: ["PUBLISHED", "FINISHED", "ARCHIVED"],
  FINISHED: ["ARCHIVED"],
  ARCHIVED: ["DRAFT"],
};

export function canTransition(from: CampaignStatus, to: CampaignStatus): boolean {
  return CAMPAIGN_TRANSITIONS[from].includes(to);
}

export function formatMoney(value: number, currency = "BRL"): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(value);
}

/** Potential revenue = total numbers × price. Never presented as realized revenue. */
export function potentialRevenue(totalNumbers: number, numberPrice: number): number {
  return Math.round(totalNumbers * numberPrice * 100) / 100;
}

