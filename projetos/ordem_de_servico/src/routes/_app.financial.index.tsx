import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { financialService } from "@/modules/financial/service";
import type { FinancialDashboardStats } from "@/modules/financial/types";
import { Landmark, CreditCard, HandCoins, AlertTriangle, DollarSign, TrendingUp, TrendingDown, ArrowRightLeft } from "lucide-react";

export const Route = createFileRoute("/_app/financial/")({
  head: () => ({ meta: [{ title: "Financial Dashboard — ServiceForge" }] }),
  component: FinancialDashboard,
});

function FinancialDashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<FinancialDashboardStats | null>(null);

  useEffect(() => { financialService.getDashboard().then(setStats); }, []);

  if (!stats) return <div className="text-sm text-muted-foreground">Loading...</div>;

  const cards = [
    { icon: Landmark, label: t("fin.totalAccounts"), value: stats.totalAccounts, color: "text-blue-500" },
    { icon: DollarSign, label: t("fin.currentBalance"), value: `R$ ${stats.currentBalance.toFixed(2)}`, color: "text-emerald-500" },
    { icon: TrendingUp, label: t("fin.monthlyIncome"), value: `R$ ${stats.monthlyIncome.toFixed(2)}`, color: "text-green-500" },
    { icon: TrendingDown, label: t("fin.monthlyExpense"), value: `R$ ${stats.monthlyExpense.toFixed(2)}`, color: "text-red-500" },
    { icon: ArrowRightLeft, label: t("fin.cashFlow"), value: `R$ ${stats.cashFlow.toFixed(2)}`, color: stats.cashFlow >= 0 ? "text-green-500" : "text-red-500" },
    { icon: CreditCard, label: t("fin.totalPayable"), value: `R$ ${stats.totalPayable.toFixed(2)}`, color: "text-orange-500" },
    { icon: HandCoins, label: t("fin.totalReceivable"), value: `R$ ${stats.totalReceivable.toFixed(2)}`, color: "text-cyan-500" },
    { icon: AlertTriangle, label: t("fin.overduePayable"), value: `R$ ${stats.overduePayable.toFixed(2)}`, color: "text-red-500" },
    { icon: AlertTriangle, label: t("fin.overdueReceivable"), value: `R$ ${stats.overdueReceivable.toFixed(2)}`, color: "text-amber-500" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">{t("fin.dashboard")}</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {cards.map((card, i) => (
          <div key={i} className="border rounded-lg p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <card.icon className={`w-5 h-5 ${card.color}`} />
              <span className="text-xs text-muted-foreground">{card.label}</span>
            </div>
            <span className="text-lg font-bold">{card.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
