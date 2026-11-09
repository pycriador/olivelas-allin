import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Clock, TrendingUp, Users, Wrench, AlertTriangle, Package, Award, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { serviceOrderService } from "@/modules/service-orders/service";

export const Route = createFileRoute("/_app/service-orders/$id/analytics")({
  head: () => ({ meta: [{ title: "Analytics — ServiceForge" }] }),
  component: AnalyticsTab,
});

function AnalyticsTab() {
  const { id } = Route.useParams();
  const { t } = useTranslation();

  const { data: analytics, isLoading } = useQuery({
    queryKey: ["so-analytics", id],
    queryFn: () => serviceOrderService.getAnalytics(id),
  });

  if (isLoading) return <div className="text-center py-8 text-sm text-muted-foreground">Carregando...</div>;
  if (!analytics) return <div className="text-center py-8 text-sm text-muted-foreground">Dados indisponíveis</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Analytics</h2>
        <p className="text-sm text-muted-foreground">Indicadores técnicos e estatísticas</p>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Tempo Médio de Diagnóstico</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{analytics.avgDiagnosisTime}h</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Tempo Médio de Execução</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{analytics.avgExecutionTime}h</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Tempo Médio de Aprovação</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{analytics.avgApprovalTime}h</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Garantias Acionadas</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{analytics.warrantiesTriggered}</p>
          </CardContent>
        </Card>
      </div>

      {/* Technician Times */}
      {analytics.technicianAvgTimes.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Tempo Médio por Técnico</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.technicianAvgTimes.map((tech, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2"><Users className="h-3 w-3" />{tech.technicianName}</span>
                  <Badge variant="secondary">{tech.avgTime}h</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {/* Common Defects */}
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Defeitos Mais Comuns</CardTitle></CardHeader>
          <CardContent>
            {analytics.commonDefects.length > 0 ? (
              <div className="space-y-2">
                {analytics.commonDefects.slice(0, 5).map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2"><AlertTriangle className="h-3 w-3 text-amber-500" />{d.defect}</span>
                    <Badge variant="secondary">{d.count}x</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum dado disponível</p>
            )}
          </CardContent>
        </Card>

        {/* Most Used Parts */}
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Peças Mais Utilizadas</CardTitle></CardHeader>
          <CardContent>
            {analytics.mostUsedParts.length > 0 ? (
              <div className="space-y-2">
                {analytics.mostUsedParts.slice(0, 5).map((p, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2"><Package className="h-3 w-3 text-blue-500" />{p.partName}</span>
                    <Badge variant="secondary">{p.count}x</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum dado disponível</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recurrent Equipment */}
      {analytics.recurrentEquipment.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Equipamentos Reincidentes</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.recurrentEquipment.map((eq, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2"><Wrench className="h-3 w-3" />{eq.deviceInfo}</span>
                  <Badge variant="secondary">{eq.count} OS</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Return Brands */}
      {analytics.topReturnBrands.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Marcas com Maior Índice de Retorno</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.topReturnBrands.map((b, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span>{b.brand}</span>
                  <Badge variant="destructive">{b.returnCount} retornos</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Returns by Period */}
      {analytics.returnsByPeriod.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Retornos por Período</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.returnsByPeriod.map((r, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span>{r.period}</span>
                  <Badge variant="secondary">{r.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
