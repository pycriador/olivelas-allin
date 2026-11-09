export type CampaignStatus =
  "DRAFT" | "SCHEDULED" | "ACTIVE" | "PAUSED" | "FINISHED" | "CANCELLED" | "ARCHIVED";

export type CampaignVisibility = "PUBLIC" | "PRIVATE";

export type CampaignPurchaseMode = "MANUAL" | "AUTOMATIC";

export type CampaignImageType = "COVER" | "GALLERY" | "SHARE" | "THUMBNAIL" | "BANNER";

export const CAMPAIGN_IMAGE_TYPE_LABELS: Record<CampaignImageType, string> = {
  COVER: "Capa",
  GALLERY: "Galeria",
  SHARE: "Compartilhamento",
  THUMBNAIL: "Miniatura",
  BANNER: "Banner",
};

export const CAMPAIGN_PURCHASE_MODE_VALUES = ["MANUAL", "AUTOMATIC"] as const;

export const CAMPAIGN_PURCHASE_MODE_LABELS: Record<CampaignPurchaseMode, string> = {
  MANUAL: "Manual (WhatsApp)",
  AUTOMATIC: "Automático (gateway)",
};

export const DEFAULT_WHATSAPP_MESSAGE_TEMPLATE =
  "Olá {name}! Tudo bem?\n\nQuero participar da rifa {campaign} e escolhi os números: {numbers}\n\nValor total: {total}";

/** Substitui os marcadores do template de mensagem do WhatsApp. */
export function renderWhatsAppTemplate(
  template: string | null | undefined,
  variables: { campaign: string; numbers: string; total: string; name: string },
): string {
  const fallback = DEFAULT_WHATSAPP_MESSAGE_TEMPLATE;
  return (template ?? fallback).replace(
    /\{campaign\}|\{numbers\}|\{total\}|\{name\}/g,
    (match) => variables[match.slice(1, -1) as keyof typeof variables] ?? "",
  );
}

/** Remove tudo que não é dígito do telefone (para wa.me). */
export function digitsOnly(value: string | null | undefined): string {
  return (value ?? "").replace(/\D/g, "");
}

export const CAMPAIGN_STATUS_VALUES = [
  "DRAFT",
  "SCHEDULED",
  "ACTIVE",
  "PAUSED",
  "FINISHED",
  "CANCELLED",
  "ARCHIVED",
] as const;

export const CAMPAIGN_VISIBILITY_VALUES = ["PUBLIC", "PRIVATE"] as const;

export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  DRAFT: "Rascunho",
  SCHEDULED: "Agendada",
  ACTIVE: "Ativa",
  PAUSED: "Pausada",
  FINISHED: "Finalizada",
  CANCELLED: "Cancelada",
  ARCHIVED: "Arquivada",
};

export const CAMPAIGN_VISIBILITY_LABELS: Record<CampaignVisibility, string> = {
  PUBLIC: "Pública",
  PRIVATE: "Privada",
};

export const CAMPAIGN_STATUS_TRANSITIONS: Record<CampaignStatus, CampaignStatus[]> = {
  DRAFT: ["SCHEDULED", "ACTIVE", "CANCELLED", "ARCHIVED"],
  SCHEDULED: ["ACTIVE", "PAUSED", "FINISHED", "CANCELLED", "ARCHIVED"],
  ACTIVE: ["PAUSED", "FINISHED", "CANCELLED", "ARCHIVED"],
  PAUSED: ["ACTIVE", "FINISHED", "CANCELLED", "ARCHIVED"],
  FINISHED: ["ARCHIVED"],
  CANCELLED: ["ARCHIVED"],
  ARCHIVED: [],
};

