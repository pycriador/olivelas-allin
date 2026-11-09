import { supabase } from "@/integrations/supabase/client";
import { slugify } from "@/lib/slug";
import { auditService } from "@/services/audit.service";
import { sanitizeFilename } from "@/services/storage.service";
import type { CampaignFormInput, CampaignSettingsInput } from "@/schemas/campaign.schema";
import {
  canTransitionCampaignStatus,
  type Campaign,
  type CampaignFilters,
  type CampaignImage,
  type CampaignImageType,
  type CampaignListResult,
  type CampaignMetrics,
  type CampaignPublishStatus,
  type CampaignSettings,
  type CampaignStatus,
  type CampaignWhatsAppMessage,
  type CampaignWhatsAppMessageInput,
  type CampaignWithRelations,
} from "@/types/campaign";

export const CAMPAIGN_MEDIA_BUCKET = "campaign-media";

const CAMPAIGN_COLUMNS =
  "id, slug, title, short_description, description, product_name, product_description, number_start, number_end, total_numbers, price_per_number, cover_image, status, visibility, start_date, end_date, allow_random_selection, reservation_timeout_minutes, max_numbers_per_purchase, contact_name, contact_phone, whatsapp_message_template, purchase_mode, created_by, created_at, updated_at, deleted_at, is_featured";

const IMAGE_COLUMNS =
  "id, campaign_id, filename, storage_path, display_order, is_cover, width, height, size, mime_type, image_type, alt_text, caption, is_active, uploaded_by, created_at, updated_at";

const SETTINGS_COLUMNS =
  "id, campaign_id, show_progress, show_remaining_numbers, show_product_value, enable_share, enable_seo, enable_public_page, seo_title, seo_description, seo_keywords, share_image, show_progress_bar, show_percentage_sold, show_total_numbers, show_contact_information, show_statistics, show_gallery, show_product_description, show_purchase_counter, show_recent_buyers, show_rules, enable_comments, enable_faq, enable_whatsapp, allow_manual_selection, allow_random_selection, auto_reservation, reservation_timeout_minutes, max_numbers_per_purchase, publish_status, theme, primary_color, secondary_color, button_color, font_family, background_image, banner_image, campaign_logo, canonical_url, og_title, og_description, og_image, twitter_title, twitter_description, twitter_image, json_ld, contact_email, contact_hours, contact_whatsapp, enable_pix, payment_gateway, created_at, updated_at";

const WHATSAPP_MESSAGE_COLUMNS =
  "id, campaign_id, name, content, is_default, created_at, updated_at";

export function slugifyTitle(title: string): string {
  return slugify(title);
}

export function campaignMediaPublicUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  const viteUrl = import.meta.env["VITE_SUPABASE_URL"] as string | undefined;
  const serverUrl = typeof process !== "undefined" ? process.env["SUPABASE_URL"] : undefined;
  const base = viteUrl || serverUrl || "";
  if (!base) return null;
  return `${base.replace(/\/$/, "")}/storage/v1/object/public/${CAMPAIGN_MEDIA_BUCKET}/${path}`;
}

export function siteUrl(): string {
  if (typeof window !== "undefined") return window.location.origin;
  if (typeof process === "undefined") return "";
  return process.env["VITE_SITE_URL"] ?? process.env["SITE_URL"] ?? "";
}

function isoDate(value: string | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

async function resolveUniqueSlug(base: string, excludeCampaignId?: string): Promise<string> {
  const candidate = base || "rifa";
  let slug = candidate;
  let counter = 2;
  for (;;) {
    const { data } = await supabase
      .from("campaigns")
      .select("id, slug")
      .eq("slug", slug)
      .maybeSingle();
    const collides = data != null && data.id !== excludeCampaignId;
    if (!collides) return slug;
    slug = `${candidate}-${counter++}`;
  }
}

function buildPayload(input: CampaignFormInput, status: CampaignStatus) {
  return {
    title: input.title,
    product_name: input.product_name,
    short_description: input.short_description,
    description: input.description,
    number_start: input.number_start,
    number_end: input.number_end,
    price_per_number: input.price_per_number,
    max_numbers_per_purchase: input.max_numbers_per_purchase,
    reservation_timeout_minutes: input.reservation_timeout_minutes,
    start_date: isoDate(input.start_date),
    end_date: isoDate(input.end_date),
    visibility: input.visibility,
    allow_random_selection: input.allow_random_selection,
    contact_name: input.contact_name?.trim() || null,
    contact_phone: input.contact_phone?.trim() || null,
    whatsapp_message_template: input.whatsapp_message_template?.trim() || null,
    purchase_mode: input.purchase_mode,
    status,
  };
}

async function getImageDimensions(file: File): Promise<{ width: number; height: number } | null> {
  if (!file.type.startsWith("image/")) return null;
  try {
    const url = URL.createObjectURL(file);
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Falha ao carregar imagem"));
      img.src = url;
    });
    URL.revokeObjectURL(url);
    return { width: img.naturalWidth, height: img.naturalHeight };
  } catch {
    return null;
  }
}

