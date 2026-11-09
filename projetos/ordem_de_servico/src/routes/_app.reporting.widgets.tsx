import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { widgetService } from "@/modules/reporting/service";
import type { Widget, WidgetType } from "@/modules/reporting/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table2, TrendingUp, PieChart, BarChart3, Activity, Grid3X3, Eye, Trash2, Edit3 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/reporting/widgets")({
  head: () => ({ meta: [{ title: "Reporting Widget Library — ServiceForge" }] }),
  component: WidgetLibraryPage,
});

const WIDGET_ICONS: Record<string, typeof Table2> = {
  table: Table2, card: Grid3X3, indicator: Activity, lineChart: TrendingUp,
  barChart: BarChart3, pieChart: PieChart, areaChart: Activity, doughnutChart: PieChart,
  gauge: Activity, calendar: Grid3X3, timeline: Activity, kpi: TrendingUp,
  metric: Activity, progress: Activity, stat: Activity, list: Table2,
};

const WIDGET_LABELS: Record<string, string> = {
  table: "Tabela", card: "Card", indicator: "Indicador", lineChart: "Gráfico Linha",
  barChart: "Gráfico Barra", pieChart: "Gráfico Pizza", areaChart: "Gráfico Área",
  doughnutChart: "Gráfico Rosca", gauge: "Gauge", heatmap: "Heatmap",
  calendar: "Calendário", timeline: "Timeline", kanban: "Kanban", map: "Mapa",
  text: "Texto", image: "Imagem", html: "HTML", iframe: "Iframe",
  kpi: "KPI", metric: "Métrica", progress: "Progresso", stat: "Estatística", list: "Lista",
};

function WidgetLibraryPage() {
  const qc = useQueryClient();
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const { data: widgets = [] } = useQuery({ queryKey: ["rpt", "widgets", "list"], queryFn: () => widgetService.list() });

  const deleteMut = useMutation({
    mutationFn: (id: string) => widgetService.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["rpt", "widgets"] }); toast.success("Widget excluído"); },
    onError: () => toast.error("Erro ao excluir widget"),
  });

  const filtered = widgets.filter(w => {
    if (typeFilter !== "all" && w.type !== typeFilter) return false;
    if (search && !w.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Widget Library</h1>
          <p className="text-sm text-muted-foreground">Biblioteca de widgets disponíveis</p>
        </div>
      </div>

      <div className="flex gap-4">
        <Input placeholder="Pesquisar widgets..." className="max-w-xs" value={search} onChange={e => setSearch(e.target.value)} />
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Filtrar por tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            {Object.entries(WIDGET_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map(w => {
          const Icon = WIDGET_ICONS[w.type] ?? Table2;
          return (
            <Card key={w.id} className="relative">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{w.name}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs text-muted-foreground line-clamp-2">{w.description}</p>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="secondary" className="text-xs">{WIDGET_LABELS[w.type] ?? w.type}</Badge>
                  <Badge variant="outline" className="text-xs">{w.category}</Badge>
                  {w.isPublished && <Badge className="text-xs bg-green-100 text-green-700 hover:bg-green-100">Publicado</Badge>}
                </div>
                <div className="flex flex-wrap gap-1">
                  {w.tags.slice(0, 3).map(t => <Badge key={t} variant="outline" className="text-xs text-muted-foreground">{t}</Badge>)}
                </div>
                <div className="flex justify-end gap-1 pt-2">
                  <Button size="sm" variant="ghost" onClick={() => deleteMut.mutate(w.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full text-center text-muted-foreground py-12">Nenhum widget encontrado</div>
        )}
      </div>
    </div>
  );
}
