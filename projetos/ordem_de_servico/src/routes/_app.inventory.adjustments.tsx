import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { inventoryService } from "@/modules/inventory/service";
import type { StockAdjustment } from "@/modules/inventory/types";

export const Route = createFileRoute("/_app/inventory/adjustments")({
  head: () => ({ meta: [{ title: "Stock Adjustments — ServiceForge" }] }),
  component: AdjustmentsPage,
});

function AdjustmentsPage() {
  const { t } = useTranslation();
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);

  useEffect(() => { inventoryService.listAdjustments().then(setAdjustments); }, []);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">{t("inv.adjustments.title")}</h2>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-3">{t("inv.adjustments.type")}</th>
              <th className="text-left p-3">{t("inv.movements.product")}</th>
              <th className="text-left p-3">{t("inv.adjustments.previousQty")}</th>
              <th className="text-left p-3">{t("inv.adjustments.newQty")}</th>
              <th className="text-left p-3">{t("inv.adjustments.difference")}</th>
              <th className="text-left p-3">{t("inv.adjustments.reason")}</th>
              <th className="text-left p-3">{t("inv.adjustments.authorizedBy")}</th>
              <th className="text-left p-3">Data</th>
            </tr>
          </thead>
          <tbody>
            {adjustments.map((a) => (
              <tr key={a.id} className="border-t">
                <td className="p-3"><span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{t(`inv.adjustments.type.${a.type}` as any)}</span></td>
                <td className="p-3">{a.productName}</td>
                <td className="p-3">{a.previousQuantity}</td>
                <td className="p-3">{a.newQuantity}</td>
                <td className="p-3"><span className={`font-semibold ${a.difference >= 0 ? "text-green-500" : "text-red-500"}`}>{a.difference >= 0 ? "+" : ""}{a.difference}</span></td>
                <td className="p-3 text-muted-foreground">{a.reason}</td>
                <td className="p-3">{a.authorizedBy}</td>
                <td className="p-3 text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
