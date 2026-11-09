import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Shield, User, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { serviceOrderService } from "@/modules/service-orders/service";

export const Route = createFileRoute("/_app/service-orders/$id/audit")({
  head: () => ({ meta: [{ title: "Auditoria — ServiceForge" }] }),
  component: AuditTab,
});

const auditTypeLabels: Record<string, string> = {
  created: "Criação", updated: "Atualização", status_changed: "Mudança de Status",
  assigned: "Atribuição", customer_changed: "Cliente Alterado",
  device_changed: "Aparelho Alterado", technician_changed: "Técnico Alterado",
  reopened: "Reabertura", delivered: "Entrega", cancelled: "Cancelamento",
};

function AuditTab() {
  const { id } = Route.useParams();
  const { t } = useTranslation();

  const { data: so, isLoading } = useQuery({
    queryKey: ["service-order", id],
    queryFn: () => serviceOrderService.get(id),
  });

  if (isLoading) return <div className="flex items-center justify-center py-12"><p className="text-sm text-muted-foreground">{t("common.loading")}</p></div>;

  const auditTypes = new Set(["created", "updated", "status_changed", "assigned", "customer_changed", "device_changed", "technician_changed", "reopened", "delivered", "cancelled"]);
  const auditEntries = (so?.timeline ?? []).filter((e) => auditTypes.has(e.type));
  const sorted = [...auditEntries].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Auditoria</h2>
      </div>

      {sorted.length === 0 ? (
        <Card><CardContent><p className="py-8 text-center text-sm text-muted-foreground">Nenhum registro de auditoria.</p></CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="p-3 font-medium">Tipo</th>
                  <th className="p-3 font-medium">Descrição</th>
                  <th className="p-3 font-medium">Usuário</th>
                  <th className="p-3 font-medium">Data</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((entry) => (
                  <tr key={entry.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="p-3">
                      <Badge variant="outline">{auditTypeLabels[entry.type] ?? entry.type}</Badge>
                    </td>
                    <td className="p-3">{entry.description}</td>
                    <td className="p-3">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3 text-muted-foreground" />
                        {entry.userName ?? "-"}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(entry.createdAt).toLocaleString("pt-BR")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
