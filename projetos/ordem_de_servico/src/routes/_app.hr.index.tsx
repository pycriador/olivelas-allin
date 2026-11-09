import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { hrService } from "@/modules/hr/service";
import type { HRDashboardStats } from "@/modules/hr/types";
import { Users, Users2, Umbrella, Clock, DollarSign, Percent } from "lucide-react";

export const Route = createFileRoute("/_app/hr/")({
  head: () => ({ meta: [{ title: "HR Dashboard — ServiceForge" }] }),
  component: HRDashboard,
});

function HRDashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<HRDashboardStats | null>(null);
  useEffect(() => { hrService.getDashboard().then(setStats); }, []);
  if (!stats) return <div className="text-sm text-muted-foreground">Loading...</div>;

  const cards = [
    { icon: Users, label: t("hr.totalEmployees"), value: stats.totalEmployees, color: "text-blue-500" },
    { icon: Users2, label: t("hr.activeEmployees"), value: stats.activeEmployees, color: "text-green-500" },
    { icon: Umbrella, label: t("hr.vacationEmployees"), value: stats.vacationEmployees, color: "text-cyan-500" },
    { icon: Clock, label: t("hr.pendingTimeSheets"), value: stats.pendingTimeSheets, color: "text-amber-500" },
    { icon: DollarSign, label: t("hr.monthlyPayrollTotal"), value: `R$ ${stats.monthlyPayrollTotal.toFixed(2)}`, color: "text-emerald-500" },
    { icon: Percent, label: t("hr.pendingCommissions"), value: `R$ ${stats.pendingCommissions.toFixed(2)}`, color: "text-red-500" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">{t("hr.dashboard")}</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map((card, i) => (
          <div key={i} className="border rounded-lg p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2"><card.icon className={`w-5 h-5 ${card.color}`} /><span className="text-xs text-muted-foreground">{card.label}</span></div>
            <span className="text-2xl font-bold">{card.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
