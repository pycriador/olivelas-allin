import { useEffect, useState } from "react";
import { FileText, ImageOff } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { storageService } from "@/services/storage.service";
import { cn } from "@/lib/utils";

interface ImagePreviewProps {
  /** Caminho no bucket, ou URL completa. */
  source: string;
  mimeType?: string;
  alt: string;
  className?: string;
}

export function ImagePreview({ source, mimeType, alt, className }: ImagePreviewProps) {
  const [url, setUrl] = useState<string | null>(source.startsWith("http") ? source : null);
  const [failed, setFailed] = useState(false);
  const isImage = !mimeType || mimeType.startsWith("image/");

  useEffect(() => {
    let active = true;
    if (source.startsWith("http") || source.startsWith("blob:")) {
      setUrl(source);
      return;
    }
    void storageService.signedUrl(source).then((signed) => {
      if (active) setUrl(signed);
    });
    return () => {
      active = false;
    };
  }, [source]);

  const box = cn(
    "flex size-full items-center justify-center overflow-hidden rounded-lg border border-border bg-muted",
    className,
  );

  if (!isImage) {
    return (
      <div className={box} aria-label={alt}>
        <FileText aria-hidden="true" className="size-5 text-muted-foreground" />
      </div>
    );
  }

  if (failed) {
    return (
      <div className={box} aria-label={alt}>
        <ImageOff aria-hidden="true" className="size-5 text-muted-foreground" />
      </div>
    );
  }

  if (!url) return <Skeleton className={cn("rounded-lg", className)} />;

  return (
    <div className={box}>
      <img
        src={url}
        alt={alt}
        loading="lazy"
        onError={() => setFailed(true)}
        className="size-full object-cover"
      />
    </div>
  );
}
