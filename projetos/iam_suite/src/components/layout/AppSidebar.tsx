import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Users, Shield, UserCircle, Settings, Layers } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";

export function AppSidebar() {
  const { t } = useTranslation();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const path = useRouterState({ select: (r) => r.location.pathname });
  const { isAdmin } = useAuth();

  const main = [
    { to: "/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
    { to: "/profile", label: t("nav.profile"), icon: UserCircle },
    { to: "/settings", label: t("nav.settings"), icon: Settings },
  ];
  const admin = [
    { to: "/admin/users", label: t("nav.users"), icon: Users },
    { to: "/admin/groups", label: t("nav.groups"), icon: Layers },
  ];

  const isActive = (p: string) => path === p || path.startsWith(p + "/");

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="border-b">
        <Link to="/dashboard" className="flex items-center gap-2 px-2 py-3">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-primary-foreground shadow-glow">
            <Shield className="h-4 w-4" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="font-display text-sm font-bold tracking-tight">Olivelas - IAM Suite</span>
              <span className="text-[10px] text-muted-foreground">Governança & Acessos</span>
            </div>
          )}
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("nav.dashboard")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {main.map((i) => (
                <SidebarMenuItem key={i.to}>
                  <SidebarMenuButton asChild isActive={isActive(i.to)} tooltip={i.label}>
                    <Link to={i.to}>
                      <i.icon className="h-4 w-4" />
                      <span>{i.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>{t("nav.admin")}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {admin.map((i) => (
                  <SidebarMenuItem key={i.to}>
                    <SidebarMenuButton asChild isActive={isActive(i.to)} tooltip={i.label}>
                      <Link to={i.to}>
                        <i.icon className="h-4 w-4" />
                        <span>{i.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter className="border-t p-2 text-[10px] text-muted-foreground">
        {!collapsed && <span>v1.0 · {t("app.name")}</span>}
      </SidebarFooter>
    </Sidebar>
  );
}
