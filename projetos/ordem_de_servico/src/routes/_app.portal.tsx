import { createFileRoute, Outlet, Link, useLocation } from "@tanstack/react-router";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Home, ClipboardList, Share2, Upload, ThumbsUp,
  ShieldCheck, Download, History, Palette, BarChart3, Settings2,
  ChevronDown, ChevronRight,
} from "lucide-react";

export const Route = createFileRoute("/_app/portal")({
  component: PortalLayout,
});

const NAV_ITEMS = [
  { label: "Início", icon: Home, path: "/portal/home" },
  { label: "Ordens Públicas", icon: ClipboardList, path: "/portal/orders" },
  { label: "Compartilhamentos", icon: Share2, path: "/portal/shares" },
  { label: "Uploads", icon: Upload, path: "/portal/uploads" },
  { label: "Aprovações", icon: ThumbsUp, path: "/portal/approvals" },
  { label: "Garantias", icon: ShieldCheck, path: "/portal/guarantees" },
  { label: "Downloads", icon: Download, path: "/portal/downloads" },
  { label: "Auditoria", icon: History, path: "/portal/audit" },
  { label: "Branding", icon: Palette, path: "/portal/branding" },
  { label: "Analytics", icon: BarChart3, path: "/portal/analytics" },
  { label: "Configurações", icon: Settings2, path: "/portal/config" },
];

function PortalLayout() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      <aside className={cn("border-r shrink-0 bg-background hidden lg:block transition-all", collapsed ? "w-14" : "w-56")}>
        <div className="flex items-center justify-between p-4 border-b">
          {!collapsed && (
            <div>
              <h2 className="text-lg font-bold tracking-tight">Portal Público</h2>
              <p className="text-xs text-muted-foreground">Atendimento ao Cliente</p>
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
