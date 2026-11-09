import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { LayoutDashboard, List, Tag, Shapes, FolderTree, Monitor, BarChart3, Upload, Download, Layers } from "lucide-react";

export const Route = createFileRoute("/_app/service-orders/assets")({
  component: AssetsLayout,
});

function AssetsLayout() {
  const { t } = useTranslation();
  const tabs = [
    { label: "Dashboard", path: "/service-orders/assets", icon: LayoutDashboard, exact: true },
    { label: "Tipos", path: "/service-orders/assets/types", icon: Layers },
    { label: "Marcas", path: "/service-orders/assets/brands", icon: Tag },
    { label: "Modelos", path: "/service-orders/assets/models", icon: Shapes },
    { label: "Categorias", path: "/service-orders/assets/categories", icon: FolderTree },
    { label: "Equipamentos", path: "/service-orders/assets/equipment", icon: Monitor },
    { label: "Analíticos", path: "/service-orders/assets/analytics", icon: BarChart3 },
    { label: "Importar", path: "/service-orders/assets/import", icon: Upload },
    { label: "Exportar", path: "/service-orders/assets/export", icon: Download },
  ];
  return (
    <div className="space-y-4">
      <nav className="flex gap-4 text-sm border-b pb-2 overflow-x-auto">
        {tabs.map((tab) => (
          <Link
            key={tab.label}
            to={tab.path as any}
            {...(tab.exact ? { activeOptions: { exact: true } } : {})}
            className="text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap [&.active]:text-foreground [&.active]:font-medium"
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}
