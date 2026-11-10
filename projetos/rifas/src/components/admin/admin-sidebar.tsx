import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  CreditCard,
  LayoutDashboard,
  Megaphone,
  ScrollText,
  Settings,
  Shield,
  ShoppingBag,
  ShieldCheck,
  Ticket,
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
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { usePermissions } from "@/hooks/use-permissions";
import { gatewayPermission } from "@/lib/permissions";
import { listGatewaySettingsAdmin } from "@/lib/payments/gateway-admin.server";
import { PAYMENT_GATEWAY_LABELS } from "@/types/payment";

interface AdminNavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  badge?: string;
}

const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard, active: true },
  { title: "Usuarios", url: "/admin/users", icon: Users, active: true },
  { title: "Campanhas", url: "/admin/campanhas", icon: Megaphone, active: true },
  { title: "Pagamentos", url: "/admin/pagamentos", icon: ShoppingBag, active: true },
  { title: "Configuracoes", url: "/admin/configuracoes", icon: Settings, active: true },
  { title: "Roles & Permissoes", url: "/admin/roles", icon: ShieldCheck, active: true },
  { title: "Relatorios", url: "/admin/relatorios", icon: BarChart3, active: true },
  { title: "Auditoria", url: "/admin/auditoria", icon: ScrollText, active: true },
];

function useVisibleGateways() {
  const { can } = usePermissions();
  const query = useQuery({
    queryKey: ["admin", "payment-gateways"],
    queryFn: () => listGatewaySettingsAdmin(),
    staleTime: 60_000,
    retry: false,
  });

  if (!query.data) return [];
  return query.data.gateways.filter((view) => can(gatewayPermission(view.gateway, "view")));
}

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (router) => router.location.pathname });
  const navigate = useNavigate();
  const visibleGateways = useVisibleGateways();

  return (
    <Sidebar collapsible="icon" aria-label="Administracao">
      <SidebarHeader className="border-b border-sidebar-border">
        <button
          onClick={() => navigate({ to: "/admin/dashboard" })}
          className="flex w-full items-center gap-2.5 px-1.5 py-1.5 text-left"
          aria-label="Admin — ir para o dashboard"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-white dark:bg-amber-600">
            <Shield aria-hidden="true" className="size-4" />
          </span>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight">Olivelas - Rifas & Sorteios Digitais</span>
              <span className="text-[10px] leading-tight text-muted-foreground">Admin Panel</span>
            </div>
          )}
        </button>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Administracao</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {ADMIN_NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    isActive={item.active && pathname === item.url}
                    tooltip={item.title}
                    disabled={!item.active}
                    onClick={item.active ? () => navigate({ to: item.url }) : undefined}
                  >
                    <item.icon aria-hidden="true" className="size-4" />
                    {!collapsed && (
                      <>
                        <span
                          className={`flex-1 truncate ${!item.active ? "text-muted-foreground" : ""}`}
                        >
                          {item.title}
                        </span>
                        {item.badge ? (
                          <Badge variant="secondary" className="text-[10px]">
                            {item.badge}
                          </Badge>
                        ) : null}
                      </>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {visibleGateways.length > 0 ? (
          <SidebarGroup>
            <SidebarGroupLabel>Gateways de Pagamento</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleGateways.map((view) => {
                  const gatewayPath = `/admin/gateways/${view.gateway.toLowerCase()}`;
                  const active = pathname === gatewayPath;
                  return (
                    <SidebarMenuItem key={view.gateway}>
                      <SidebarMenuButton
                        isActive={active}
                        tooltip={PAYMENT_GATEWAY_LABELS[view.gateway]}
                        onClick={() => navigate({ to: gatewayPath })}
                      >
                        <CreditCard aria-hidden="true" className="size-4" />
                        {!collapsed && (
                          <span className="flex-1 truncate">
                            {PAYMENT_GATEWAY_LABELS[view.gateway]}
                          </span>
                        )}
                        {!collapsed && (
                          <Badge
                            variant={view.enabled ? "default" : "secondary"}
                            className="text-[10px]"
                          >
                            {view.enabled ? "On" : "Off"}
                          </Badge>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}

        <SidebarGroup>
          <SidebarGroupLabel>Conta</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Voltar ao app"
                  onClick={() => navigate({ to: "/dashboard" })}
                >
                  <Ticket aria-hidden="true" className="size-4" />
                  {!collapsed && <span className="flex-1 truncate">Voltar ao app</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
