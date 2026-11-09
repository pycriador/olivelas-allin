import { Link, useRouterState } from "@tanstack/react-router";
import { Coffee, LayoutDashboard, Palette, Settings, UserCircle, Sparkles, Activity, MessageSquareText, Layers, UploadCloud } from "lucide-react";
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

const items = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard, exact: true },
  { title: "Coleções", url: "/admin/collections", icon: Coffee },
  { title: "Artes", url: "/admin/artworks", icon: Palette },
  { title: "Importação", url: "/admin/artworks/import", icon: UploadCloud },

  { title: "Configurações", url: "/admin/settings", icon: Settings },
  { title: "Perfil", url: "/admin/profile", icon: UserCircle },
];

const aiItems = [
  { title: "Prompts", url: "/admin/ai/prompts", icon: MessageSquareText },
  { title: "Monitor", url: "/admin/ai/monitor", icon: Activity },
  { title: "Processamento em lote", url: "/admin/ai/batch", icon: Layers },
  { title: "Configurações de IA", url: "/admin/ai/settings", icon: Sparkles },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const isActive = (url: string, exact?: boolean) =>
    exact ? pathname === url : pathname === url || pathname.startsWith(url + "/");

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-3 py-4">
        <Link to="/admin" className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Coffee className="h-4 w-4" />
          </div>
          {!collapsed && (
            <div>
              <p className="font-display text-base leading-none">Olivelas</p>
              <p className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">Mug Gallery</p>
            </div>
          )}
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Gestão</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url, item.exact)} tooltip={item.title}>
                    <Link to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Inteligência Artificial</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {aiItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <Link to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
