import { useRef, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ImageSorter } from "@/features/campaigns/components/image-sorter";
import {
  useRemoveCampaignImage,
  useReorderCampaignImages,
  useSetCampaignCover,
  useUploadCampaignImages,
} from "@/features/campaigns/hooks/use-campaigns";
import { compressImage } from "@/lib/image-compression";
import { cn } from "@/lib/utils";
import type { CampaignImage } from "@/types/campaign";

export interface CampaignGalleryProps {
  campaignId: string;
  images: CampaignImage[];
}

export function CampaignGallery({ campaignId, images }: CampaignGalleryProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const upload = useUploadCampaignImages();
  const remove = useRemoveCampaignImage();
  const setCover = useSetCampaignCover();
  const reorder = useReorderCampaignImages();

  const handleFiles = async (fileList: FileList | File[] | null) => {
    const files = Array.from(fileList ?? []);
    if (files.length === 0) return;

    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    if (imageFiles.length === 0) {
      toast.error("Selecione apenas imagens (JPG, PNG, WebP, GIF).");
      return;
    }

    const compressed = await Promise.all(imageFiles.map((file) => compressImage(file)));

    upload.mutate(
      { campaignId, files: compressed },
      {
        onSuccess: (created) =>
          toast.success(`${created.length} imagem(ns) enviada(s) com sucesso`),
        onError: (error) =>
          toast.error("Não foi possível enviar as imagens", { description: error.message }),
      },
    );
  };

  return (
    <div className="space-y-4">
      <div
        role="button"
        tabIndex={0}
        aria-label="Enviar imagens para a galeria"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") inputRef.current?.click();
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          void handleFiles(event.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-colors",
          isDragging ? "border-primary bg-accent" : "border-border",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(event) => {
            void handleFiles(event.target.files);
            event.target.value = "";
          }}
        />
        <ImagePlus aria-hidden="true" className="size-6 text-muted-foreground" />
        <p className="text-sm font-medium">Arraste imagens ou clique para enviar</p>
        <p className="text-xs text-muted-foreground">
          Upload múltiplo com compressão automática. A primeira imagem vira a capa.
        </p>
        <Button type="button" variant="outline" size="sm" disabled={upload.isPending}>
          {upload.isPending ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <ImagePlus aria-hidden="true" className="size-4" />
          )}
          {upload.isPending ? "Enviando…" : "Escolher imagens"}
        </Button>
      </div>

      {images.length > 0 ? (
        <ImageSorter
          images={images}
          onReorder={(orderedIds) =>
            reorder.mutate(
              { campaignId, orderedIds },
              {
                onSuccess: () => toast.success("Ordem das imagens atualizada"),
                onError: (error) =>
                  toast.error("Não foi possível reordenar", { description: error.message }),
              },
            )
          }
          onRemove={(imageId) =>
            remove.mutate(
              { campaignId, imageId },
              {
                onSuccess: () => toast.success("Imagem removida"),
                onError: (error) =>
                  toast.error("Não foi possível remover", { description: error.message }),
              },
            )
          }
          onSetCover={(imageId) =>
            setCover.mutate(
              { campaignId, imageId },
              {
                onSuccess: () => toast.success("Capa atualizada"),
                onError: (error) =>
                  toast.error("Não foi possível definir a capa", { description: error.message }),
              },
            )
          }
        />
      ) : null}
    </div>
  );
}
