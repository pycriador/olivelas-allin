import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Wrench, Clock, CheckCircle, RotateCcw, AlertTriangle, Gauge, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { serviceOrderService } from "@/modules/service-orders/service";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { useMemo } from "react";

export const Route = createFileRoute("/_app/service-orders/technician")({
  head: () => ({ meta: [{ title: "Painel do Técnico — ServiceForge" }] }),
  component: TechnicianDashboardPage,
});

function TechnicianDashboardPage() {
  const { t } = useTranslation();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["so", "technician-stats"],
    queryFn: () => serviceOrderService.getTechnicianDashboardStats(),
  });

  const cards = useMemo(() => [
    { label: t("so.technician.assigned"), value: stats?.assigned ?? 0, icon: ClipboardList, color: "text-blue-500" },
    { label: t("so.technician.inExecution"), value: stats?.inExecution ?? 0, icon: Wrench, color: "text-purple-500" },
    { label: t("so.technician.awaitingParts"), value: stats?.awaitingParts ?? 0, icon: Clock, color: "text-orange-500" },
    { label: t("so.technician.completedToday"), value: stats?.completedToday ?? 0, icon: CheckCircle, color: "text-green-500" },
    { label: t("so.technician.avgTime"), value: `${stats?.avgTime ?? 0}h`, icon: Gauge, color: "text-gray-500" },
    { label: t("so.technician.returns"), value: stats?.returns ?? 0, icon: RotateCcw, color: "text-amber-500" },
    { label: t("so.technician.pendingIssues"), value: stats?.pendingIssues ?? 0, icon: AlertTriangle, color: "text-red-500" },
  ], [stats, t]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("so.technician.dashboard")}</h1>
        <p className="text-sm text-muted-foreground">{t("so.subtitle")}</p>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center py-12"><p className="text-sm text-muted-foreground">{t("common.loading")}</p></div>
      ) : (
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
      )}
    </div>
  );
}
