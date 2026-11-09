import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ExternalLink, Copy, MessageCircle, Play, Pause } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ArtworkInfo {
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
  artwork: ArtworkInfo;
  aiMetadata?: AiMetadata | null;
  totalInCollection: number;
  currentIndex: number;
  isSlideshow: boolean;
  slideshowPlaying: boolean;
  slideshowSpeed: number;
  onToggleSlideshow: () => void;
  onChangeSpeed: (s: number) => void;
  onPrev: () => void;
  onNext: () => void;
  className?: string;
}

export function ArtworkPanel({
  artwork,
  aiMetadata,
  totalInCollection,
  currentIndex,
  isSlideshow,
  slideshowPlaying,
  slideshowSpeed,
  onToggleSlideshow,
  onChangeSpeed,
  onPrev,
  onNext,
  className,
}: Props) {
  const [sections, setSections] = useState<Record<string, boolean>>({
    general: true,
    ai: false,
    share: false,
    slideshow: false,
  });

  const toggleSection = (key: string) =>
    setSections((s) => ({ ...s, [key]: !s[key] }));

  const pageUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareText = `${artwork.title}${artwork.code ? ` #${artwork.code}` : ""} — Olivelas Art Hub`;

  const copyLink = () => {
    navigator.clipboard.writeText(pageUrl).then(() => toast.success("Link copiado"));
  };

  const copyCode = () => {
    if (artwork.code) {
      navigator.clipboard.writeText(artwork.code).then(() => toast.success("Código copiado"));
    }
  };

  const shareWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${pageUrl}`)}`;
    window.open(url, "_blank", "noopener");
  };

  const collectionUrl = artwork.collection
    ? `${window.location.origin}/collections/${artwork.collection.slug}`
    : "";

  return (
    <ScrollArea className={cn("h-full", className)}>
      <div className="flex min-w-0 flex-col gap-4 p-4 sm:p-6">
        {/* Navigation header */}
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="break-words font-display text-2xl leading-tight">{artwork.title}</h1>
            {artwork.code ? (
              <p className="text-xs text-muted-foreground">#{artwork.code}</p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={onPrev} title="Anterior (←)">
              <ChevronDown className="h-4 w-4 rotate-90" />
            </Button>
            <span className="min-w-[3.5rem] text-center text-xs tabular-nums text-muted-foreground">
              {currentIndex + 1}/{totalInCollection}
            </span>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={onNext} title="Próxima (→)">
              <ChevronDown className="h-4 w-4 -rotate-90" />
            </Button>
          </div>
        </div>

        {/* Description — always visible */}
        {artwork.description ? (
          <p className="text-sm leading-relaxed text-muted-foreground">{artwork.description}</p>
        ) : aiMetadata?.short_summary ? (
          <p className="text-sm leading-relaxed text-muted-foreground">{aiMetadata.short_summary}</p>
        ) : null}

        {/* Quick actions — always visible */}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={shareWhatsApp}>
            <MessageCircle className="mr-1.5 h-3.5 w-3.5" /> WhatsApp
          </Button>
          <Button variant="outline" size="sm" onClick={copyLink}>
            <Copy className="mr-1.5 h-3.5 w-3.5" /> Copiar Link
          </Button>
          {artwork.code ? (
            <Button variant="outline" size="sm" onClick={copyCode}>
              <Copy className="mr-1.5 h-3.5 w-3.5" /> Código
            </Button>
          ) : null}
        </div>

        {/* General Info Section */}
        <CollapsibleSection
          label="Informações Gerais"
          open={sections.general}
          onToggle={() => toggleSection("general")}
        >
          <div className="grid grid-cols-1 gap-2 text-sm min-[420px]:grid-cols-2">
            {artwork.collection ? (
              <InfoItem label="Coleção" value={artwork.collection.name} />
            ) : null}
            {artwork.category ? <InfoItem label="Categoria" value={artwork.category} /> : null}
            {artwork.status ? <InfoItem label="Status" value={artwork.status} /> : null}
            {artwork.slug ? <InfoItem label="Slug" value={artwork.slug} /> : null}
          </div>
        </CollapsibleSection>

        {/* AI Metadata Section */}
        {aiMetadata ? (
          <CollapsibleSection
            label="Informações da IA"
            open={sections.ai}
            onToggle={() => toggleSection("ai")}
          >
            <div className="space-y-4">
              {aiMetadata.short_summary ? (
                <p className="text-sm leading-relaxed text-muted-foreground">{aiMetadata.short_summary}</p>
              ) : null}

              <div className="grid grid-cols-1 gap-2 text-sm min-[420px]:grid-cols-2">
                {aiMetadata.theme ? <InfoItem label="Tema" value={aiMetadata.theme} /> : null}
                {aiMetadata.style ? <InfoItem label="Estilo" value={aiMetadata.style} /> : null}
                {aiMetadata.occasion ? <InfoItem label="Ocasião" value={aiMetadata.occasion} /> : null}
                {aiMetadata.emotion ? <InfoItem label="Emoção" value={aiMetadata.emotion} /> : null}
                {aiMetadata.illustration_type ? <InfoItem label="Tipo" value={aiMetadata.illustration_type} /> : null}
                {aiMetadata.target_audience ? <InfoItem label="Público" value={aiMetadata.target_audience} /> : null}
                {aiMetadata.typography_type ? <InfoItem label="Tipografia" value={aiMetadata.typography_type} /> : null}
                {aiMetadata.commemorative_date ? <InfoItem label="Data" value={aiMetadata.commemorative_date} /> : null}
              </div>

              {aiMetadata.keywords && aiMetadata.keywords.length > 0 ? (
                <div>
                  <p className="mb-1.5 text-xs uppercase tracking-wide text-muted-foreground">Palavras-chave</p>
                  <div className="flex flex-wrap gap-1">
                    {aiMetadata.keywords.map((k) => (
                      <Badge key={k} variant="secondary" className="text-[10px]">{k}</Badge>
                    ))}
                  </div>
                </div>
              ) : null}

              {aiMetadata.tags && aiMetadata.tags.length > 0 ? (
                <div>
                  <p className="mb-1.5 text-xs uppercase tracking-wide text-muted-foreground">Tags</p>
                  <div className="flex flex-wrap gap-1">
                    {aiMetadata.tags.map((t) => (
                      <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>
                    ))}
                  </div>
                </div>
              ) : null}

              {aiMetadata.predominant_colors && aiMetadata.predominant_colors.length > 0 ? (
                <div>
                  <p className="mb-1.5 text-xs uppercase tracking-wide text-muted-foreground">Cores</p>
                  <div className="flex flex-wrap gap-1.5">
                    {aiMetadata.predominant_colors.map((c) => (
                      <span
                        key={c}
                        className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[10px]"
                      >
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: c }} />
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {aiMetadata.objects && aiMetadata.objects.length > 0 ? (
                <div>
                  <p className="mb-1.5 text-xs uppercase tracking-wide text-muted-foreground">Objetos detectados</p>
                  <div className="flex flex-wrap gap-1">
                    {aiMetadata.objects.map((o) => (
                      <Badge key={o} variant="secondary" className="text-[10px]">{o}</Badge>
                    ))}
                  </div>
                </div>
              ) : null}

              {aiMetadata.compatible_products && aiMetadata.compatible_products.length > 0 ? (
                <div>
                  <p className="mb-1.5 text-xs uppercase tracking-wide text-muted-foreground">Produtos compatíveis</p>
                  <div className="flex flex-wrap gap-1">
                    {aiMetadata.compatible_products.map((p) => (
                      <Badge key={p} variant="outline" className="text-[10px]">{p}</Badge>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="rounded-lg border border-border/60 bg-surface/40 p-3 text-xs text-muted-foreground">
                {aiMetadata.has_people !== null || aiMetadata.has_animals !== null ? (
                  <div className="mb-2 flex gap-3">
                    {aiMetadata.has_people !== null ? (
                      <span>Pessoas: {aiMetadata.has_people ? "Sim" : "Não"}</span>
                    ) : null}
                    {aiMetadata.has_animals !== null ? (
                      <span>Animais: {aiMetadata.has_animals ? "Sim" : "Não"}</span>
                    ) : null}
                  </div>
                ) : null}
                {aiMetadata.suggested_category ? (
                  <p>Categoria sugerida: {aiMetadata.suggested_category}</p>
                ) : null}
                {aiMetadata.suggested_collection ? (
                  <p>Coleção sugerida: {aiMetadata.suggested_collection}</p>
                ) : null}
                {aiMetadata.model ? <p className="mt-1">Modelo: {aiMetadata.model}</p> : null}
                {aiMetadata.last_generated_at ? (
                  <p className="mt-1">
                    Processado em: {new Date(aiMetadata.last_generated_at).toLocaleString("pt-BR")}
                  </p>
                ) : null}
              </div>
            </div>
          </CollapsibleSection>
        ) : null}

        {/* Slideshow Section */}
        <CollapsibleSection
          label="Apresentação"
          open={sections.slideshow}
          onToggle={() => toggleSection("slideshow")}
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Button
                variant={slideshowPlaying ? "default" : "outline"}
                size="sm"
                onClick={onToggleSlideshow}
              >
                {slideshowPlaying ? (
                  <><Pause className="mr-1.5 h-3.5 w-3.5" /> Pausar</>
                ) : (
                  <><Play className="mr-1.5 h-3.5 w-3.5" /> Reproduzir</>
                )}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onChangeSpeed(5000)} className={cn(slideshowSpeed === 5000 && "bg-muted")}>
                5s
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onChangeSpeed(10000)} className={cn(slideshowSpeed === 10000 && "bg-muted")}>
                10s
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onChangeSpeed(15000)} className={cn(slideshowSpeed === 15000 && "bg-muted")}>
                15s
              </Button>
            </div>
          </div>
        </CollapsibleSection>

        {/* QR Code Section */}
        {collectionUrl ? (
          <CollapsibleSection
            label="QR Code"
            open={sections.share}
            onToggle={() => toggleSection("share")}
          >
            <div className="space-y-3">
              <Button variant="ghost" size="sm" asChild className="w-full justify-start">
                <a href={collectionUrl} target="_blank" rel="noopener">
                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Ver na coleção
                </a>
              </Button>
              <div className="rounded-lg border border-border/60 bg-surface/40 p-3">
                <p className="mb-2 text-xs text-muted-foreground">QR Code</p>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(pageUrl)}`}
                  alt="QR Code"
                  className="mx-auto h-36 w-36 rounded-lg"
                />
              </div>
            </div>
          </CollapsibleSection>
        ) : null}

        <Separator />
        <p className="text-center text-[10px] text-muted-foreground">
          Olivelas Art Hub &middot; {new Date().getFullYear()}
        </p>
      </div>
    </ScrollArea>
  );
}

function CollapsibleSection({
  label,
  open,
  onToggle,
  children,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border/50">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm font-medium transition-colors hover:bg-muted/30"
      >
        {label}
        <ChevronDown
          className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")}
        />
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-1">{children}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-border/40 bg-surface/30 px-2.5 py-2">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 break-words text-sm font-medium capitalize">{value}</p>
    </div>
  );
}
