import { supabase } from "@/integrations/supabase/client";
import { STORAGE_BUCKETS, type StorageBucket, decodeStoredImage } from "./storage";

export interface ResolvedImage {
  url: string;
  bucket: StorageBucket;
  path: string;
}

export function resolveStoredImage(stored: string | null | undefined): ResolvedImage | null {
  const decoded = decodeStoredImage(stored);
  if (!decoded) return null;
  const { data } = supabase.storage.from(decoded.bucket).getPublicUrl(decoded.path);
  return {
    url: data?.publicUrl ?? "",
    bucket: decoded.bucket,
    path: decoded.path,
  };
}

export function getPublicImageUrl(stored: string | null | undefined): string | null {
  return resolveStoredImage(stored)?.url ?? null;
}

export async function getSignedUrlForStorage(
  bucket: StorageBucket,
  path: string,
): Promise<string | null> {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60 * 24);
  if (error) {
    console.error("[storage-service] signed url error", error);
    return null;
  }
  return data?.signedUrl ?? null;
}

export function isValidStoredImage(stored: string | null | undefined): boolean {
  if (!stored) return false;
  const idx = stored.indexOf("::");
  if (idx === -1) return false;
  const bucket = stored.slice(0, idx);
  const path = stored.slice(idx + 2);
  return Object.values(STORAGE_BUCKETS).includes(bucket as StorageBucket) && path.length > 0;
}

export { STORAGE_BUCKETS, type StorageBucket, decodeStoredImage } from "./storage";
