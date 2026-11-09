import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { purchasingService } from "@/modules/purchasing/service";
import type { PurchaseReceiving } from "@/modules/purchasing/types";

export const Route = createFileRoute("/_app/purchasing/receiving")({
  head: () => ({ meta: [{ title: "Goods Receiving — ServiceForge" }] }),
  component: ReceivingPage,
});

function ReceivingPage() {
  const { t } = useTranslation();
  const [receivings, setReceivings] = useState<PurchaseReceiving[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => { purchasingService.listReceivings().then(setReceivings); }, []);

  const statusColors: Record<string, string> = { ok: "bg-green-100 text-green-700", damaged: "bg-red-100 text-red-700", missing: "bg-amber-100 text-amber-700", replaced: "bg-blue-100 text-blue-700" };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">{t("pur.receiving.title")}</h2>
      <div className="flex flex-col gap-2">
        {receivings.map((r) => (
          <div key={r.id} className="border rounded-lg">
            <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50" onClick={() => setExpanded(expanded === r.id ? null : r.id)}>
              <div className="flex items-center gap-4">
                <span className="font-mono text-xs font-medium">{r.number}</span>
                <span className="text-sm">{r.supplierName}</span>
                <span className="text-xs text-muted-foreground">{r.document}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">{r.receivedDate}</span>
                <span className="text-xs text-muted-foreground">{r.receivedBy}</span>
              </div>
            </div>
            {expanded === r.id && (
              <div className="border-t p-3">
                <div className="mb-2 text-xs text-muted-foreground">{t("pur.receiving.order")}: {r.purchaseOrderNumber}</div>
                <table className="w-full text-sm">
                  <thead><tr><th className="text-left p-2">{t("inv.movements.product")}</th><th className="text-left p-2">{t("pur.receiving.expected")}</th><th className="text-left p-2">{t("pur.receiving.received")}</th><th className="text-left p-2">Status</th></tr></thead>
                  <tbody>
                    {r.items.map((item) => (
                      <tr key={item.id} className="border-t">
                        <td className="p-2">{item.productName}</td>
                        <td className="p-2">{item.expectedQuantity}</td>
                        <td className="p-2">{item.receivedQuantity}</td>
                        <td className="p-2"><span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[item.status] || ""}`}>{t(`pur.status.${item.status}`)}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {r.notes && <div className="mt-2 text-xs text-muted-foreground">{t("pur.receiving.notes")}: {r.notes}</div>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
