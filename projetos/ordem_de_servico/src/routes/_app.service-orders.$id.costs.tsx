import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calculator, TrendingUp, TrendingDown, DollarSign, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { serviceOrderService } from "@/modules/service-orders/service";

export const Route = createFileRoute("/_app/service-orders/$id/costs")({
  head: () => ({ meta: [{ title: "Custos — ServiceForge" }] }),
  component: CostsTab,
});

function CostsTab() {
  const { id } = Route.useParams();
  const { t } = useTranslation();
  const qc = useQueryClient();

  const { data: costs, isLoading } = useQuery({
    queryKey: ["so-costs", id],
    queryFn: () => serviceOrderService.getCosts(id),
  });

  const { data: so } = useQuery({
    queryKey: ["service-order", id],
    queryFn: () => serviceOrderService.get(id),
  });

  const calculateCosts = useMutation({
    mutationFn: () => serviceOrderService.calculateCosts(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["so-costs", id] });
      toast("Custos calculados");
    },
    onError: () => toast("Erro ao calcular custos"),
  });

  if (isLoading) return <div className="text-center py-8 text-sm text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Custos</h2>
          <p className="text-sm text-muted-foreground">Análise de custos da ordem de serviço</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => calculateCosts.mutate()}>
          <RefreshCw className="mr-2 h-4 w-4" /> Calcular Custos
        </Button>
      </div>

      {costs ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium">Custos de Peças</CardTitle></CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">R$ {costs.partsCost.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium">Mão de Obra</CardTitle></CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">R$ {costs.laborCost.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium">Custos Adicionais</CardTitle></CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">R$ {costs.additionalCosts.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium">Terceiros</CardTitle></CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">R$ {costs.thirdPartyCosts.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium">Frete</CardTitle></CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">R$ {costs.shippingCost.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium">Desconto</CardTitle></CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-500">- R$ {costs.discount.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardHeader><CardTitle className="text-sm font-medium">Custo Total</CardTitle></CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">R$ {costs.totalCost.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium">Valor Final (OS)</CardTitle></CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">R$ {(so?.finalValue ?? 0).toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium">Margem</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <p className={`text-2xl font-bold ${costs.margin >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {costs.margin.toFixed(1)}%
                </p>
                {costs.margin >= 0 ? <TrendingUp className="h-5 w-5 text-green-600" /> : <TrendingDown className="h-5 w-5 text-red-600" />}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium">Lucro Estimado</CardTitle></CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${costs.estimatedProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                R$ {costs.estimatedProfit.toFixed(2)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium">Lucro Realizado</CardTitle></CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">R$ {costs.realizedProfit.toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center space-y-4">
            <Calculator className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Custos ainda não calculados</p>
            <Button onClick={() => calculateCosts.mutate()}>
              <RefreshCw className="mr-2 h-4 w-4" /> Calcular Custos Agora
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
