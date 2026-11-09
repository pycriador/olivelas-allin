import { createFileRoute, Outlet, Link, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { Users2, LayoutDashboard, Users, Clock, DollarSign, Percent, CalendarRange } from "lucide-react";

export const Route = createFileRoute("/_app/hr")({
  head: () => ({ meta: [{ title: "HR — ServiceForge" }] }),
  component: HRLayout,
});

const tabs = [
  { path: "/hr", icon: LayoutDashboard, labelKey: "nav.hrDashboard" },
  { path: "/hr/employees", icon: Users, labelKey: "nav.hrEmployees" },
  { path: "/hr/timesheets", icon: Clock, labelKey: "nav.hrTimeSheets" },
  { path: "/hr/payroll", icon: DollarSign, labelKey: "nav.hrPayroll" },
  { path: "/hr/commissions", icon: Percent, labelKey: "nav.hrCommissions" },
  { path: "/hr/shifts", icon: CalendarRange, labelKey: "nav.hrShifts" },
];

function HRLayout() {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-3">
        <Users2 className="w-6 h-6 text-pink-500" />
        <div>
          <h1 className="text-xl font-bold">{t("hr.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("hr.subtitle")}</p>
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
