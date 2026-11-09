import { useState, useEffect, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin-sidebar";
import { AdminHeader } from "@/components/admin-header";
import { AppFooter } from "@/components/app-footer";
import { impersonationService } from "@/modules/admin/service";
import type { ImpersonationSession } from "@/modules/admin/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { LogOut, Clock, User } from "lucide-react";

export function AdminLayout({ children }: { children: ReactNode }) {
  const [impersonation, setImpersonation] = useState<ImpersonationSession>({
    active: false, originalUserId: "", originalUserName: "", companyId: "", companyName: "", startedAt: "",
  });
  const { t } = useTranslation();

  useEffect(() => {
    impersonationService.get().then(setImpersonation);
  }, []);

  const handleEndImpersonation = async () => {
    await impersonationService.end();
    setImpersonation({ active: false, originalUserId: "", originalUserName: "", companyId: "", companyName: "", startedAt: "" });
  };

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        {impersonation.active && (
          <div className="flex items-center gap-4 bg-amber-600 px-4 py-2 text-sm text-white">
            <Badge variant="secondary" className="bg-amber-700 text-white border-0">
              {t("admin.impersonation")}
            </Badge>
            <span className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              {impersonation.originalUserName}
            </span>
            <span className="flex items-center gap-1">
              <Building2Icon />
              {impersonation.companyName}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {t("admin.impersonationStart")}: {new Date(impersonation.startedAt).toLocaleTimeString()}
            </span>
            <Button
              size="sm"
              variant="secondary"
              className="ml-auto bg-amber-700 text-white hover:bg-amber-800 border-0"
              onClick={handleEndImpersonation}
            >
              <LogOut className="mr-1 h-3.5 w-3.5" />
              {t("admin.impersonationEnd")}
            </Button>
          </div>
        )}
        <AdminHeader />
        <main className="flex-1 p-6">{children}</main>
        <AppFooter />
      </SidebarInset>
    </SidebarProvider>
  );
}

function Building2Icon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5"
    >
      <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
      <path d="M9 22v-4h6v4" />
      <line x1="8" x2="10" y1="6" y2="6" />
      <line x1="8" x2="10" y1="10" y2="10" />
      <line x1="14" x2="16" y1="6" y2="6" />
      <line x1="14" x2="16" y1="10" y2="10" />
    </svg>
  );
}