export const campaignService = {
  CAMPAIGN_MEDIA_BUCKET,

  async getById(campaignId: string): Promise<CampaignWithRelations | null> {
    const { data: campaign, error } = await supabase
      .from("campaigns")
      .select(CAMPAIGN_COLUMNS)
      .eq("id", campaignId)
      .maybeSingle();
    if (error) throw error;
    if (!campaign) return null;

    const [imagesRes, settingsRes, profileRes] = await Promise.all([
      supabase
        .from("campaign_images")
        .select(IMAGE_COLUMNS)
        .eq("campaign_id", campaignId)
        .order("display_order", { ascending: true }),
      supabase
        .from("campaign_settings")
        .select(SETTINGS_COLUMNS)
        .eq("campaign_id", campaignId)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("id, name, email")
        .eq("id", campaign.created_by)
        .maybeSingle(),
    ]);
    if (imagesRes.error) throw imagesRes.error;
    if (settingsRes.error) throw settingsRes.error;
    if (profileRes.error) throw profileRes.error;

    return {
      ...(campaign as unknown as Campaign),
      images: (imagesRes.data ?? []) as unknown as CampaignImage[],
      settings: (settingsRes.data as unknown as CampaignSettings) ?? null,
      creator_name: profileRes.data?.name ?? null,
      creator_email: profileRes.data?.email ?? null,
    };
  },

  async getBySlug(slug: string): Promise<CampaignWithRelations | null> {
    const { data: campaign, error } = await supabase
      .from("campaigns")
      .select(CAMPAIGN_COLUMNS)
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw error;
    if (!campaign) return null;
    return campaignService.getById(campaign.id);
  },

  async list(params: {
    page: number;
    pageSize: number;
    filters?: CampaignFilters;
  }): Promise<CampaignListResult> {
    const { page, pageSize } = params;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const filters = params.filters;

    let query = supabase
      .from("campaigns")
      .select(CAMPAIGN_COLUMNS, { count: "exact" })
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (filters?.status && filters.status !== "ALL") query = query.eq("status", filters.status);
    if (filters?.visibility && filters.visibility !== "ALL")
      query = query.eq("visibility", filters.visibility);
    if (filters?.createdBy && filters.createdBy !== "ALL")
      query = query.eq("created_by", filters.createdBy);
    if (filters?.search) query = query.ilike("title", `%${filters.search}%`);
    if (filters?.dateRange?.from) query = query.gte("created_at", filters.dateRange.from);
    if (filters?.dateRange?.to) query = query.lte("created_at", filters.dateRange.to);

    const { data, error, count } = await query;
    if (error) throw error;

    const rows = (data ?? []) as unknown as Campaign[];
    return {
      items: await hydrateWithRelations(rows),
      total: count ?? 0,
      page,
      pageSize,
    };
  },

  async listDeleted(createdBy?: string): Promise<Campaign[]> {
    let query = supabase
      .from("campaigns")
      .select(CAMPAIGN_COLUMNS)
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false })
      .limit(500);
    if (createdBy) query = query.eq("created_by", createdBy);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as unknown as Campaign[];
  },

  async create(input: CampaignFormInput): Promise<Campaign> {
    const { data: auth } = await supabase.auth.getUser();
    const actorId = auth.user?.id;
    if (!actorId) throw new Error("Não autenticado");

    const baseSlug = input.slug?.trim() ? slugifyTitle(input.slug) : slugifyTitle(input.title);
    const slug = await resolveUniqueSlug(baseSlug);
    const status: CampaignStatus = input.status ?? "DRAFT";

    const { data, error } = await supabase
      .from("campaigns")
      .insert({ ...buildPayload(input, status), slug, created_by: actorId })
      .select(CAMPAIGN_COLUMNS)
      .single();
    if (error) throw error;

    await auditService.log({
      action: "CREATE",
      entity: "campaign",
      entityId: data.id,
      newValue: { title: data.title, slug: data.slug },
    });
    return data as unknown as Campaign;
  },

  async update(campaignId: string, input: CampaignFormInput): Promise<Campaign> {
    const existing = await campaignService.getById(campaignId);
    if (!existing) throw new Error("Campanha não encontrada");

    const baseSlug = input.slug?.trim() ? slugifyTitle(input.slug) : slugifyTitle(input.title);
    const slug = await resolveUniqueSlug(baseSlug, campaignId);
    const status = input.status ?? existing.status;

    const { data, error } = await supabase
      .from("campaigns")
      .update({ ...buildPayload(input, status), slug })
      .eq("id", campaignId)
      .select(CAMPAIGN_COLUMNS)
      .single();
    if (error) throw error;

    await auditService.log({
      action: "UPDATE",
      entity: "campaign",
      entityId: campaignId,
      oldValue: { title: existing.title, status: existing.status },
      newValue: { title: data.title, status: data.status, slug: data.slug },
    });
    return data as unknown as Campaign;
  },

  async updateStatus(campaignId: string, status: CampaignStatus): Promise<Campaign> {
    const existing = await campaignService.getById(campaignId);
    if (!existing) throw new Error("Campanha não encontrada");
    if (existing.status === status) return existing as unknown as Campaign;
    if (!canTransitionCampaignStatus(existing.status, status)) {
      throw new Error(`Transição inválida de "${existing.status}" para "${status}"`);
    }

    const { data, error } = await supabase
      .from("campaigns")
      .update({ status })
      .eq("id", campaignId)
      .select(CAMPAIGN_COLUMNS)
      .single();
    if (error) throw error;

    const action =
      status === "ARCHIVED"
        ? "ARCHIVE"
        : status === "ACTIVE" || status === "SCHEDULED"
          ? "PUBLISH"
          : "STATUS_CHANGE";

    await auditService.log({
      action,
      entity: "campaign",
      entityId: campaignId,
      oldValue: { status: existing.status },
      newValue: { status },
    });
    return data as unknown as Campaign;
  },

  async softDelete(campaignId: string): Promise<void> {
    const existing = await campaignService.getById(campaignId);
    if (!existing) throw new Error("Campanha nao encontrada");

    const now = new Date().toISOString();
    const releasedSlug = `${existing.slug}-deleted-${Date.now()}`;

    const { error } = await supabase
      .from("campaigns")
      .update({ deleted_at: now, slug: releasedSlug })
      .eq("id", campaignId);
    if (error) throw error;

    await auditService.log({
      action: "DELETE",
      entity: "campaign",
      entityId: campaignId,
      oldValue: { title: existing.title, status: existing.status },
    });
  },

  async permanentDelete(campaignId: string): Promise<void> {
    const { error } = await supabase.from("campaigns").delete().eq("id", campaignId);
    if (error) throw error;
  },

  async restore(campaignId: string): Promise<Campaign> {
    const existing = await campaignService.getById(campaignId);
    if (!existing) throw new Error("Campanha nao encontrada");

    const { data, error } = await supabase
      .from("campaigns")
      .update({ deleted_at: null })
      .eq("id", campaignId)
      .select(CAMPAIGN_COLUMNS)
      .single();
    if (error) throw error;

    await auditService.log({
      action: "RESTORE",
      entity: "campaign",
      entityId: campaignId,
      newValue: { title: existing.title },
    });
    return data as unknown as Campaign;
  },

  async updateCampaignContact(
    campaignId: string,
    input: {
      contact_name?: string | null;
      contact_phone?: string | null;
      whatsapp_message_template?: string | null;
      purchase_mode?: "MANUAL" | "AUTOMATIC";
    },
  ): Promise<void> {
    const { error } = await supabase
      .from("campaigns")
      .update({
        contact_name: input.contact_name ?? null,
        contact_phone: input.contact_phone ?? null,
        whatsapp_message_template: input.whatsapp_message_template ?? null,
        ...(input.purchase_mode ? { purchase_mode: input.purchase_mode } : {}),
      })
      .eq("id", campaignId);
    if (error) throw error;
  },

  async listWhatsAppMessages(campaignId: string): Promise<CampaignWhatsAppMessage[]> {
    const { data, error } = await supabase
      .from("campaign_whatsapp_messages")
      .select(WHATSAPP_MESSAGE_COLUMNS)
      .eq("campaign_id", campaignId)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []) as unknown as CampaignWhatsAppMessage[];
  },

  async createWhatsAppMessage(
    campaignId: string,
    input: CampaignWhatsAppMessageInput,
  ): Promise<CampaignWhatsAppMessage> {
    const { data: existing } = await supabase
      .from("campaign_whatsapp_messages")
      .select("id")
      .eq("campaign_id", campaignId)
      .maybeSingle();
    const isDefault = input.is_default || existing == null;

    if (input.is_default) {
      const { error: clearError } = await supabase
        .from("campaign_whatsapp_messages")
        .update({ is_default: false })
        .eq("campaign_id", campaignId);
      if (clearError) throw clearError;
    }

    const { data, error } = await supabase
      .from("campaign_whatsapp_messages")
      .insert({
        campaign_id: campaignId,
        name: input.name,
        content: input.content,
        is_default: isDefault,
      })
      .select(WHATSAPP_MESSAGE_COLUMNS)
      .single();
    if (error) throw error;

    if (isDefault) {
      await syncWhatsAppDefaultTemplate(campaignId, input.content);
    }
    return data as unknown as CampaignWhatsAppMessage;
  },

  async updateWhatsAppMessage(
    messageId: string,
    input: CampaignWhatsAppMessageInput,
  ): Promise<CampaignWhatsAppMessage> {
    const { data: current } = await supabase
      .from("campaign_whatsapp_messages")
      .select("campaign_id, content")
      .eq("id", messageId)
      .maybeSingle();
    if (!current) throw new Error("Mensagem não encontrada");

    const campaignId = current.campaign_id as string;

    if (input.is_default) {
      const { error: clearError } = await supabase
        .from("campaign_whatsapp_messages")
        .update({ is_default: false })
        .eq("campaign_id", campaignId);
      if (clearError) throw clearError;
    }

    const { data, error } = await supabase
      .from("campaign_whatsapp_messages")
      .update({
        name: input.name,
        content: input.content,
        is_default: input.is_default,
      })
      .eq("id", messageId)
      .select(WHATSAPP_MESSAGE_COLUMNS)
      .single();
    if (error) throw error;

    if (input.is_default) {
      await syncWhatsAppDefaultTemplate(campaignId, input.content);
    }
    return data as unknown as CampaignWhatsAppMessage;
  },

  async setDefaultWhatsAppMessage(
    campaignId: string,
    messageId: string,
  ): Promise<CampaignWhatsAppMessage> {
    const { data: target } = await supabase
      .from("campaign_whatsapp_messages")
      .select("content")
      .eq("id", messageId)
      .maybeSingle();
    if (!target) throw new Error("Mensagem não encontrada");

    const { error: clearError } = await supabase
      .from("campaign_whatsapp_messages")
      .update({ is_default: false })
      .eq("campaign_id", campaignId);
    if (clearError) throw clearError;

    const { data, error } = await supabase
      .from("campaign_whatsapp_messages")
      .update({ is_default: true })
      .eq("id", messageId)
      .select(WHATSAPP_MESSAGE_COLUMNS)
      .single();
    if (error) throw error;

    await syncWhatsAppDefaultTemplate(campaignId, target.content as string);
    return data as unknown as CampaignWhatsAppMessage;
  },

  async deleteWhatsAppMessage(
    messageId: string,
  ): Promise<{ nextTemplate: string | null }> {
    const { data: current } = await supabase
      .from("campaign_whatsapp_messages")
      .select("campaign_id, content, is_default")
      .eq("id", messageId)
      .maybeSingle();
    if (!current) return { nextTemplate: null };

    const campaignId = current.campaign_id as string;
    const wasDefault = current.is_default === true;

    const { error } = await supabase
      .from("campaign_whatsapp_messages")
      .delete()
      .eq("id", messageId);
    if (error) throw error;

    if (wasDefault) {
      const { data: remaining } = await supabase
        .from("campaign_whatsapp_messages")
        .select("id, content")
        .eq("campaign_id", campaignId)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      const nextTemplate = (remaining?.content as string | undefined) ?? null;
      if (remaining?.id) {
        const { error: promoteError } = await supabase
          .from("campaign_whatsapp_messages")
          .update({ is_default: true })
          .eq("id", remaining.id as string);
        if (promoteError) throw promoteError;
      }
      await syncWhatsAppDefaultTemplate(campaignId, nextTemplate);
      return { nextTemplate };
    }
    return { nextTemplate: null };
  },

  async duplicate(campaignId: string): Promise<Campaign> {
    const existing = await campaignService.getById(campaignId);
    if (!existing) throw new Error("Campanha não encontrada");
    const { data: auth } = await supabase.auth.getUser();
    const actorId = auth.user?.id;
    if (!actorId) throw new Error("Não autenticado");

    const slug = await resolveUniqueSlug(slugifyTitle(existing.title));
    const { data, error } = await supabase
      .from("campaigns")
      .insert({
        title: `${existing.title} (cópia)`,
        slug,
        product_name: existing.product_name,
        short_description: existing.short_description,
        description: existing.description,
        number_start: existing.number_start,
        number_end: existing.number_end,
        price_per_number: existing.price_per_number,
        max_numbers_per_purchase: existing.max_numbers_per_purchase,
        reservation_timeout_minutes: existing.reservation_timeout_minutes,
        start_date: existing.start_date,
        end_date: existing.end_date,
        visibility: existing.visibility,
        allow_random_selection: existing.allow_random_selection,
        contact_name: existing.contact_name,
        contact_phone: existing.contact_phone,
        whatsapp_message_template: existing.whatsapp_message_template,
        purchase_mode: existing.purchase_mode,
        status: "DRAFT",
        created_by: actorId,
      })
      .select(CAMPAIGN_COLUMNS)
      .single();
    if (error) throw error;

    await copyCampaignAssets(existing, data.id);

    await auditService.log({
      action: "DUPLICATE",
      entity: "campaign",
      entityId: data.id,
      oldValue: { sourceId: campaignId, title: existing.title },
      newValue: { title: data.title, slug: data.slug },
    });
    return data as unknown as Campaign;
  },

  async updateSettings(
    campaignId: string,
    input: CampaignSettingsInput,
  ): Promise<CampaignSettings> {
    const text = (value: string | undefined) => {
      const trimmed = (value ?? "").trim();
      return trimmed.length > 0 ? trimmed : null;
    };

    const payload = {
      show_progress: input.show_progress,
      show_remaining_numbers: input.show_remaining_numbers,
      show_product_value: input.show_product_value,
      enable_share: input.enable_share,
      enable_seo: input.enable_seo,
      enable_public_page: input.enable_public_page,
      seo_title: text(input.seo_title),
      seo_description: text(input.seo_description),
      seo_keywords: text(input.seo_keywords),
      share_image: text(input.share_image),

      show_progress_bar: input.show_progress_bar,
      show_percentage_sold: input.show_percentage_sold,
      show_total_numbers: input.show_total_numbers,
      show_contact_information: input.show_contact_information,
      show_statistics: input.show_statistics,
      show_gallery: input.show_gallery,
      show_product_description: input.show_product_description,
      show_purchase_counter: input.show_purchase_counter,
      show_recent_buyers: input.show_recent_buyers,
      show_rules: input.show_rules,
      enable_comments: input.enable_comments,
      enable_faq: input.enable_faq,
      enable_whatsapp: input.enable_whatsapp,

      allow_manual_selection: input.allow_manual_selection,
      allow_random_selection: input.allow_random_selection,
      auto_reservation: input.auto_reservation,
      reservation_timeout_minutes: input.reservation_timeout_minutes,
      max_numbers_per_purchase: input.max_numbers_per_purchase,

      theme: input.theme,
      primary_color: text(input.primary_color),
      secondary_color: text(input.secondary_color),
      button_color: text(input.button_color),
      font_family: input.font_family,
      background_image: text(input.background_image),
      banner_image: text(input.banner_image),
      campaign_logo: text(input.campaign_logo),

      canonical_url: text(input.canonical_url),
      og_title: text(input.og_title),
      og_description: text(input.og_description),
      og_image: text(input.og_image),
      twitter_title: text(input.twitter_title),
      twitter_description: text(input.twitter_description),
      twitter_image: text(input.twitter_image),
      json_ld: text(input.json_ld),

      contact_email: text(input.contact_email),
      contact_hours: text(input.contact_hours),
      contact_whatsapp: text(input.contact_whatsapp),

      enable_pix: input.enable_pix,
      payment_gateway:
        input.payment_gateway === "DEFAULT" || !input.payment_gateway
          ? null
          : input.payment_gateway,
    };

    const { data, error } = await supabase
      .from("campaign_settings")
      .update(payload as never)
      .eq("campaign_id", campaignId)
      .select(SETTINGS_COLUMNS)
      .single();
    if (error) throw error;

    await auditService.log({
      action: "UPDATE",
      entity: "campaign_settings",
      entityId: campaignId,
      newValue: payload,
    });
    return data as unknown as CampaignSettings;
  },

  /** Atualiza o estado de publicação (rascunho, revisão, publicada…). */
  async updatePublishStatus(
    campaignId: string,
    status: CampaignPublishStatus,
  ): Promise<CampaignSettings> {
    const { data, error } = await supabase
      .from("campaign_settings")
      .update({ publish_status: status } as never)
      .eq("campaign_id", campaignId)
      .select(SETTINGS_COLUMNS)
      .single();
    if (error) throw error;

    await auditService.log({
      action: status === "PUBLISHED" ? "PUBLISH" : "UPDATE",
      entity: "campaign_settings",
      entityId: campaignId,
      newValue: { publish_status: status },
    });
    return data as unknown as CampaignSettings;
  },

  async uploadImages(campaignId: string, files: File[]): Promise<CampaignImage[]> {
    const existing = await campaignService.getById(campaignId);
    if (!existing) throw new Error("Campanha não encontrada");

    const created: CampaignImage[] = [];
    for (const file of files) {
      const dimensions = await getImageDimensions(file);
      const path = `campaigns/${campaignId}/gallery/${Date.now()}-${sanitizeFilename(file.name)}`;
      const { error: uploadError } = await supabase.storage
        .from(CAMPAIGN_MEDIA_BUCKET)
        .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
      if (uploadError) throw uploadError;

      const isCover = existing.images.length === 0 && created.length === 0;
      const { data, error } = await supabase
        .from("campaign_images")
        .insert({
          campaign_id: campaignId,
          filename: file.name,
          storage_path: path,
          display_order: existing.images.length + created.length,
          is_cover: isCover,
          image_type: isCover ? "COVER" : "GALLERY",
          width: dimensions?.width ?? null,
          height: dimensions?.height ?? null,
          size: file.size,
          mime_type: file.type || null,
        })
        .select(IMAGE_COLUMNS)
        .single();
      if (error) throw error;
      created.push(data as unknown as CampaignImage);

      await auditService.log({
        action: "UPLOAD",
        entity: "campaign_image",
        entityId: data.id,
        newValue: { filename: file.name, storage_path: path, is_cover: isCover },
      });
    }

    if (existing.images.length === 0 && created.length > 0) {
      const firstCreated = created[0];
      if (firstCreated) {
        await supabase
          .from("campaigns")
          .update({ cover_image: firstCreated.storage_path })
          .eq("id", campaignId);
      }
    }
    return created;
  },

  async setCover(campaignId: string, imageId: string): Promise<void> {
    const image = await getImageById(imageId);
    if (!image) throw new Error("Imagem não encontrada");

    await supabase
      .from("campaign_images")
      .update({ is_cover: false })
      .eq("campaign_id", campaignId);
    const { error } = await supabase
      .from("campaign_images")
      .update({ is_cover: true, image_type: "COVER" })
      .eq("id", imageId);
    if (error) throw error;
    await supabase
      .from("campaigns")
      .update({ cover_image: image.storage_path })
      .eq("id", campaignId);

    await auditService.log({
      action: "UPDATE",
      entity: "campaign_image",
      entityId: imageId,
      newValue: { is_cover: true },
    });
  },

  async removeImage(campaignId: string, imageId: string): Promise<void> {
    const image = await getImageById(imageId);
    if (!image) throw new Error("Imagem não encontrada");

    const { error } = await supabase.from("campaign_images").delete().eq("id", imageId);
    if (error) throw error;

    await supabase.storage
      .from(CAMPAIGN_MEDIA_BUCKET)
      .remove([image.storage_path])
      .catch(() => undefined);

    const campaign = await campaignService.getById(campaignId);
    if (campaign && campaign.cover_image === image.storage_path) {
      const nextCover = campaign.images.find((img) => img.id !== imageId) ?? null;
      await supabase
        .from("campaigns")
        .update({ cover_image: nextCover?.storage_path ?? null })
        .eq("id", campaignId);
      if (nextCover) {
        await supabase.from("campaign_images").update({ is_cover: true }).eq("id", nextCover.id);
      }
    }

    await auditService.log({
      action: "DELETE",
      entity: "campaign_image",
      entityId: imageId,
      oldValue: { filename: image.filename, storage_path: image.storage_path },
    });
  },

  async reorderImages(campaignId: string, orderedIds: string[]): Promise<void> {
    for (let index = 0; index < orderedIds.length; index++) {
      const imageId = orderedIds[index];
      if (!imageId) continue;
      const { error } = await supabase
        .from("campaign_images")
        .update({ display_order: index })
        .eq("id", imageId);
      if (error) throw error;
    }

    await auditService.log({
      action: "UPDATE",
      entity: "campaign",
      entityId: campaignId,
      newValue: { imageOrder: orderedIds },
    });
  },

  async setImageType(
    campaignId: string,
    imageId: string,
    imageType: CampaignImageType,
  ): Promise<CampaignImage> {
    const exclusiveTypes = ["COVER", "SHARE", "THUMBNAIL", "BANNER"];
    if (exclusiveTypes.includes(imageType)) {
      await supabase
        .from("campaign_images")
        .update({ image_type: "GALLERY", is_cover: false })
        .eq("campaign_id", campaignId)
        .eq("image_type", imageType);
    }

    const { data, error } = await supabase
      .from("campaign_images")
      .update({ image_type: imageType, is_cover: imageType === "COVER" })
      .eq("id", imageId)
      .select(IMAGE_COLUMNS)
      .single();
    if (error) throw error;

    if (imageType === "COVER") {
      await supabase
        .from("campaigns")
        .update({ cover_image: data.storage_path })
        .eq("id", campaignId);
    }

    return data as unknown as CampaignImage;
  },

  async updateImage(
    imageId: string,
    updates: { altText?: string; caption?: string },
  ): Promise<void> {
    const { error } = await supabase
      .from("campaign_images")
      .update({
        alt_text: updates.altText ?? null,
        caption: updates.caption ?? null,
      })
      .eq("id", imageId);
    if (error) throw error;
  },

  async cleanupOrphanImages(): Promise<number> {
    const { data: files } = await supabase.from("campaign_images").select("storage_path");
    const referenced = new Set((files ?? []).map((row) => row.storage_path));

    const { data: objects } = await supabase.storage
      .from(CAMPAIGN_MEDIA_BUCKET)
      .list("campaigns", { limit: 1000, sortBy: { column: "name", order: "asc" } });

    const orphans: string[] = [];
    for (const object of objects ?? []) {
      if (object.metadata?.mimetype === "application/octet-stream") continue;
      const path = `campaigns/${object.name}`;
      if (!referenced.has(path)) orphans.push(path);
    }
    if (orphans.length === 0) return 0;

    await supabase.storage.from(CAMPAIGN_MEDIA_BUCKET).remove(orphans);
    return orphans.length;
  },

  async metrics(createdBy?: string): Promise<CampaignMetrics> {
    let query = supabase
      .from("campaigns")
      .select(CAMPAIGN_COLUMNS)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(1000);
    if (createdBy) query = query.eq("created_by", createdBy);
    const { data, error } = await query;
    if (error) throw error;

    const campaigns = (data ?? []) as unknown as Campaign[];
    const byStatus: Record<CampaignStatus, number> = {
      DRAFT: 0,
      SCHEDULED: 0,
      ACTIVE: 0,
      PAUSED: 0,
      FINISHED: 0,
      CANCELLED: 0,
      ARCHIVED: 0,
    };
    const byMonth = new Map<string, number>();

    for (const campaign of campaigns) {
      byStatus[campaign.status] = (byStatus[campaign.status] ?? 0) + 1;
      const month = campaign.created_at.slice(0, 7);
      byMonth.set(month, (byMonth.get(month) ?? 0) + 1);
    }

    return {
      total: campaigns.length,
      active: byStatus.ACTIVE,
      scheduled: byStatus.SCHEDULED,
      finished: byStatus.FINISHED,
      cancelled: byStatus.CANCELLED,
      archived: byStatus.ARCHIVED,
      drafts: byStatus.DRAFT,
      lastCreated: campaigns[0] ?? null,
      byMonth: [...byMonth.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([month, count]) => ({ month, count })),
    };
  },
};

