import { useMemo } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { Search, LogOut, User as UserIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import { supabase } from "@/integrations/supabase/client";
import { LanguageSwitcher } from "./language-switcher";
import { ThemeSwitcher } from "./theme-switcher";
import { useCurrentProfile } from "@/shared/hooks/use-current-profile";

export function AppHeader() {
  const { t } = useTranslation();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data } = useCurrentProfile();

  const crumbs = useMemo(() => {
    const parts = pathname.split("/").filter(Boolean);
    return parts.map((p, i) => ({
      href: "/" + parts.slice(0, i + 1).join("/"),
      label: t(`nav.${mapSlugToKey(p)}` as const, { defaultValue: p }),
      last: i === parts.length - 1,
    }));
  }, [pathname, t]);

  async function handleSignOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    toast.success(t("auth.signedOut"));
    navigate({ to: "/auth", replace: true });
  }

  const initials = (data?.profile?.full_name ?? data?.profile?.email ?? "?")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/95 px-3 backdrop-blur">
      <SidebarTrigger />
      <Separator orientation="vertical" className="mx-1 h-6" />
      <Breadcrumb className="hidden sm:block">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/dashboard">{t("app.name")}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {crumbs.map((c) => (
            <span key={c.href} className="flex items-center gap-1.5">
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {c.last ? (
                  <BreadcrumbPage>{c.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={c.href}>{c.label}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </span>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="ml-auto flex items-center gap-2">
        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("common.search")}
            className="h-9 w-64 pl-8"
            disabled
          />
        </div>
        <LanguageSwitcher />
        <ThemeSwitcher />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex flex-col">
              <span className="text-sm font-medium">
                {data?.profile?.full_name ?? "—"}
              </span>
              <span className="text-xs text-muted-foreground">
                {data?.profile?.email ?? ""}
              </span>
              {data?.tenant && (
                <span className="mt-1 text-xs text-muted-foreground">
                  {data.tenant.name}
                </span>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/configuracoes">
                <UserIcon className="mr-2 h-4 w-4" /> {t("nav.settings")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" /> {t("auth.signOut")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

function mapSlugToKey(slug: string): string {
  const map: Record<string, string> = {
    dashboard: "dashboard",
    agenda: "agenda",
    clientes: "clients",
    profissionais: "professionals",
    eventos: "events",
    bloqueios: "blocks",
    "tipos-atendimento": "appointmentTypes",
    horarios: "schedules",
    "grupos-horarios": "scheduleGroups",
    usuarios: "users",
    configuracoes: "settings",
  };
  return map[slug] ?? slug;
}
