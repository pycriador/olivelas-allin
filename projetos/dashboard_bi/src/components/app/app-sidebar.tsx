import { Link, useRouterState } from "@tanstack/react-router";
import {
  Home,
  FileBarChart,
  LayoutDashboard,
  LineChart,
  Star,
  Shield,
  User,
  Settings,
  HelpCircle,
  Database,
} from "lucide-react";
import { Plug, BookOpen, FolderTree, Columns3, Eye, FileText, Terminal } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  const { t } = useTranslation();
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  const main = [
    { to: "/", label: t("nav.home"), icon: Home },
    { to: "/reports", label: t("nav.reports"), icon: FileBarChart },
    { to: "/dashboards", label: t("nav.dashboards"), icon: LayoutDashboard },
    { to: "/analytics", label: t("nav.analytics"), icon: LineChart },
    { to: "/favorites", label: t("nav.favorites"), icon: Star },
  ];
  const dataNav = [
    { to: "/data-sources", label: t("nav.dataSources"), icon: Plug },
    { to: "/data-catalog", label: t("nav.dataCatalog"), icon: BookOpen },
    { to: "/explorer", label: t("nav.explorer"), icon: FolderTree },
    { to: "/sql-studio", label: "SQL Studio", icon: Terminal },
    { to: "/schemas", label: t("nav.schemas"), icon: Columns3 },
    { to: "/views", label: t("nav.views"), icon: Eye },
    { to: "/metadata", label: t("nav.metadata"), icon: FileText },
  ];
  const personalNav = [
    { to: "/admin", label: t("nav.admin"), icon: Shield },
    { to: "/profile", label: t("nav.profile"), icon: User },
    { to: "/settings", label: t("nav.settings"), icon: Settings },
    { to: "/help", label: t("nav.help"), icon: HelpCircle },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Database className="h-4 w-4" />
          </div>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold">Olivelas - Dashboard BI</span>
            <span className="text-xs text-muted-foreground">Analytics Enterprise</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("nav.workspace")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {main.map((it) => (
                <SidebarMenuItem key={it.to}>
                  <SidebarMenuButton asChild isActive={pathname === it.to} tooltip={it.label}>
                    <Link to={it.to}>
                      <it.icon className="h-4 w-4" />
                      <span>{it.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>{t("nav.data")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {dataNav.map((it) => (
                <SidebarMenuItem key={it.to}>
                  <SidebarMenuButton asChild isActive={pathname === it.to} tooltip={it.label}>
                    <Link to={it.to}>
                      <it.icon className="h-4 w-4" />
                      <span>{it.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>{t("nav.personal")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {personalNav.map((it) => (
                <SidebarMenuItem key={it.to}>
                  <SidebarMenuButton asChild isActive={pathname === it.to} tooltip={it.label}>
                    <Link to={it.to}>
                      <it.icon className="h-4 w-4" />
                      <span>{it.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="px-2 py-2 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
          © {new Date().getFullYear()} {t("app.name")}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
