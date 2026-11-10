import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Heart, Star, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { listThemes, listMyThemeFavoriteIds, toggleThemeFavorite, type SortKey } from "@/modules/marketplace/api";

export const Route = createFileRoute("/_authenticated/app/marketplace/themes")({
  component: BrowseThemes,
});

function BrowseThemes() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("popular");
  const [featured, setFeatured] = useState(false);

  const themesQ = useQuery({
    queryKey: ["market","themes", { q, sort, featured }],
    queryFn: () => listThemes({ q, sort, featured }),
  });
  const favsQ = useQuery({ queryKey: ["market","theme-favs"], queryFn: listMyThemeFavoriteIds });
  const favSet = favsQ.data ?? new Set<string>();

  async function onFav(id: string) {
    try {
      await toggleThemeFavorite(id, favSet.has(id));
      qc.invalidateQueries({ queryKey: ["market","theme-favs"] });
      qc.invalidateQueries({ queryKey: ["market","themes"] });
    } catch (e) { toast.error((e as Error).message); }
  }

  const items = themesQ.data ?? [];
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar temas..." className="pl-9" />
        </div>
        <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
          <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="popular">Populares</SelectItem>
            <SelectItem value="recent">Mais recentes</SelectItem>
            <SelectItem value="rating">Melhor avaliados</SelectItem>
            <SelectItem value="az">A–Z</SelectItem>
          </SelectContent>
        </Select>
        <Button variant={featured ? "default" : "outline"} size="sm" onClick={() => setFeatured((v) => !v)}>
          <Sparkles className="mr-2 h-4 w-4" /> Destaques
        </Button>
      </div>

      {themesQ.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-xl" />)}
        </div>
      ) : items.length === 0 ? (
        <Card className="p-10 text-center"><p className="font-medium">Nenhum tema encontrado</p></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((t) => {
            const c = t.tokens?.colors ?? {};
            return (
              <Card key={t.id} className="flex flex-col overflow-hidden transition-all hover:-translate-y-1 hover:shadow-card">
                <div
                  className="h-24 w-full"
                  style={{
                    background: `linear-gradient(135deg, ${c.primary ?? "#7C5CFF"} 0%, ${c.accent ?? "#F7A5A5"} 100%)`,
                  }}
                />
                <div className="flex flex-1 flex-col gap-3 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{t.tokens?.mode ?? "light"}</Badge>
                        {t.is_featured && <Badge className="bg-primary/15 text-primary" variant="secondary">Destaque</Badge>}
                      </div>
                      <Link to={"/app/marketplace/theme/$id" as "/app"} params={{ id: t.id } as never} className="mt-2 block">
                        <h3 className="font-display text-lg font-semibold hover:underline">{t.title}</h3>
                      </Link>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{t.description}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => onFav(t.id)} aria-label="Favoritar">
                      <Heart className={favSet.has(t.id) ? "h-5 w-5 fill-red-500 text-red-500" : "h-5 w-5"} />
                    </Button>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5" />{t.rating_avg.toFixed(1)} ({t.rating_count})</span>
                    <span className="inline-flex items-center gap-1"><Heart className="h-3.5 w-3.5" />{t.favorites_count}</span>
                  </div>
                  <Button asChild variant="outline" size="sm" className="mt-auto">
                    <Link to={"/app/marketplace/theme/$id" as "/app"} params={{ id: t.id } as never}>Ver detalhes</Link>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}