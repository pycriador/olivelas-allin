import { z } from "zod";

import {
  CAMPAIGN_FONT_VALUES,
  CAMPAIGN_PUBLISH_STATUS_VALUES,
  CAMPAIGN_PURCHASE_MODE_VALUES,
  CAMPAIGN_STATUS_VALUES,
  CAMPAIGN_THEME_VALUES,
  CAMPAIGN_VISIBILITY_VALUES,
  type CampaignStatus,
  type CampaignVisibility,
} from "@/types/campaign";

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const campaignFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(2, "Informe ao menos 2 caracteres")
      .max(120, "Máximo de 120 caracteres"),
    slug: z
      .string()
      .trim()
      .regex(SLUG_REGEX, "Slug inválido: use letras minúsculas, números e hífens")
      .max(80, "Máximo de 80 caracteres")
      .or(z.literal("")),
    product_name: z
      .string()
      .trim()
      .min(2, "Informe o produto/brinde")
      .max(120, "Máximo de 120 caracteres"),
    short_description: z
      .string()
      .trim()
      .min(2, "Informe a descrição curta")
      .max(200, "Máximo de 200 caracteres"),
    description: z
      .string()
      .trim()
      .min(2, "Informe a descrição completa")
      .max(20_000, "Máximo de 20.000 caracteres"),
    number_start: z.coerce
      .number({ message: "Número inicial obrigatório" })
      .int("Informe um número inteiro")
      .min(0, "Número inicial não pode ser negativo"),
    number_end: z.coerce
      .number({ message: "Número final obrigatório" })
      .int("Informe um número inteiro")
      .min(0, "Número final não pode ser negativo"),
    price_per_number: z.coerce
      .number({ message: "Valor por número obrigatório" })
      .min(0.01, "O valor por número deve ser maior que zero"),
    max_numbers_per_purchase: z.coerce
      .number({ message: "Limite por compra obrigatório" })
      .int("Informe um número inteiro")
      .min(1, "O limite por compra deve ser de ao menos 1 número"),
    reservation_timeout_minutes: z.coerce
      .number({ message: "Tempo de reserva obrigatório" })
      .int("Informe um número inteiro")
      .min(1, "O tempo de reserva deve ser de ao menos 1 minuto"),
    start_date: z.string().min(1, "Informe a data de início"),
    end_date: z.string().min(1, "Informe a data de encerramento"),
    visibility: z.enum(CAMPAIGN_VISIBILITY_VALUES, {
      message: "Selecione a visibilidade",
    }),
    allow_random_selection: z.boolean(),
    contact_name: z
      .string()
      .trim()
      .max(120, "Máximo de 120 caracteres")
      .optional()
      .or(z.literal("")),
    contact_phone: z
      .string()
      .trim()
      .max(30, "Máximo de 30 caracteres")
      .optional()
      .or(z.literal("")),
    whatsapp_message_template: z
      .string()
      .trim()
      .max(2000, "Máximo de 2.000 caracteres")
      .optional()
      .or(z.literal("")),
    purchase_mode: z.enum(CAMPAIGN_PURCHASE_MODE_VALUES, {
      message: "Selecione o modo de compra",
    }),
    status: z.enum(CAMPAIGN_STATUS_VALUES).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.number_end < data.number_start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["number_end"],
        message: "O número final deve ser maior ou igual ao número inicial",
      });
    }
    if (data.end_date && data.start_date && data.end_date < data.start_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["end_date"],
        message: "A data de encerramento deve ser posterior à data de início",
      });
    }
  });

export type CampaignFormInput = z.infer<typeof campaignFormSchema>;

const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

const optionalColor = z
  .string()
  .trim()
  .regex(HEX_COLOR, "Use uma cor hexadecimal (ex.: #1A1A1A)")
  .optional()
  .or(z.literal(""));

const optionalText = (max: number) =>
  z.string().trim().max(max, `Máximo de ${max} caracteres`).optional().or(z.literal(""));

