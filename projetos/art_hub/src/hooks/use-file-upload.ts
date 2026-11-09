import { useCallback, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  buildObjectPath,
  encodeStoredImage,
  getPublicUrl,
  validateFile,
  type StorageBucket,
} from "@/lib/services/storage";

export interface UploadState {
  progress: number;
  uploading: boolean;
  error: string | null;
}

export interface UploadResult {
  stored: string;
  previewUrl: string | null;
}

export function useFileUpload() {
  const [state, setState] = useState<UploadState>({ progress: 0, uploading: false, error: null });
  const abortRef = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setState({ progress: 0, uploading: false, error: null });
  }, []);

  const upload = useCallback(
    async (file: File, bucket: StorageBucket, prefix: string): Promise<UploadResult | null> => {
      const validation = validateFile(file);
      if (!validation.ok) {
        setState({ progress: 0, uploading: false, error: validation.error });
        return null;
      }

      const path = buildObjectPath(prefix, file.name);
      abortRef.current = new AbortController();
      setState({ progress: 10, uploading: true, error: null });

      try {
        // supabase-js v2 doesn't expose XHR progress; simulate incremental progress.
        const progressTimer = setInterval(() => {
          setState((s) =>
            s.uploading && s.progress < 85 ? { ...s, progress: s.progress + 5 } : s,
          );
        }, 200);

        const { error } = await supabase.storage.from(bucket).upload(path, file, {
          cacheControl: "31536000",
          upsert: false,
          contentType: file.type,
        });
        clearInterval(progressTimer);

        if (abortRef.current.signal.aborted) {
          await supabase.storage.from(bucket).remove([path]);
          setState({ progress: 0, uploading: false, error: null });
          return null;
        }

        if (error) {
          setState({ progress: 0, uploading: false, error: error.message });
          return null;
        }

        const stored = encodeStoredImage(bucket, path);
        const previewUrl = getPublicUrl(stored);
        setState({ progress: 100, uploading: false, error: null });
        return { stored, previewUrl };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Falha no upload";
        setState({ progress: 0, uploading: false, error: message });
        return null;
      }
    },
    [],
  );

  return { upload, cancel, ...state };
}
