import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Download, Heart, Star } from "lucide-react";
import { toast } from "sonner";
import {
  getTemplate,
  listTemplateRatings,
  listMyTemplateFavoriteIds,
  toggleTemplateFavorite,
  upsertTemplateRating,
  useTemplateAsForm,
} from "@/modules/marketplace/api";
import { RatingStars } from "@/modules/marketplace/components/RatingStars";

export const Route = createFileRoute("/_authenticated/app/marketplace/template/$id")({
  component: TemplateDetail,
});

function TemplateDetail() {
  const { id } = useParams({ from: "/_authenticated/app/marketplace/template/$id" });
  const qc = useQueryClient();
  const navigate = useNavigate();
  const tplQ = useQuery({ queryKey: ["market","template",id], queryFn: () => getTemplate(id) });
  const ratingsQ = useQuery({ queryKey: ["market","template",id,"ratings"], queryFn: () => listTemplateRatings(id) });
  const favsQ = useQuery({ queryKey: ["market","tpl-favs"], queryFn: listMyTemplateFavoriteIds });
  const favSet = favsQ.data ?? new Set<string>();

  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState("");

  if (tplQ.isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-40 w-full" /></div>;
  const tpl = tplQ.data;
  if (!tpl) return <Card className="p-10 text-center">Template não encontrado.</Card>;
  const t = tpl;

  const isFav = favSet.has(t.id);

  async function onFav() {
    try {
      await toggleTemplateFavorite(t.id, isFav);
      qc.invalidateQueries({ queryKey: ["market","tpl-favs"] });
      qc.invalidateQueries({ queryKey: ["market","template",id] });
    } catch (e) { toast.error((e as Error).message); }
  }
  async function onUse() {
    try {
      const formId = await useTemplateAsForm(t);
      toast.success("Adicionado aos seus formulários.");
      navigate({ to: "/app/forms/$id/edit" as "/app", params: { id: formId } as never });
    } catch (e) { toast.error((e as Error).message); }
  }
  async function onRate() {
    if (!myRating) return toast.error("Escolha de 1 a 5 estrelas.");
    try {
      await upsertTemplateRating(t.id, myRating, myComment.trim() || undefined);
      toast.success("Avaliação enviada, obrigado!");
      setMyComment("");
      qc.invalidateQueries({ queryKey: ["market","template",id,"ratings"] });
      qc.invalidateQueries({ queryKey: ["market","template",id] });
    } catch (e) { toast.error((e as Error).message); }
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link to={"/app/marketplace" as "/app"}><ArrowLeft className="mr-2 h-4 w-4" />Voltar</Link>
      </Button>

      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{t.category}</Badge>
              <Badge variant="outline">v{t.version}</Badge>
              <Badge variant="outline">{t.language}</Badge>
              {t.is_featured && <Badge className="bg-primary/15 text-primary" variant="secondary">Destaque</Badge>}
            </div>
            <h1 className="font-display text-3xl font-semibold">{t.title}</h1>
            <p className="text-muted-foreground">{t.description}</p>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1"><Star className="h-4 w-4" />{t.rating_avg.toFixed(1)} ({t.rating_count} avaliações)</span>
              <span className="inline-flex items-center gap-1"><Download className="h-4 w-4" />{t.downloads_count} usos</span>
              <span className="inline-flex items-center gap-1"><Heart className="h-4 w-4" />{t.favorites_count} favoritos</span>
            </div>
            {t.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-2">
                {t.tags.map((tag) => <Badge key={tag} variant="outline" className="text-xs">#{tag}</Badge>)}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onFav}>
              <Heart className={isFav ? "mr-2 h-4 w-4 fill-red-500 text-red-500" : "mr-2 h-4 w-4"} />
              {isFav ? "Favoritado" : "Favoritar"}
            </Button>
            <Button onClick={onUse}><Download className="mr-2 h-4 w-4" />Usar template</Button>
          </div>
        </div>
      </Card>

      <Card className="space-y-4 p-6">
        <h2 className="font-display text-xl font-semibold">Avaliar este template</h2>
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
          <p className="text-sm text-muted-foreground">Ainda não há avaliações. Seja o primeiro!</p>
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