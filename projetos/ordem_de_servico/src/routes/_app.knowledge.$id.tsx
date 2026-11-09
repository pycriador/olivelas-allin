import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, FileText, Edit, Eye, ThumbsUp, Star, Clock, Tag, User, Calendar, BookOpen, Download, MessageCircle, History, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { knowledgeService } from "@/modules/knowledge/service";

export const Route = createFileRoute("/_app/knowledge/$id")({
  head: () => ({ meta: [{ title: "Artigo — Knowledge — ServiceForge" }] }),
  component: KnowledgeArticleDetail,
});

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700", review: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700", published: "bg-blue-100 text-blue-700",
  obsolete: "bg-orange-100 text-orange-700", archived: "bg-red-100 text-red-700",
};

const typeLabels: Record<string, string> = {
  procedure: "Procedimento", manual: "Manual", diagram: "Diagrama",
  firmware: "Firmware", driver: "Driver", tutorial: "Tutorial",
  solution: "Solução", defect: "Defeito", error_code: "Código de Erro",
  faq: "FAQ", bulletin: "Boletim", alert: "Alerta",
};

function KnowledgeArticleDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [commentText, setCommentText] = useState("");
  const [rating, setRating] = useState(0);

  const { data: article, isLoading } = useQuery({
    queryKey: ["knowledge-article", id],
    queryFn: async () => {
      const a = await knowledgeService.get(id);
      if (a) await knowledgeService.recordView(id);
      return a;
    },
  });

  const addComment = useMutation({
    mutationFn: () => knowledgeService.addComment(id, { author: "Admin", authorId: "admin", text: commentText }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["knowledge-article", id] }); setCommentText(""); toast("Comentário adicionado"); },
  });

  const rateArticle = useMutation({
    mutationFn: () => knowledgeService.rate(id, rating),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["knowledge-article", id] }); toast("Avaliação registrada"); },
  });

  const recordUse = useMutation({
    mutationFn: () => knowledgeService.recordUse(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["knowledge-article", id] }),
  });

  const changeStatus = useMutation({
    mutationFn: ({ status }: { status: string }) => knowledgeService.update(id, { status: status as any }, undefined, "Admin"),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["knowledge-article", id] }); toast("Status atualizado"); },
  });

  if (isLoading) return <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">Carregando...</div>;
  if (!article) return <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">Artigo não encontrado</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/knowledge"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{typeLabels[article.type] ?? article.type}</Badge>
            <Badge className={statusColors[article.status] ?? ""} variant="outline">{article.status}</Badge>
            {article.version > 1 && <Badge variant="secondary">v{article.version}</Badge>}
            {article.analytics?.avgRating ? <Badge variant="secondary">{article.analytics.avgRating.toFixed(1)} ★</Badge> : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/knowledge/$id/editor" params={{ id }}>
            <Button size="sm" variant="outline"><Edit className="mr-2 h-4 w-4" />Editar</Button>
          </Link>
          {article.status !== "published" ? (
            <Button size="sm" onClick={() => changeStatus.mutate({ status: "published" })}>Publicar</Button>
          ) : (
            <Button size="sm" variant="outline" onClick={() => changeStatus.mutate({ status: "archived" })}>Arquivar</Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => recordUse.mutate()}>
            <ThumbsUp className="mr-2 h-4 w-4" />Útil
          </Button>
        </div>
      </div>

      <div>
        <h1 className="text-xl font-semibold">{article.title}</h1>
        {article.summary && <p className="text-sm text-muted-foreground mt-1">{article.summary}</p>}
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        {article.brand && <span className="flex items-center gap-1"><Tag className="h-3 w-3" />{article.brand}</span>}
        {article.model && <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />{article.model}</span>}
        <span className="flex items-center gap-1"><User className="h-3 w-3" />{article.author}</span>
        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(article.createdAt).toLocaleDateString("pt-BR")}</span>
        <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{article.analytics?.views ?? 0} visualizações</span>
        <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" />{article.analytics?.timesUsed ?? 0} usos</span>
        {article.estimatedTime && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />~{article.estimatedTime}min</span>}
      </div>

      {article.keywords.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {article.keywords.map((kw, i) => <Badge key={i} variant="secondary" className="text-xs">{kw}</Badge>)}
        </div>
      )}

      <Separator />

      <div className="whitespace-pre-wrap text-sm leading-relaxed">{article.content}</div>

      {article.parts && article.parts.length > 0 && (
        <Card><CardHeader><CardTitle className="text-sm font-medium">Peças Utilizadas</CardTitle></CardHeader><CardContent>
          <div className="flex flex-wrap gap-2">{article.parts.map((p, i) => <Badge key={i} variant="secondary">{p}</Badge>)}</div>
        </CardContent></Card>
      )}

      {article.tools && article.tools.length > 0 && (
        <Card><CardHeader><CardTitle className="text-sm font-medium">Ferramentas Necessárias</CardTitle></CardHeader><CardContent>
          <div className="flex flex-wrap gap-2">{article.tools.map((t, i) => <Badge key={i} variant="outline">{t}</Badge>)}</div>
        </CardContent></Card>
      )}

      <Card><CardHeader><CardTitle className="text-sm font-medium">Avalie este documento</CardTitle></CardHeader><CardContent>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button key={star} onClick={() => { setRating(star); rateArticle.mutate(); }}
              className={`h-8 w-8 flex items-center justify-center rounded hover:bg-accent ${star <= (rating || Math.round(article.analytics?.avgRating ?? 0)) ? "text-yellow-500" : "text-muted-foreground"}`}>
              <Star className="h-5 w-5 fill-current" />
            </button>
          ))}
        </div>
      </CardContent></Card>

      <Card><CardHeader><CardTitle className="text-sm font-medium">Comentários ({article.comments?.length ?? 0})</CardTitle></CardHeader><CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Adicionar comentário..." />
          <Button size="sm" onClick={() => addComment.mutate()} disabled={!commentText.trim()}>Enviar</Button>
        </div>
        {(article.comments ?? []).length > 0 ? (
          <div className="space-y-3">
            {(article.comments ?? []).map((c) => (
              <div key={c.id} className="text-sm">
                <span className="font-medium">{c.author}</span>
                <span className="text-muted-foreground ml-2">{new Date(c.createdAt).toLocaleString("pt-BR")}</span>
                <p className="mt-1">{c.text}</p>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-muted-foreground">Nenhum comentário ainda</p>}
      </CardContent></Card>

      {(article.versions ?? []).length > 1 && (
        <Card><CardHeader><CardTitle className="text-sm font-medium">Histórico de Versões</CardTitle></CardHeader><CardContent>
          <div className="space-y-2 text-sm">
            {(article.versions ?? []).sort((a, b) => b.version - a.version).map((v) => (
              <div key={v.id} className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <History className="h-3 w-3 text-muted-foreground" />v{v.version}
                  <span className="text-muted-foreground">por {v.author}</span>
                </span>
                <span className="text-xs text-muted-foreground">{new Date(v.createdAt).toLocaleDateString("pt-BR")}</span>
              </div>
            ))}
          </div>
        </CardContent></Card>
      )}
    </div>
  );
}
