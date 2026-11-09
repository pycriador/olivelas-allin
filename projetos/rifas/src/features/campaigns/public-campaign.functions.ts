import { createServerFn } from "@tanstack/react-start";

import { campaignSlugSchema } from "@/schemas/campaign.schema";
import type { CampaignNumber } from "@/types/campaign-number";
import type {
  Campaign,
  CampaignImage,
  CampaignPublicData,
  CampaignSettings,
  CampaignStatus,
} from "@/types/campaign";

const PUBLIC_STATUS: readonly CampaignStatus[] = ["SCHEDULED", "ACTIVE", "PAUSED", "FINISHED"];

const CAMPAIGN_COLUMNS =
  "id, slug, title, short_description, description, product_name, product_description, number_start, number_end, total_numbers, price_per_number, cover_image, status, visibility, start_date, end_date, allow_random_selection, reservation_timeout_minutes, max_numbers_per_purchase, contact_name, contact_phone, whatsapp_message_template, purchase_mode, created_by, created_at, updated_at, deleted_at";

const IMAGE_COLUMNS =
  "id, campaign_id, filename, storage_path, display_order, is_cover, created_at, updated_at";

const SETTINGS_COLUMNS =
  "id, campaign_id, show_progress, show_remaining_numbers, show_product_value, enable_share, enable_seo, enable_public_page, seo_title, seo_description, seo_keywords, share_image, show_progress_bar, show_percentage_sold, show_total_numbers, show_contact_information, show_statistics, show_gallery, show_product_description, show_purchase_counter, show_recent_buyers, show_rules, enable_comments, enable_faq, enable_whatsapp, allow_manual_selection, allow_random_selection, auto_reservation, reservation_timeout_minutes, max_numbers_per_purchase, publish_status, theme, primary_color, secondary_color, button_color, font_family, background_image, banner_image, campaign_logo, canonical_url, og_title, og_description, og_image, twitter_title, twitter_description, twitter_image, json_ld, contact_email, contact_hours, contact_whatsapp, enable_pix, payment_gateway, created_at, updated_at";

const NUMBER_COLUMNS =
  "id, campaign_id, number, status, reserved_until, purchase_id, created_at, updated_at";

export interface PublicCampaignCard {
  id: string;
  slug: string;
  title: string;
  short_description: string | null;
  product_name: string;
  number_start: number;
  number_end: number;
  total_numbers: number | null;
  price_per_number: number;
  cover_image: string | null;
  status: CampaignStatus;
  start_date: string | null;
  end_date: string | null;
  is_featured: boolean;
}

const CAMPAIGN_CARD_COLUMNS =
  "id, slug, title, short_description, product_name, number_start, number_end, total_numbers, price_per_number, cover_image, status, start_date, end_date, is_featured";

/** Lista as campanhas publicas exibiveis na pagina inicial. */
export const listPublicCampaigns = createServerFn().handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data, error } = await supabaseAdmin
    .from("campaigns")
    .select(CAMPAIGN_CARD_COLUMNS)
    .eq("visibility", "PUBLIC")
    .in("status", PUBLIC_STATUS)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) throw error;

  const campaigns = (data ?? []) as unknown as PublicCampaignCard[];
  if (campaigns.length === 0) return [];

  const campaignIds = campaigns.map((c) => c.id);
  const { data: settingsRows } = await supabaseAdmin
    .from("campaign_settings")
    .select("campaign_id")
    .eq("enable_public_page", true)
    .in("campaign_id", campaignIds);

  const enabledIds = new Set((settingsRows ?? []).map((r) => r.campaign_id));
  return campaigns.filter((c) => enabledIds.has(c.id));
});

export const getPublicCampaign = createServerFn()
  .validator(campaignSlugSchema)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: campaign, error } = await supabaseAdmin
      .from("campaigns")
      .select(CAMPAIGN_COLUMNS)
      .eq("slug", data.slug)
      .is("deleted_at", null)
      .maybeSingle();
    if (error) throw error;
    if (!campaign) return null;
    if (campaign.visibility !== "PUBLIC" || !PUBLIC_STATUS.includes(campaign.status)) {
      return null;
    }

    const [settingsRes, imagesRes, numbersRes] = await Promise.all([
      supabaseAdmin
        .from("campaign_settings")
        .select(SETTINGS_COLUMNS)
        .eq("campaign_id", campaign.id)
        .maybeSingle(),
      supabaseAdmin
        .from("campaign_images")
        .select(IMAGE_COLUMNS)
        .eq("campaign_id", campaign.id)
        .order("display_order", { ascending: true }),
      supabaseAdmin
        .from("campaign_numbers")
        .select(NUMBER_COLUMNS)
        .eq("campaign_id", campaign.id)
        .order("number", { ascending: true }),
    ]);
    if (settingsRes.error) throw settingsRes.error;
    if (imagesRes.error) throw imagesRes.error;
    if (numbersRes.error) throw numbersRes.error;

    const settings = (settingsRes.data as unknown as CampaignSettings) ?? null;
    if (settings && !settings.enable_public_page) return null;

    const numbers = (numbersRes.data ?? []) as unknown as CampaignNumber[];

    const paidCount = numbers.filter((n) => n.status === "PAID" || n.status === "WINNER").length;
    const reservedCount = numbers.filter(
      (n) =>
        n.status === "RESERVED" &&
        n.reserved_until &&
        new Date(n.reserved_until).getTime() > Date.now(),
    ).length;
    const total = campaign.total_numbers ?? 0;
    const availableCount = Math.max(0, total - paidCount - reservedCount);
    const progressPercent = total > 0 ? Math.min(100, (paidCount / total) * 100) : 0;

    const result: CampaignPublicData = {
      campaign: campaign as unknown as Campaign,
      images: (imagesRes.data ?? []) as unknown as CampaignImage[],
      settings,
      numbers,
      soldCount: paidCount,
      availableCount,
      progressPercent,
    };
    return result;
  });