async function getImageById(imageId: string): Promise<CampaignImage | null> {
  const { data, error } = await supabase
    .from("campaign_images")
    .select(IMAGE_COLUMNS)
    .eq("id", imageId)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as CampaignImage) ?? null;
}

async function syncWhatsAppDefaultTemplate(
  campaignId: string,
  content: string | null,
): Promise<void> {
  const { error } = await supabase
    .from("campaigns")
    .update({ whatsapp_message_template: content })
    .eq("id", campaignId);
  if (error) throw error;
}

async function copyCampaignAssets(source: CampaignWithRelations, targetId: string): Promise<void> {
  if (source.settings) {
    const settings = source.settings;
    await supabase
      .from("campaign_settings")
      .update({
        show_progress: settings.show_progress,
        show_remaining_numbers: settings.show_remaining_numbers,
        show_product_value: settings.show_product_value,
        enable_share: settings.enable_share,
        enable_seo: settings.enable_seo,
        enable_public_page: settings.enable_public_page,
      })
      .eq("campaign_id", targetId);
  }

  let firstUploadedPath: string | null = null;
  for (let index = 0; index < source.images.length; index++) {
    const image = source.images[index];
    if (!image) continue;
    const targetPath = `campaigns/${targetId}/gallery/${Date.now()}-${index}-${sanitizeFilename(image.filename)}`;
    const { data: blob, error } = await supabase.storage
      .from(CAMPAIGN_MEDIA_BUCKET)
      .download(image.storage_path);
    if (error || !blob) continue;

    const file = new File([blob], targetPath.split("/").pop() ?? "imagem", {
      type: blob.type || "image/jpeg",
    });
    const { error: uploadError } = await supabase.storage
      .from(CAMPAIGN_MEDIA_BUCKET)
      .upload(targetPath, file, { cacheControl: "3600", upsert: false, contentType: file.type });
    if (uploadError) continue;

    await supabase.from("campaign_images").insert({
      campaign_id: targetId,
      filename: image.filename,
      storage_path: targetPath,
      display_order: index,
      is_cover: index === 0,
    });
    if (index === 0) firstUploadedPath = targetPath;
  }

  if (firstUploadedPath) {
    const { error: coverUpdateError } = await supabase
      .from("campaigns")
      .update({ cover_image: firstUploadedPath })
      .eq("id", targetId);
    void coverUpdateError;
  }
}

