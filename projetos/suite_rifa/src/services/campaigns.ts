import { supabase } from "@/integrations/supabase/client";
import { rpcArgs } from "@/lib/rpc";

import type {
  Campaign,
  CampaignImage,
  CampaignMetrics,
  CampaignStatus,
  Paginated,
  PublicCampaignView,
} from "./types";

export interface CampaignFilters {
  search?: string;
  status?: CampaignStatus | null;
  createdFrom?: string | null;
  createdTo?: string | null;
  publishedFrom?: string | null;
  publishedTo?: string | null;
  includeArchived?: boolean;
  sort?: string;
  direction?: "asc" | "desc";
  limit?: number;
  offset?: number;
}

export interface CampaignInput {
  name: string;
  slug: string;
  product_name: string;
  total_numbers: number;
  number_price: number;
  description?: string | null;
  product_description?: string | null;
  start_at?: string | null;
  end_at?: string | null;
}

const BUCKET = "org-assets";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/avif"];

/**
 * CampaignService — the only path the UI uses to mutate campaigns.
 * Every rule (tenant, RBAC, plan limits, status transitions, audit) is enforced by
 * security-definer database functions; there are no direct table writes.
 */
export const CampaignService = {
  async list(organizationId: string, filters: CampaignFilters = {}): Promise<Paginated<Campaign>> {
    const { data, error } = await supabase.rpc(
      "list_campaigns",
      rpcArgs<{ _org: string }>({
        _org: organizationId,
        _search: filters.search,
        _status: filters.status,
        _created_from: filters.createdFrom,
        _created_to: filters.createdTo,
        _published_from: filters.publishedFrom,
        _published_to: filters.publishedTo,
        _include_archived: filters.includeArchived ?? false,
        _sort: filters.sort ?? "created_at",
        _direction: filters.direction ?? "desc",
        _limit: filters.limit ?? 12,
        _offset: filters.offset ?? 0,
      }),
    );
    if (error) throw error;
    const payload = data as unknown as { total: number; rows: Campaign[] } | null;
    return {
      total: Number(payload?.total ?? 0),
      rows: (payload?.rows ?? []).map(normalizeCampaign),
    };
  },

  async metrics(organizationId: string): Promise<CampaignMetrics> {
    const { data, error } = await supabase.rpc("campaign_metrics", { _org: organizationId });
    if (error) throw error;
    const raw = (data ?? {}) as Record<string, number>;
    return {
      total: Number(raw["total"] ?? 0),
      published: Number(raw["published"] ?? 0),
      draft: Number(raw["draft"] ?? 0),
      paused: Number(raw["paused"] ?? 0),
      finished: Number(raw["finished"] ?? 0),
      archived: Number(raw["archived"] ?? 0),
    };
  },

  /** Reads a single campaign. RLS restricts it to the tenant (IDOR protection). */
  async get(organizationId: string, campaignId: string): Promise<Campaign | null> {
    const { data, error } = await supabase
      .from("campaigns")
      .select("*")
      .eq("id", campaignId)
      .eq("organization_id", organizationId)
      .maybeSingle();
    if (error) throw error;
    return data ? normalizeCampaign(data as unknown as Campaign) : null;
  },

  /** `organization_id` and `created_by` are derived server-side from the session. */
  async create(organizationId: string, input: CampaignInput): Promise<string> {
    const { data, error } = await supabase.rpc(
      "create_campaign",
      rpcArgs<{ _org: string; _name: string; _slug: string; _product_name: string; _total_numbers: number; _number_price: number }>(
        {
          _org: organizationId,
          _name: input.name,
          _slug: input.slug,
          _product_name: input.product_name,
          _total_numbers: input.total_numbers,
          _number_price: input.number_price,
          _description: input.description,
          _product_description: input.product_description,
          _start_at: input.start_at,
          _end_at: input.end_at,
        },
      ),
    );
    if (error) throw error;
    return data as unknown as string;
  },

  async update(
    campaignId: string,
    patch: Partial<CampaignInput> & { clear_start_at?: boolean; clear_end_at?: boolean },
  ): Promise<void> {
    const { error } = await supabase.rpc(
      "update_campaign",
      rpcArgs<{ _campaign: string }>({
        _campaign: campaignId,
        _name: patch.name,
        _slug: patch.slug,
        _description: patch.description,
        _product_name: patch.product_name,
        _product_description: patch.product_description,
        _total_numbers: patch.total_numbers,
        _number_price: patch.number_price,
        _start_at: patch.start_at,
        _end_at: patch.end_at,
        _clear_start_at: patch.clear_start_at ?? false,
        _clear_end_at: patch.clear_end_at ?? false,
      }),
    );
    if (error) throw error;
  },

  async setStatus(campaignId: string, status: CampaignStatus): Promise<void> {
    const { error } = await supabase.rpc("set_campaign_status", {
      _campaign: campaignId,
      _status: status,
    });
    if (error) throw error;
  },

  publish: (id: string) => CampaignService.setStatus(id, "PUBLISHED"),
  pause: (id: string) => CampaignService.setStatus(id, "PAUSED"),
  resume: (id: string) => CampaignService.setStatus(id, "PUBLISHED"),
  finish: (id: string) => CampaignService.setStatus(id, "FINISHED"),
  archive: (id: string) => CampaignService.setStatus(id, "ARCHIVED"),
  restore: (id: string) => CampaignService.setStatus(id, "DRAFT"),
};

