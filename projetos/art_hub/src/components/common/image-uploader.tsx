import { useRef, useState } from "react";
import { Loader2, Trash2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useFileUpload } from "@/hooks/use-file-upload";
import { StoredImage } from "./stored-image";
import { deleteStoredImage, type StorageBucket } from "@/lib/services/storage";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  bucket: StorageBucket;
  prefix: string;
  label?: string;
  aspect?: "square" | "wide";
}

export function ImageUploader({ value, onChange, bucket, prefix, label, aspect = "square" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { upload, cancel, uploading, progress, error } = useFileUpload();
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file: File) => {
    const result = await upload(file, bucket, prefix);
    if (result) {
      // remove old
      if (value) await deleteStoredImage(value);
      onChange(result.stored);
      toast.success("Imagem enviada");
    } else if (error) {
      toast.error(error);
    }
  };

  const handleRemove = async () => {
    if (value) await deleteStoredImage(value);
    onChange(null);
  };

  return (
    <div className="space-y-2">
      {label ? <p className="text-sm font-medium text-foreground">{label}</p> : null}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files[0];
          if (file) void handleFile(file);
        }}
        className={cn(
          "relative overflow-hidden rounded-xl border border-dashed border-border bg-surface-muted/60 transition",
          dragOver && "border-primary bg-accent/10",
          aspect === "square" ? "aspect-square" : "aspect-[16/6]",
        )}
      >
        {value ? (
          <>
            <StoredImage stored={value} alt="preview" className="h-full w-full object-cover" />
            <div className="absolute right-2 top-2 flex gap-1">
              <Button size="icon" variant="secondary" type="button" onClick={() => inputRef.current?.click()}>
                <Upload className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="destructive" type="button" onClick={handleRemove}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground transition hover:text-foreground"
          >
            {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
            <span className="text-xs">
              {uploading ? "Enviando…" : "Clique ou arraste uma imagem (PNG, JPG, WEBP até 8 MB)"}
            </span>
          </button>
        )}
        {uploading ? (
          <div className="absolute inset-x-3 bottom-3 flex items-center gap-2 rounded-md bg-background/90 p-2 shadow">
            <Progress value={progress} className="h-2 flex-1" />
            <Button size="icon" variant="ghost" type="button" onClick={cancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : null}
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
