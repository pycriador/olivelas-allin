import { useEffect, type ReactNode } from "react";
import { Navigate, useNavigate } from "@tanstack/react-router";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/features/dashboard/ui/app-sidebar";
import { Topbar } from "@/features/dashboard/ui/topbar";
import { CommandPalette } from "@/features/dashboard/ui/command-palette";
import { DashboardSkeleton } from "@/features/dashboard/ui/dashboard-skeleton";
import { useAuthStore } from "@/stores/auth";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const isLoading = useAuthStore((s) => s.isLoading);
  const session = useAuthStore((s) => s.session);
  const navigate = useNavigate();

  const isAuthenticated = !!session?.user;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate({ to: "/login" });
    }
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Topbar />
        <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">{children}</div>
      </SidebarInset>
      <CommandPalette />
    </SidebarProvider>
  );
}
