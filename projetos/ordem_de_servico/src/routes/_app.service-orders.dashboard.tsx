import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Search, Clock, CheckCircle, XCircle, FileWarning, Wrench, Gauge, ShieldCheck, RotateCcw, Users, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { serviceOrderService } from "@/modules/service-orders/service";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { useMemo } from "react";

export const Route = createFileRoute("/_app/service-orders/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard OS — ServiceForge" }] }),
  component: SODashboardPage,
});

function SODashboardPage() {
  const { t } = useTranslation();
  const { data: stats, isLoading } = useQuery({
    queryKey: ["so", "stats"],
    queryFn: () => serviceOrderService.getDashboardStats(),
  });

  const { data: enhancedStats } = useQuery({
    queryKey: ["so", "stats", "enhanced"],
    queryFn: () => serviceOrderService.getEnhancedDashboardStatsV2().catch(() => null),
  });

  const { data: allSOs = [] } = useQuery({
    queryKey: ["service-orders"],
    queryFn: () => serviceOrderService.list(),
  });

  const warrantyCount = useMemo(() => {
    return allSOs.filter((so) => so.warrantyId).length;
  }, [allSOs]);

  const returnCount = useMemo(() => {
    return allSOs.filter((so) => so.timeline?.some((t) => t.type === "return_created")).length;
  }, [allSOs]);

  const techCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allSOs.forEach((so) => {
      if (so.technicianName) {
        counts[so.technicianName] = (counts[so.technicianName] ?? 0) + 1;
      }
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [allSOs]);

  const companyCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allSOs.forEach((so) => {
      if (so.companyId) {
        counts[so.companyId] = (counts[so.companyId] ?? 0) + 1;
      }
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [allSOs]);

  const maxTech = Math.max(...techCounts.map(([, c]) => c), 1);
  const maxCompany = Math.max(...companyCounts.map(([, c]) => c), 1);

  const cards = useMemo(() => [
    { label: t("so.open"), value: stats?.open ?? 0, icon: ClipboardList, color: "text-gray-500" },
    { label: t("so.diagnosis_count"), value: stats?.diagnosis ?? 0, icon: Search, color: "text-blue-500" },
    { label: t("so.awaitingApproval"), value: stats?.awaitingApproval ?? 0, icon: Clock, color: "text-amber-500" },
    { label: t("so.awaitingParts"), value: stats?.awaitingParts ?? 0, icon: FileWarning, color: "text-orange-500" },
    { label: t("so.ready"), value: stats?.ready ?? 0, icon: CheckCircle, color: "text-green-500" },
    { label: t("so.delivered"), value: stats?.delivered ?? 0, icon: CheckCircle, color: "text-emerald-500" },
    { label: t("so.cancelled"), value: stats?.cancelled ?? 0, icon: XCircle, color: "text-red-500" },
    { label: t("so.avgTime"), value: `${stats?.avgTime ?? 0}h`, icon: Gauge, color: "text-purple-500" },
    { label: "OS em Garantia", value: warrantyCount, icon: ShieldCheck, color: "text-yellow-500" },
    { label: "OS com Retorno", value: returnCount, icon: RotateCcw, color: "text-red-500" },
    { label: "Valor Total", value: enhancedStats ? `R$ ${enhancedStats.totalValue.toFixed(0)}` : "R$ 0", icon: Gauge, color: "text-green-500" },
    { label: "Valor Recebido", value: enhancedStats ? `R$ ${enhancedStats.totalReceived.toFixed(0)}` : "R$ 0", icon: Gauge, color: "text-emerald-500" },
  ], [stats, t, warrantyCount, returnCount, enhancedStats]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("so.dashboard")}</h1>
        <p className="text-sm text-muted-foreground">{t("so.subtitle")}</p>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" /> OS por Técnico
                </CardTitle>
              </CardHeader>
              <CardContent>
                {techCounts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhum técnico atribuído.</p>
                ) : (
                  <div className="space-y-3">
                    {techCounts.map(([name, count]) => (
                      <div key={name}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="font-medium truncate">{name}</span>
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${(count / maxTech) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" /> OS por Empresa
                </CardTitle>
              </CardHeader>
              <CardContent>
                {companyCounts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhuma empresa vinculada.</p>
                ) : (
                  <div className="space-y-3">
                    {companyCounts.map(([id, count]) => (
                      <div key={id}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="font-medium truncate">{id}</span>
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full transition-all"
                            style={{ width: `${(count / maxCompany) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
