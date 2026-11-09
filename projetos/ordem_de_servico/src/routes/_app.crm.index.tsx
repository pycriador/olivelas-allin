import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { crmService } from "@/modules/crm/service";
import type { CRMDashboardStats } from "@/modules/crm/types";
import { Users, UserPlus, CheckCircle2, TrendingUp, DollarSign, Trophy, FileCheck, Megaphone } from "lucide-react";

export const Route = createFileRoute("/_app/crm/")({
  head: () => ({ meta: [{ title: "CRM Dashboard — ServiceForge" }] }),
  component: CRMDashboard,
});

function CRMDashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<CRMDashboardStats | null>(null);
  useEffect(() => { crmService.getDashboard().then(setStats); }, []);
  if (!stats) return <div className="text-sm text-muted-foreground">Loading...</div>;

  const cards = [
    { icon: Users, label: t("crm.totalLeads"), value: stats.totalLeads, color: "text-blue-500" },
    { icon: UserPlus, label: t("crm.newLeads"), value: stats.newLeads, color: "text-cyan-500" },
    { icon: CheckCircle2, label: t("crm.convertedLeads"), value: stats.convertedLeads, color: "text-green-500" },
    { icon: TrendingUp, label: t("crm.activeOpportunities"), value: stats.activeOpportunities, color: "text-violet-500" },
    { icon: DollarSign, label: t("crm.pipelineValue"), value: `R$ ${stats.pipelineValue.toFixed(2)}`, color: "text-amber-500" },
    { icon: Trophy, label: t("crm.wonValue"), value: `R$ ${stats.wonValue.toFixed(2)}`, color: "text-emerald-500" },
    { icon: FileCheck, label: t("crm.activeAgreements"), value: stats.activeAgreements, color: "text-indigo-500" },
    { icon: Megaphone, label: t("crm.campaignCount"), value: stats.campaignCount, color: "text-pink-500" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">{t("crm.dashboard")}</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
