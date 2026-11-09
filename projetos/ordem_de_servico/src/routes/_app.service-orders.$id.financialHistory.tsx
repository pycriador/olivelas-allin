import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { serviceOrderService } from "@/modules/service-orders/service";
import type { SOFinancialHistoryEntry } from "@/modules/service-orders/types";

export const Route = createFileRoute("/_app/service-orders/$id/financialHistory")({
  head: () => ({ meta: [{ title: "Histórico Financeiro — ServiceForge" }] }),
  component: FinancialHistoryTab,
});

const typeConfig: Record<string, { label: string; color: string; positive: boolean }> = {
  budget_created: { label: "Orçamento Criado", color: "bg-blue-100 text-blue-700", positive: false },
  budget_approved: { label: "Orçamento Aprovado", color: "bg-green-100 text-green-700", positive: true },
  budget_rejected: { label: "Orçamento Rejeitado", color: "bg-red-100 text-red-700", positive: false },
  payment_added: { label: "Pagamento Adicionado", color: "bg-indigo-100 text-indigo-700", positive: true },
  payment_confirmed: { label: "Pagamento Confirmado", color: "bg-green-100 text-green-700", positive: true },
  payment_cancelled: { label: "Pagamento Cancelado", color: "bg-red-100 text-red-700", positive: false },
  receipt_generated: { label: "Recibo Gerado", color: "bg-purple-100 text-purple-700", positive: false },
  delivery_completed: { label: "Entrega Concluída", color: "bg-cyan-100 text-cyan-700", positive: false },
  closed: { label: "OS Encerrada", color: "bg-gray-100 text-gray-700", positive: false },
};

function FinancialHistoryTab() {
  const { id } = Route.useParams();
  const { t } = useTranslation();

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["so-financial-history", id],
    queryFn: () => serviceOrderService.getFinancialHistory(id),
  });

  if (isLoading) return <div className="flex items-center justify-center py-12"><p className="text-sm text-muted-foreground">{t("common.loading")}</p></div>;

  const currentBalance = entries.length > 0 ? (entries[0].newBalance ?? 0) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <DollarSign className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Histórico Financeiro</h2>
      </div>

      {entries.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Saldo Atual</span>
              <span className={`text-2xl font-bold ${currentBalance >= 0 ? "text-green-600" : "text-red-600"}`}>
                R$ {currentBalance.toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {entries.length === 0 ? (
        <Card><CardContent><p className="py-8 text-center text-sm text-muted-foreground">Nenhum registro financeiro.</p></CardContent></Card>
      ) : (
        <Card>
          <CardHeader><CardTitle className="text-base">Movimentações</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {entries.map((entry) => {
                const config = typeConfig[entry.type] ?? { label: entry.type, color: "bg-gray-100 text-gray-700", positive: false };
                const isIncome = config.positive || (entry.value != null && entry.value >= 0);
                return (
                  <div key={entry.id} className="flex items-center justify-between text-sm border-b pb-3 last:border-0">
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${config.color}`}>
                        {isIncome ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{entry.description}</span>
                          <Badge className={config.color} variant="outline">{config.label}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{new Date(entry.createdAt).toLocaleString("pt-BR")}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {entry.value != null && (
                        <p className={`font-medium ${isIncome ? "text-green-600" : "text-red-600"}`}>
                          {isIncome ? "+" : ""}R$ {entry.value.toFixed(2)}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {entry.previousBalance != null && `Ant: R$ ${entry.previousBalance.toFixed(2)}`}
                        {entry.previousBalance != null && entry.newBalance != null && " → "}
                        {entry.newBalance != null && `Novo: R$ ${entry.newBalance.toFixed(2)}`}
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
