import { createFileRoute, Outlet, Link, useLocation } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Eye, Image, Package, FileText, History, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { deviceService } from "@/modules/devices/service";

export const Route = createFileRoute("/_app/service-orders/assets/equipment/$id")({
  head: () => ({ meta: [{ title: "Equipamento — ServiceForge" }] }),
  component: EquipmentDetailLayout,
});

const tabs = [
  { id: "overview", label: "Visão Geral", path: "/service-orders/assets/equipment/$id", icon: Eye, exact: true },
  { id: "photos", label: "Fotos", path: "/service-orders/assets/equipment/$id/photos", icon: Image },
  { id: "accessories", label: "Acessórios", path: "/service-orders/assets/equipment/$id/accessories", icon: Package },
  { id: "documents", label: "Documentos", path: "/service-orders/assets/equipment/$id/documents", icon: FileText },
  { id: "history", label: "Histórico", path: "/service-orders/assets/equipment/$id/history", icon: History },
  { id: "timeline", label: "Timeline", path: "/service-orders/assets/equipment/$id/timeline", icon: Clock },
];

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-700", inactive: "bg-gray-100 text-gray-700",
  in_maintenance: "bg-amber-100 text-amber-700", deactivated: "bg-red-100 text-red-700",
};
const statusLabels: Record<string, string> = {
  active: "Ativo", inactive: "Inativo", in_maintenance: "Em Manutenção", deactivated: "Desativado",
};

function EquipmentDetailLayout() {
  const { id } = Route.useParams();
  const location = useLocation();
  const { t } = useTranslation();

  const { data: device, isLoading } = useQuery({
    queryKey: ["device", id],
    queryFn: () => deviceService.get(id),
  });

  const currentTab = tabs.find((tab) =>
    tab.exact ? location.pathname === `/service-orders/assets/equipment/${id}` : location.pathname.startsWith(`/service-orders/assets/equipment/${id}/${tab.id}`)
  ) ?? tabs[0];

  if (isLoading) return <div className="flex items-center justify-center py-12"><p className="text-sm text-muted-foreground">Carregando...</p></div>;
  if (!device) return <div className="flex items-center justify-center py-12"><p className="text-sm text-muted-foreground">Equipamento não encontrado</p></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/service-orders/assets/equipment"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{device.serialNumber ?? device.assetNumber ?? "Equipamento"}</h1>
              <Badge className={statusColors[device.status]} variant="outline">{statusLabels[device.status]}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{device.imei ? `IMEI: ${device.imei}` : ""}</p>
          </div>
        </div>
      </div>

      <div className="border-b overflow-x-auto">
        <nav className="flex gap-1 min-w-max">
          {tabs.map((tab) => {
            const isActive = tab.exact
              ? location.pathname === `/service-orders/assets/equipment/${id}`
              : location.pathname.startsWith(`/service-orders/assets/equipment/${id}/${tab.id}`);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.id}
                to={tab.path as any}
                params={{ id } as never}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  isActive ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <Outlet />
    </div>
  );
}
