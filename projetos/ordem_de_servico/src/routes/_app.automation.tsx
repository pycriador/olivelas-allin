import { createFileRoute, Outlet, Link, useLocation } from "@tanstack/react-router";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Workflow, FileType, FileText, GitBranch, Map,
  CheckSquare, Calendar, Play, Clock, Terminal, History, Monitor,
  Shield, Settings2, ChevronDown, ChevronRight,
} from "lucide-react";

export const Route = createFileRoute("/_app/automation")({
  component: AutomationRoute,
});

const NAV_ITEMS = [
  { label: "Designer", icon: Workflow, path: "/automation/designer" },
  { label: "Workflows", icon: LayoutDashboard, path: "/automation/workflows" },
  { label: "Templates", icon: FileType, path: "/automation/templates" },
  { label: "Processos", icon: Play, path: "/automation/process" },
  { label: "Regras", icon: GitBranch, path: "/automation/rules" },
  { label: "Máquina de Estados", icon: Map, path: "/automation/statemachine" },
  { label: "Aprovações", icon: CheckSquare, path: "/automation/approvals" },
  { label: "Agendamentos", icon: Calendar, path: "/automation/scheduler" },
  { label: "Jobs", icon: Terminal, path: "/automation/jobs" },
  { label: "Timers", icon: Clock, path: "/automation/timers" },
  { label: "Scripts", icon: FileText, path: "/automation/scripts" },
  { label: "Histórico", icon: History, path: "/automation/history" },
  { label: "Monitor", icon: Monitor, path: "/automation/monitor" },
  { label: "Auditoria", icon: Shield, path: "/automation/audit" },
  { label: "Configurações", icon: Settings2, path: "/automation/config" },
];

function AutomationRoute() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      <aside className={cn("border-r shrink-0 bg-background hidden lg:block transition-all", collapsed ? "w-14" : "w-56")}>
        <div className="flex items-center justify-between p-4 border-b">
          {!collapsed && (
            <div>
              <h2 className="text-lg font-bold tracking-tight">Automação</h2>
              <p className="text-xs text-muted-foreground">Plataforma de Automação</p>
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
