import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, TrendingUp, Eye, Clock, ThumbsUp, BookOpen, Users, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { knowledgeService } from "@/modules/knowledge/service";

export const Route = createFileRoute("/_app/knowledge/analytics")({
  head: () => ({ meta: [{ title: "Analytics — Knowledge — ServiceForge" }] }),
  component: KnowledgeAnalytics,
});

function KnowledgeAnalytics() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["knowledge-stats"],
    queryFn: () => knowledgeService.getDashboardStats(),
  });

  const { data: allArticles = [] } = useQuery({
    queryKey: ["knowledge-articles"],
    queryFn: () => knowledgeService.list(),
  });

  if (isLoading) return <div className="text-center py-8 text-sm text-muted-foreground">Carregando...</div>;

  const totalViews = allArticles.reduce((s, a) => s + (a.analytics?.views ?? 0), 0);
  const totalUses = allArticles.reduce((s, a) => s + (a.analytics?.timesUsed ?? 0), 0);
  const totalDownloads = allArticles.reduce((s, a) => s + (a.analytics?.downloads ?? 0), 0);
  const ratedArticles = allArticles.filter((a) => (a.analytics?.ratings ?? []).length > 0);
  const avgRating = ratedArticles.length > 0
    ? ratedArticles.reduce((s, a) => s + (a.analytics?.avgRating ?? 0), 0) / ratedArticles.length
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Analytics</h2>
        <p className="text-sm text-muted-foreground">Métricas de utilização da base de conhecimento</p>
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Total de Visualizações</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{totalViews}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Total de Usos</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{totalUses}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Downloads</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{totalDownloads}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Avaliação Média</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{avgRating.toFixed(1)} <span className="text-sm text-muted-foreground">★</span></p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm font-medium">Documentos Mais Visualizados</CardTitle></CardHeader>
        <CardContent>
          {stats?.mostViewed.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum dado disponível</p> : (
            <div className="space-y-3">
              {stats?.mostViewed.slice(0, 10).map((article, i) => (
                <div key={article.id} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="text-muted-foreground w-5">{i + 1}.</span>
                    {article.title.substring(0, 60)}
                  </span>
                  <Badge variant="secondary">{article.analytics?.views ?? 0} visualizações</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm font-medium">Documentos sem Utilização</CardTitle></CardHeader>
        <CardContent>
          {(() => {
            const unused = allArticles.filter((a) => (a.analytics?.views ?? 0) === 0);
            return unused.length === 0
              ? <p className="text-sm text-muted-foreground">Todos os documentos já foram consultados</p>
              : <p className="text-sm">{unused.length} documentos nunca foram visualizados</p>;
          })()}
        </CardContent>
      </Card>
    </div>
  );
}
