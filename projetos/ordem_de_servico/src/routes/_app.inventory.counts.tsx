import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { inventoryService } from "@/modules/inventory/service";
import type { InventoryCount } from "@/modules/inventory/types";

export const Route = createFileRoute("/_app/inventory/counts")({
  head: () => ({ meta: [{ title: "Inventory Counts — ServiceForge" }] }),
  component: CountsPage,
});

function CountsPage() {
  const { t } = useTranslation();
  const [counts, setCounts] = useState<InventoryCount[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => { inventoryService.listCounts().then(setCounts); }, []);

  const statusColors: Record<string, string> = { draft: "bg-gray-100 text-gray-500", in_progress: "bg-blue-100 text-blue-700", completed: "bg-green-100 text-green-700", approved: "bg-emerald-100 text-emerald-700" };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">{t("inv.counts.title")}</h2>
      <div className="flex flex-col gap-2">
        {counts.map((c) => (
          <div key={c.id} className="border rounded-lg">
            <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50" onClick={() => setExpanded(expanded === c.id ? null : c.id)}>
              <div className="flex items-center gap-4">
                <span className="font-medium">{c.warehouseName}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[c.status] || ""}`}>{t(`inv.status.${c.status}`)}</span>
                <span className="text-sm text-muted-foreground">{c.countDate}</span>
              </div>
              <span className="text-xs text-muted-foreground">{c.items.length} itens{c.notes ? ` — ${c.notes}` : ""}</span>
            </div>
            {expanded === c.id && (
              <div className="border-t p-3">
                <table className="w-full text-sm">
                  <thead><tr><th className="text-left p-2">{t("inv.movements.product")}</th><th className="text-left p-2">{t("inv.counts.expected")}</th><th className="text-left p-2">{t("inv.counts.counted")}</th><th className="text-left p-2">{t("inv.counts.difference")}</th></tr></thead>
                  <tbody>
                    {c.items.map((item) => (
                      <tr key={item.id} className="border-t">
                        <td className="p-2">{item.productName}</td>
                        <td className="p-2">{item.expectedQuantity}</td>
                        <td className="p-2">{item.countedQuantity}</td>
                        <td className="p-2"><span className={`font-semibold ${item.difference >= 0 ? "text-green-500" : "text-red-500"}`}>{item.difference >= 0 ? "+" : ""}{item.difference}</span></td>
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
