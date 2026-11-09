import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { inventoryService } from "@/modules/inventory/service";
import type { WarehouseBin } from "@/modules/inventory/types";

export const Route = createFileRoute("/_app/inventory/bins")({
  head: () => ({ meta: [{ title: "Bins — ServiceForge" }] }),
  component: BinsPage,
});

function BinsPage() {
  const { t } = useTranslation();
  const [bins, setBins] = useState<WarehouseBin[]>([]);

  useEffect(() => { inventoryService.listBins().then(setBins); }, []);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">{t("inv.bins.title")}</h2>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-3">{t("inv.bins.code")}</th>
              <th className="text-left p-3">{t("inv.warehouses.title")}</th>
              <th className="text-left p-3">{t("inv.bins.description")}</th>
              <th className="text-left p-3">{t("inv.bins.maxCapacity")}</th>
              <th className="text-left p-3">{t("inv.bins.currentCapacity")}</th>
              <th className="text-left p-3">{t("inv.warehouses.active")}</th>
            </tr>
          </thead>
          <tbody>
            {bins.map((b) => (
              <tr key={b.id} className="border-t">
                <td className="p-3 font-mono text-xs font-medium">{b.code}</td>
                <td className="p-3">{b.warehouseName}</td>
                <td className="p-3 text-muted-foreground">{b.description}</td>
                <td className="p-3">{b.maxCapacity}</td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${(b.currentCapacity || 0) > (b.maxCapacity || 1) * 0.8 ? "bg-red-400" : (b.currentCapacity || 0) > (b.maxCapacity || 1) * 0.5 ? "bg-amber-400" : "bg-green-400"}`}
                        style={{ width: `${Math.min(100, ((b.currentCapacity || 0) / (b.maxCapacity || 1)) * 100)}%` }} />
                    </div>
                    <span className="text-xs">{b.currentCapacity}/{b.maxCapacity}</span>
                  </div>
                </td>
                <td className="p-3">{b.active ? "Sim" : "Não"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
