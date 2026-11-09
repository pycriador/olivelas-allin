import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { inventoryService } from "@/modules/inventory/service";
import type { StockAlert } from "@/modules/inventory/types";

export const Route = createFileRoute("/_app/inventory/alerts")({
  head: () => ({ meta: [{ title: "Stock Alerts — ServiceForge" }] }),
  component: AlertsPage,
});

function AlertsPage() {
  const { t } = useTranslation();
  const [alerts, setAlerts] = useState<StockAlert[]>([]);

  useEffect(() => { inventoryService.listAlerts().then(setAlerts); }, []);

  const statusColors: Record<string, string> = { low: "text-amber-500 bg-amber-50", out: "text-red-500 bg-red-50", overstock: "text-blue-500 bg-blue-50", normal: "text-green-500 bg-green-50" };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">{t("inv.alerts.title")}</h2>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-3">{t("inv.movements.product")}</th>
              <th className="text-left p-3">{t("inv.warehouses.title")}</th>
              <th className="text-left p-3">{t("inv.products.currentStock")}</th>
              <th className="text-left p-3">{t("inv.products.minStock")}</th>
              <th className="text-left p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((a) => (
              <tr key={a.id} className="border-t">
                <td className="p-3 font-medium">{a.productName}</td>
                <td className="p-3">{a.warehouseName}</td>
                <td className="p-3 font-semibold">{a.currentStock}</td>
                <td className="p-3">{a.minStock}</td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[a.status] || ""}`}>
                    {t(`inv.alerts.${a.status}`)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
