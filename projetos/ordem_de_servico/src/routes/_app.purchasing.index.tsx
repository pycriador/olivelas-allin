import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { purchasingService } from "@/modules/purchasing/service";
import type { PurchaseDashboardStats } from "@/modules/purchasing/types";
import { FileText, Truck, Clock, DollarSign, Users, PackageCheck } from "lucide-react";

export const Route = createFileRoute("/_app/purchasing/")({
  head: () => ({ meta: [{ title: "Purchasing Dashboard — ServiceForge" }] }),
  component: PurchasingDashboard,
});

function PurchasingDashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<PurchaseDashboardStats | null>(null);

  useEffect(() => { purchasingService.getDashboard().then(setStats); }, []);

  if (!stats) return <div className="text-sm text-muted-foreground">Loading...</div>;

  const cards = [
    { icon: FileText, label: t("pur.totalOrders"), value: stats.totalOrders, color: "text-blue-500" },
    { icon: Clock, label: t("pur.pendingOrders"), value: stats.pendingOrders, color: "text-amber-500" },
    { icon: PackageCheck, label: t("pur.ordersToReceive"), value: stats.ordersToReceive, color: "text-purple-500" },
    { icon: DollarSign, label: t("pur.totalMonthValue"), value: `R$ ${stats.totalMonthValue.toFixed(2)}`, color: "text-green-500" },
    { icon: Users, label: t("pur.totalSuppliers"), value: stats.totalSuppliers, color: "text-cyan-500" },
    { icon: Truck, label: t("pur.avgDeliveryDays"), value: `${stats.avgDeliveryDays} dias`, color: "text-orange-500" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">{t("pur.dashboard")}</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
