import { Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { NotificationsPopover } from "@/features/dashboard/ui/notifications-popover";
import { UserMenuButton } from "@/features/dashboard/ui/user-menu-button";
import { WorkspaceSwitcher } from "@/features/dashboard/ui/workspace-switcher";
import { useUIStore } from "@/stores/ui";

export function Topbar() {
  const setCommandPaletteOpen = useUIStore((s) => s.setCommandPaletteOpen);

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <WorkspaceSwitcher />
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setCommandPaletteOpen(true)}
          className="hidden items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm text-muted-foreground shadow-sm transition-colors hover:bg-accent sm:inline-flex"
          aria-label="Pesquisa global"
        >
          <Search className="size-3.5" />
          <span>Pesquisar...</span>
          <kbd className="pointer-events-none ml-4 inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
            Ctrl K
          </kbd>
        </button>
        <button
          type="button"
          onClick={() => setCommandPaletteOpen(true)}
          className="inline-flex items-center rounded-md border border-input bg-background px-2.5 py-1.5 text-sm text-muted-foreground shadow-sm sm:hidden"
          aria-label="Pesquisa global"
        >
          <Search className="size-4" />
        </button>
        <ThemeToggle />
        <NotificationsPopover />
        <Separator orientation="vertical" className="mx-1 h-4" />
        <UserMenuButton />
      </div>
    </header>
  );
}

export function Breadcrumbs() {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Link to="/dashboard" className="hover:text-foreground">
        Início
      </Link>
    </div>
  );
}
