import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight, Coffee, Palette } from "lucide-react";
import { PublicShell } from "@/components/layout/public-shell";
import { StoredImage } from "@/components/common/stored-image";
import { EmptyState } from "@/components/common/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { collectionsRepo } from "@/lib/repositories/collections";
import { artworksRepo } from "@/lib/repositories/artworks";
import { queryKeys } from "@/lib/query-keys";
import { useSettings } from "@/hooks/use-settings";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Olivelas – Coleções de Artes para Canecas" },
      {
        name: "description",
        content: "Descubra coleções únicas de artes para canecas e solicite sua favorita pelo WhatsApp.",
      },
      { property: "og:title", content: "Olivelas – Coleções de Artes para Canecas" },
      { property: "og:description", content: "Descubra coleções únicas de artes para canecas e solicite sua favorita pelo WhatsApp." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://olivelas.art.br" }],
  }),
  component: Home,
});

function Home() {
  const { data: settings } = useSettings();
  const { data: collectionsData, isLoading: collectionsLoading, isError: collectionsError } = useQuery({
    queryKey: queryKeys.collections.publicList(),
    queryFn: () => collectionsRepo.listPublic(),
  });

  const featuredCollection = settings?.home_collection_id
    ? collectionsData?.find((c) => c.id === settings.home_collection_id)
    : undefined;

  return (
    <PublicShell>
      <section className="relative overflow-hidden border-b border-border/60">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,var(--color-accent)/8%,transparent_60%)]" />
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 md:grid-cols-[1.1fr_1fr] md:py-28">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col justify-center"
          >
            <h1 className="mt-5 font-display text-5xl leading-[1.05] text-foreground md:text-6xl">
              {settings?.home_title ?? "Canecas - Olivelas"} —<br />
              <span className="text-muted-foreground">{settings?.home_tagline ?? "arte que veste sua caneca."}</span>
            </h1>
            <p className="mt-6 max-w-lg text-base text-muted-foreground">
              {settings?.home_subtitle ??
                "Um catálogo curado de ilustrações e estampas. Escolha a arte perfeita, envie o código pelo WhatsApp e a gente cuida do resto."}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/collections">
                  Explorar coleções <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="relative hidden overflow-hidden rounded-3xl border border-border bg-surface-muted md:block"
          >
            {featuredCollection?.cover_image ? (
              <StoredImage
                stored={featuredCollection.cover_image}
                alt={featuredCollection.name}
                className="h-auto w-full object-contain"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <Coffee className="h-16 w-16 opacity-30" />
              </div>
            )}
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="font-display text-3xl">Coleções</h2>
            <p className="mt-1 text-sm text-muted-foreground">Escolha uma coleção para ver todas as artes.</p>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/collections">
              Ver todas <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
        {collectionsError ? (
          <EmptyState icon={Palette} title="Erro ao carregar" description="Não foi possível carregar as coleções. Tente novamente mais tarde." />
        ) : (
          <CollectionsGrid loading={collectionsLoading} rows={collectionsData ?? []} />
        )}
      </section>
    </PublicShell>
  );
}

interface Coll {
  id: string;
  slug: string;
  name: string;
  cover_image: string | null;
}

function CollectionsGrid({ loading, rows }: { loading: boolean; rows: Coll[] }) {
  if (loading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[4/3] rounded-2xl" />
        ))}
      </div>
    );
  }
  if (rows.length === 0) {
    return <EmptyState icon={Palette} title="Nenhuma coleção publicada ainda" />;
  }
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((c) => (
        <CollectionCard key={c.id} c={c} />
      ))}
    </div>
  );
}

function CollectionCard({ c }: { c: Coll }) {
  const count = useQuery({
    queryKey: queryKeys.collections.count(c.id),
    queryFn: () => artworksRepo.countByCollection(c.id),
  });
  return (
    <Link to="/collections/$slug" params={{ slug: c.slug }} className="group block">
      <motion.div
        whileHover={{ y: -2 }}
        className="overflow-hidden rounded-2xl border border-border bg-surface shadow-elegant transition"
      >
        <div className="aspect-[4/3] overflow-hidden bg-surface-muted">
          <StoredImage
            stored={c.cover_image}
            alt={c.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        </div>
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <h3 className="font-display text-xl leading-tight">{c.name}</h3>
            <p className="text-xs text-muted-foreground">{count.data ?? 0} artes</p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
        </div>
      </motion.div>
    </Link>
  );
}
