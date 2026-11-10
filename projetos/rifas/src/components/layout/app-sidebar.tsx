import { Link, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  Clock,
  Contact,
  Eye,
  Grid3x3,
  Handshake,
  LayoutGrid,
  Palette,
  ScrollText,
  Settings,
  ShoppingBag,
  Ticket,
  Trophy,
  Users,
} from "lucide-react";

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
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { NAV_ITEMS, type NavItem } from "@/config/navigation";
import { useAuth } from "@/contexts/auth-context";
import { usePermissions } from "@/hooks/use-permissions";

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { role } = useAuth();
  const { can } = usePermissions();
  const canAccessAdmin = role === "GLOBAL_ADMIN" || role === "ADMIN";
  const pathname = useRouterState({ select: (router) => router.location.pathname });

  const isVisible = (item: NavItem) => {
    if (item.adminOnly && !canAccessAdmin) return false;
    if (item.permission && !can(item.permission)) return false;
    return true;
  };

  const mainItems = NAV_ITEMS.filter(isVisible).filter((item) => !item.section && item.url);

  const adminItems = NAV_ITEMS.filter(isVisible).filter(
    (item) => item.section === "admin" && item.url,
  );

  const campaignMatch = pathname.match(/^\/campanhas\/([^/]+)$/);
  const campaignId = campaignMatch?.[1];

  return (
    <Sidebar collapsible="icon" aria-label="Navegacao principal">
      <SidebarHeader className="border-b border-sidebar-border">
        <Link
          to="/dashboard"
          className="flex items-center gap-2.5 px-1.5 py-1.5"
          aria-label="RaffleHub — ir para o dashboard"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Ticket aria-hidden="true" className="size-4" />
          </span>
          {!collapsed && <span className="text-sm font-semibold tracking-tight">Olivelas - Rifas & Sorteios Digitais</span>}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Plataforma</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={pathname === item.url} tooltip={item.title}>
                    <Link to={item.url} className="flex items-center gap-2">
                      <item.icon aria-hidden="true" className="size-4" />
                      {!collapsed && <span className="flex-1 truncate">{item.title}</span>}
                      {!collapsed && !item.available && (
                        <Badge variant="secondary" className="text-[10px]">
                          Em breve
                        </Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {campaignId ? (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>Campanha</SidebarGroupLabel>
              <SidebarGroupContent>
                <CampaignSubNav campaignId={campaignId} collapsed={collapsed} pathname={pathname} />
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        ) : null}

        {adminItems.length > 0 ? (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>Administracao</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminItems.map((item) => (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.url}
                        tooltip={item.title}
                      >
                        <Link to={item.url} className="flex items-center gap-2">
                          <item.icon aria-hidden="true" className="size-4" />
                          {!collapsed && <span className="flex-1 truncate">{item.title}</span>}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        ) : null}
      </SidebarContent>
    </Sidebar>
  );
}

const CAMPAIGN_TABS = [
  { value: "overview", label: "Visao Geral", icon: BarChart3 },
  { value: "grid", label: "Grade Visual", icon: Grid3x3 },
  { value: "numbers", label: "Numeros", icon: LayoutGrid },
  { value: "orders", label: "Pedidos", icon: ShoppingBag },
  { value: "crm", label: "Clientes", icon: Handshake },
  { value: "participants", label: "Participantes", icon: Users },
  { value: "gallery", label: "Midia", icon: Palette },
  { value: "artwork", label: "Artes", icon: Eye },
  { value: "settings", label: "Configuracoes", icon: Settings },
  { value: "contact", label: "Contato", icon: Contact },
  { value: "reservations", label: "Reservas", icon: Clock },
  { value: "draw", label: "Sorteio", icon: Trophy },
  { value: "history", label: "Historico", icon: ScrollText },
];

function CampaignSubNav({
  campaignId,
  collapsed,
}: {
  campaignId: string;
  collapsed: boolean;
  pathname: string;
}) {
  const params =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams("");
  const currentTab = params.get("tab") || "overview";

  function navigateTab(tab: string) {
    const url = new URL(window.location.href);
    if (tab === "overview") {
      url.searchParams.delete("tab");
    } else {
      url.searchParams.set("tab", tab);
    }
    window.location.href = url.toString();
  }

  return (
    <SidebarMenu>
      {CAMPAIGN_TABS.map((tab) => {
        const activeTab = tab.value === currentTab || (tab.value === "overview" && !currentTab);
        return (
          <SidebarMenuItem key={tab.value}>
            <SidebarMenuButton
              isActive={activeTab}
              tooltip={tab.label}
              onClick={() => navigateTab(tab.value)}
            >
              <tab.icon aria-hidden="true" className="size-4" />
              {!collapsed && <span className="flex-1 truncate">{tab.label}</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
