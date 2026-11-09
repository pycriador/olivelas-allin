import type { ReactNode } from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-w-0 max-w-full overflow-hidden flex flex-col flex-1">
        <AppHeader />
        <main className="flex-1 min-w-0 max-w-full overflow-y-auto p-3 sm:p-4 md:p-6 w-full flex flex-col">
          {children}
        </main>
        <AppFooter />
      </SidebarInset>
    </SidebarProvider>
  );
}
