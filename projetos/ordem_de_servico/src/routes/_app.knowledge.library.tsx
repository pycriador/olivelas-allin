import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Library, FileText, BookOpen, AlertTriangle, BarChart3, Brain, Settings, TrendingUp, Search, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { knowledgeService } from "@/modules/knowledge/service";
import type { KnowledgeContentType } from "@/modules/knowledge/types";

export const Route = createFileRoute("/_app/knowledge/library")({
  head: () => ({ meta: [{ title: "Biblioteca — Knowledge — ServiceForge" }] }),
  component: KnowledgeLibrary,
});

const typeLabels: Record<string, string> = {
  procedure: "Procedimentos", manual: "Manuais", diagram: "Diagramas",
  firmware: "Firmware", driver: "Drivers", tutorial: "Tutoriais",
  solution: "Soluções", defect: "Defeitos", error_code: "Códigos Erro",
  faq: "FAQ", bulletin: "Boletins", alert: "Alertas",
};

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700", review: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700", published: "bg-blue-100 text-blue-700",
  obsolete: "bg-orange-100 text-orange-700", archived: "bg-red-100 text-red-700",
};

function KnowledgeLibrary() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ["knowledge-articles"],
    queryFn: () => knowledgeService.list(),
  });

  const filtered = articles.filter((a) => {
    if (typeFilter !== "all" && a.type !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return a.title.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q) || (a.brand ?? "").toLowerCase().includes(q) || (a.model ?? "").toLowerCase().includes(q) || a.keywords.some((k) => k.toLowerCase().includes(q));
    }
    return true;
  });

  const types = Object.keys(typeLabels) as KnowledgeContentType[];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Pesquisar na biblioteca..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="all">Todos os tipos</option>
          {types.map((t) => <option key={t} value={t}>{typeLabels[t]}</option>)}
        </select>
        <Badge variant="secondary">{filtered.length} documentos</Badge>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-sm text-muted-foreground">Carregando...</div>
      ) : filtered.length === 0 ? (
        <Card><CardContent><p className="py-12 text-center text-sm text-muted-foreground">Nenhum documento encontrado</p></CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((article) => (
            <Link key={article.id} to="/knowledge/$id" params={{ id: article.id }}>
              <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant="outline" className="text-xs">{typeLabels[article.type] ?? article.type}</Badge>
                    <Badge className={statusColors[article.status] ?? ""} variant="outline">{article.status}</Badge>
                  </div>
                  <h3 className="font-medium text-sm line-clamp-2">{article.title}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">{article.summary}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {article.brand && <span>{article.brand}</span>}
                    {article.model && <span>· {article.model}</span>}
                    {article.version > 1 && <span>· v{article.version}</span>}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{article.analytics?.views ?? 0} visualizações</span>
                    <span>· {article.analytics?.timesUsed ?? 0} usos</span>
                    {article.analytics?.avgRating ? <span>· {article.analytics.avgRating.toFixed(1)} ★</span> : null}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