export const campaignSettingsSchema = z.object({
  show_progress: z.boolean(),
  show_remaining_numbers: z.boolean(),
  show_product_value: z.boolean(),
  enable_share: z.boolean(),
  enable_seo: z.boolean(),
  enable_public_page: z.boolean(),
  seo_title: z.string().trim().max(70, "Máximo de 70 caracteres").optional().or(z.literal("")),
  seo_description: z
    .string()
    .trim()
    .max(160, "Máximo de 160 caracteres")
    .optional()
    .or(z.literal("")),
  seo_keywords: z.string().trim().max(300, "Máximo de 300 caracteres").optional().or(z.literal("")),
  share_image: z.string().trim().max(500).optional().or(z.literal("")),

  show_progress_bar: z.boolean(),
  show_percentage_sold: z.boolean(),
  show_total_numbers: z.boolean(),
  show_contact_information: z.boolean(),
  show_statistics: z.boolean(),
  show_gallery: z.boolean(),
  show_product_description: z.boolean(),
  show_purchase_counter: z.boolean(),
  show_recent_buyers: z.boolean(),
  show_rules: z.boolean(),
  enable_comments: z.boolean(),
  enable_faq: z.boolean(),
  enable_whatsapp: z.boolean(),

  allow_manual_selection: z.boolean(),
  allow_random_selection: z.boolean(),
  auto_reservation: z.boolean(),
  reservation_timeout_minutes: z.coerce
    .number({ message: "Tempo de reserva obrigatório" })
    .int("Informe um número inteiro")
    .min(1, "Mínimo de 1 minuto")
    .max(1440, "Máximo de 1.440 minutos"),
  max_numbers_per_purchase: z.coerce
    .number({ message: "Limite por compra obrigatório" })
    .int("Informe um número inteiro")
    .min(1, "Mínimo de 1 número")
    .max(10_000, "Máximo de 10.000 números"),

  theme: z.enum(CAMPAIGN_THEME_VALUES, { message: "Selecione o tema" }),
  primary_color: optionalColor,
  secondary_color: optionalColor,
  button_color: optionalColor,
  font_family: z.enum(CAMPAIGN_FONT_VALUES, { message: "Selecione a fonte" }),
  background_image: optionalText(500),
  banner_image: optionalText(500),
  campaign_logo: optionalText(500),

  canonical_url: z
    .string()
    .trim()
    .url("Informe uma URL válida")
    .max(500)
    .optional()
    .or(z.literal("")),
  og_title: optionalText(70),
  og_description: optionalText(200),
  og_image: optionalText(500),
  twitter_title: optionalText(70),
  twitter_description: optionalText(200),
  twitter_image: optionalText(500),
  json_ld: optionalText(20_000),

  contact_email: z.string().trim().email("E-mail inválido").max(255).optional().or(z.literal("")),
  contact_hours: optionalText(120),
  contact_whatsapp: optionalText(30),

  enable_pix: z.boolean(),
  payment_gateway: z.enum(["INFINITYPAY", "MERCADO_PAGO", "PAGBANK", "DEFAULT"]).default("DEFAULT"),
});

export type CampaignSettingsInput = z.infer<typeof campaignSettingsSchema>;

export const campaignWhatsAppMessageSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Informe o nome da mensagem")
    .max(80, "Máximo de 80 caracteres"),
  content: z
    .string()
    .trim()
    .min(1, "Informe o conteúdo da mensagem")
    .max(2000, "Máximo de 2.000 caracteres"),
  is_default: z.boolean(),
});

export type CampaignWhatsAppMessageInput = z.infer<typeof campaignWhatsAppMessageSchema>;

export const campaignPublishStatusSchema = z.object({
  campaignId: z.string().uuid("Campanha inválida"),
  status: z.enum(CAMPAIGN_PUBLISH_STATUS_VALUES),
});

export type CampaignPublishStatusInput = z.infer<typeof campaignPublishStatusSchema>;

export const campaignStatusSchema = z.object({
  campaignId: z.string().uuid("Campanha inválida"),
  status: z.enum(CAMPAIGN_STATUS_VALUES),
});

export type CampaignStatusInput = z.infer<typeof campaignStatusSchema>;

export const campaignSlugSchema = z.object({
  slug: z.string().trim().min(1, "Slug obrigatório").max(80),
});

export type CampaignSlugInput = z.infer<typeof campaignSlugSchema>;

export type CampaignStatusValue = CampaignStatus;
export type CampaignVisibilityValue = CampaignVisibility;
