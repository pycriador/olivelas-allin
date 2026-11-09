import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Eye, ExternalLink, Share2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StoredImage } from "@/components/common/stored-image";
import { toast } from "sonner";

interface ArtworkItem {
  id: string;
  title: string;
  code?: string | null;
  image_url?: string | null;
  collection?: { id: string; name: string; slug: string } | null;
  status?: string;
}

interface Props {
  item: ArtworkItem;
  onShowcase: (id: string) => void;
}

export function GridCard({ item, onShowcase }: Props) {
  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/artworks/${item.id}`
    : "";

  const copyLink = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(shareUrl).then(() => toast.success("Link copiado"));
  };

  return (
    <article className="group relative overflow-hidden rounded-xl border border-border bg-surface transition-all duration-200 hover:border-primary/40 hover:shadow-lg">
      <Link to="/artworks/$id" params={{ id: item.id }} className="block">
        <div className="aspect-square overflow-hidden bg-surface-muted">
          <StoredImage
            stored={item.image_url}
            alt={item.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
          {item.status && item.status !== "active" ? (
            <Badge variant="secondary" className="absolute left-2 top-2 text-[10px]">
              {item.status === "draft" ? "Rascunho" : item.status}
            </Badge>
          ) : null}
        </div>

        <div className="px-3 py-3">
          <p className="truncate text-sm font-medium">{item.title}</p>
          <div className="mt-1 flex items-center gap-2">
            {item.code ? (
              <span className="text-[11px] uppercase tracking-widest text-muted-foreground">
                #{item.code}
              </span>
            ) : null}
            {item.collection?.name ? (
              <span className="truncate text-[11px] text-muted-foreground">
                {item.collection.name}
              </span>
            ) : null}
          </div>
        </div>
      </Link>

      {/* Quick actions overlay on hover */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2 bg-overlay/0 opacity-0 transition-all duration-200 group-hover:bg-overlay/40 group-hover:opacity-100">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.05 }}
          className="pointer-events-auto flex gap-1"
        >
          <Button
            variant="secondary"
            size="icon"
            className="h-9 w-9 rounded-full bg-white/90 text-foreground shadow-lg hover:bg-white"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onShowcase(item.id);
            }}
            title="Visualizar na galeria"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="h-9 w-9 rounded-full bg-white/90 text-foreground shadow-lg hover:bg-white"
            asChild
            onClick={(e) => e.stopPropagation()}
            title="Abrir arte"
          >
            <Link to="/artworks/$id" params={{ id: item.id }}>
              <ExternalLink className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="h-9 w-9 rounded-full bg-white/90 text-foreground shadow-lg hover:bg-white"
            onClick={copyLink}
            title="Copiar link"
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </motion.div>
      </div>
    </article>
  );
}
