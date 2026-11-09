import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Monitor, CheckCircle2, Wrench, Truck, ShieldCheck, Undo2, BarChart3, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { deviceService } from "@/modules/devices/service";
import { brandService } from "@/modules/brands/service";
import { modelService } from "@/modules/models/service";

export const Route = createFileRoute("/_app/service-orders/assets/")({
  head: () => ({ meta: [{ title: "Dashboard de Ativos — ServiceForge" }] }),
  component: AssetsDashboardPage,
});

function AssetsDashboardPage() {
  const { t } = useTranslation();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["deviceStats"],
    queryFn: () => deviceService.getStats(),
  });

  const { data: brands = [] } = useQuery({
    queryKey: ["brands"],
    queryFn: () => brandService.list(),
  });

  const { data: models = [] } = useQuery({
    queryKey: ["models"],
    queryFn: () => modelService.list(),
  });

  const cards = useMemo(() => [
    { label: "Equipamentos Cadastrados", value: stats?.total ?? 0, icon: Monitor, color: "text-blue-500" },
    { label: "Ativos", value: stats?.active ?? 0, icon: CheckCircle2, color: "text-green-500" },
    { label: "Em Manutenção", value: stats?.inMaintenance ?? 0, icon: Wrench, color: "text-amber-500" },
    { label: "Entregues", value: stats?.delivered ?? 0, icon: Truck, color: "text-purple-500" },
  ], [stats]);

  const topBrands = useMemo(() => {
    if (!stats?.topBrands?.length) return [];
    return stats.topBrands.slice(0, 5);
  }, [stats]);

  const topModels = useMemo(() => {
    if (!stats?.topModels?.length) return [];
    return stats.topModels.slice(0, 5);
  }, [stats]);

  const categoryData = useMemo(() => {
    if (!stats?.byCategory) return [];
    return Object.entries(stats.byCategory)
      .map(([key, count]) => ({ name: key, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [stats]);

  const maxCategoryCount = Math.max(...categoryData.map((c) => c.count), 1);
  const maxBrandCount = Math.max(...topBrands.map((b) => b.count), 1);
  const maxModelCount = Math.max(...topModels.map((m) => m.count), 1);

  if (isLoading) return <div className="flex items-center justify-center py-12"><p className="text-sm text-muted-foreground">Carregando...</p></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard de Ativos</h1>
        <p className="text-sm text-muted-foreground">Visão geral dos equipamentos cadastrados</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-4 w-4" />Equipamentos por Categoria</CardTitle></CardHeader>
          <CardContent>
            {categoryData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Nenhum dado disponível</p>
            ) : (
              <div className="space-y-3">
                {categoryData.map((item) => (
                  <div key={item.name} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{item.name}</span>
                      <span className="text-muted-foreground">{item.count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${(item.count / maxCategoryCount) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4" />Top Marcas</CardTitle></CardHeader>
          <CardContent>
            {topBrands.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Nenhum dado disponível</p>
            ) : (
              <div className="space-y-3">
                {topBrands.map((item) => (
                  <div key={item.name} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{item.name}</span>
                      <span className="text-muted-foreground">{item.count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-blue-500" style={{ width: `${(item.count / maxBrandCount) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4" />Top Modelos</CardTitle></CardHeader>
          <CardContent>
            {topModels.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Nenhum dado disponível</p>
            ) : (
              <div className="space-y-3">
                {topModels.map((item) => (
                  <div key={item.name} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{item.name}</span>
                      <span className="text-muted-foreground">{item.count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-green-500" style={{ width: `${(item.count / maxModelCount) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Com Garantia</CardTitle>
              <ShieldCheck className="h-4 w-4 text-teal-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.withWarranty ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Com Retorno</CardTitle>
              <Undo2 className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.withReturn ?? 0}</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
