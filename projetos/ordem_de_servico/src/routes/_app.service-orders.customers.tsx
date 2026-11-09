import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { useTranslation } from "@/core/i18n/I18nProvider";

export const Route = createFileRoute("/_app/service-orders/customers")({
  component: CustomersLayout,
});

function CustomersLayout() {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <nav className="flex gap-4 text-sm border-b pb-2">
        <Link to="/service-orders/customers" className="text-muted-foreground hover:text-foreground transition-colors">{t("customers.dashboard")}</Link>
        <Link to="/service-orders/customers/list" className="text-muted-foreground hover:text-foreground transition-colors">{t("customers.list")}</Link>
        <Link to="/service-orders/customers/import" className="text-muted-foreground hover:text-foreground transition-colors">{t("customers.import")}</Link>
        <Link to="/service-orders/customers/export" className="text-muted-foreground hover:text-foreground transition-colors">{t("customers.export")}</Link>
      </nav>
      <Outlet />
    </div>
  );
}
