import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Brain, FileText, Lightbulb, AlertTriangle, BookOpen, Wrench, Search, Star, ThumbsUp, Eye, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { knowledgeService } from "@/modules/knowledge/service";
import { serviceOrderService } from "@/modules/service-orders/service";

export const Route = createFileRoute("/_app/service-orders/$id/knowledge")({
  head: () => ({ meta: [{ title: "Conhecimento Técnico — ServiceForge" }] }),
  component: SOKnowledgeTab,
});

const typeLabels: Record<string, string> = {
  procedure: "Procedimento", manual: "Manual", diagram: "Diagrama",
  solution: "Solução", defect: "Defeito", error_code: "Código Erro",
  faq: "FAQ", bulletin: "Boletim", alert: "Alerta",
};

const typeIcons: Record<string, any> = {
  procedure: Wrench, manual: BookOpen, diagram: FileText,
  solution: Lightbulb, defect: AlertTriangle, error_code: AlertTriangle,
  faq: BookOpen, bulletin: FileText, alert: AlertTriangle,
};

function SOKnowledgeTab() {
  const { id } = Route.useParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"recommended" | "search">("recommended");

  const { data: so } = useQuery({
    queryKey: ["service-order", id],
    queryFn: () => serviceOrderService.get(id),
  });

  const { data: recommended = [], isLoading: loadingRec } = useQuery({
    queryKey: ["so-knowledge-rec", id, so?.brand, so?.model, so?.defectName],
    queryFn: () => knowledgeService.findRelatedBySO(id, so?.deviceInfo, so?.deviceInfo, so?.defectName),
    enabled: !!so,
  });

  const { data: searchResults = [], isLoading: loadingSearch } = useQuery({
    queryKey: ["so-knowledge-search", id, searchQuery],
    queryFn: () => knowledgeService.search(searchQuery),
    enabled: searchQuery.length >= 2,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Conhecimento Técnico</h2>
          <p className="text-sm text-muted-foreground">
            {so ? `${so.deviceInfo ?? ""} ${so.defectName ? "· " + so.defectName : ""}` : ""}
          </p>
        </div>
      </div>

      <div className="flex gap-2 border-b pb-2">
        <button className={`px-3 py-1.5 text-sm font-medium rounded-t transition-colors ${activeTab === "recommended" ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
          onClick={() => setActiveTab("recommended")}>
          <Brain className="inline h-4 w-4 mr-1" />Recomendados
        </button>
        <button className={`px-3 py-1.5 text-sm font-medium rounded-t transition-colors ${activeTab === "search" ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
          onClick={() => setActiveTab("search")}>
          <Search className="inline h-4 w-4 mr-1" />Pesquisar
        </button>
      </div>

      {activeTab === "recommended" && (
        loadingRec ? (
          <div className="text-center py-8 text-sm text-muted-foreground">Carregando recomendações...</div>
        ) : recommended.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center space-y-3">
              <Brain className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Nenhum artigo recomendado para esta OS</p>
              <p className="text-xs text-muted-foreground">Complete o diagnóstico para obter recomendações mais precisas</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{recommended.length} artigos relacionados</p>
            <div className="space-y-2">
              {recommended.map((result) => {
                const Icon = typeIcons[result.article.type] ?? FileText;
                return (
                  <Link key={result.article.id} to="/knowledge/$id" params={{ id: result.article.id }}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Icon className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{result.article.title}</span>
                              <Badge variant="outline" className="text-xs">{typeLabels[result.article.type] ?? result.article.type}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{result.article.summary}</p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" />{result.article.analytics?.timesUsed ?? 0}</span>
                              <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{result.article.analytics?.views ?? 0}</span>
                              {result.article.analytics?.avgRating ? <span className="flex items-center gap-1"><Star className="h-3 w-3" />{result.article.analytics.avgRating.toFixed(1)}</span> : null}
                              {result.article.estimatedTime && <span>~{result.article.estimatedTime}min</span>}
                            </div>
                            {result.highlights.length > 0 && (
                              <div className="flex gap-1 mt-2">
                                {result.highlights.slice(0, 3).map((h, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs bg-green-50 text-green-700">{h}</Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <Badge variant="secondary" className="shrink-0">{Math.round(result.score)}%</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        )
      )}

      {activeTab === "search" && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Pesquisar na base de conhecimento..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          {loadingSearch ? (
            <div className="text-center py-4 text-sm text-muted-foreground">Pesquisando...</div>
          ) : searchQuery.length >= 2 && searchResults.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum resultado encontrado</p>
          ) : searchQuery.length >= 2 ? (
            <div className="space-y-2">
              {searchResults.slice(0, 20).map((result) => (
                <Link key={result.article.id} to="/knowledge/$id" params={{ id: result.article.id }}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="font-medium">{result.article.title}</span>
                        <Badge variant="outline" className="text-xs">{typeLabels[result.article.type] ?? result.article.type}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Digite pelo menos 2 caracteres para pesquisar</p>
          )}
        </div>
      )}
    </div>
  );
}
