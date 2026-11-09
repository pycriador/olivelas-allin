import { createFileRoute, Outlet, Link, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { Cable, LayoutDashboard, Puzzle, ShoppingBag, Plug, Webhook, Globe, RefreshCw, ScrollText, HeartPulse, Activity, FileJson } from "lucide-react";

export const Route = createFileRoute("/_app/integrations")({
  head: () => ({ meta: [{ title: "Integration Platform — ServiceForge" }] }),
  component: IntegrationsLayout,
});

const tabs = [
  { path: "/integrations", icon: LayoutDashboard, labelKey: "nav.intDashboard" },
  { path: "/integrations/connectors", icon: Puzzle, labelKey: "nav.intConnectors" },
  { path: "/integrations/marketplace", icon: ShoppingBag, labelKey: "nav.intMarketplace" },
  { path: "/integrations/connections", icon: Plug, labelKey: "nav.intConnections" },
  { path: "/integrations/webhooks", icon: Webhook, labelKey: "nav.intWebhooks" },
  { path: "/integrations/apis", icon: Globe, labelKey: "nav.intApis" },
  { path: "/integrations/syncs", icon: RefreshCw, labelKey: "nav.intSyncs" },
  { path: "/integrations/logs", icon: ScrollText, labelKey: "nav.intLogs" },
  { path: "/integrations/health", icon: HeartPulse, labelKey: "nav.intHealth" },
  { path: "/integrations/monitoring", icon: Activity, labelKey: "nav.intMonitoring" },
  { path: "/integrations/templates", icon: FileJson, labelKey: "nav.intTemplates" },
];

function IntegrationsLayout() {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-3">
        <Cable className="w-6 h-6 text-cyan-500" />
        <div>
          <h1 className="text-xl font-bold">{t("int.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("int.subtitle")}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1 border-b pb-2">
        {tabs.map((tab) => {
          const isActive = location.pathname === `/app${tab.path}`;
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-t-md transition-colors ${
                isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"
              }`}
            >
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
