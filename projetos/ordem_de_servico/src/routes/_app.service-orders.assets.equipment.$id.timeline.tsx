import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { History, MessageSquare, ArrowRightLeft, Clock, Plus, Pencil } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { deviceService } from "@/modules/devices/service";

export const Route = createFileRoute("/_app/service-orders/assets/equipment/$id/timeline")({
  head: () => ({ meta: [{ title: "Timeline — ServiceForge" }] }),
  component: EquipmentTimelineTab,
});

const typeIcons: Record<string, any> = {
  created: Plus, updated: Pencil, comment: MessageSquare,
  maintenance: Clock, status: ArrowRightLeft,
};
const typeLabels: Record<string, string> = {
  created: "Criação", updated: "Atualização", comment: "Comentário",
  maintenance: "Manutenção", status: "Mudança de Status",
};
const typeColors: Record<string, string> = {
  created: "bg-green-100 text-green-700", updated: "bg-blue-100 text-blue-700",
  comment: "bg-purple-100 text-purple-700", maintenance: "bg-amber-100 text-amber-700",
  status: "bg-orange-100 text-orange-700",
};

function EquipmentTimelineTab() {
  const { id } = Route.useParams();
  const { t } = useTranslation();

  const { data: device, isLoading } = useQuery({
    queryKey: ["device", id],
    queryFn: () => deviceService.get(id),
  });

  const entries = useMemo(() => {
    if (!device?.timeline) return [];
    return [...device.timeline].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [device]);

  if (isLoading) return <div className="flex items-center justify-center py-12"><p className="text-sm text-muted-foreground">Carregando...</p></div>;
  if (!device) return <div className="flex items-center justify-center py-12"><p className="text-sm text-muted-foreground">Equipamento não encontrado</p></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Timeline</h2>
        <p className="text-sm text-muted-foreground">Linha do tempo de eventos do equipamento</p>
      </div>

      {entries.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <History className="h-10 w-10" />
              <p className="text-sm">Nenhum evento na timeline</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6">
            <div className="relative space-y-0">
              {entries.map((entry, idx) => {
                const Icon = typeIcons[entry.type] ?? History;
                return (
                  <div key={entry.id} className="flex gap-4 pb-6 last:pb-0 relative">
                    <div className="flex flex-col items-center">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${typeColors[entry.type] ?? "bg-gray-100 text-gray-700"}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      {idx < entries.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                    </div>
                    <div className="flex-1 pt-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className={typeColors[entry.type]}>{typeLabels[entry.type] ?? entry.type}</Badge>
                      </div>
                      <p className="text-sm">{entry.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {entry.userName ? `${entry.userName} · ` : ""}{new Date(entry.createdAt).toLocaleString("pt-BR")}
                      </p>
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
