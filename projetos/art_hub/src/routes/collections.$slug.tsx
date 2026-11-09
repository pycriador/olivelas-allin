import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Palette, Search, Grid3X3, LayoutPanelTop } from "lucide-react";
import { PublicShell } from "@/components/layout/public-shell";
import { StoredImage } from "@/components/common/stored-image";
import { EmptyState } from "@/components/common/empty-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { GridCard } from "@/components/gallery/grid-card";
import { GalleryLayout } from "@/components/gallery/gallery-layout";
import { collectionsRepo } from "@/lib/repositories/collections";
import { artworksRepo } from "@/lib/repositories/artworks";
import { aiMetadataRepo } from "@/lib/repositories/ai";
import { queryKeys } from "@/lib/query-keys";

export const Route = createFileRoute("/collections/$slug")({
  loader: async ({ params }) => {
    const collection = await collectionsRepo.getBySlug(params.slug);
    if (!collection || collection.status !== "active") throw notFound();
    return { collection };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.collection.name} – Olivelas` },
          {
            name: "description",
            content: loaderData.collection.description ?? `Artes da coleção ${loaderData.collection.name}.`,
          },
          { property: "og:title", content: `${loaderData.collection.name} – Olivelas` },
          {
            property: "og:description",
            content: loaderData.collection.description ?? `Artes da coleção ${loaderData.collection.name}.`,
          },
          { property: "og:type", content: "website" },
          { name: "twitter:card", content: "summary_large_image" },
        ]
      : [{ title: "Coleção não encontrada" }, { name: "robots", content: "noindex" }],
    links: loaderData
      ? [{ rel: "canonical", href: `https://olivelas.art.br/collections/${loaderData.collection.slug}` }]
      : undefined,
  }),
  notFoundComponent: () => (
    <PublicShell>
      <EmptyState
        className="mx-auto my-24 max-w-lg"
        icon={Palette}
        title="Coleção não encontrada"
        description="A coleção que você procura não está disponível."
      />
    </PublicShell>
  ),
  pendingComponent: () => (
    <PublicShell>
      <div className="mx-auto max-w-6xl px-4 py-14">
        <Skeleton className="mb-8 h-8 w-64" />
        <Skeleton className="mb-12 h-48 w-full rounded-2xl" />
        <Skeleton className="mb-6 h-6 w-32" />
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
      </div>
    </PublicShell>
  ),
  component: CollectionDetail,
});

function CollectionDetail() {
  const { collection } = Route.useLoaderData();
  const [q, setQ] = useState("");
  const [mode, setMode] = useState<"grid" | "showcase">("showcase");
  const [showcaseId, setShowcaseId] = useState<string | null>(null);
  const [showcaseAi, setShowcaseAi] = useState<unknown>(null);

  const { data: artworksData, isLoading: artworksLoading, isError: artworksError } = useQuery({
    queryKey: queryKeys.artworks.publicByCollection(collection.id, q),
    queryFn: () => artworksRepo.listByCollection(collection.id, q || undefined),
  });

  const aiMetadataQ = useQuery({
    queryKey: ["ai-metadata-showcase", showcaseId],
    queryFn: () => aiMetadataRepo.getByArtwork(showcaseId!),
    enabled: mode === "showcase" && !!showcaseId,
  });

  const artworks = artworksData ?? [];
  const hasArtworks = artworks.length > 0;

  useEffect(() => {
    if (mode === "showcase" && !showcaseId && artworks.length > 0) {
      setShowcaseId(artworks[0].id);
    }
  }, [artworks, mode, showcaseId]);

  const openShowcase = useCallback((id: string) => {
    setShowcaseId(id);
    setMode("showcase");
  }, []);

  const closeShowcase = useCallback(() => {
    setMode("grid");
    setShowcaseId(null);
  }, []);

  // When showcase mode, show the gallery layout
  if (mode === "showcase" && showcaseId) {
    const currentArtwork = artworks.find((a) => a.id === showcaseId) ?? artworks[0];
    return (
      <GalleryLayout
        artwork={currentArtwork}
        collectionArtworks={artworks}
        aiMetadata={aiMetadataQ.data}
        onClose={closeShowcase}
      />
    );
  }

  return (
    <PublicShell>
      <div className="relative aspect-[16/6] w-full overflow-hidden border-b border-border/60 bg-surface-muted">
        {collection.banner_image || collection.cover_image ? (
          <StoredImage stored={collection.banner_image ?? collection.cover_image} alt={collection.name} />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-6xl px-4 pb-8">
          <Link to="/collections" className="mb-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3 w-3" /> Todas as coleções
          </Link>
          <h1 className="font-display text-4xl md:text-5xl">{collection.name}</h1>
          {collection.description ? (
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{collection.description}</p>
          ) : null}
        </div>
      </div>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h2 className="font-display text-2xl">Artes</h2>
          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar arte ou código…" className="pl-9" />
            </div>
            <div className="flex rounded-lg border border-border bg-surface p-0.5">
              <Button
                variant={mode === "grid" ? "default" : "ghost"}
                size="sm"
                className="h-8 gap-1.5 px-3"
                onClick={() => setMode("grid")}
              >
                <Grid3X3 className="h-3.5 w-3.5" /> Grid
              </Button>
              <Button
                variant={mode === "showcase" ? "default" : "ghost"}
                size="sm"
                className="h-8 gap-1.5 px-3"
                onClick={() => {
                  if (artworks.length > 0) openShowcase(artworks[0].id);
                }}
                disabled={!hasArtworks}
              >
                <LayoutPanelTop className="h-3.5 w-3.5" /> Galeria
              </Button>
            </div>
          </div>
        </div>

        {artworksError ? (
          <EmptyState icon={Palette} title="Erro ao carregar" description="Não foi possível carregar as artes. Tente novamente." />
        ) : artworksLoading ? (
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-xl" />
            ))}
          </div>
        ) : !hasArtworks ? (
          <EmptyState icon={Palette} title="Nenhuma arte encontrada" />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
            >
              {artworks.map((a) => (
                <GridCard key={a.id} item={a} onShowcase={openShowcase} />
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </section>
    </PublicShell>
  );
}
