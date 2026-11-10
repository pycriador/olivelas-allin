import { Link, Outlet, useRouter } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import {
  FileText,
  LayoutDashboard,
  Users,
  UsersRound,
  Shield,
  Settings,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  Search,
  Bell,
  ChevronRight,
  Building2,
  Code2,
  Plug,
  Workflow,
  Activity,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { OrgSwitcher } from "@/components/org/org-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/stores/auth-store";
import type { Permission } from "@/types/auth";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: Permission;
}

const NAV: NavItem[] = [
  { to: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard, permission: "view_dashboard" },
  { to: "/forms", labelKey: "nav.forms", icon: FileText, permission: "create_forms" },
  { to: "/users", labelKey: "nav.users", icon: Users, permission: "manage_users" },
  { to: "/groups", labelKey: "nav.groups", icon: UsersRound, permission: "manage_groups" },
  { to: "/permissions", labelKey: "nav.permissions", icon: Shield, permission: "manage_permissions" },
  { to: "/organization", labelKey: "nav.organization", icon: Building2 },
  { to: "/developer", labelKey: "nav.developer", icon: Code2 },
  { to: "/integrations", labelKey: "nav.integrations", icon: Plug },
  { to: "/automations", labelKey: "nav.automations", icon: Workflow },
  { to: "/system", labelKey: "nav.system", icon: Activity },
];

export function AppLayout() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, logout, hasPermission, isHydrated, init } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    void init();
  }, [init]);

  // Auth guard (client-side; we ship CSR)
  useEffect(() => {
    if (isHydrated && !user) {
      router.navigate({ to: "/login" });
    }
  }, [isHydrated, user, router]);

  useEffect(() => {
    setMobileOpen(false);
  }, [router.state.location.pathname]);

  if (!isHydrated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground/40 border-t-foreground" />
      </div>
    );
  }

  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const visibleNav = NAV.filter(
    (n) => !n.permission || hasPermission(n.permission),
  );

  const pathname = router.state.location.pathname;
  const currentNav = visibleNav.find((n) => pathname.startsWith(n.to));

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-300",
          collapsed ? "w-[72px]" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "md:translate-x-0",
        )}
      >
        <div className="flex h-16 items-center justify-between px-4">
          <Link to="/dashboard">
            <Logo showText={!collapsed} size="sm" />
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-3">
          {visibleNav.map((item) => {
            const active = pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{t(item.labelKey)}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t p-3 space-y-1">
          <Link
            to="/profile"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
              pathname.startsWith("/profile")
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60",
            )}
          >
            <UserIcon className="h-4 w-4" />
            {!collapsed && <span>{t("nav.profile")}</span>}
          </Link>
          <Link
            to="/settings"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
              pathname.startsWith("/settings")
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60",
            )}
          >
            <Settings className="h-4 w-4" />
            {!collapsed && <span>{t("nav.settings")}</span>}
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div
        className={cn(
          "flex min-h-screen flex-1 flex-col transition-[padding] duration-300",
          collapsed ? "md:pl-[72px]" : "md:pl-64",
        )}
      >
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur md:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="hidden md:inline-flex"
            onClick={() => setCollapsed((c) => !c)}
            aria-label="Toggle sidebar"
          >
            <Menu className="h-4 w-4" />
          </Button>

          <div className="hidden items-center gap-2 text-sm text-muted-foreground md:flex">
            <span>{t("common.appName")}</span>
            {currentNav && (
              <>
                <ChevronRight className="h-3.5 w-3.5" />
                <span className="font-medium text-foreground">
                  {t(currentNav.labelKey)}
                </span>
              </>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="hidden sm:block">
              <OrgSwitcher />
            </div>
            <div className="relative hidden md:block">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("common.search")}
                className="h-9 w-56 pl-8"
              />
            </div>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Bell className="h-4 w-4" />
            </Button>
            <LanguageSwitcher compact />
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full pl-1 pr-2 py-1 transition hover:bg-accent">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm font-medium md:inline">
                    {user.name.split(" ")[0]}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="flex flex-col">
                  <span className="text-sm font-medium">{user.name}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {user.email}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.navigate({ to: "/profile" })}>
                  <UserIcon className="mr-2 h-4 w-4" /> {t("nav.profile")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.navigate({ to: "/settings" })}>
                  <Settings className="mr-2 h-4 w-4" /> {t("nav.settings")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    void logout();
                    router.navigate({ to: "/login" });
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" /> {t("common.signOut")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <Outlet />
        </main>

        <footer className="border-t px-6 py-4 text-xs text-muted-foreground">
          © {new Date().getFullYear()} IAM Pro Forms · Enterprise platform
        </footer>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-foreground/30 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </div>
  );
}
