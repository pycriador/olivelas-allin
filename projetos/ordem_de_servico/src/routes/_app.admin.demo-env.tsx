import { createFileRoute, Outlet, Link, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { seedDemoEnv } from "@/modules/demo-env/seeds";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Beaker, FlaskConical, Upload, Download,
  BarChart3, History, ScrollText, Activity, ShieldCheck,
  ChevronDown, ChevronRight, Container,
} from "lucide-react";

export const Route = createFileRoute("/_app/admin/demo-env")({
  component: DemoEnvLayout,
});

const NAV_ITEMS: { labelKey: string; icon: typeof LayoutDashboard; path: string }[] = [
  { labelKey: "nav.adminDemoDashboard", icon: LayoutDashboard, path: "/admin/demo-env" },
  { labelKey: "nav.adminDemoScenarios", icon: Beaker, path: "/admin/demo-env/scenarios" },
  { labelKey: "nav.adminDemoGenerator", icon: FlaskConical, path: "/admin/demo-env/generator" },
  { labelKey: "nav.adminDemoSeeds", icon: Activity, path: "/admin/demo-env/seeds" },
  { labelKey: "nav.adminDemoExport", icon: Upload, path: "/admin/demo-env/export" },
  { labelKey: "nav.adminDemoImport", icon: Download, path: "/admin/demo-env/import" },
  { labelKey: "nav.adminDemoStatistics", icon: BarChart3, path: "/admin/demo-env/statistics" },
  { labelKey: "nav.adminDemoHistory", icon: History, path: "/admin/demo-env/history" },
  { labelKey: "nav.adminDemoLogs", icon: ScrollText, path: "/admin/demo-env/logs" },
  { labelKey: "nav.adminDemoDiagnosis", icon: Activity, path: "/admin/demo-env/diagnosis" },
  { labelKey: "nav.adminDemoIntegrity", icon: ShieldCheck, path: "/admin/demo-env/integrity" },
];

function DemoEnvLayout() {
  const { t } = useTranslation();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    seedDemoEnv().catch(() => {});
  }, []);

  const isActive = (p: string) => location.pathname === p;

  return (
    <div className="flex h-full">
      <aside className={cn(
        "border-r shrink-0 bg-background transition-all duration-200",
        collapsed ? "w-12" : "w-56"
      )}>
        <ScrollArea className="h-full py-4">
          <div className="mb-4 px-3">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="flex items-center gap-2 text-sm font-semibold tracking-tight hover:text-foreground/80 transition-colors"
            >
              {collapsed ? <Container className="h-5 w-5" /> : (
                <>
                  <Container className="h-5 w-5 shrink-0" />
                  <span>{t("nav.adminDemoEnv")}</span>
                </>
              )}
            </button>
          </div>
          <nav className="space-y-0.5">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors mx-1",
                  isActive(item.path)
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                title={collapsed ? t(item.labelKey) : undefined}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="truncate">{t(item.labelKey)}</span>}
              </Link>
            ))}
          </nav>
        </ScrollArea>
      </aside>
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
