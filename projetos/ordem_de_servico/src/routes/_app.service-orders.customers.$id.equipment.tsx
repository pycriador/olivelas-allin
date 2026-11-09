import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Wrench } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { customerService } from "@/modules/customers/service";

export const Route = createFileRoute("/_app/service-orders/customers/$id/equipment")({
  head: () => ({ meta: [{ title: "Equipamentos — ServiceForge" }] }),
  component: CustomerEquipmentPage,
});

function CustomerEquipmentPage() {
  const { id } = Route.useParams();
  const { t } = useTranslation();

  const { data: customer, isLoading } = useQuery({
    queryKey: ["customer", id],
    queryFn: () => customerService.get(id),
  });

  const equipments = customer?.equipments ?? [];

  if (isLoading) return <div className="flex items-center justify-center py-12"><p className="text-sm text-muted-foreground">Carregando...</p></div>;
  if (!customer) return <div className="flex items-center justify-center py-12"><p className="text-sm text-muted-foreground">Cliente não encontrado</p></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Equipamentos</h1>
        <p className="text-sm text-muted-foreground">Equipamentos do cliente</p>
      </div>

      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-4 flex items-center gap-3">
          <Wrench className="h-5 w-5 text-amber-600" />
          <p className="text-sm text-amber-800">Módulo de Equipamentos será implementado na Sprint 27</p>
        </CardContent>
      </Card>

      {equipments.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Equipamentos Cadastrados</CardTitle></CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="p-3 font-medium">Tipo</th>
                  <th className="p-3 font-medium">Marca</th>
                  <th className="p-3 font-medium">Modelo</th>
                  <th className="p-3 font-medium">Número de Série</th>
                  <th className="p-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {equipments.map((eq) => (
                  <tr key={eq.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="p-3 font-medium">{eq.type}</td>
                    <td className="p-3">{eq.brand}</td>
                    <td className="p-3">{eq.model}</td>
                    <td className="p-3">{eq.serialNumber}</td>
                    <td className="p-3"><Badge variant="outline">{eq.status}</Badge></td>
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
