import type { ReactNode } from "react";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./admin-sidebar";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AdminSidebar />
        <SidebarInset className="flex flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <span className="hidden text-sm text-muted-foreground sm:inline">Painel administrativo</span>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/">
                  <ExternalLink className="mr-1 h-3.5 w-3.5" /> Ver site
                </Link>
              </Button>
              <ThemeToggle />
              <UserMenu />
            </div>
          </header>
          <main className="flex-1 p-6">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
