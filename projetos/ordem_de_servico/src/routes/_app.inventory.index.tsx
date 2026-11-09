import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { inventoryService } from "@/modules/inventory/service";
import type { InventoryDashboardStats } from "@/modules/inventory/types";
import { Package, Warehouse, DollarSign, AlertTriangle, PackageX, ArrowRightLeft, ClipboardList } from "lucide-react";

export const Route = createFileRoute("/_app/inventory/")({
  head: () => ({ meta: [{ title: "Inventory Dashboard — ServiceForge" }] }),
  component: InventoryDashboard,
});

function InventoryDashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<InventoryDashboardStats | null>(null);

  useEffect(() => { inventoryService.getDashboard().then(setStats); }, []);

  if (!stats) return <div className="text-sm text-muted-foreground">Loading...</div>;

  const cards = [
    { icon: Package, label: t("inv.totalProducts"), value: stats.totalProducts, color: "text-blue-500" },
    { icon: Warehouse, label: t("inv.totalWarehouses"), value: stats.totalWarehouses, color: "text-green-500" },
    { icon: DollarSign, label: t("inv.totalStockValue"), value: `R$ ${stats.totalStockValue.toFixed(2)}`, color: "text-emerald-500" },
    { icon: AlertTriangle, label: t("inv.lowStockItems"), value: stats.lowStockItems, color: "text-amber-500" },
    { icon: PackageX, label: t("inv.outOfStockItems"), value: stats.outOfStockItems, color: "text-red-500" },
    { icon: ArrowRightLeft, label: "Movimentações", value: stats.totalMovements, color: "text-purple-500" },
    { icon: ClipboardList, label: "Inventários Pendentes", value: stats.pendingCounts, color: "text-cyan-500" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">{t("inv.dashboard")}</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <div key={i} className="border rounded-lg p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <card.icon className={`w-5 h-5 ${card.color}`} />
              <span className="text-xs text-muted-foreground">{card.label}</span>
            </div>
            <span className="text-2xl font-bold">{card.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
