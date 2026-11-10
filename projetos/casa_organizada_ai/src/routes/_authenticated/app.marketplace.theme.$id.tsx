import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Heart, Star } from "lucide-react";
import { toast } from "sonner";
import {
  getTheme,
  listThemeRatings,
  listMyThemeFavoriteIds,
  toggleThemeFavorite,
  upsertThemeRating,
} from "@/modules/marketplace/api";
import { RatingStars } from "@/modules/marketplace/components/RatingStars";

export const Route = createFileRoute("/_authenticated/app/marketplace/theme/$id")({
  component: ThemeDetail,
});

function ThemeDetail() {
  const { id } = useParams({ from: "/_authenticated/app/marketplace/theme/$id" });
  const qc = useQueryClient();
  const themeQ = useQuery({ queryKey: ["market","theme",id], queryFn: () => getTheme(id) });
  const ratingsQ = useQuery({ queryKey: ["market","theme",id,"ratings"], queryFn: () => listThemeRatings(id) });
  const favsQ = useQuery({ queryKey: ["market","theme-favs"], queryFn: listMyThemeFavoriteIds });
  const favSet = favsQ.data ?? new Set<string>();
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState("");

  if (themeQ.isLoading) return <Skeleton className="h-40 w-full" />;
  const th = themeQ.data;
  if (!th) return <Card className="p-10 text-center">Tema não encontrado.</Card>;
  const t = th;
  const isFav = favSet.has(t.id);
  const c = t.tokens?.colors ?? {};

  async function onFav() {
    try {
      await toggleThemeFavorite(t.id, isFav);
      qc.invalidateQueries({ queryKey: ["market","theme-favs"] });
      qc.invalidateQueries({ queryKey: ["market","theme",id] });
    } catch (e) { toast.error((e as Error).message); }
  }
  async function onRate() {
    if (!myRating) return toast.error("Escolha de 1 a 5 estrelas.");
    try {
      await upsertThemeRating(t.id, myRating, myComment.trim() || undefined);
      toast.success("Avaliação enviada!");
      setMyComment("");
      qc.invalidateQueries({ queryKey: ["market","theme",id,"ratings"] });
      qc.invalidateQueries({ queryKey: ["market","theme",id] });
    } catch (e) { toast.error((e as Error).message); }
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link to={"/app/marketplace/themes" as "/app"}><ArrowLeft className="mr-2 h-4 w-4" />Voltar</Link>
      </Button>

      <Card className="overflow-hidden">
        <div
          className="h-40 w-full"
          style={{ background: `linear-gradient(135deg, ${c.primary ?? "#7C5CFF"} 0%, ${c.accent ?? "#F7A5A5"} 100%)` }}
        />
        <div className="space-y-3 p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{t.tokens?.mode ?? "light"}</Badge>
            <Badge variant="outline">v{t.version}</Badge>
            <Badge variant="outline">{t.language}</Badge>
          </div>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-semibold">{t.title}</h1>
              <p className="mt-1 text-muted-foreground">{t.description}</p>
            </div>
            <Button variant="outline" onClick={onFav}>
              <Heart className={isFav ? "mr-2 h-4 w-4 fill-red-500 text-red-500" : "mr-2 h-4 w-4"} />
              {isFav ? "Favoritado" : "Favoritar"}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            {Object.entries(c).map(([k, v]) => (
              <div key={k} className="inline-flex items-center gap-2 rounded-md border border-border px-2 py-1 text-xs">
                <span className="h-4 w-4 rounded" style={{ background: v as string }} />
                <span className="font-mono">{k}: {v as string}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 pt-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Star className="h-4 w-4" />{t.rating_avg.toFixed(1)} ({t.rating_count})</span>
            <span className="inline-flex items-center gap-1"><Heart className="h-4 w-4" />{t.favorites_count}</span>
          </div>
        </div>
      </Card>

      <Card className="space-y-4 p-6">
        <h2 className="font-display text-xl font-semibold">Avaliar este tema</h2>
        <div className="flex items-center gap-3">
          <RatingStars value={myRating} size={22} interactive onChange={setMyRating} />
          <span className="text-sm text-muted-foreground">{myRating || "—"} / 5</span>
        </div>
        <Textarea placeholder="Comentário (opcional)" value={myComment} onChange={(e) => setMyComment(e.target.value)} rows={3} />
        <Button onClick={onRate}>Enviar avaliação</Button>
      </Card>

      <Card className="space-y-4 p-6">
        <h2 className="font-display text-xl font-semibold">Avaliações recentes</h2>
        {ratingsQ.isLoading ? (
          <Skeleton className="h-20 w-full" />
        ) : (ratingsQ.data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem avaliações ainda.</p>
        ) : (
          <ul className="space-y-4">
            {ratingsQ.data!.map((r) => (
              <li key={r.id} className="border-b border-border pb-3 last:border-b-0">
                <div className="flex items-center justify-between">
                  <RatingStars value={r.rating} />
                  <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("pt-BR")}</span>
                </div>
                {r.comment && <p className="mt-2 text-sm">{r.comment}</p>}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}