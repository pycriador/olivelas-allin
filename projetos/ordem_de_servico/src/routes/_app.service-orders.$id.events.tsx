import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Radio, Activity, CheckCircle, XCircle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { eventBus } from "@/modules/events/service";
import type { PlatformEvent } from "@/modules/events/types";
import { EVENT_CATEGORY_LABELS, EVENT_STATUS_LABELS } from "@/modules/events/types";

export const Route = createFileRoute("/_app/service-orders/$id/events")({
  head: () => ({ meta: [{ title: "Eventos — ServiceForge" }] }),
  component: EventsTab,
});

const statusIcons: Record<string, typeof Activity> = {
  created: Clock, processing: Activity, completed: CheckCircle, failed: XCircle, retrying: Clock,
};

const statusColors: Record<string, string> = {
  created: "bg-gray-100 text-gray-700", processing: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700", failed: "bg-red-100 text-red-700",
  retrying: "bg-amber-100 text-amber-700",
};

function EventsTab() {
  const { id } = Route.useParams();
  const { t } = useTranslation();

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["so-events", id],
    queryFn: () => eventBus.history(),
  });

  const filtered = events.filter((e: PlatformEvent) => {
    if (e.payload?.id === id) return true;
    if (e.payload?.serviceOrderId === id) return true;
    if (e.payload?.orderId === id) return true;
    return false;
  }).sort((a: PlatformEvent, b: PlatformEvent) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (isLoading) return <div className="flex items-center justify-center py-12"><p className="text-sm text-muted-foreground">{t("common.loading")}</p></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Radio className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Eventos</h2>
      </div>

      {filtered.length === 0 ? (
        <Card><CardContent><p className="py-8 text-center text-sm text-muted-foreground">Nenhum evento registrado para esta OS.</p></CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="p-3 font-medium">Evento</th>
                  <th className="p-3 font-medium">Categoria</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium">Data</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((event: PlatformEvent) => {
                  const Icon = statusIcons[event.status] ?? Activity;
                  const colorClass = statusColors[event.status] ?? "bg-gray-100 text-gray-700";
                  return (
                    <tr key={event.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="p-3">
                        <span className="font-medium">{event.name}</span>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline">{EVENT_CATEGORY_LABELS[event.category] ?? event.category}</Badge>
                      </td>
                      <td className="p-3">
                        <Badge className={colorClass} variant="outline">
                          <Icon className="h-3 w-3 mr-1 inline" />
                          {EVENT_STATUS_LABELS[event.status] ?? event.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {new Date(event.createdAt).toLocaleString("pt-BR")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
