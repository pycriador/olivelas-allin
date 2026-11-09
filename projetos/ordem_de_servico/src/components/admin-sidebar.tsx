import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Building2, Users, Shield, KeyRound, Database, Settings,
  FileText, ScrollText, Monitor, ChevronLeft, Cuboid, Columns3, LayoutTemplate,
  Grip, LayoutPanelTop, SlidersHorizontal, FileJson, GitBranch, Star,
  type LucideIcon,
} from "lucide-react";

import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { APP_NAME, APP_VERSION } from "@/core/constants";
import { useMenuFavorites } from "@/hooks/use-menu-favorites";

interface NavItem {
  label: string;
  icon: LucideIcon;
  path: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "nav.adminDashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
  { label: "nav.adminCompanies", icon: Building2, path: "/admin/companies" },
  { label: "nav.adminUsers", icon: Users, path: "/admin/users" },
  { label: "nav.adminRoles", icon: Shield, path: "/admin/roles" },
  { label: "nav.adminPermissions", icon: KeyRound, path: "/admin/permissions" },
  { label: "nav.adminDatabase", icon: Database, path: "/admin/database" },
  { label: "nav.adminSettings", icon: Settings, path: "/admin/settings" },
  { label: "nav.adminLogs", icon: FileText, path: "/admin/logs" },
  { label: "nav.adminAudit", icon: ScrollText, path: "/admin/audit" },
  { label: "nav.adminSystem", icon: Monitor, path: "/admin/system" },
];

const METADATA_ITEMS: NavItem[] = [
  { label: "nav.metadataEntities", icon: Cuboid, path: "/admin/metadata/entities" },
  { label: "nav.metadataFields", icon: Columns3, path: "/admin/metadata/fields" },
  { label: "nav.metadataForms", icon: LayoutTemplate, path: "/admin/metadata/forms" },
  { label: "nav.metadataViews", icon: Grip, path: "/admin/metadata/views" },
  { label: "nav.metadataDashboards", icon: LayoutPanelTop, path: "/admin/metadata/dashboards" },
  { label: "nav.metadataConfig", icon: SlidersHorizontal, path: "/admin/metadata/config" },
  { label: "nav.metadataTemplates", icon: FileJson, path: "/admin/metadata/templates" },
  { label: "nav.metadataVersions", icon: GitBranch, path: "/admin/metadata/versions" },
];

function StarToggle({ path, isFav, onToggle }: { path: string; isFav: boolean; onToggle: (p: string) => void }) {
  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggle(path); }}
      className="flex items-center justify-center h-8 w-8 shrink-0 rounded-md hover:bg-accent transition-colors group-data-[collapsible=icon]:hidden"
      title={isFav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
    >
      <Star className={`h-3.5 w-3.5 ${isFav ? "text-amber-500 fill-amber-500" : "text-muted-foreground"}`} />
    </button>
  );
}

export function AdminSidebar() {
  const { t } = useTranslation();
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const isActive = (p: string) => pathname === p || pathname.startsWith(p + "/");
  const { isFavorite, toggleFavorite } = useMenuFavorites();

  const allItems = [...NAV_ITEMS, ...METADATA_ITEMS];
  const favoriteItems = allItems.filter((i) => isFavorite(i.path));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-destructive text-destructive-foreground font-bold">
            SF
          </div>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold">{t("admin.title")}</span>
            <span className="text-xs text-muted-foreground">v{APP_VERSION}</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {favoriteItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>{t("nav.favorites")}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {favoriteItems.map((item) => (
                  <SidebarMenuItem key={item.path}>
                    <div className="flex items-center w-full">
                      <SidebarMenuButton asChild isActive={isActive(item.path)} className="flex-1">
                        <Link to={item.path}>
                          <item.icon />
                          <span>{t(item.label)}</span>
                        </Link>
                      </SidebarMenuButton>
                      <StarToggle path={item.path} isFav={true} onToggle={toggleFavorite} />
                    </div>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupLabel>{t("admin.title")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <div className="flex items-center w-full">
                    <SidebarMenuButton asChild isActive={isActive(item.path)} className="flex-1">
                      <Link to={item.path}>
                        <item.icon />
                        <span>{t(item.label)}</span>
                      </Link>
                    </SidebarMenuButton>
                    <StarToggle path={item.path} isFav={isFavorite(item.path)} onToggle={toggleFavorite} />
                  </div>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>{t("modules.metadata")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {METADATA_ITEMS.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <div className="flex items-center w-full">
                    <SidebarMenuButton asChild isActive={isActive(item.path)} className="flex-1">
                      <Link to={item.path}>
                        <item.icon />
                        <span>{t(item.label)}</span>
                      </Link>
                    </SidebarMenuButton>
                    <StarToggle path={item.path} isFav={isFavorite(item.path)} onToggle={toggleFavorite} />
                  </div>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link to="/dashboard">
                <ChevronLeft />
                <span>{t("common.back")}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
