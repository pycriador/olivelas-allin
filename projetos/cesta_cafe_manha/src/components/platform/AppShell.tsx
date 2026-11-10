import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { Boxes, LayoutDashboard, LogOut, Moon, Package, Receipt, Sun, Users } from "lucide-react";

import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { applyTheme, getStoredTheme, type Theme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { logActivity } from "@/services/account";
import { ROLE_LABEL, type AppRole, type Profile } from "@/types/domain";

type NavItem = {
  label: string;
  icon: typeof LayoutDashboard;
  to?: "/painel" | "/usuarios" | "/produtos";
  roles: AppRole[];
};

const NAV_GROUPS: { group: string; items: NavItem[] }[] = [
  {
    group: "Operação",
    items: [
      {
        label: "Painel",
        icon: LayoutDashboard,
        to: "/painel",
        roles: ["administrador", "estoque", "financeiro", "consulta"],
      },
      { label: "Produtos", icon: Package, to: "/produtos", roles: ["administrador", "estoque", "consulta"] },
      { label: "Estoque", icon: Boxes, roles: ["administrador", "estoque", "consulta"] },
    ],
  },
  {
    group: "Gestão",
    items: [
      { label: "Financeiro", icon: Receipt, roles: ["administrador", "financeiro", "consulta"] },
      { label: "Usuários", icon: Users, to: "/usuarios", roles: ["administrador"] },
    ],
  },
];

function useTheme() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const stored = getStoredTheme();
    setTheme(stored);
    applyTheme(stored);
  }, []);

  return {
    theme,
    toggle: () => {
      const next: Theme = theme === "dark" ? "light" : "dark";
      setTheme(next);
      applyTheme(next);
    },
  };
}

export function AppShell({
  profile,
  roles,
  title,
  description,
  children,
}: {
  profile: Profile;
  roles: AppRole[];
  title: string;
  description: string;
  children: ReactNode;
}) {
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function handleSignOut() {
    await logActivity(profile.id, "logout");
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const initials = (profile.full_name ?? profile.email).slice(0, 2).toUpperCase();

  return (
    <div className="relative flex min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-0 aurora-field opacity-60" aria-hidden />

      <aside className="relative z-10 hidden w-60 shrink-0 flex-col border-r border-border bg-sidebar/80 lg:flex">
        <div className="px-5 py-5">
          <Logo subtitle={false} />
        </div>
        <nav className="flex-1 space-y-6 px-3">
          {NAV_GROUPS.map((group) => {
            const items = group.items.filter((item) => item.roles.some((role) => roles.includes(role)));
            if (items.length === 0) return null;
            return (
              <div key={group.group}>
                <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {group.group}
                </p>
                {items.map((item) =>
                  item.to ? (
                    <Link
                      key={item.label}
                      to={item.to}
                      activeProps={{ className: "bg-foreground/10 text-foreground" }}
                      className="mt-0.5 flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
                    >
                      <item.icon className="size-4" />
                      {item.label}
                    </Link>
                  ) : (
                    <span
                      key={item.label}
                      title="Módulo em construção"
                      className="mt-0.5 flex cursor-not-allowed items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] text-muted-foreground/50"
                    >
                      <item.icon className="size-4" />
                      {item.label}
                      <span className="ml-auto text-[10px] uppercase tracking-wide">em breve</span>
                    </span>
                  ),
                )}
              </div>
            );
          })}
        </nav>
        <div className="border-t border-border px-5 py-4 text-[11px] text-muted-foreground">
          <p className="font-medium text-foreground">{roles.map((role) => ROLE_LABEL[role]).join(" · ")}</p>
          <p className="mt-0.5">Catálogo sem versões</p>
        </div>
      </aside>

      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-border px-6 py-3.5">
          <div className="min-w-0">
            <h1 className="truncate text-[17px] font-bold tracking-tight">{title}</h1>
            <p className="truncate text-xs text-muted-foreground">{description}</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={toggle} aria-label="Alternar tema">
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
            <div className="flex items-center gap-2.5">
              <span className="grid size-8 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                {initials}
              </span>
              <div className="hidden sm:block">
                <p className="text-[13px] font-medium leading-none">{profile.full_name ?? profile.email}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{profile.email}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleSignOut} aria-label="Sair">
              <LogOut className="size-4" />
            </Button>
          </div>
        </header>

        <main className={cn("flex-1 px-6 py-6")}>{children}</main>
      </div>
    </div>
  );
}
