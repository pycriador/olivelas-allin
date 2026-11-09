import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  BarChart3,
  Building2,
  CreditCard,
  Gauge,
  LayoutDashboard,
  ListOrdered,
  Menu,
  Plug,
  ScrollText,
  Settings,
  ShieldCheck,
  Ticket,
  Trophy,
  Users,
  Wallet,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { OrganizationSwitcher } from "@/components/app/OrganizationSwitcher";
import { ThemeToggle } from "@/components/app/ThemeToggle";
import { UserMenu } from "@/components/app/UserMenu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useTenant } from "@/hooks/useTenant";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  to?: string;
  icon: typeof LayoutDashboard;
  soon?: boolean;
}

const APP_NAV: { section: string; items: NavItem[] }[] = [
  {
    section: "Visão geral",
    items: [{ label: "Dashboard", to: "/dashboard", icon: LayoutDashboard }],
  },
  {
    section: "Operação",
    items: [
      { label: "Campanhas", to: "/campaigns", icon: Ticket },
      { label: "Participantes", to: "/participants", icon: Users },
      { label: "Números", icon: ListOrdered, soon: true },
      { label: "Pedidos", icon: Wallet, soon: true },
      { label: "Pagamentos", to: "/payments", icon: CreditCard },
      { label: "Sorteios", icon: Trophy, soon: true },
      { label: "Relatórios", icon: BarChart3, soon: true },
    ],
  },
  {
    section: "Configurações",
    items: [
      { label: "Organização", to: "/settings/organization", icon: Building2 },
      { label: "Usuários", to: "/settings/users", icon: Users },
      { label: "Integrações", icon: Plug, soon: true },
      { label: "Plano", to: "/settings/plan", icon: CreditCard },
      { label: "Uso", to: "/settings/usage", icon: Gauge },
      { label: "Auditoria", to: "/settings/audit", icon: ScrollText },
    ],
  },
];

const PLATFORM_NAV: { section: string; items: NavItem[] }[] = [
  {
    section: "Plataforma",
    items: [
      { label: "Painel", to: "/platform", icon: ShieldCheck },
      { label: "Organizações", icon: Building2, soon: true },
      { label: "Planos globais", icon: CreditCard, soon: true },
      { label: "Auditoria global", icon: Activity, soon: true },
    ],
  },
];

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { isGlobalAdmin } = useTenant();
  const groups = isGlobalAdmin ? [...APP_NAV, ...PLATFORM_NAV] : APP_NAV;

  return (
    <nav className="space-y-6 px-3 py-4">
      {groups.map((group) => (
        <div key={group.section}>
          <p className="px-3 pb-2 text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
            {group.section}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const Icon = item.icon;
              if (!item.to) {
                return (
                  <li key={item.label}>
                    <span
                      className="flex cursor-not-allowed items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground/70"
                      title="Disponível em uma próxima etapa"
                    >
                      <Icon className="size-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                      <Badge variant="outline" className="ml-auto text-[0.6rem]">
                        breve
                      </Badge>
                    </span>
                  </li>
                );
              }
              const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
              return (
                <li key={item.label}>
                  <Link
                    to={item.to}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <Link to="/dashboard" className="flex items-center gap-2 px-4 py-4">
      <span className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground">
        <Ticket className="size-4" />
      </span>
      <span className="font-display text-base font-semibold">RaffleHub</span>
    </Link>
  );
}

export function AppShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const { isSuspended, organization } = useTenant();

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar lg:flex lg:flex-col">
        <Brand />
        <ScrollArea className="flex-1">
          <NavList />
        </ScrollArea>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-border bg-background/85 px-4 backdrop-blur">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-sidebar p-0">
              <SheetTitle className="sr-only">Navegação</SheetTitle>
              <Brand />
              <ScrollArea className="h-[calc(100vh-4rem)]">
                <NavList onNavigate={() => setOpen(false)} />
              </ScrollArea>
            </SheetContent>
          </Sheet>

          <OrganizationSwitcher />
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <UserMenu />
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-6xl space-y-6">
            {isSuspended && organization ? (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-foreground">
                Esta organização está <strong>{organization.status === "SUSPENDED" ? "suspensa" : "inativa"}</strong>.
                Operações de escrita estão bloqueadas até a reativação.
              </div>
            ) : null}

            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="font-display text-2xl font-semibold tracking-tight">{title}</h1>
                {description ? (
                  <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                ) : null}
              </div>
              {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
            </div>

            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
