import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface ArtworkThumb {
  id: string;
  title: string;
  image_url?: string | null;
}

interface Props {
  items: ArtworkThumb[];
  currentId: string;
  onSelect: (id: string) => void;
  className?: string;
}

export function ThumbnailFilmstrip({ items, currentId, onSelect, className }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollRef.current) return;
    const el = scrollRef.current.querySelector(`[data-id="${currentId}"]`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [currentId]);

  if (!items.length) return null;

  return (
    <div
      ref={scrollRef}
      className={cn(
        "flex h-20 shrink-0 gap-2 overflow-x-auto overflow-y-hidden border-t border-border bg-background px-3 py-2 sm:px-4",
        className,
      )}
    >
      {items.map((item) => (
        <button
          key={item.id}
          data-id={item.id}
          type="button"
          onClick={() => onSelect(item.id)}
          className={cn(
            "h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-all duration-200",
            item.id === currentId
              ? "border-primary ring-1 ring-primary/40"
              : "border-border/40 opacity-60 hover:opacity-100",
          )}
        >
          <img
            src={item.image_url ?? ""}
            alt={item.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </button>
      ))}
    </div>
  );
}
