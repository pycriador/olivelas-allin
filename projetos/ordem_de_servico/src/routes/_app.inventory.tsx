import { createFileRoute, Outlet, Link, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { Package, LayoutDashboard, PackageOpen, Warehouse, Layers, ArrowRightLeft, Scale, ClipboardList, Truck, Bell } from "lucide-react";

export const Route = createFileRoute("/_app/inventory")({
  head: () => ({ meta: [{ title: "Inventory — ServiceForge" }] }),
  component: InventoryLayout,
});

const tabs = [
  { path: "/inventory", icon: LayoutDashboard, labelKey: "nav.invDashboard" },
  { path: "/inventory/products", icon: PackageOpen, labelKey: "nav.invProducts" },
  { path: "/inventory/warehouses", icon: Warehouse, labelKey: "nav.invWarehouses" },
  { path: "/inventory/bins", icon: Layers, labelKey: "nav.invBins" },
  { path: "/inventory/movements", icon: ArrowRightLeft, labelKey: "nav.invMovements" },
  { path: "/inventory/adjustments", icon: Scale, labelKey: "nav.invAdjustments" },
  { path: "/inventory/counts", icon: ClipboardList, labelKey: "nav.invCounts" },
  { path: "/inventory/transfers", icon: Truck, labelKey: "nav.invTransfers" },
  { path: "/inventory/alerts", icon: Bell, labelKey: "nav.invAlerts" },
];

function InventoryLayout() {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-3">
        <Package className="w-6 h-6 text-amber-500" />
        <div>
          <h1 className="text-xl font-bold">{t("inv.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("inv.subtitle")}</p>
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
