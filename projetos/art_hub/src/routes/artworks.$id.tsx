import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle, Palette, ArrowLeft, ChevronDown, ZoomIn, Copy, Share2, QrCode, ExternalLink, RotateCcw, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PublicShell } from "@/components/layout/public-shell";
import { StoredImage } from "@/components/common/stored-image";
import { EmptyState } from "@/components/common/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ImageZoom } from "@/components/gallery/image-zoom";
import { artworksRepo } from "@/lib/repositories/artworks";
import { aiMetadataRepo } from "@/lib/repositories/ai";
import { aiHistoryRepo } from "@/lib/repositories/ai";
import { settingsRepo } from "@/lib/repositories/settings";
import { buildWhatsAppUrl, renderWhatsAppMessage } from "@/lib/services/whatsapp";
import { resolveImageUrl } from "@/lib/services/storage";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/artworks/$id")({
  loader: async ({ params }) => {
    const [artwork, settings] = await Promise.all([
      artworksRepo.getById(params.id),
      settingsRepo.get(),
    ]);
    if (!artwork || artwork.status !== "active") throw notFound();
    return { artwork, settings };
  },
  head: ({ loaderData }) => {
    const artwork = loaderData?.artwork;
    const imgUrl = artwork ? resolveImageUrl(artwork.image_url) : "";
    return {
      meta: artwork
        ? [
            { title: `${artwork.title} – Olivelas` },
            { name: "description", content: artwork.description ?? `Arte ${artwork.title} disponível na Olivelas.` },
            { property: "og:title", content: `${artwork.title} – Olivelas` },
            { property: "og:description", content: artwork.description ?? `Arte ${artwork.title} disponível na Olivelas.` },
            { property: "og:type", content: "website" },
            { property: "og:image", content: imgUrl ?? "" },
            { name: "twitter:card", content: "summary_large_image" },
            { name: "twitter:image", content: imgUrl ?? "" },
          ]
        : [{ title: "Arte não encontrada" }, { name: "robots", content: "noindex" }],
      links: artwork
        ? [{ rel: "canonical", href: `https://olivelas.art.br/artworks/${artwork.id}` }]
        : undefined,
    };
  },
  notFoundComponent: () => (
    <PublicShell>
      <EmptyState className="mx-auto my-24 max-w-lg" icon={Palette} title="Arte não encontrada" />
    </PublicShell>
  ),
  pendingComponent: () => (
    <PublicShell>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <Skeleton className="mb-4 h-4 w-48" />
        <div className="grid gap-10 md:grid-cols-[1.15fr_1fr]">
          <Skeleton className="aspect-square rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </div>
    </PublicShell>
  ),
  component: ArtworkPage,
});

