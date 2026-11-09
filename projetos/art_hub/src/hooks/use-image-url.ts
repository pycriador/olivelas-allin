import { useMemo } from "react";
import { getPublicImageUrl } from "@/lib/services/storage-service";

export function useImageUrl(stored: string | null | undefined): string | null {
  return useMemo(() => getPublicImageUrl(stored), [stored]);
}