/**
 * CampaignImageService — tenant-isolated Storage under
 * `organizations/{organizationId}/campaigns/{campaignId}/`.
 * Public consumption goes through the `/api/public/campaign-image` proxy, which only
 * serves images of campaigns that are actually live.
 */
export const CampaignImageService = {
  async list(campaignId: string): Promise<CampaignImage[]> {
    const { data, error } = await supabase
      .from("campaign_images")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("type", { ascending: false })
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data ?? []) as unknown as CampaignImage[];
  },

  validate(file: File): string | null {
    if (!ALLOWED_MIME.includes(file.type)) return "Envie uma imagem JPG, PNG, WEBP ou AVIF.";
    if (file.size > MAX_IMAGE_BYTES) return "A imagem deve ter no máximo 5 MB.";
    if (file.size === 0) return "O arquivo enviado está vazio.";
    return null;
  },

  /** Verifies the bytes really decode as an image (never trust the extension). */
  async assertDecodable(file: File): Promise<void> {
    if (typeof window === "undefined" || typeof createImageBitmap !== "function") return;
    try {
      const bitmap = await createImageBitmap(file);
      bitmap.close?.();
    } catch {
      throw new Error("INVALID_IMAGE");
    }
  },

  async upload(params: {
    organizationId: string;
    campaignId: string;
    file: File;
    asCover?: boolean;
  }): Promise<string> {
    const { organizationId, campaignId, file, asCover } = params;
    const invalid = CampaignImageService.validate(file);
    if (invalid) throw new Error(invalid);
    await CampaignImageService.assertDecodable(file);

    const ext = (file.type.split("/")[1] ?? "jpg").replace("jpeg", "jpg");
    const path = `organizations/${organizationId}/campaigns/${campaignId}/${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      contentType: file.type,
      upsert: false,
    });
    if (error) throw error;

    // Create a signed URL valid for 7 days so images work in public pages
    const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(path, 7 * 24 * 3600);
    const imageUrl = signed?.signedUrl ?? publicProxyPath(path);

    const { data, error: rpcError } = await supabase.rpc("add_campaign_image", {
      _campaign: campaignId,
      _path: path,
      _url: imageUrl,
      _as_cover: asCover ?? false,
    });
    if (rpcError) {
      await supabase.storage.from(BUCKET).remove([path]);
      throw rpcError;
    }
    return data as unknown as string;
  },

  async setCover(imageId: string): Promise<void> {
    const { error } = await supabase.rpc("set_campaign_cover", { _image: imageId });
    if (error) throw error;
  },

  async remove(imageId: string): Promise<void> {
    const { data, error } = await supabase.rpc("delete_campaign_image", { _image: imageId });
    if (error) throw error;
    const path = data as unknown as string | null;
    if (path) await supabase.storage.from(BUCKET).remove([path]);
  },

  async reorder(campaignId: string, imageIds: string[]): Promise<void> {
    const { error } = await supabase.rpc("reorder_campaign_images", {
      _campaign: campaignId,
      _ids: imageIds,
    });
    if (error) throw error;
  },

  /** Signed URL for in-app previews (works for drafts too, members only). */
  async signedUrl(storagePath: string): Promise<string | null> {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(storagePath, 3600);
    if (error) return null;
    return data?.signedUrl ?? null;
  },
};

/** Public read path — a dedicated query that never touches administrative data. */
export const PublicCampaignService = {
  async bySlug(slug: string): Promise<PublicCampaignView | null> {
    const { data, error } = await supabase.rpc("public_campaign", { _slug: slug });
    if (error) throw error;
    if (!data) return null;
    const raw = data as unknown as PublicCampaignView & { number_price: number | string };
    return { ...raw, number_price: Number(raw.number_price ?? 0) };
  },
};

export function publicProxyPath(storagePath: string): string {
  return `/api/public/campaign-image?p=${encodeURIComponent(storagePath)}`;
}

function normalizeCampaign(row: Campaign): Campaign {
  return { ...row, number_price: Number(row.number_price ?? 0), total_numbers: Number(row.total_numbers ?? 0) };
}
