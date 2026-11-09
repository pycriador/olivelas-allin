import { Link, useLocation } from "@tanstack/react-router";
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
} from "@/components/ui/sidebar";
import { Logo } from "@/components/shared/logo";
import { APP_NAV } from "@/constants/navigation";
import { useWorkspaceStore } from "@/stores/workspace";
import { useAuthStore } from "@/stores/auth";
import { UserMenuButton } from "@/features/dashboard/ui/user-menu-button";
import { WorkspaceSwitcher } from "@/features/dashboard/ui/workspace-switcher";

export function AppSidebar() {
  const location = useLocation();
  const permissionMap = useWorkspaceStore((s) => s.permissionMap);
  const isGlobalAdmin = useAuthStore((s) => s.isGlobalAdmin);

  const isActive = (href: string) => {
    if (href === "/dashboard") return location.pathname === href;
    return location.pathname === href || location.pathname.startsWith(`${href}/`);
  };

  const canSee = (permission?: string) => {
    if (!permission) return true;
    if (isGlobalAdmin) return true;
    return permissionMap.has(permission);
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link to="/dashboard" className="flex items-center gap-2 px-2 py-1">
          <Logo />
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {APP_NAV.sections.map((section) => {
          const items = section.items.filter((item) => canSee(item.permission));
          if (items.length === 0) return null;
          return (
            <SidebarGroup key={section.title}>
              <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive(item.href)}
                        tooltip={item.title}
                      >
                        <Link to={item.href}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <WorkspaceSwitcher variant="sidebar" />
          </SidebarMenuItem>
          <SidebarMenuItem>
            <UserMenuButton variant="sidebar" />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
