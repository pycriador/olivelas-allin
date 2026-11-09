import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { BarChart3, Monitor, Wrench, Clock, AlertTriangle, TrendingUp, Tag, RepeatIcon, Gauge } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { deviceService } from "@/modules/devices/service";
import { brandService } from "@/modules/brands/service";
import { modelService } from "@/modules/models/service";
import { equipmentTypeService } from "@/modules/equipment-types/service";

export const Route = createFileRoute("/_app/service-orders/assets/analytics")({
  head: () => ({ meta: [{ title: "Analíticos — ServiceForge" }] }),
  component: AssetAnalyticsPage,
});

function AssetAnalyticsPage() {
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

  const { data: types = [] } = useQuery({
    queryKey: ["equipmentTypes"],
    queryFn: () => equipmentTypeService.list(),
  });

  const brandMap = Object.fromEntries(brands.map((b) => [b.id, b.name]));
  const modelMap = Object.fromEntries(models.map((m) => [m.id, m.name]));
  const typeMap = Object.fromEntries(types.map((t) => [t.id, t.name]));

  const brandData = useMemo(() => {
    if (!stats?.byCompany) return [];
    return Object.entries(stats.byCompany)
      .map(([key, count]) => ({ name: brandMap[key] ?? key, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [stats, brandMap]);

  const typeData = useMemo(() => {
    if (!stats?.byCategory) return [];
    return Object.entries(stats.byCategory)
      .map(([key, count]) => ({ name: typeMap[key] ?? key, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [stats, typeMap]);

  const topBrands = useMemo(() => {
    if (!stats?.topBrands?.length) return [];
    return stats.topBrands.slice(0, 5);
  }, [stats]);

  const topModels = useMemo(() => {
    if (!stats?.topModels?.length) return [];
    return stats.topModels.slice(0, 5);
  }, [stats]);

  const maxBrandCount = Math.max(...brandData.map((b) => b.count), 1);
  const maxTypeCount = Math.max(...typeData.map((t) => t.count), 1);

  if (isLoading) return <div className="flex items-center justify-center py-12"><p className="text-sm text-muted-foreground">Carregando...</p></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analíticos de Ativos</h1>
        <p className="text-sm text-muted-foreground">Métricas e estatísticas dos equipamentos</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Equipamentos</CardTitle>
            <Monitor className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats?.total ?? 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Quantidade de Reparos</CardTitle>
            <Wrench className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats?.inMaintenance ?? 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tempo Médio em Manutenção</CardTitle>
            <Clock className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats?.avgRepairTime ?? 0}h</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Equipamentos Reincidentes</CardTitle>
            <RepeatIcon className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats?.reincidentDevices ?? 0}</div></CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Tag className="h-4 w-4" />Equipamentos por Marca</CardTitle></CardHeader>
          <CardContent>
            {brandData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Nenhum dado disponível</p>
            ) : (
              <div className="space-y-3">
                {brandData.map((item) => (
                  <div key={item.name} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{item.name}</span>
                      <span className="text-muted-foreground">{item.count}</span>
                    </div>
                    <div className="h-5 rounded-md bg-muted overflow-hidden">
                      <div className="h-full rounded-md bg-blue-500 flex items-center px-2 text-xs text-white font-medium" style={{ width: `${(item.count / maxBrandCount) * 100}%`, minWidth: item.count > 0 ? "fit-content" : undefined }}>
                        {item.count > 0 && `${item.count}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-4 w-4" />Equipamentos por Tipo</CardTitle></CardHeader>
          <CardContent>
            {typeData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Nenhum dado disponível</p>
            ) : (
              <div className="space-y-3">
                {typeData.map((item) => (
                  <div key={item.name} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{item.name}</span>
                      <span className="text-muted-foreground">{item.count}</span>
                    </div>
                    <div className="h-5 rounded-md bg-muted overflow-hidden">
                      <div className="h-full rounded-md bg-green-500 flex items-center px-2 text-xs text-white font-medium" style={{ width: `${(item.count / maxTypeCount) * 100}%` }}>
                        {item.count > 0 && `${item.count}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4" />Top Marcas (mais equipamentos)</CardTitle></CardHeader>
          <CardContent>
            {topBrands.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Nenhum dado disponível</p>
            ) : (
              <div className="space-y-3">
                {topBrands.map((item, idx) => (
                  <div key={item.name} className="flex items-center gap-3 text-sm">
                    <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">{idx + 1}</span>
                    <span className="flex-1">{item.name}</span>
                    <span className="font-medium">{item.count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4" />Modelos com Maior Índice de Defeito</CardTitle></CardHeader>
          <CardContent>
            {topModels.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Nenhum dado disponível</p>
            ) : (
              <div className="space-y-3">
                {topModels.map((item, idx) => (
                  <div key={item.name} className="flex items-center gap-3 text-sm">
                    <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">{idx + 1}</span>
                    <span className="flex-1">{item.name}</span>
                    <span className="font-medium">{item.count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
