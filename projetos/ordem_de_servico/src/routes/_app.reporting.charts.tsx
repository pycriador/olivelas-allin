import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, BarChart3, PieChart, Activity, ChartPie, Radar, ExternalLink, Eye } from "lucide-react";
import { widgetService } from "@/modules/reporting/service";

export const Route = createFileRoute("/_app/reporting/charts")({
  head: () => ({ meta: [{ title: "Gráficos — ServiceForge" }] }),
  component: ChartsGalleryPage,
});

const CHART_TYPE_ICONS: Record<string, typeof TrendingUp> = {
  lineChart: TrendingUp, barChart: BarChart3, pieChart: PieChart,
  areaChart: Activity, doughnutChart: ChartPie, radarChart: Radar,
};

const CHART_TYPE_LABELS: Record<string, string> = {
  lineChart: "Gráfico de Linha", barChart: "Gráfico de Barra", pieChart: "Gráfico de Pizza",
  areaChart: "Gráfico de Área", doughnutChart: "Gráfico de Rosca", radarChart: "Gráfico Radar",
};

const CHART_TYPES = ["lineChart", "barChart", "pieChart", "areaChart", "doughnutChart", "radarChart"];

function ChartsGalleryPage() {
  const { data: widgets = [] } = useQuery({
    queryKey: ["reporting", "widgets", "list"],
    queryFn: () => widgetService.list(),
  });

  const chartWidgets = widgets.filter(w => CHART_TYPES.includes(w.type));

  if (chartWidgets.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Gráficos</h1>
          <p className="text-sm text-muted-foreground">Galeria de visualizações de gráficos</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CHART_TYPES.map(ct => {
            const Icon = CHART_TYPE_ICONS[ct] ?? TrendingUp;
            return (
              <Card key={ct} className="hover:shadow-sm transition-shadow">
                <CardHeader className="flex items-center text-center">
                  <div className="w-14 h-14 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center mb-2">
                    <Icon className="w-7 h-7 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <CardTitle className="text-sm font-medium capitalize">
                    {CHART_TYPE_LABELS[ct] ?? ct.replace("Chart", "")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="h-24 bg-muted/30 rounded-lg flex items-center justify-center text-muted-foreground text-xs">
                    Nenhum widget disponível
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Gráficos</h1>
        <p className="text-sm text-muted-foreground">Galeria de visualizações de gráficos</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {chartWidgets.map(w => {
          const Icon = CHART_TYPE_ICONS[w.type] ?? TrendingUp;
          return (
            <Card key={w.id} className="hover:shadow-sm transition-shadow">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-cyan-600" />
                  <CardTitle className="text-sm font-medium">{w.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <Badge variant="secondary" className="text-xs">{CHART_TYPE_LABELS[w.type] ?? w.type}</Badge>
                <p className="text-xs text-muted-foreground line-clamp-2">{w.description}</p>
                <div className="h-24 bg-muted/30 rounded-lg flex items-center justify-center text-muted-foreground text-xs">
                  [{CHART_TYPE_LABELS[w.type]?.toUpperCase() ?? w.type} placeholder]
                </div>
                <div className="flex justify-end gap-1 pt-2">
                  <Button size="sm" variant="outline"><Eye className="h-3 w-3 mr-1" />Visualizar</Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
