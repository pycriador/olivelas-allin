import { supabase } from "@/integrations/supabase/client";

export const STORAGE_BUCKETS = {
  collections: "collection-images",
  artworks: "artwork-images",
  branding: "branding",
} as const;

export type StorageBucket = (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS];

export const ALLOWED_IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "webp", "gif"] as const;
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8 MB

export function getPublicUrl(stored: string | null | undefined): string | null {
  const decoded = decodeStoredImage(stored);
  if (!decoded) return null;
  const { data } = supabase.storage.from(decoded.bucket).getPublicUrl(decoded.path);
  return data?.publicUrl ?? null;
}

export function validateFile(file: File): { ok: true } | { ok: false; error: string } {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (
    !ext ||
    !ALLOWED_IMAGE_EXTENSIONS.includes(ext as (typeof ALLOWED_IMAGE_EXTENSIONS)[number])
  ) {
    return {
      ok: false,
      error: `Formato inválido. Aceitos: ${ALLOWED_IMAGE_EXTENSIONS.join(", ")}`,
    };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return {
      ok: false,
      error: `Arquivo muito grande. Limite: ${MAX_UPLOAD_BYTES / (1024 * 1024)} MB`,
    };
  }
  return { ok: true };
}

export function buildObjectPath(prefix: string, fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "bin";
  const stamp = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}/${stamp}-${rand}.${ext}`;
}

export async function getSignedUrl(bucket: StorageBucket, path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60 * 24);
  if (error) {
    console.error("[storage] signed url error", error);
    return null;
  }
  return data?.signedUrl ?? null;
}

/** image_url is stored as `bucket::path`. Resolves to a public URL for display. */
export function encodeStoredImage(bucket: StorageBucket, path: string): string {
  return `${bucket}::${path}`;
}

export function decodeStoredImage(
  value: string | null | undefined,
): { bucket: StorageBucket; path: string } | null {
  if (!value) return null;
  const idx = value.indexOf("::");
  if (idx === -1) return null;
  const bucket = value.slice(0, idx) as StorageBucket;
  const path = value.slice(idx + 2);
  if (!bucket || !path) return null;
  return { bucket, path };
}

export function resolveImageUrl(stored: string | null | undefined): string | null {
  return getPublicUrl(stored);
}

export async function deleteStoredImage(stored: string | null | undefined): Promise<void> {
  const decoded = decodeStoredImage(stored);
  if (!decoded) return;
  await supabase.storage.from(decoded.bucket).remove([decoded.path]);
}
