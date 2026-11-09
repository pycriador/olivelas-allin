import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Smartphone, Wrench, RotateCcw, ShieldCheck, Package, History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { serviceOrderService } from "@/modules/service-orders/service";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_app/service-orders/device-history/$deviceId")({
  head: () => ({ meta: [{ title: "Histórico do Aparelho — ServiceForge" }] }),
  component: DeviceHistoryPage,
});

function DeviceHistoryPage() {
  const { deviceId } = Route.useParams();
  const { t } = useTranslation();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["device-history", deviceId],
    queryFn: () => serviceOrderService.getDeviceHistory(deviceId),
  });

  const priorityColor: Record<string, string> = { low: "bg-gray-100 text-gray-700", medium: "bg-blue-100 text-blue-700", high: "bg-amber-100 text-amber-700", urgent: "bg-red-100 text-red-700" };
  const statusColors: Record<string, string> = {
    "Em Aberto": "bg-gray-100 text-gray-700", "Em Diagnóstico": "bg-blue-100 text-blue-700",
    "Aguardando Aprovação": "bg-amber-100 text-amber-700", "Aprovada": "bg-green-100 text-green-700",
    "Em Execução": "bg-purple-100 text-purple-700", "Aguardando Peça": "bg-orange-100 text-orange-700",
    "Pronta": "bg-emerald-100 text-emerald-700", "Entregue": "bg-green-100 text-green-700",
    "Cancelada": "bg-red-100 text-red-700",
  };

  const defects = [...new Set(orders.map((o) => o.defectName).filter(Boolean))];
  const services = [...new Set(orders.flatMap((o) => o.services?.map((s) => s.serviceName) ?? []))];
  const parts = [...new Set(orders.flatMap((o) => o.parts?.map((p) => p.partName) ?? []))];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/service-orders"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("so.deviceHistory.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("so.device")}: {deviceId}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("so.deviceHistory.allOS")}</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{orders.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("so.deviceHistory.defects")}</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{defects.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("so.deviceHistory.services")}</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{services.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("so.deviceHistory.parts")}</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{parts.length}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">{t("so.deviceHistory.allOS")}</CardTitle></CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="p-6 text-sm text-center text-muted-foreground">{t("common.loading")}</p>
          ) : orders.length === 0 ? (
            <p className="p-6 text-sm text-center text-muted-foreground">{t("common.noResults")}</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="p-3 font-medium">{t("so.number")}</th>
                  <th className="p-3 font-medium">{t("so.defect")}</th>
                  <th className="p-3 font-medium">{t("so.priority")}</th>
                  <th className="p-3 font-medium">{t("so.status")}</th>
                  <th className="p-3 font-medium">{t("so.entryDate")}</th>
                  <th className="p-3 font-medium">{t("so.deliveryDate")}</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((so) => (
                  <tr key={so.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="p-3">
                      <Link to="/service-orders/$id" params={{ id: so.id }} className="font-medium hover:underline">{so.number}</Link>
                    </td>
                    <td className="p-3 max-w-[200px] truncate">{so.defectName || "-"}</td>
                    <td className="p-3"><Badge className={priorityColor[so.priority] ?? ""} variant="outline">{t(`so.priority.${so.priority}`)}</Badge></td>
                    <td className="p-3"><Badge className={statusColors[so.status] ?? ""} variant="outline">{so.statusLabel}</Badge></td>
                    <td className="p-3">{so.entryDate}</td>
                    <td className="p-3">{so.deliveryDate || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {defects.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">{t("so.deviceHistory.defects")}</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {defects.map((d, i) => <Badge key={i} variant="secondary">{d}</Badge>)}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
