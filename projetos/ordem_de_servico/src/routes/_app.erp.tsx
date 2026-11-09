import { createFileRoute, Outlet, Link, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { Building, LayoutDashboard, Building2, GitBranch, FileText, ScrollText } from "lucide-react";

export const Route = createFileRoute("/_app/erp")({
  head: () => ({ meta: [{ title: "ERP — ServiceForge" }] }),
  component: ERPLayout,
});

const tabs = [
  { path: "/erp", icon: LayoutDashboard, labelKey: "nav.erpDashboard" },
  { path: "/erp/companies", icon: Building2, labelKey: "nav.erpCompanies" },
  { path: "/erp/departments", icon: GitBranch, labelKey: "nav.erpDepartments" },
  { path: "/erp/contracts", icon: FileText, labelKey: "nav.erpContracts" },
  { path: "/erp/rules", icon: ScrollText, labelKey: "nav.erpRules" },
];

function ERPLayout() {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-3">
        <Building className="w-6 h-6 text-violet-500" />
        <div>
          <h1 className="text-xl font-bold">{t("erp.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("erp.subtitle")}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1 border-b pb-2">
        {tabs.map((tab) => {
          const isActive = location.pathname === `/app${tab.path}`;
          return (
            <Link key={tab.path} to={tab.path}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-t-md transition-colors ${
                isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"
              }`}>
              <tab.icon className="w-4 h-4" />
              {t(tab.labelKey)}
            </Link>
          );
        })}
      </div>
      <Outlet />
    </div>
  );
}
