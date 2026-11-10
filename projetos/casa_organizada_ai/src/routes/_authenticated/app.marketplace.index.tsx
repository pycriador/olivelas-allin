import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Heart, Download, Star, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  listTemplates,
  listMyTemplateFavoriteIds,
  toggleTemplateFavorite,
  useTemplateAsForm,
  type SortKey,
} from "@/modules/marketplace/api";
import { RatingStars } from "@/modules/marketplace/components/RatingStars";

export const Route = createFileRoute("/_authenticated/app/marketplace/")({
  component: BrowseTemplates,
});

const CATEGORIES = [
  "all","casa","pets","criancas","saude","academia","estudos","escola","projetos","empresa","compras","financas","viagens","eventos","hobbies","geral",
];

function BrowseTemplates() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<SortKey>("popular");
  const [featured, setFeatured] = useState(false);

  const templatesQ = useQuery({
    queryKey: ["market","templates", { q, category, sort, featured }],
    queryFn: () => listTemplates({ q, category, sort, featured }),
  });
  const favsQ = useQuery({ queryKey: ["market","tpl-favs"], queryFn: listMyTemplateFavoriteIds });

  const favSet = favsQ.data ?? new Set<string>();

  async function onFavorite(id: string) {
    try {
      await toggleTemplateFavorite(id, favSet.has(id));
      qc.invalidateQueries({ queryKey: ["market","tpl-favs"] });
      qc.invalidateQueries({ queryKey: ["market","templates"] });
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function onUse(id: string) {
    const t = (templatesQ.data ?? []).find((x) => x.id === id);
    if (!t) return;
    try {
      const formId = await useTemplateAsForm(t);
      toast.success("Template adicionado aos seus formulários.");
      navigate({ to: "/app/forms/$id/edit" as "/app", params: { id: formId } as never });
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  const items = useMemo(() => templatesQ.data ?? [], [templatesQ.data]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar templates..." className="pl-9" />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c === "all" ? "Todas categorias" : c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
          <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="popular">Populares</SelectItem>
            <SelectItem value="recent">Mais recentes</SelectItem>
            <SelectItem value="rating">Melhor avaliados</SelectItem>
            <SelectItem value="downloads">Mais baixados</SelectItem>
            <SelectItem value="az">A–Z</SelectItem>
          </SelectContent>
        </Select>
        <Button variant={featured ? "default" : "outline"} size="sm" onClick={() => setFeatured((v) => !v)}>
          <Sparkles className="mr-2 h-4 w-4" /> Destaques
        </Button>
      </div>

      {templatesQ.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-xl" />)}
        </div>
      ) : items.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="font-medium">Nada por aqui ainda</p>
          <p className="text-sm text-muted-foreground">Ajuste os filtros ou volte em breve.</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((t) => (
            <Card key={t.id} className="flex flex-col gap-3 p-5 transition-all hover:-translate-y-1 hover:shadow-card">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{t.category}</Badge>
                    {t.is_featured && <Badge className="bg-primary/15 text-primary" variant="secondary"><Sparkles className="mr-1 h-3 w-3" />Destaque</Badge>}
                  </div>
                  <Link to={"/app/marketplace/template/$id" as "/app"} params={{ id: t.id } as never} className="mt-2 block">
                    <h3 className="font-display text-lg font-semibold hover:underline">{t.title}</h3>
                  </Link>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{t.description}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onFavorite(t.id)}
                  aria-label="Favoritar"
                >
                  <Heart className={favSet.has(t.id) ? "h-5 w-5 fill-red-500 text-red-500" : "h-5 w-5"} />
                </Button>
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5" />{t.rating_avg.toFixed(1)} ({t.rating_count})</span>
                <span className="inline-flex items-center gap-1"><Download className="h-3.5 w-3.5" />{t.downloads_count}</span>
                <span className="inline-flex items-center gap-1"><Heart className="h-3.5 w-3.5" />{t.favorites_count}</span>
              </div>

              <div className="mt-auto flex gap-2 border-t border-border pt-3">
                <Button asChild variant="outline" size="sm" className="flex-1">
                  <Link to={"/app/marketplace/template/$id" as "/app"} params={{ id: t.id } as never}>Ver detalhes</Link>
                </Button>
                <Button size="sm" className="flex-1" onClick={() => onUse(t.id)}>
                  <Download className="mr-2 h-4 w-4" /> Usar
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}