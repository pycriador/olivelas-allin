import { useCallback, useRef, useState } from "react";
import { UploadCloud, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ImagePreview } from "@/components/common/image-preview";
import { formatBytes, storageService, validateFile } from "@/services/storage.service";
import { useAuth } from "@/contexts/auth-context";
import type { StorageFile, StorageFolder } from "@/types/storage";
import { cn } from "@/lib/utils";

interface FileUploaderProps {
  folder: StorageFolder;
  multiple?: boolean;
  accept?: string;
  maxSizeMb?: number;
  allowedTypes?: readonly string[];
  onUploaded?: (files: StorageFile[]) => void;
  className?: string;
}

interface PendingFile {
  file: File;
  previewUrl: string;
}

export function FileUploader({
  folder,
  multiple = true,
  accept = "image/*,application/pdf",
  maxSizeMb,
  allowedTypes,
  onUploaded,
  className,
}: FileUploaderProps) {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [pending, setPending] = useState<PendingFile[]>([]);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const addFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList) return;
      const next: PendingFile[] = [];
      for (const file of Array.from(fileList)) {
        const validation = validateFile(file, {
          ...(maxSizeMb !== undefined ? { maxSizeMb } : {}),
          ...(allowedTypes ? { allowedTypes } : {}),
        });
        if (validation) {
          toast.error(`${file.name}: ${validation}`);
          continue;
        }
        next.push({ file, previewUrl: URL.createObjectURL(file) });
      }
      setPending((current) => (multiple ? [...current, ...next] : next.slice(0, 1)));
    },
    [multiple, maxSizeMb, allowedTypes],
  );

  const removePending = (index: number) => {
    setPending((current) => current.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (!user || pending.length === 0) return;
    setUploading(true);
    setProgress(0);
    const uploaded: StorageFile[] = [];

    try {
      for (const [index, item] of pending.entries()) {
        const result = await storageService.upload(item.file, folder, user.id);
        uploaded.push(result);
        setProgress(Math.round(((index + 1) / pending.length) * 100));
      }
      toast.success(
        uploaded.length === 1 ? "Arquivo enviado." : `${uploaded.length} arquivos enviados.`,
      );
      setPending([]);
      onUploaded?.(uploaded);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha no upload.");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div
        role="button"
        tabIndex={0}
        aria-label="Área de upload de arquivos"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          addFiles(event.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-6 py-10 text-center transition-colors",
          dragging ? "border-primary bg-accent" : "border-border hover:bg-muted/50",
        )}
      >
        <UploadCloud aria-hidden="true" className="size-6 text-muted-foreground" />
        <p className="mt-3 text-sm font-medium">Arraste arquivos ou clique para selecionar</p>
        <p className="mt-1 text-xs text-muted-foreground">
          PNG, JPG, WEBP, GIF ou PDF · até {maxSizeMb ?? 10} MB por arquivo
        </p>
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          multiple={multiple}
          accept={accept}
          onChange={(event) => {
            addFiles(event.target.files);
            event.target.value = "";
          }}
        />
      </div>

      {pending.length > 0 ? (
        <div className="space-y-3">
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pending.map((item, index) => (
              <li
                key={`${item.file.name}-${index}`}
                className="flex items-center gap-3 rounded-lg border border-border p-2"
              >
                <div className="size-12 shrink-0">
                  <ImagePreview
                    source={item.previewUrl}
                    mimeType={item.file.type}
                    alt={item.file.name}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatBytes(item.file.size)}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Remover ${item.file.name}`}
                  onClick={() => removePending(index)}
                  disabled={uploading}
                >
                  <X aria-hidden="true" className="size-4" />
                </Button>
              </li>
            ))}
          </ul>

          {uploading ? <Progress value={progress} aria-label="Progresso do upload" /> : null}

          <div className="flex gap-2">
            <Button type="button" onClick={() => void handleUpload()} disabled={uploading}>
              {uploading ? "Enviando…" : `Enviar ${pending.length} arquivo(s)`}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPending([])}
              disabled={uploading}
            >
              Limpar
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
