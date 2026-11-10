import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Folder,
  FolderTree,

  Star,
  BookMarked,
  Library,
  Trash2,
  Settings,
  Shield,
  Sparkles,
  ChevronsLeft,
  ChevronsRight,
  Boxes,
} from "lucide-react";
import { motion } from "framer-motion";
import { useUIStore } from "@/stores/ui.store";
import { useT } from "@/stores/i18n.store";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", icon: LayoutDashboard, key: "nav.dashboard" },
  { to: "/projects", icon: Folder, key: "nav.projects" },
  { to: "/explorer", icon: FolderTree, key: "nav.explorer" },
  { to: "/favorites", icon: Star, key: "nav.favorites" },
  { to: "/templates", icon: BookMarked, key: "nav.templates" },
  { to: "/library", icon: Library, key: "nav.library" },
  { to: "/trash", icon: Trash2, key: "nav.trash" },
] as const;


const bottomItems = [
  { to: "/settings", icon: Settings, key: "nav.settings" },
  { to: "/admin", icon: Shield, key: "nav.admin" },
] as const;

export function AppSidebar() {
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggle = useUIStore((s) => s.toggleSidebar);
  const t = useT();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <motion.aside
      animate={{ width: collapsed ? 68 : 248 }}
      transition={{ type: "spring", stiffness: 260, damping: 30 }}
      className="sticky top-0 flex h-screen flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground"
    >
      <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
          <Sparkles className="h-4 w-4" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">Olivelas - Engenharia de Especificações</div>
            <div className="truncate text-[11px] text-sidebar-foreground/60">
              Spec-Driven Engineering
            </div>
          </div>
        )}
      </div>

      {!collapsed && (
        <div className="mx-3 mt-3 rounded-md border border-sidebar-border/60 bg-sidebar-accent/40 p-2">
          <div className="flex items-center gap-2">
            <Boxes className="h-4 w-4 text-sidebar-foreground/70" />
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-wide text-sidebar-foreground/60">
                {t("nav.workspace")}
              </div>
              <div className="truncate text-xs font-medium">Acme Engineering</div>
            </div>
          </div>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto p-2">
        <ul className="space-y-0.5">
          {items.map((it) => {
            const active = pathname === it.to || (it.to !== "/" && pathname.startsWith(it.to));
            const Icon = it.icon;
            return (
              <li key={it.to}>
                <Link
                  to={it.to}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    active && "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
                    collapsed && "justify-center",
                  )}
                  title={collapsed ? t(it.key) : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span className="truncate">{t(it.key)}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-sidebar-border p-2">
        <ul className="space-y-0.5">
          {bottomItems.map((it) => {
            const active = pathname.startsWith(it.to);
            const Icon = it.icon;
            return (
              <li key={it.to}>
                <Link
                  to={it.to}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent",
                    active && "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
                    collapsed && "justify-center",
                  )}
                  title={collapsed ? t(it.key) : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span className="truncate">{t(it.key)}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
        <button
          onClick={toggle}
          className={cn(
            "mt-2 flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-sidebar-foreground/60 hover:bg-sidebar-accent",
            collapsed && "justify-center",
          )}
        >
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </motion.aside>
  );
}
