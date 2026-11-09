import { useCallback, useMemo, useState } from "react";
import { useImageUrl } from "@/hooks/use-image-url";
import { cn } from "@/lib/utils";
import { ImageIcon, RefreshCw } from "lucide-react";

const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000];

interface Props {
  stored: string | null | undefined;
  alt: string;
  className?: string;
  fallbackClassName?: string;
}

export function StoredImage({ stored, alt, className, fallbackClassName }: Props) {
  const url = useImageUrl(stored);
  const [retryCount, setRetryCount] = useState(0);
  const [errored, setErrored] = useState(false);

  const handleError = useCallback(() => {
    if (retryCount < MAX_RETRIES) {
      const delay = RETRY_DELAYS[retryCount];
      setTimeout(() => {
        setRetryCount((c) => c + 1);
        setErrored(false);
      }, delay);
    } else {
      setErrored(true);
    }
  }, [retryCount]);

  const handleLoad = useCallback(() => {
    setErrored(false);
  }, []);

  const retry = useCallback(() => {
    setRetryCount(0);
    setErrored(false);
  }, []);

  const imgUrl = useMemo(() => {
    if (!url) return null;
    if (retryCount === 0) return url;
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}_r=${retryCount}`;
  }, [url, retryCount]);

  if (!stored || !imgUrl) {
    return (
      <div
        className={cn(
          "flex h-full w-full items-center justify-center bg-muted text-muted-foreground",
          fallbackClassName,
          className,
        )}
      >
        <ImageIcon className="h-6 w-6 opacity-50" />
      </div>
    );
  }

  if (errored) {
    return (
      <div
        className={cn(
          "flex h-full w-full flex-col items-center justify-center gap-2 bg-muted text-muted-foreground",
          fallbackClassName,
          className,
        )}
      >
        <ImageIcon className="h-6 w-6 opacity-50" />
        <p className="text-[10px]">Imagem não disponível</p>
        <button
          type="button"
          onClick={retry}
          className="flex items-center gap-1 text-[10px] text-primary hover:underline"
        >
          <RefreshCw className="h-3 w-3" /> Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <img
      src={imgUrl}
      alt={alt}
      loading="lazy"
      onLoad={handleLoad}
      onError={handleError}
      className={cn(
        "h-full w-full object-cover",
        className,
      )}
    />
  );
}
