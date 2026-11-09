import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Grid3X3, LayoutPanelTop, X, PanelRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ImageZoom } from "./image-zoom";
import { ArtworkPanel } from "./artwork-panel";
import { ThumbnailFilmstrip } from "./thumbnail-filmstrip";
import { resolveImageUrl } from "@/lib/services/storage";

interface ArtworkItem {
  id: string;
  title: string;
  code?: string | null;
  description?: string | null;
  image_url?: string | null;
  collection?: { id: string; name: string; slug: string } | null;
  status?: string;
  slug?: string | null;
  category?: string | null;
}

interface AiMetadata {
  id?: string;
  title_suggested?: string | null;
  short_summary?: string | null;
  description?: string | null;
  theme?: string | null;
  occasion?: string | null;
  style?: string | null;
  emotion?: string | null;
  illustration_type?: string | null;
  target_audience?: string | null;
  suggested_category?: string | null;
  suggested_collection?: string | null;
  typography_type?: string | null;
  commemorative_date?: string | null;
  keywords?: string[];
  tags?: string[];
  predominant_colors?: string[];
  objects?: string[];
  decorative_elements?: string[];
  compatible_products?: string[];
  has_people?: boolean | null;
  has_animals?: boolean | null;
  model?: string | null;
  last_generated_at?: string | null;
}

interface Props {
  artwork: ArtworkItem;
  collectionArtworks: ArtworkItem[];
  aiMetadata?: AiMetadata | null;
  allAiMetadata?: Record<string, AiMetadata>;
  onClose: () => void;
}

