import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { erpService } from "@/modules/erp/service";
import type { ERPDashboardStats } from "@/modules/erp/types";
import { Building2, Building, GitBranch, FileText, DollarSign, Clock, ScrollText } from "lucide-react";

export const Route = createFileRoute("/_app/erp/")({
  head: () => ({ meta: [{ title: "ERP Dashboard — ServiceForge" }] }),
  component: ERPDashboard,
});

function ERPDashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<ERPDashboardStats | null>(null);
  useEffect(() => { erpService.getDashboard().then(setStats); }, []);
  if (!stats) return <div className="text-sm text-muted-foreground">Loading...</div>;

  const cards = [
    { icon: Building2, label: t("erp.totalCompanies"), value: stats.totalCompanies, color: "text-violet-500" },
    { icon: Building, label: t("erp.activeCompanies"), value: stats.activeCompanies, color: "text-green-500" },
    { icon: GitBranch, label: t("erp.totalDepartments"), value: stats.totalDepartments, color: "text-blue-500" },
    { icon: FileText, label: t("erp.activeContracts"), value: stats.activeContracts, color: "text-emerald-500" },
    { icon: DollarSign, label: t("erp.totalContractValue"), value: `R$ ${stats.totalContractValue.toFixed(2)}`, color: "text-amber-500" },
    { icon: Clock, label: t("erp.expiredContracts"), value: stats.expiredContracts, color: "text-red-500" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">{t("erp.dashboard")}</h2>
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
