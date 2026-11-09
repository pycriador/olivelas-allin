import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Calendar,
  Users,
  UserCog,
  Gauge,
  CalendarClock,
  CalendarOff,
  Tag,
  Clock,
  Layers,
  UsersRound,
  CalendarSync,
  Settings,
  Sparkles,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, key: "dashboard" as const },
  { to: "/agenda", icon: Calendar, key: "agenda" as const },
  { to: "/disponibilidade", icon: Gauge, key: "availability" as const },
  { to: "/clientes", icon: Users, key: "clients" as const },
  { to: "/profissionais", icon: UserCog, key: "professionals" as const },
  { to: "/eventos", icon: CalendarClock, key: "events" as const },
  { to: "/bloqueios", icon: CalendarOff, key: "blocks" as const },
  { to: "/tipos-atendimento", icon: Tag, key: "appointmentTypes" as const },
  { to: "/horarios", icon: Clock, key: "schedules" as const },
  { to: "/grupos-horarios", icon: Layers, key: "scheduleGroups" as const },
  { to: "/usuarios", icon: UsersRound, key: "users" as const },
  { to: "/google-workspace", icon: CalendarSync, key: "googleWorkspace" as const },
  { to: "/configuracoes", icon: Settings, key: "settings" as const },
];

export function AppSidebar() {
  const { t } = useTranslation();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold">{t("app.name")}</span>
              <span className="text-xs text-muted-foreground">{t("app.tagline")}</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const active =
                  pathname === item.to || pathname.startsWith(item.to + "/");
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton asChild isActive={active} tooltip={t(`nav.${item.key}`)}>
                      <Link to={item.to} className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        <span>{t(`nav.${item.key}`)}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="px-2 py-2 text-xs text-muted-foreground">
          {!collapsed && <span>v0.1 · Foundation</span>}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
