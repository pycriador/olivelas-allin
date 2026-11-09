import { useMemo } from "react";
import { resolveImageUrl } from "@/lib/services/storage";

export function useSignedImage(stored: string | null | undefined) {
  const url = useMemo(() => resolveImageUrl(stored), [stored]);
  return { data: url, isLoading: false };
}
