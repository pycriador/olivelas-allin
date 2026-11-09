import { useRef, useState } from "react";
import { GripVertical, Star, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { campaignMediaPublicUrl } from "@/services/campaign.service";
import { cn } from "@/lib/utils";
import type { CampaignImage } from "@/types/campaign";

export interface ImageSorterProps {
  images: CampaignImage[];
  onReorder: (orderedIds: string[]) => void;
  onRemove: (imageId: string) => void;
  onSetCover: (imageId: string) => void;
  className?: string;
}

export function ImageSorter({
  images,
  onReorder,
  onRemove,
  onSetCover,
  className,
}: ImageSorterProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const overIndexRef = useRef<number | null>(null);

  const handleDrop = () => {
    if (draggedIndex === null || overIndexRef.current === null) return;
    const next = [...images];
    const moved = next[draggedIndex];
    if (!moved) return;
    next.splice(draggedIndex, 1);
    next.splice(overIndexRef.current, 0, moved);
    onReorder(next.map((image) => image.id));
    setDraggedIndex(null);
    overIndexRef.current = null;
  };

  return (
    <ul className={cn("grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4", className)}>
      {images.map((image, index) => {
        const url = campaignMediaPublicUrl(image.storage_path);
        return (
          <li
            key={image.id}
            draggable
            onDragStart={() => setDraggedIndex(index)}
            onDragOver={(event) => {
              event.preventDefault();
              overIndexRef.current = index;
            }}
            onDrop={handleDrop}
            onDragEnd={() => setDraggedIndex(null)}
            className={cn(
              "group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted",
              draggedIndex === index && "opacity-40",
            )}
          >
            {url ? (
              <img
                src={url}
                alt={image.filename}
                loading="lazy"
                className="size-full object-cover"
              />
            ) : null}

            {image.is_cover ? (
              <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                Capa
              </span>
            ) : null}

            <span className="absolute left-2 top-1/2 -translate-y-1/2 cursor-grab rounded-full bg-background/80 p-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
              <GripVertical aria-hidden="true" className="size-3.5" />
            </span>

            <span className="absolute inset-x-2 bottom-2 flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="size-7"
                    disabled={image.is_cover}
                    onClick={() => onSetCover(image.id)}
                  >
                    <Star aria-hidden="true" className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Definir como capa</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="size-7"
                    onClick={() => onRemove(image.id)}
                  >
                    <Trash2 aria-hidden="true" className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Remover imagem</TooltipContent>
              </Tooltip>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