export function canTransitionCampaignStatus(from: CampaignStatus, to: CampaignStatus): boolean {
  return CAMPAIGN_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export interface Campaign {
  id: string;
  slug: string;
  title: string;
  short_description: string | null;
  description: string | null;
  product_name: string;
  product_description: string | null;
  number_start: number;
  number_end: number;
  total_numbers: number;
  price_per_number: number;
  cover_image: string | null;
  status: CampaignStatus;
  visibility: CampaignVisibility;
  start_date: string | null;
  end_date: string | null;
  allow_random_selection: boolean;
  reservation_timeout_minutes: number;
  max_numbers_per_purchase: number | null;
  contact_name: string | null;
  contact_phone: string | null;
  whatsapp_message_template: string | null;
  purchase_mode: CampaignPurchaseMode;
  created_by: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  is_featured: boolean;
  draw_date: string | null;
}

export interface CampaignImage {
  id: string;
  campaign_id: string;
  filename: string;
  storage_path: string;
  display_order: number;
  is_cover: boolean;
  width: number | null;
  height: number | null;
  size: number | null;
  mime_type: string | null;
  image_type: CampaignImageType;
  alt_text: string | null;
  caption: string | null;
  is_active: boolean;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CampaignWhatsAppMessage {
  id: string;
  campaign_id: string;
  name: string;
  content: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export type CampaignWhatsAppMessageInput = {
  name: string;
  content: string;
  is_default: boolean;
};

export type CampaignPublishStatus =
  "DRAFT" | "UNDER_REVIEW" | "PUBLISHED" | "PAUSED" | "FINISHED" | "ARCHIVED";

export const CAMPAIGN_PUBLISH_STATUS_VALUES = [
  "DRAFT",
  "UNDER_REVIEW",
  "PUBLISHED",
  "PAUSED",
  "FINISHED",
  "ARCHIVED",
] as const;

export const CAMPAIGN_PUBLISH_STATUS_LABELS: Record<CampaignPublishStatus, string> = {
  DRAFT: "Rascunho",
  UNDER_REVIEW: "Em revisão",
  PUBLISHED: "Publicada",
  PAUSED: "Pausada",
  FINISHED: "Encerrada",
  ARCHIVED: "Arquivada",
};

export const CAMPAIGN_THEME_VALUES = ["system", "light", "dark"] as const;

export const CAMPAIGN_THEME_LABELS: Record<(typeof CAMPAIGN_THEME_VALUES)[number], string> = {
  system: "Seguir sistema",
  light: "Claro",
  dark: "Escuro",
};

export const CAMPAIGN_FONT_VALUES = ["inter", "geist", "serif", "mono"] as const;

export const CAMPAIGN_FONT_LABELS: Record<(typeof CAMPAIGN_FONT_VALUES)[number], string> = {
  inter: "Inter (padrão)",
  geist: "Geist",
  serif: "Serifada",
  mono: "Monoespaçada",
};

export const CAMPAIGN_FONT_STACKS: Record<(typeof CAMPAIGN_FONT_VALUES)[number], string> = {
  inter: "Inter, system-ui, sans-serif",
  geist: "Geist, Inter, system-ui, sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
  mono: "'JetBrains Mono', ui-monospace, monospace",
};

export interface CampaignSettings {
  id: string;
  campaign_id: string;
  show_progress: boolean;
  show_remaining_numbers: boolean;
  show_product_value: boolean;
  enable_share: boolean;
  enable_seo: boolean;
  enable_public_page: boolean;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  share_image: string | null;
  /* Exibição */
  show_progress_bar: boolean;
  show_percentage_sold: boolean;
  show_total_numbers: boolean;
  show_contact_information: boolean;
  show_statistics: boolean;
  show_gallery: boolean;
  show_product_description: boolean;
  show_purchase_counter: boolean;
  show_recent_buyers: boolean;
  show_rules: boolean;
  enable_comments: boolean;
  enable_faq: boolean;
  enable_whatsapp: boolean;
  /* Reservas */
  allow_manual_selection: boolean;
  allow_random_selection: boolean;
  auto_reservation: boolean;
  reservation_timeout_minutes: number;
  max_numbers_per_purchase: number | null;
  /* Publicação */
  publish_status: CampaignPublishStatus;
  /* Personalização */
  theme: string;
  primary_color: string | null;
  secondary_color: string | null;
  button_color: string | null;
  font_family: string | null;
  background_image: string | null;
  banner_image: string | null;
  campaign_logo: string | null;
  /* SEO avançado */
  canonical_url: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image: string | null;
  twitter_title: string | null;
  twitter_description: string | null;
  twitter_image: string | null;
  json_ld: string | null;
  /* Contato */
  contact_email: string | null;
  contact_hours: string | null;
  contact_whatsapp: string | null;
  /* Pagamento */
  enable_pix: boolean;
  payment_gateway: import("@/types/payment").PaymentGateway | null;
  created_at: string;
  updated_at: string;
}

export interface CampaignWithRelations extends Campaign {
  images: CampaignImage[];
  settings: CampaignSettings | null;
  creator_name: string | null;
  creator_email: string | null;
}

export interface CampaignFilters {
  status?: CampaignStatus | "ALL";
  visibility?: CampaignVisibility | "ALL";
  createdBy?: string | "ALL";
  search?: string;
  dateRange?: { from: string; to: string } | null;
}

export interface CampaignListResult {
  items: CampaignWithRelations[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CampaignMetrics {
  total: number;
  active: number;
  scheduled: number;
  finished: number;
  cancelled: number;
  archived: number;
  drafts: number;
  lastCreated: Campaign | null;
  byMonth: { month: string; count: number }[];
}

export interface CampaignPublicData {
  campaign: Campaign;
  images: CampaignImage[];
  settings: CampaignSettings | null;
  numbers: import("./campaign-number").CampaignNumber[];
  soldCount: number;
  availableCount: number;
  progressPercent: number;
}

export type CampaignAuditEntry = {
  id: string;
  action: string;
  actor_id: string | null;
  actor_name: string | null;
  created_at: string;
  metadata: Record<string, unknown>;
};
