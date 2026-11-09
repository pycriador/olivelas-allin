import { createFileRoute, Outlet, Link, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, BarChart3, PieChart, Activity, Database, FileText,
  Palette, Download, Clock, History, Settings2, Grid3X3,
  ChevronDown, ChevronRight, TrendingUp, Table2,
} from "lucide-react";

export const Route = createFileRoute("/_app/reporting")({
  component: ReportingRoute,
});

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/reporting/dashboard" },
  { label: "Dashboards", icon: Grid3X3, path: "/reporting/dashboards" },
  { label: "Relatórios", icon: FileText, path: "/reporting/reports" },
  { label: "Widgets", icon: Table2, path: "/reporting/widgets" },
  { label: "Gráficos", icon: PieChart, path: "/reporting/charts" },
  { label: "Datasets", icon: Database, path: "/reporting/datasets" },
  { label: "KPIs", icon: TrendingUp, path: "/reporting/kpis" },
  { label: "Templates", icon: Palette, path: "/reporting/templates" },
  { label: "Exportações", icon: Download, path: "/reporting/exports" },
  { label: "Agendamentos", icon: Clock, path: "/reporting/schedules" },
  { label: "Histórico", icon: History, path: "/reporting/history" },
  { label: "Configurações", icon: Settings2, path: "/reporting/config" },
];

function ReportingRoute() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      <aside className={cn("border-r shrink-0 bg-background hidden lg:block transition-all", collapsed ? "w-14" : "w-56")}>
        <div className="flex items-center justify-between p-4 border-b">
          {!collapsed && (
            <div>
              <h2 className="text-lg font-bold tracking-tight">Reporting & BI</h2>
              <p className="text-xs text-muted-foreground">Plataforma de Analytics</p>
            </div>
          )}
          <button onClick={() => setCollapsed(!collapsed)} className="text-muted-foreground hover:text-foreground p-1">
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
        <ScrollArea className="h-[calc(100%-4rem)] py-2 px-2">
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                    isActive ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>
      </aside>
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
