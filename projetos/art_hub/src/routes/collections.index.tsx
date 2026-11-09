import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { motion } from "framer-motion";
import { Palette, Search } from "lucide-react";
import { PublicShell } from "@/components/layout/public-shell";
import { StoredImage } from "@/components/common/stored-image";
import { EmptyState } from "@/components/common/empty-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { collectionsRepo } from "@/lib/repositories/collections";
import { artworksRepo } from "@/lib/repositories/artworks";
import { queryKeys } from "@/lib/query-keys";

export const Route = createFileRoute("/collections/")({
  head: () => ({
    meta: [
      { title: "Coleções – Olivelas" },
      { name: "description", content: "Todas as coleções de artes para canecas da Olivelas." },
      { property: "og:title", content: "Coleções – Olivelas" },
      { property: "og:description", content: "Todas as coleções de artes para canecas da Olivelas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://olivelas.art.br/collections" }],
  }),
  component: CollectionsPage,
});

function CollectionsPage() {
  const [q, setQ] = useState("");
  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.collections.publicList(),
    queryFn: () => collectionsRepo.listPublic(),
  });

  const filtered = (data ?? []).filter((c) => c.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <PublicShell>
      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-4xl">Coleções</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Explore todas as coleções e encontre a arte perfeita.
            </p>
          </div>
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar coleção…" className="pl-9" />
          </div>
        </div>

        {isError ? (
          <EmptyState icon={Palette} title="Erro ao carregar" description="Não foi possível carregar as coleções. Tente novamente mais tarde." />
        ) : isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[4/3] rounded-2xl" />
            ))}
          </div>
        ) : data && data.length === 0 ? (
          <EmptyState icon={Palette} title="Nenhuma coleção" description="Ainda não há coleções publicadas." />
        ) : filtered.length === 0 ? (
          <EmptyState icon={Palette} title="Nada encontrado" description="Tente outro termo de busca." />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((c) => (
              <CollectionCard key={c.id} id={c.id} slug={c.slug} name={c.name} cover={c.cover_image} />
            ))}
          </div>
        )}
      </section>
    </PublicShell>
  );
}

function CollectionCard({
  id,
  slug,
  name,
  cover,
}: {
  id: string;
  slug: string;
  name: string;
  cover: string | null;
}) {
  const count = useQuery({
    queryKey: queryKeys.collections.count(id),
    queryFn: () => artworksRepo.countByCollection(id),
  });
  return (
    <Link to="/collections/$slug" params={{ slug }} className="group block">
      <motion.div
        whileHover={{ y: -2 }}
        className="overflow-hidden rounded-2xl border border-border bg-surface shadow-elegant"
      >
        <div className="aspect-[4/3] overflow-hidden bg-surface-muted">
          <StoredImage
            stored={cover}
            alt={name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        </div>
        <div className="px-5 py-4">
          <h3 className="font-display text-xl">{name}</h3>
          <p className="text-xs text-muted-foreground">{count.data ?? 0} artes</p>
        </div>
      </motion.div>
    </Link>
  );
}
