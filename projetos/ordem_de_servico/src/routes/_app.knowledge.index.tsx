import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, FileText, AlertTriangle, Tags, Brain, Clock, Eye, TrendingUp, BarChart3, Library, Upload, Search, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { knowledgeService } from "@/modules/knowledge/service";

export const Route = createFileRoute("/_app/knowledge/")({
  head: () => ({ meta: [{ title: "Dashboard — Knowledge — ServiceForge" }] }),
  component: KnowledgeDashboard,
});

const typeLabels: Record<string, string> = {
  procedure: "Procedimentos", manual: "Manuais", diagram: "Diagramas",
  firmware: "Firmware", driver: "Drivers", tutorial: "Tutoriais",
  solution: "Soluções", defect: "Defeitos", error_code: "Códigos Erro",
  faq: "FAQ", bulletin: "Boletins", alert: "Alertas",
};

const typeIcons: Record<string, any> = {
  procedure: FileText, manual: BookOpen, diagram: BarChart3,
  firmware: Brain, driver: Settings, tutorial: BookOpen,
  solution: TrendingUp, defect: AlertTriangle, error_code: AlertTriangle,
  faq: BookOpen, bulletin: FileText, alert: AlertTriangle,
};

function KnowledgeDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["knowledge-stats"],
    queryFn: () => knowledgeService.getDashboardStats(),
  });

  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700", review: "bg-yellow-100 text-yellow-700",
    approved: "bg-green-100 text-green-700", published: "bg-blue-100 text-blue-700",
    obsolete: "bg-orange-100 text-orange-700", archived: "bg-red-100 text-red-700",
  };

  if (isLoading) return <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">Carregando...</div>;
  if (!stats) return <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">Nenhum dado disponível</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/knowledge/library"><Button size="sm" variant="outline"><Library className="mr-2 h-4 w-4" />Biblioteca</Button></Link>
        <Link to="/knowledge/search"><Button size="sm" variant="outline"><Search className="mr-2 h-4 w-4" />Pesquisar</Button></Link>
        <Link to="/knowledge/import"><Button size="sm" variant="outline"><Upload className="mr-2 h-4 w-4" />Importar</Button></Link>
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Total de Documentos</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{stats.totalArticles}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Categorias</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{stats.totalCategories}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Marcas</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{stats.totalBrands}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Modelos</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{stats.totalModels}</p></CardContent></Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Por Tipo</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(typeLabels).map(([type, label]) => {
                const count = (stats.byType as any)[type] ?? 0;
                if (count === 0) return null;
                return (
                  <div key={type} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-primary" />
                      {label}
                    </span>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Por Status</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(stats.byStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Badge className={statusColors[status] ?? ""} variant="outline">{status}</Badge>
                  </span>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Documentos Mais Acessados</CardTitle></CardHeader>
          <CardContent>
            {stats.mostViewed.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum dado disponível</p> : (
              <div className="space-y-2">
                {stats.mostViewed.slice(0, 5).map((article) => (
                  <Link key={article.id} to="/knowledge/$id" params={{ id: article.id }} className="flex items-center justify-between text-sm hover:bg-muted/50 rounded p-1">
                    <span className="flex items-center gap-2"><FileText className="h-3 w-3 text-muted-foreground" />{article.title.substring(0, 50)}</span>
                    <Badge variant="secondary">{article.analytics?.views ?? 0} visualizações</Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Documentos Mais Utilizados</CardTitle></CardHeader>
          <CardContent>
            {stats.mostUsed.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum dado disponível</p> : (
              <div className="space-y-2">
                {stats.mostUsed.slice(0, 5).map((article) => (
                  <Link key={article.id} to="/knowledge/$id" params={{ id: article.id }} className="flex items-center justify-between text-sm hover:bg-muted/50 rounded p-1">
                    <span className="flex items-center gap-2"><TrendingUp className="h-3 w-3 text-muted-foreground" />{article.title.substring(0, 50)}</span>
                    <Badge variant="secondary">{article.analytics?.timesUsed ?? 0} usos</Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm font-medium">Resumo</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><span className="text-muted-foreground">Conteúdo publicado:</span> <Badge variant="secondary">{stats.byStatus.published ?? 0}</Badge></div>
            <div><span className="text-muted-foreground">Em revisão:</span> <Badge variant="secondary">{stats.pendingReview}</Badge></div>
            <div><span className="text-muted-foreground">Arquivado:</span> <Badge variant="secondary">{stats.archived}</Badge></div>
            <div><span className="text-muted-foreground">Gerado por IA:</span> <Badge variant="secondary">{stats.aiGenerated}</Badge></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
