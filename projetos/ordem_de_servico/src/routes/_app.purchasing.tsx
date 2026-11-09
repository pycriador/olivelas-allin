import { createFileRoute, Outlet, Link, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { ShoppingCart, LayoutDashboard, Truck, FileText, PackageCheck } from "lucide-react";

export const Route = createFileRoute("/_app/purchasing")({
  head: () => ({ meta: [{ title: "Purchasing — ServiceForge" }] }),
  component: PurchasingLayout,
});

const tabs = [
  { path: "/purchasing", icon: LayoutDashboard, labelKey: "nav.purDashboard" },
  { path: "/purchasing/suppliers", icon: Truck, labelKey: "nav.purSuppliers" },
  { path: "/purchasing/orders", icon: FileText, labelKey: "nav.purOrders" },
  { path: "/purchasing/receiving", icon: PackageCheck, labelKey: "nav.purReceiving" },
];

function PurchasingLayout() {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-3">
        <ShoppingCart className="w-6 h-6 text-blue-500" />
        <div>
          <h1 className="text-xl font-bold">{t("pur.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("pur.subtitle")}</p>
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
