// Lovable Cloud Storage: project attachments, images and diagram exports.
import { supabase } from "@/integrations/supabase/client";

export const ASSET_BUCKET = "project-assets";

export interface StoredAsset {
  path: string;
  name: string;
  size: number;
  updatedAt: number;
}

function keyFor(projectId: string, fileName: string) {
  const safe = fileName.replace(/[^\w.\-]+/g, "_");
  return `${projectId}/${Date.now()}-${safe}`;
}

export const storageService = {
  async upload(projectId: string, file: File): Promise<StoredAsset> {
    const path = keyFor(projectId, file.name);
    const { error } = await supabase.storage.from(ASSET_BUCKET).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || "application/octet-stream",
    });
    if (error) throw new Error(error.message);
    return { path, name: file.name, size: file.size, updatedAt: Date.now() };
  },

  async list(projectId: string): Promise<StoredAsset[]> {
    const { data, error } = await supabase.storage.from(ASSET_BUCKET).list(projectId, {
      limit: 200,
      sortBy: { column: "created_at", order: "desc" },
    });
    if (error) throw new Error(error.message);
    return (data ?? []).map((o) => ({
      path: `${projectId}/${o.name}`,
      name: o.name,
      size: (o.metadata as { size?: number } | null)?.size ?? 0,
      updatedAt: o.updated_at ? new Date(o.updated_at).getTime() : Date.now(),
    }));
  },

  /** Signed URL for a private object (valid for one hour). */
  async signedUrl(path: string): Promise<string> {
    const { data, error } = await supabase.storage.from(ASSET_BUCKET).createSignedUrl(path, 3600);
    if (error || !data) throw new Error(error?.message ?? "Could not create link");
    return data.signedUrl;
  },

  async remove(path: string): Promise<void> {
    const { error } = await supabase.storage.from(ASSET_BUCKET).remove([path]);
    if (error) throw new Error(error.message);
  },
};