function ArtworkPage() {
  const { artwork, settings } = Route.useLoaderData();

  const [imageZoom, setImageZoom] = useState(false);
  const [sections, setSections] = useState<Record<string, boolean>>({
    general: true,
    ai: false,
    history: false,
    share: false,
  });

  const toggleSection = (key: string) =>
    setSections((s) => ({ ...s, [key]: !s[key] }));

  const aiMetadataQ = useQuery({
    queryKey: ["ai-metadata-detail", artwork.id],
    queryFn: () => aiMetadataRepo.getByArtwork(artwork.id),
  });

  const aiHistoryQ = useQuery({
    queryKey: ["ai-history-detail", artwork.id],
    queryFn: () => aiHistoryRepo.list({ artworkId: artwork.id, pageSize: 5 }),
  });

  const metadata = aiMetadataQ.data;
  const historyRows = aiHistoryQ.data?.rows ?? [];

  const pageUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareText = `${artwork.title}${artwork.code ? ` #${artwork.code}` : ""} — Olivelas Art Hub`;
  const imageUrl = resolveImageUrl(artwork.image_url) ?? "";

  const copyLink = () => navigator.clipboard.writeText(pageUrl).then(() => toast.success("Link copiado"));
  const copyCode = () => artwork.code && navigator.clipboard.writeText(artwork.code).then(() => toast.success("Código copiado"));

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(`${shareText}\n${pageUrl}`)}`, "_blank", "noopener");
  };

  const handleRequest = () => {
    if (!settings?.whatsapp_number) {
      toast.error("WhatsApp ainda não configurado. Tente novamente em breve.");
      return;
    }
    const message = renderWhatsAppMessage(settings.whatsapp_message, {
      title: artwork.title,
      collection: artwork.collection?.name ?? "—",
      code: artwork.code ?? artwork.id.slice(0, 8),
      url: pageUrl,
    });
    window.open(buildWhatsAppUrl(settings.whatsapp_number, message), "_blank", "noopener");
  };

  return (
    <PublicShell>
      {/* Full-screen image viewer */}
      <AnimatePresence>
        {imageZoom ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col bg-background"
          >
            <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-background px-4">
              <span className="text-sm font-medium">{artwork.title}</span>
              <Button variant="ghost" size="sm" onClick={() => setImageZoom(false)}>
                Fechar
              </Button>
            </header>
            <div className="flex-1">
              <ImageZoom src={imageUrl} alt={artwork.title} className="h-full w-full" />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <section className="mx-auto max-w-6xl px-4 py-10">
        {artwork.collection ? (
          <Link
            to="/collections/$slug"
            params={{ slug: artwork.collection.slug }}
            className="mb-4 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" /> {artwork.collection.name}
          </Link>
        ) : null}

        <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr]">
          {/* Image — contain, no crop */}
          <div className="overflow-hidden rounded-2xl border border-border bg-black/95">
            <button
              type="button"
              onClick={() => imageUrl && setImageZoom(true)}
              className="group relative flex aspect-[4/3] w-full items-center justify-center sm:aspect-auto sm:min-h-[60vh]"
              title="Clique para ampliar"
            >
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={artwork.title}
                  className="max-h-full max-w-full object-contain p-2 transition-transform duration-300 group-hover:scale-[1.02]"
                />
              ) : (
                <StoredImage stored={artwork.image_url} alt={artwork.title} className="max-h-full max-w-full object-contain p-2" />
              )}
              <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-background/70 px-2.5 py-1 text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                <ZoomIn className="h-3.5 w-3.5" /> Ampliar
              </div>
            </button>
          </div>

          {/* Info column */}
          <div className="flex flex-col gap-6">
            {artwork.code ? (
              <p className="text-xs uppercase tracking-widest text-muted-foreground">#{artwork.code}</p>
            ) : null}
            <h1 className="font-display text-4xl leading-tight md:text-5xl">{artwork.title}</h1>

            {/* Quick actions */}
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleRequest}>
                <MessageCircle className="mr-2 h-4 w-4" /> Solicitar esta arte
              </Button>
              <Button variant="outline" onClick={shareWhatsApp}>
                <Share2 className="mr-2 h-4 w-4" /> Compartilhar
              </Button>
              <Button variant="ghost" onClick={copyLink}>
                <Copy className="mr-2 h-4 w-4" />
              </Button>
              {artwork.code ? (
                <Button variant="ghost" onClick={copyCode}>
                  <Copy className="mr-2 h-4 w-4" />
                </Button>
              ) : null}
            </div>

            {/* Collapsible sections */}
            <div className="space-y-3">
              {/* General Info */}
              <CollapsibleSection
                label="Informações Gerais"
                open={sections.general}
                onToggle={() => toggleSection("general")}
              >
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {artwork.collection ? (
                    <InfoCard label="Coleção" value={artwork.collection.name} />
                  ) : null}
                  <InfoCard label="Status" value={artwork.status === "active" ? "Ativo" : artwork.status ?? "—"} />
                  {artwork.code ? <InfoCard label="Código" value={`#${artwork.code}`} /> : null}
                </div>
              </CollapsibleSection>

              {/* Description */}
              {artwork.description || metadata?.short_summary || metadata?.description ? (
                <CollapsibleSection
                  label="Descrição"
                  open={sections.general}
                  onToggle={() => toggleSection("general")}
                >
                  <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
                    {artwork.description ? (
                      <div>
                        <p className="mb-1 text-xs uppercase tracking-wide text-foreground/60">Descrição</p>
                        <p>{artwork.description}</p>
                      </div>
                    ) : null}
                    {metadata?.short_summary ? (
                      <div>
                        <p className="mb-1 text-xs uppercase tracking-wide text-foreground/60">Resumo IA</p>
                        <p>{metadata.short_summary}</p>
                      </div>
                    ) : null}
                  </div>
                </CollapsibleSection>
              ) : null}

              {/* AI Metadata */}
              {metadata ? (
                <CollapsibleSection
                  label={aiMetadataQ.isLoading ? "IA" : "Informações da IA"}
                  open={sections.ai}
                  onToggle={() => toggleSection("ai")}
                >
                  <div className="space-y-4">
                    {metadata.short_summary ? (
                      <p className="text-sm leading-relaxed text-muted-foreground">{metadata.short_summary}</p>
                    ) : null}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {metadata.theme ? <InfoCard label="Tema" value={metadata.theme} /> : null}
                      {metadata.style ? <InfoCard label="Estilo" value={metadata.style} /> : null}
                      {metadata.occasion ? <InfoCard label="Ocasião" value={metadata.occasion} /> : null}
                      {metadata.emotion ? <InfoCard label="Emoção" value={metadata.emotion} /> : null}
                      {metadata.illustration_type ? <InfoCard label="Tipo" value={metadata.illustration_type} /> : null}
                      {metadata.target_audience ? <InfoCard label="Público" value={metadata.target_audience} /> : null}
                      {metadata.typography_type ? <InfoCard label="Tipografia" value={metadata.typography_type} /> : null}
                      {metadata.suggested_category ? <InfoCard label="Categoria" value={metadata.suggested_category} /> : null}
                      {metadata.suggested_collection ? <InfoCard label="Coleção sugerida" value={metadata.suggested_collection} /> : null}
                      {metadata.commemorative_date ? <InfoCard label="Data comemorativa" value={metadata.commemorative_date} /> : null}
                    </div>
                    {metadata.keywords?.length ? (
                      <TagGroup label="Palavras-chave" items={metadata.keywords} variant="secondary" />
                    ) : null}
                    {metadata.tags?.length ? (
                      <TagGroup label="Tags" items={metadata.tags} variant="outline" />
                    ) : null}
                    {metadata.objects?.length ? (
                      <TagGroup label="Objetos detectados" items={metadata.objects} variant="secondary" />
                    ) : null}
                    {metadata.compatible_products?.length ? (
                      <TagGroup label="Produtos compatíveis" items={metadata.compatible_products} variant="outline" />
                    ) : null}
                    {metadata.predominant_colors?.length ? (
                      <div>
                        <p className="mb-1.5 text-xs uppercase tracking-wide text-muted-foreground">Cores predominantes</p>
                        <div className="flex flex-wrap gap-1.5">
                          {metadata.predominant_colors.map((c) => (
                            <span key={c} className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[10px]">
                              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: c }} />
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {metadata.has_people !== null || metadata.has_animals !== null ? (
                      <div className="rounded-lg border border-border/60 bg-surface/40 p-3 text-xs text-muted-foreground">
                        {metadata.has_people !== null ? <span>Pessoas: {metadata.has_people ? "Sim" : "Não"} </span> : null}
                        {metadata.has_animals !== null ? <span>Animais: {metadata.has_animals ? "Sim" : "Não"}</span> : null}
                      </div>
                    ) : null}
                    {metadata.decorative_elements?.length ? (
                      <TagGroup label="Elementos decorativos" items={metadata.decorative_elements} variant="secondary" />
                    ) : null}
                    <div className="rounded-lg border border-border/60 bg-surface/40 p-3 text-xs text-muted-foreground">
                      {metadata.model ? <p>Modelo: {metadata.model}</p> : null}
                      {metadata.last_generated_at ? (
                        <p>Processado em: {new Date(metadata.last_generated_at).toLocaleString("pt-BR")}</p>
                      ) : null}
                      {metadata.description ? (
                        <div className="mt-2">
                          <p className="text-xs uppercase tracking-wide text-foreground/60">Descrição IA</p>
                          <p className="mt-1 text-sm leading-relaxed">{metadata.description}</p>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </CollapsibleSection>
              ) : aiMetadataQ.isLoading ? (
                <Skeleton className="h-24 w-full rounded-lg" />
              ) : null}

              {/* History */}
              {historyRows.length > 0 ? (
                <CollapsibleSection
                  label="Histórico"
                  open={sections.history}
                  onToggle={() => toggleSection("history")}
                >
                  <div className="space-y-2">
                    {historyRows.map((row) => (
                      <div key={row.id} className="rounded-lg border border-border/60 bg-surface/40 p-3 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <Badge variant={row.status === "completed" ? "default" : "destructive"} className="text-[10px]">
                            {row.status}
                          </Badge>
                          <span className="text-muted-foreground">
                            {new Date(row.created_at).toLocaleString("pt-BR")}
                          </span>
                        </div>
                        {row.model ? <p className="mt-1 text-muted-foreground">Modelo: {row.model}</p> : null}
                        {row.duration_ms ? <p className="text-muted-foreground">Duração: {row.duration_ms} ms</p> : null}
                        {row.error_message ? (
                          <p className="mt-1 text-destructive">{row.error_message}</p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </CollapsibleSection>
              ) : null}

              {/* Share */}
              <CollapsibleSection
                label="Compartilhar"
                open={sections.share}
                onToggle={() => toggleSection("share")}
              >
                <div className="space-y-3">
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
                  {artwork.collection ? (
                    <Button variant="ghost" size="sm" asChild className="w-full justify-start">
                      <Link to="/collections/$slug" params={{ slug: artwork.collection.slug }}>
                        <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Ver na coleção
                      </Link>
                    </Button>
                  ) : null}
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
            </div>
          </div>
        </div>
      </section>
    </PublicShell>
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
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
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

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/40 bg-surface/30 px-2.5 py-2">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium capitalize">{value}</p>
    </div>
  );
}

function TagGroup({ label, items, variant }: { label: string; items: string[]; variant: "secondary" | "outline" }) {
  return (
    <div>
      <p className="mb-1.5 text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-1">
        {items.map((item) => (
          <Badge key={item} variant={variant} className="text-[10px]">{item}</Badge>
        ))}
      </div>
    </div>
  );
}
