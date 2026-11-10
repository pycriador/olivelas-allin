import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  LibraryBig,
  Palette,
  User,
  LogOut,
  Sparkles,
  FileText,
  ShieldCheck,
  Store,
  Heart,
  MessageSquare,
  Settings2,
  Bot,
  PlugZap,
  Webhook,
  Bell,
  Key,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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
import { Logo } from "@/components/logo";
import { useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@/lib/permissions";
import { logAudit } from "@/lib/audit.functions";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean };
const nav: NavItem[] = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/app/assistant", label: "Assistente IA", icon: MessageSquare },
  { to: "/app/ai-settings", label: "Config. IA", icon: Settings2 },
  { to: "/app/automations", label: "Automações", icon: Bot },
  { to: "/app/integrations", label: "Integrações", icon: PlugZap },
  { to: "/app/webhooks", label: "Webhooks", icon: Webhook },
  { to: "/app/notifications", label: "Notificações", icon: Bell },
  { to: "/app/api-keys", label: "API Keys", icon: Key },
  { to: "/app/forms", label: "Formulários", icon: FileText },
  { to: "/app/marketplace", label: "Marketplace", icon: Store },
  { to: "/app/favorites", label: "Favoritos", icon: Heart },
  { to: "/app/templates", label: "Templates", icon: LibraryBig },
  { to: "/app/theme-builder", label: "Theme Builder", icon: Palette },
  { to: "/app/perfil", label: "Perfil", icon: User },
];

export function AppSidebar() {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: me } = useCurrentUser();

  async function signOut() {
    await logAudit({ data: { action: "auth.signout" } }).catch(() => {});
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    toast.success("Até já!");
    navigate({ to: "/auth", replace: true });
  }

  const isActive = (to: string, exact?: boolean) => (exact ? path === to : path.startsWith(to));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex h-12 items-center px-2">
          {collapsed ? <Logo compact /> : <Logo />}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {nav.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton asChild isActive={isActive(item.to, item.exact)}>
                    <Link to={item.to as "/app"}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {me?.isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/app/admin")}>
                    <Link to={"/app/admin" as "/app"}>
                      <ShieldCheck className="h-4 w-4" />
                      <span>Admin</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Novidades</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="mx-2 rounded-lg border border-sidebar-border bg-sidebar-accent/50 p-3 text-xs text-sidebar-accent-foreground">
              <div className="flex items-center gap-1.5 font-medium">
                <Sparkles className="h-3 w-3" /> Em breve
              </div>
              <p className="mt-1 text-sidebar-foreground/70">Planejamentos, calendário e mais.</p>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={signOut}>
              <LogOut className="h-4 w-4" />
              <span>Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
