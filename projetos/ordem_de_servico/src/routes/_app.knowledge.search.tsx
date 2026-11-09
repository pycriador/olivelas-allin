import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Search as SearchIcon, FileText, Filter, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { knowledgeService } from "@/modules/knowledge/service";

export const Route = createFileRoute("/_app/knowledge/search")({
  head: () => ({ meta: [{ title: "Pesquisa — Knowledge — ServiceForge" }] }),
  component: KnowledgeSearch,
});

const typeLabels: Record<string, string> = {
  procedure: "Procedimentos", manual: "Manuais", diagram: "Diagramas",
  firmware: "Firmware", driver: "Drivers", tutorial: "Tutoriais",
  solution: "Soluções", defect: "Defeitos", error_code: "Códigos Erro",
  faq: "FAQ", bulletin: "Boletins", alert: "Alertas",
};

const suggestions = [
  "Notebook Dell liga mas não apresenta vídeo",
  "TV Samsung reinicia sozinha",
  "Micro-ondas aquece pouco",
  "Geladeira não gela",
  "iPhone não carrega",
  "Notebook superaquecendo",
  "TV com faixa na tela",
];

function KnowledgeSearch() {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [brandFilter, setBrandFilter] = useState("");

  const { data: allArticles = [] } = useQuery({
    queryKey: ["knowledge-articles"],
    queryFn: () => knowledgeService.list(),
  });

  const { data: results = [], isLoading } = useQuery({
    queryKey: ["knowledge-search", query, typeFilter, brandFilter],
    queryFn: () => knowledgeService.search(query, {
      type: typeFilter as any || undefined,
      brand: brandFilter || undefined,
    }),
    enabled: query.length >= 2,
  });

  const brands = useMemo(() => {
    const s = new Set(allArticles.filter((a) => a.brand).map((a) => a.brand));
    return Array.from(s).sort();
  }, [allArticles]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Pesquisa Inteligente</h2>
        <p className="text-sm text-muted-foreground">Pesquise por equipamento, defeito, sintoma, código ou peça</p>
      </div>

      <div className="relative">
        <SearchIcon className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
        <Input
          className="pl-10 py-6 text-lg"
          placeholder="Ex: Notebook Dell liga mas não apresenta vídeo..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <Button variant="ghost" size="icon" className="absolute right-2 top-2" onClick={() => setQuery("")}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {!query && (
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-3">Sugestões de pesquisa:</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button key={s} className="px-3 py-1.5 text-sm bg-muted rounded-full hover:bg-accent transition-colors"
                onClick={() => setQuery(s)}>{s}</button>
            ))}
          </div>
        </div>
      )}

      {query.length >= 2 && (
        <div className="flex flex-wrap gap-2">
          <select className="h-9 text-sm rounded-md border border-input bg-background px-3" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">Todos os tipos</option>
            {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select className="h-9 text-sm rounded-md border border-input bg-background px-3" value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)}>
            <option value="">Todas as marcas</option>
            {brands.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          <Badge variant="secondary">{results.length} resultados</Badge>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8 text-sm text-muted-foreground">Pesquisando...</div>
      ) : query.length >= 2 && results.length === 0 ? (
        <Card><CardContent><p className="py-12 text-center text-sm text-muted-foreground">Nenhum resultado encontrado para "{query}"</p></CardContent></Card>
      ) : query.length >= 2 ? (
        <div className="space-y-3">
          {results.map((result) => (
            <Link key={result.article.id} to="/knowledge/$id" params={{ id: result.article.id }}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="font-medium text-sm">{result.article.title}</span>
                        <Badge variant="outline" className="text-xs">{typeLabels[result.article.type] ?? result.article.type}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{result.article.summary}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {result.article.brand && <span>{result.article.brand}</span>}
                        {result.article.model && <span>· {result.article.model}</span>}
                        {result.matchedKeywords.length > 0 && <span>· Keywords: {result.matchedKeywords.slice(0, 3).join(", ")}</span>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Badge variant="secondary">{Math.round(result.score)}%</Badge>
                      {result.highlights.length > 0 && (
                        <span className="text-xs text-muted-foreground">{result.highlights.length} matches</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
