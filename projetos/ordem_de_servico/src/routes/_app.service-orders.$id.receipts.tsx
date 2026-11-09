import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, FileSpreadsheet, FileBadge, FileCheck, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { serviceOrderService } from "@/modules/service-orders/service";
import type { SOReceipt } from "@/modules/service-orders/types";

export const Route = createFileRoute("/_app/service-orders/$id/receipts")({
  head: () => ({ meta: [{ title: "Recibos — ServiceForge" }] }),
  component: ReceiptsTab,
});

const receiptConfig: Record<string, { icon: typeof FileText; label: string; color: string }> = {
  entry: { icon: FileDown, label: "Entrada", color: "bg-blue-100 text-blue-700" },
  payment: { icon: FileText, label: "Pagamento", color: "bg-green-100 text-green-700" },
  withdrawal: { icon: FileSpreadsheet, label: "Retirada", color: "bg-orange-100 text-orange-700" },
  proof: { icon: FileCheck, label: "Comprovante", color: "bg-purple-100 text-purple-700" },
  warranty: { icon: FileBadge, label: "Garantia", color: "bg-cyan-100 text-cyan-700" },
};

function ReceiptsTab() {
  const { id } = Route.useParams();
  const { t } = useTranslation();
  const qc = useQueryClient();

  const { data: receipts = [], isLoading } = useQuery({
    queryKey: ["so-receipts", id],
    queryFn: () => serviceOrderService.getReceipts(id),
  });

  const generateReceipt = useMutation({
    mutationFn: (type: SOReceipt["type"]) => serviceOrderService.generateReceipt(id, type, "Admin"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["so-receipts", id] });
      qc.invalidateQueries({ queryKey: ["service-order", id] });
      toast("Recibo gerado");
    },
    onError: () => toast("Erro ao gerar recibo"),
  });

  if (isLoading) return <div className="flex items-center justify-center py-12"><p className="text-sm text-muted-foreground">{t("common.loading")}</p></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Recibos</h2>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Gerar Recibos</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(receiptConfig).map(([type, config]) => {
              const Icon = config.icon;
              return (
                <Button key={type} variant="outline" size="sm" onClick={() => generateReceipt.mutate(type as SOReceipt["type"])}>
                  <Icon className="mr-1 h-4 w-4" />Recibo de {config.label}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {receipts.length === 0 ? (
        <Card><CardContent><p className="py-8 text-center text-sm text-muted-foreground">Nenhum recibo gerado.</p></CardContent></Card>
      ) : (
        <Card>
          <CardHeader><CardTitle className="text-base">Recibos Gerados</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {receipts.map((receipt) => {
                const config = receiptConfig[receipt.type] ?? { icon: FileText, label: receipt.type, color: "bg-gray-100 text-gray-700" };
                const Icon = config.icon;
                return (
                  <div key={receipt.id} className="flex items-center justify-between text-sm border-b pb-3 last:border-0">
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{receipt.number}</p>
                        <Badge className={config.color} variant="outline">{config.label}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{new Date(receipt.generatedAt).toLocaleString("pt-BR")}</span>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <FileDown className="h-3 w-3" />
                      </Button>
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