export function GalleryLayout({
  artwork: initial,
  collectionArtworks,
  aiMetadata: initialAi,
  allAiMetadata,
  onClose,
}: Props) {
  const [panelOpen, setPanelOpen] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(() =>
    collectionArtworks.findIndex((a) => a.id === initial.id),
  );
  const [slideshowPlaying, setSlideshowPlaying] = useState(false);
  const [slideshowSpeed, setSlideshowSpeed] = useState(5000);
  const slideshowTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const current = collectionArtworks[currentIndex] ?? initial;
  const resolvedUrl = resolveImageUrl(current.image_url);

  const resolvedFilmstrip = useMemo(
    () =>
      collectionArtworks.map((a) => ({
        id: a.id,
        title: a.title,
        image_url: resolveImageUrl(a.image_url),
      })),
    [collectionArtworks],
  );

  // Preload adjacent
  const preloadSrc = useMemo(() => {
    const indices = [currentIndex - 1, currentIndex, currentIndex + 1].filter(
      (i) => i >= 0 && i < collectionArtworks.length,
    );
    return indices.map((i) => resolveImageUrl(collectionArtworks[i].image_url)).filter(Boolean);
  }, [currentIndex, collectionArtworks]);

  useEffect(() => {
    preloadSrc.forEach((src) => {
      if (src) {
        const img = new Image();
        img.src = src;
      }
    });
  }, [preloadSrc]);

  // Slideshow
  useEffect(() => {
    if (slideshowPlaying) {
      slideshowTimer.current = setInterval(() => {
        setCurrentIndex((idx) => {
          const next = idx + 1;
          if (next >= collectionArtworks.length) {
            setSlideshowPlaying(false);
            return 0;
          }
          return next;
        });
      }, slideshowSpeed);
    }
    return () => {
      if (slideshowTimer.current) clearInterval(slideshowTimer.current);
    };
  }, [slideshowPlaying, slideshowSpeed, collectionArtworks.length]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "ArrowLeft") { goTo(currentIndex - 1); return; }
      if (e.key === "ArrowRight") { goTo(currentIndex + 1); return; }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const goTo = useCallback(
    (idx: number) => {
      if (idx >= 0 && idx < collectionArtworks.length) {
        setCurrentIndex(idx);
      }
    },
    [collectionArtworks.length],
  );

  const toggleSlideshow = useCallback(() => setSlideshowPlaying((p) => !p), []);

  // Overlay click to navigate
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (!panelOpen) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const threshold = rect.width * 0.35;
      if (x < threshold) goTo(currentIndex - 1);
      else if (x > rect.width - threshold) goTo(currentIndex + 1);
    },
    [currentIndex, panelOpen, goTo],
  );

  // Mobile swipe
  const touchStart = useRef<number>(0);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStart.current;
    if (Math.abs(dx) > 60) {
      if (dx > 0) goTo(currentIndex - 1);
      else goTo(currentIndex + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Top bar */}
      <header className="grid h-12 shrink-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 border-b border-border bg-background px-2 sm:px-3">
        <Button
          variant="ghost"
          size="sm"
          className="w-fit shrink-0 px-2 sm:px-3"
          onClick={(event) => {
            event.stopPropagation();
            onClose();
          }}
        >
          <X className="h-4 w-4 sm:mr-1.5" /> <span className="hidden sm:inline">Fechar</span>
        </Button>
        <div className="flex shrink-0 rounded-md border border-border bg-surface p-0.5">
          <Button variant="default" size="sm" className="h-7 gap-1 px-2 sm:px-3" disabled>
            <LayoutPanelTop className="h-3.5 w-3.5" />
            <span className="hidden min-[360px]:inline">Galeria</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2 sm:px-3"
            onClick={(event) => {
              event.stopPropagation();
              onClose();
            }}
          >
            <Grid3X3 className="h-3.5 w-3.5" />
            <span className="hidden min-[360px]:inline">Grid</span>
          </Button>
        </div>
        <div className="flex min-w-0 justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="hidden sm:inline-flex"
            onClick={() => setPanelOpen((p) => !p)}
          >
            <PanelRight className="mr-1.5 h-4 w-4" /> {panelOpen ? "Ocultar" : "Detalhes"}
          </Button>
          <span className="truncate text-xs tabular-nums text-muted-foreground sm:hidden">
            {currentIndex + 1}/{collectionArtworks.length}
          </span>
        </div>
      </header>

      {/* Main content */}
      <div className="min-h-0 flex-1 overflow-y-auto sm:flex sm:overflow-hidden">
        {/* Image area */}
        <div
          className={cn(
            "relative flex h-[68svh] min-h-[28rem] w-full shrink-0 flex-col sm:h-auto sm:min-h-0 sm:min-w-0 sm:flex-1",
            panelOpen ? "" : "sm:w-full",
          )}
          onClick={handleOverlayClick}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="min-h-0 flex-1"
            >
              {resolvedUrl ? (
                <ImageZoom src={resolvedUrl} alt={current.title} className="h-full w-full" />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  Imagem não disponível
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Nav arrows overlay */}
          <Button
            variant="secondary"
            size="icon"
            className="absolute left-2 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 rounded-full opacity-0 transition-opacity hover:opacity-100 sm:inline-flex"
            onClick={(event) => {
              event.stopPropagation();
              goTo(currentIndex - 1);
            }}
            disabled={currentIndex <= 0}
            aria-label="Arte anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="absolute right-2 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 rounded-full opacity-0 transition-opacity hover:opacity-100 sm:inline-flex"
            onClick={(event) => {
              event.stopPropagation();
              goTo(currentIndex + 1);
            }}
            disabled={currentIndex >= collectionArtworks.length - 1}
            aria-label="Próxima arte"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>

          {/* Thumbnail filmstrip */}
          {collectionArtworks.length > 1 ? (
            <ThumbnailFilmstrip
              items={resolvedFilmstrip}
              currentId={current.id}
              onSelect={(id) => {
                const idx = collectionArtworks.findIndex((a) => a.id === id);
                if (idx >= 0) goTo(idx);
              }}
            />
          ) : null}
        </div>

        {/* Desktop panel */}
        {panelOpen ? (
          <aside className="hidden min-h-0 w-[clamp(24rem,34vw,32rem)] shrink-0 border-l border-border sm:block">
            <ArtworkPanel
              artwork={current}
              aiMetadata={
                allAiMetadata?.[current.id] ??
                (current.id === initial.id ? initialAi : undefined)
              }
              totalInCollection={collectionArtworks.length}
              currentIndex={currentIndex}
              isSlideshow={slideshowPlaying}
              slideshowPlaying={slideshowPlaying}
              slideshowSpeed={slideshowSpeed}
              onToggleSlideshow={toggleSlideshow}
              onChangeSpeed={setSlideshowSpeed}
              onPrev={() => goTo(currentIndex - 1)}
              onNext={() => goTo(currentIndex + 1)}
            />
          </aside>
        ) : null}

        {/* Mobile details */}
        <section className="border-t border-border bg-background sm:hidden">
          <ArtworkPanel
            artwork={current}
            aiMetadata={
              allAiMetadata?.[current.id] ??
              (current.id === initial.id ? initialAi : undefined)
            }
            totalInCollection={collectionArtworks.length}
            currentIndex={currentIndex}
            isSlideshow={slideshowPlaying}
            slideshowPlaying={slideshowPlaying}
            slideshowSpeed={slideshowSpeed}
            onToggleSlideshow={toggleSlideshow}
            onChangeSpeed={setSlideshowSpeed}
            onPrev={() => goTo(currentIndex - 1)}
            onNext={() => goTo(currentIndex + 1)}
            className="h-auto"
          />
        </section>
      </div>
    </div>
  );
}
