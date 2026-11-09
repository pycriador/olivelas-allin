import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Clock, FileText, ArrowRightLeft, MessageSquare, Camera, Package, HistoryIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { deviceService } from "@/modules/devices/service";

export const Route = createFileRoute("/_app/service-orders/assets/equipment/$id/history")({
  head: () => ({ meta: [{ title: "Histórico — ServiceForge" }] }),
  component: EquipmentHistoryTab,
});

function EquipmentHistoryTab() {
  const { id } = Route.useParams();
  const { t } = useTranslation();

  const { data: device, isLoading } = useQuery({
    queryKey: ["device", id],
    queryFn: () => deviceService.get(id),
  });

  const historyEntries = useMemo(() => {
    if (!device) return [];
    const entries: { date: string; icon: any; description: string; color: string }[] = [];

    (device.deviceDocuments ?? []).forEach((doc) => {
      entries.push({
        date: doc.uploadedAt,
        icon: FileText,
        description: `Documento adicionado: ${doc.name}`,
        color: "text-blue-500",
      });
    });

    (device.transfers ?? []).forEach((t) => {
      entries.push({
        date: t.transferredAt,
        icon: ArrowRightLeft,
        description: `Transferido de "${t.fromCustomerName || "Anterior"}" para "${t.toCustomerName}"`,
        color: "text-amber-500",
      });
    });

    (device.timeline ?? []).forEach((t) => {
      const iconMap: Record<string, any> = {
        created: HistoryIcon, updated: MessageSquare, comment: MessageSquare,
        maintenance: Clock, status: ArrowRightLeft,
      };
      entries.push({
        date: t.createdAt,
        icon: iconMap[t.type] ?? MessageSquare,
        description: t.description,
        color: "text-muted-foreground",
      });
    });

    (device.photos ?? []).forEach((p) => {
      entries.push({
        date: p.uploadedAt,
        icon: Camera,
        description: `Foto adicionada (${p.category})`,
        color: "text-purple-500",
      });
    });

    (device.accessories ?? []).forEach((a) => {
      if (a.id) {
        entries.push({
          date: device.createdAt ?? "",
          icon: Package,
          description: `Acessório: ${a.name} (x${a.quantity})`,
          color: "text-green-500",
        });
      }
    });

    entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return entries;
  }, [device]);

  if (isLoading) return <div className="flex items-center justify-center py-12"><p className="text-sm text-muted-foreground">Carregando...</p></div>;
  if (!device) return <div className="flex items-center justify-center py-12"><p className="text-sm text-muted-foreground">Equipamento não encontrado</p></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Histórico Completo</h2>
        <p className="text-sm text-muted-foreground">Todos os eventos registrados para este equipamento</p>
      </div>

      {historyEntries.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <HistoryIcon className="h-10 w-10" />
              <p className="text-sm">Nenhum evento registrado</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6">
            <div className="relative space-y-0">
              {historyEntries.map((entry, idx) => {
                const Icon = entry.icon;
                return (
                  <div key={idx} className="flex gap-4 pb-6 last:pb-0 relative">
                    <div className="flex flex-col items-center">
                      <div className={`h-8 w-8 rounded-full bg-muted flex items-center justify-center ${entry.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      {idx < historyEntries.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                    </div>
                    <div className="flex-1 pt-1">
                      <p className="text-sm">{entry.description}</p>
                      <p className="text-xs text-muted-foreground">{new Date(entry.date).toLocaleString("pt-BR")}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
