import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTranslation } from "@/core/i18n/I18nProvider";

export const Route = createFileRoute("/_app/service-orders")({
  component: ServiceOrdersLayout,
});

function ServiceOrdersLayout() {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <nav className="flex gap-4 text-sm border-b pb-2">
        <Link to="/service-orders" className="text-muted-foreground hover:text-foreground transition-colors">{t("so.list")}</Link>
        <Link to="/service-orders/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">{t("so.dashboard")}</Link>
        <Link to="/service-orders/technician" className="text-muted-foreground hover:text-foreground transition-colors">{t("so.technician.dashboard")}</Link>
        <Link to="/service-orders/customers" className="text-muted-foreground hover:text-foreground transition-colors">{t("nav.soCustomers")}</Link>
        <Link to="/service-orders/assets" className="text-muted-foreground hover:text-foreground transition-colors">{t("nav.soAssets")}</Link>
      </nav>
      <Outlet />
    </div>
  );
}
