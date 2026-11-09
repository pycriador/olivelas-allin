import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { User, Wrench, Clock, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { serviceOrderService } from "@/modules/service-orders/service";

export const Route = createFileRoute("/_app/service-orders/$id/technician")({
  head: () => ({ meta: [{ title: "Técnico — ServiceForge" }] }),
  component: TechnicianTab,
});

function TechnicianTab() {
  const { id } = Route.useParams();
  const { t } = useTranslation();

  const { data: so, isLoading } = useQuery({
    queryKey: ["so", id],
    queryFn: () => serviceOrderService.get(id),
  });

  if (isLoading) return <div className="p-4 text-muted-foreground">Carregando...</div>;
  if (!so) return <div className="p-4 text-muted-foreground">Ordem de serviço não encontrada</div>;

  const statusColors: Record<string, string> = {
    active: "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
    completed: "bg-blue-100 text-blue-700",
  };

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {t("so.technician.assigned") || "Técnico Responsável"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {so.technicianName ? (
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-medium">{so.technicianName}</p>
                {so.technicianId && (
                  <p className="text-sm text-muted-foreground">ID: {so.technicianId}</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">Nenhum técnico atribuído a esta OS.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            {t("so.technician.inExecution") || "Execução"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge className={statusColors[so.status] ?? "bg-gray-100 text-gray-700"}>
                {so.statusLabel || so.status}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Prioridade</p>
              <Badge variant={so.priority === "urgent" ? "destructive" : "secondary"}>
                {so.priority}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
