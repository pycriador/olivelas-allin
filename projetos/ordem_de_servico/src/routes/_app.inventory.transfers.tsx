import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { inventoryService } from "@/modules/inventory/service";
import type { TransferOrder } from "@/modules/inventory/types";

export const Route = createFileRoute("/_app/inventory/transfers")({
  head: () => ({ meta: [{ title: "Transfer Orders — ServiceForge" }] }),
  component: TransfersPage,
});

function TransfersPage() {
  const { t } = useTranslation();
  const [transfers, setTransfers] = useState<TransferOrder[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => { inventoryService.listTransfers().then(setTransfers); }, []);

  const statusColors: Record<string, string> = { draft: "bg-gray-100 text-gray-500", in_transit: "bg-blue-100 text-blue-700", completed: "bg-green-100 text-green-700", cancelled: "bg-red-100 text-red-700" };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">{t("inv.transfers.title")}</h2>
      <div className="flex flex-col gap-2">
        {transfers.map((tr) => (
          <div key={tr.id} className="border rounded-lg">
            <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50" onClick={() => setExpanded(expanded === tr.id ? null : tr.id)}>
              <div className="flex items-center gap-4">
                <span className="font-mono text-xs font-medium">{tr.number}</span>
                <span className="text-sm">{tr.fromWarehouseName} → {tr.toWarehouseName}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[tr.status] || ""}`}>{t(`inv.status.${tr.status}`)}</span>
              </div>
              <span className="text-xs text-muted-foreground">{tr.items.length} itens</span>
            </div>
            {expanded === tr.id && (
              <div className="border-t p-3">
                <table className="w-full text-sm">
                  <thead><tr><th className="text-left p-2">{t("inv.movements.product")}</th><th className="text-left p-2">Qtd</th><th className="text-left p-2">{t("inv.transfers.status")}</th></tr></thead>
                  <tbody>
                    {tr.items.map((item) => (
                      <tr key={item.id} className="border-t">
                        <td className="p-2">{item.productName}</td>
                        <td className="p-2">{item.quantity}</td>
                        <td className="p-2"><span className="text-xs">{item.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
