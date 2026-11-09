import { createFileRoute, Outlet, Link, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { Brain, LayoutDashboard, Puzzle, Play, ScanText, Eye, ListOrdered, Clock, ShieldCheck, Settings, TableProperties } from "lucide-react";

export const Route = createFileRoute("/_app/ai")({
  head: () => ({ meta: [{ title: "AI Platform — ServiceForge" }] }),
  component: AIPlatformLayout,
});

const tabs = [
  { path: "/ai", icon: LayoutDashboard, labelKey: "nav.aiDashboard" },
  { path: "/ai/providers", icon: Puzzle, labelKey: "nav.aiProviders" },
  { path: "/ai/prompts", icon: Brain, labelKey: "nav.aiPrompts" },
  { path: "/ai/playground", icon: Play, labelKey: "nav.aiPlayground" },
  { path: "/ai/ocr", icon: ScanText, labelKey: "nav.aiOcr" },
  { path: "/ai/vision", icon: Eye, labelKey: "nav.aiVision" },
  { path: "/ai/queue", icon: ListOrdered, labelKey: "nav.aiQueue" },
  { path: "/ai/history", icon: Clock, labelKey: "nav.aiHistory" },
  { path: "/ai/audit", icon: ShieldCheck, labelKey: "nav.aiAudit" },
  { path: "/ai/config", icon: Settings, labelKey: "nav.aiConfig" },
  { path: "/ai/conference", icon: TableProperties, labelKey: "nav.aiConference" },
];

function AIPlatformLayout() {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-3">
        <Brain className="w-6 h-6 text-purple-500" />
        <div>
          <h1 className="text-xl font-bold">{t("ai.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("ai.subtitle")}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1 border-b pb-2">
        {tabs.map((tab) => {
          const isActive = location.pathname === `/app${tab.path}` || (tab.path === "/ai" && location.pathname === "/app/ai");
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-t-md transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-muted-foreground"
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
