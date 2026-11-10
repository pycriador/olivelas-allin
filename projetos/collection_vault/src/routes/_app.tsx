import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  LayoutDashboard, Library, Gamepad2, Joystick, Package, Building2, Store, Tag, Link2, LogOut, Code,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, SidebarHeader, SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

const items = [
  { to: "/dashboard", label: "DASHBOARD", icon: LayoutDashboard },
  { to: "/colecao", label: "COLEÇÃO", icon: Library },
  { to: "/jogos", label: "JOGOS", icon: Gamepad2 },
  { to: "/itens", label: "HARDWARE", icon: Package },
  { to: "/plataformas", label: "PLATAFORMAS", icon: Joystick },
  { to: "/empresas", label: "EMPRESAS", icon: Building2 },
  { to: "/lojas", label: "LOJAS", icon: Store },
  { to: "/cupons", label: "CUPONS", icon: Tag },
  { to: "/links", label: "LINKS", icon: Link2 },
  { to: "/api", label: "API", icon: Code },
] as const;

function AppLayout() {
  const { user, loading, signOut } = useAuth();
  const nav = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => { if (!loading && !user) nav({ to: "/auth" }); }, [user, loading, nav]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="font-display text-xs neon-text-cyan">LOADING<span className="blink">_</span></p>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar collapsible="icon">
          <SidebarHeader className="border-b border-sidebar-border">
            <Link to="/dashboard" className="flex items-center gap-2 px-2 py-2">
              <Joystick className="h-6 w-6 text-primary shrink-0" />
              <span className="font-display text-xs neon-text-pink truncate">OLIVELAS VAULT</span>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="font-display text-[10px]">MENU</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((it) => (
                    <SidebarMenuItem key={it.to}>
                      <SidebarMenuButton asChild isActive={path === it.to} tooltip={it.label}>
                        <Link to={it.to} className="font-mono text-lg">
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
          <SidebarFooter className="border-t border-sidebar-border">
            <Button variant="ghost" size="sm" onClick={() => signOut().then(() => nav({ to: "/" }))} className="w-full justify-start font-mono text-lg">
              <LogOut className="h-4 w-4" /> SAIR
            </Button>
          </SidebarFooter>
        </Sidebar>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-12 flex items-center border-b border-border px-3 sticky top-0 bg-background/80 backdrop-blur z-10">
            <SidebarTrigger />
            <span className="ml-3 font-mono text-xl text-muted-foreground truncate">
              ► {user.email}
            </span>
          </header>
          <main className="flex-1 p-4 md:p-8 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
