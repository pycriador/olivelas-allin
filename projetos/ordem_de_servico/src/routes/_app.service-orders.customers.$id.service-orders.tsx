import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { customerService } from "@/modules/customers/service";

export const Route = createFileRoute("/_app/service-orders/customers/$id/service-orders")({
  head: () => ({ meta: [{ title: "Ordens de Serviço — ServiceForge" }] }),
  component: CustomerServiceOrdersPage,
});

function CustomerServiceOrdersPage() {
  const { id } = Route.useParams();
  const { t } = useTranslation();

  const { data: customer, isLoading } = useQuery({
    queryKey: ["customer", id],
    queryFn: () => customerService.get(id),
  });

  const serviceOrders = customer?.serviceOrders ?? [];

  if (isLoading) return <div className="flex items-center justify-center py-12"><p className="text-sm text-muted-foreground">Carregando...</p></div>;
  if (!customer) return <div className="flex items-center justify-center py-12"><p className="text-sm text-muted-foreground">Cliente não encontrado</p></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Ordens de Serviço</h1>
        <p className="text-sm text-muted-foreground">Ordens de serviço do cliente</p>
      </div>

      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-4 flex items-center gap-3">
          <ClipboardList className="h-5 w-5 text-amber-600" />
          <p className="text-sm text-amber-800">Módulo de Ordens de Serviço será implementado na Sprint 28</p>
        </CardContent>
      </Card>

      {serviceOrders.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Ordens de Serviço</CardTitle></CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="p-3 font-medium">Número</th>
                  <th className="p-3 font-medium">Data</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium">Equipamento</th>
                  <th className="p-3 font-medium">Valor</th>
                </tr>
              </thead>
              <tbody>
                {serviceOrders.map((so) => (
                  <tr key={so.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="p-3 font-medium">
                      <Link to="/service-orders/$id" params={{ id: so.id }} className="hover:underline">{so.number}</Link>
                    </td>
                    <td className="p-3">{new Date(so.date).toLocaleDateString("pt-BR")}</td>
                    <td className="p-3"><Badge variant="outline">{so.status}</Badge></td>
                    <td className="p-3">{so.equipment}</td>
                    <td className="p-3">R$ {so.value.toFixed(2)}</td>
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