async function hydrateWithRelations(rows: Campaign[]): Promise<CampaignWithRelations[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((row) => row.id);

  const [imagesRes, settingsRes, profilesRes] = await Promise.all([
    supabase
      .from("campaign_images")
      .select(IMAGE_COLUMNS)
      .in("campaign_id", ids)
      .order("display_order", { ascending: true }),
    supabase.from("campaign_settings").select(SETTINGS_COLUMNS).in("campaign_id", ids),
    supabase
      .from("profiles")
      .select("id, name, email")
      .in(
        "id",
        rows.map((row) => row.created_by),
      ),
  ]);
  if (imagesRes.error) throw imagesRes.error;
  if (settingsRes.error) throw settingsRes.error;
  if (profilesRes.error) throw profilesRes.error;

  const imagesMap = new Map<string, CampaignImage[]>();
  for (const image of (imagesRes.data ?? []) as unknown as CampaignImage[]) {
    const list = imagesMap.get(image.campaign_id) ?? [];
    list.push(image);
    imagesMap.set(image.campaign_id, list);
  }
  const settingsMap = new Map<string, CampaignSettings>();
  for (const settings of (settingsRes.data ?? []) as unknown as CampaignSettings[]) {
    settingsMap.set(settings.campaign_id, settings);
  }
  const profilesMap = new Map((profilesRes.data ?? []).map((profile) => [profile.id, profile]));

  return rows.map((row) => ({
    ...row,
    images: imagesMap.get(row.id) ?? [],
    settings: settingsMap.get(row.id) ?? null,
    creator_name: profilesMap.get(row.created_by)?.name ?? null,
    creator_email: profilesMap.get(row.created_by)?.email ?? null,
  }));
}
