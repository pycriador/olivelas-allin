import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { customerService } from "@/modules/customers/service";

export const Route = createFileRoute("/_app/service-orders/customers/$id/warranties")({
  head: () => ({ meta: [{ title: "Garantias — ServiceForge" }] }),
  component: CustomerWarrantiesPage,
});

function CustomerWarrantiesPage() {
  const { id } = Route.useParams();
  const { t } = useTranslation();

  const { data: customer, isLoading } = useQuery({
    queryKey: ["customer", id],
    queryFn: () => customerService.get(id),
  });

  const warranties = customer?.warranties ?? [];

  const statusColors: Record<string, string> = {
    active: "bg-green-100 text-green-700",
    expired: "bg-gray-100 text-gray-700",
    cancelled: "bg-red-100 text-red-700",
  };
  const statusLabels: Record<string, string> = {
    active: "Ativa",
    expired: "Expirada",
    cancelled: "Cancelada",
  };

  if (isLoading) return <div className="flex items-center justify-center py-12"><p className="text-sm text-muted-foreground">Carregando...</p></div>;
  if (!customer) return <div className="flex items-center justify-center py-12"><p className="text-sm text-muted-foreground">Cliente não encontrado</p></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Garantias</h1>
        <p className="text-sm text-muted-foreground">Garantias associadas ao cliente</p>
      </div>

      {warranties.length === 0 ? (
        <Card><CardContent><p className="py-12 text-center text-sm text-muted-foreground">Nenhuma garantia registrada</p></CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="p-3 font-medium">Equipamento</th>
                  <th className="p-3 font-medium">OS</th>
                  <th className="p-3 font-medium">Tipo</th>
                  <th className="p-3 font-medium">Início</th>
                  <th className="p-3 font-medium">Fim</th>
                  <th className="p-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {warranties.map((w) => (
                  <tr key={w.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="p-3 font-medium">{w.equipmentName ?? "-"}</td>
                    <td className="p-3">{w.serviceOrderId ?? "-"}</td>
                    <td className="p-3">{w.warrantyType}</td>
                    <td className="p-3">{new Date(w.startDate).toLocaleDateString("pt-BR")}</td>
                    <td className="p-3">{new Date(w.endDate).toLocaleDateString("pt-BR")}</td>
                    <td className="p-3">
                      <Badge className={statusColors[w.status]} variant="outline">{statusLabels[w.status]}</Badge>
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
