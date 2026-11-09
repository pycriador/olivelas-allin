import { createFileRoute, Outlet, Link, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { HeartHandshake, LayoutDashboard, UserPlus, TrendingUp, FileCheck, Megaphone } from "lucide-react";

export const Route = createFileRoute("/_app/crm")({
  head: () => ({ meta: [{ title: "CRM — ServiceForge" }] }),
  component: CRMLayout,
});

const tabs = [
  { path: "/crm", icon: LayoutDashboard, labelKey: "nav.crmDashboard" },
  { path: "/crm/leads", icon: UserPlus, labelKey: "nav.crmLeads" },
  { path: "/crm/opportunities", icon: TrendingUp, labelKey: "nav.crmOpportunities" },
  { path: "/crm/agreements", icon: FileCheck, labelKey: "nav.crmAgreements" },
  { path: "/crm/campaigns", icon: Megaphone, labelKey: "nav.crmCampaigns" },
];

function CRMLayout() {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-3">
        <HeartHandshake className="w-6 h-6 text-rose-500" />
        <div>
          <h1 className="text-xl font-bold">{t("crm.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("crm.subtitle")}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1 border-b pb-2">
        {tabs.map((tab) => {
          const isActive = location.pathname === `/app${tab.path}`;
          return (
            <Link key={tab.path} to={tab.path}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-t-md transition-colors ${
                isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"
              }`}>
              <tab.icon className="w-4 h-4" />
              {t(tab.labelKey)}
            </Link>
          );
        })}
      </div>
      <Outlet />
    </div>
  );
}
