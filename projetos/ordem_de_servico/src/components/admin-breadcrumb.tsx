import { useRouterState } from "@tanstack/react-router";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useTranslation } from "@/core/i18n/I18nProvider";

const LABEL_MAP: Record<string, string> = {
  customers: "nav.customersList",
  assets: "nav.assetsEquipment",
  types: "nav.assetsTypes",
  brands: "nav.assetsBrands",
  models: "nav.assetsModels",
  categories: "nav.assetsCategories",
  analytics: "nav.assetsAnalytics",
  equipment: "nav.assetsEquipment",
  dashboard: "nav.adminDashboard",
  companies: "nav.adminCompanies",
  users: "nav.adminUsers",
  roles: "nav.adminRoles",
  permissions: "nav.adminPermissions",
  database: "nav.adminDatabase",
  settings: "nav.adminSettings",
  logs: "nav.adminLogs",
  audit: "nav.adminAudit",
  system: "nav.adminSystem",
  "demo-env": "nav.adminDemoEnv",
  scenarios: "nav.adminDemoScenarios",
  generator: "nav.adminDemoGenerator",
  seeds: "nav.adminDemoSeeds",
  export: "nav.adminDemoExport",
  import: "nav.adminDemoImport",
  statistics: "nav.adminDemoStatistics",
  history: "nav.adminDemoHistory",
  diagnosis: "nav.adminDemoDiagnosis",
  integrity: "nav.adminDemoIntegrity",
};

export function AdminBreadcrumb() {
  const { t } = useTranslation();
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length <= 1) {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink>{t("admin.title")}</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {segments.map((seg, i) => {
          const label = LABEL_MAP[seg] ? t(LABEL_MAP[seg]) : seg.charAt(0).toUpperCase() + seg.slice(1);
          return (
            <BreadcrumbItem key={seg + i}>
              {i > 0 && <BreadcrumbSeparator />}
              <BreadcrumbLink>{label}</BreadcrumbLink>
            </BreadcrumbItem>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
