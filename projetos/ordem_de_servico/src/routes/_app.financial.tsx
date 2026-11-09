import { createFileRoute, Outlet, Link, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { DollarSign, LayoutDashboard, Landmark, GitBranch, CreditCard, HandCoins, ArrowRightLeft, FileText } from "lucide-react";

export const Route = createFileRoute("/_app/financial")({
  head: () => ({ meta: [{ title: "Financial — ServiceForge" }] }),
  component: FinancialLayout,
});

const tabs = [
  { path: "/financial", icon: LayoutDashboard, labelKey: "nav.finDashboard" },
  { path: "/financial/accounts", icon: Landmark, labelKey: "nav.finAccounts" },
  { path: "/financial/cost-centers", icon: GitBranch, labelKey: "nav.finCostCenters" },
  { path: "/financial/payable", icon: CreditCard, labelKey: "nav.finPayable" },
  { path: "/financial/receivable", icon: HandCoins, labelKey: "nav.finReceivable" },
  { path: "/financial/transactions", icon: ArrowRightLeft, labelKey: "nav.finTransactions" },
  { path: "/financial/invoices", icon: FileText, labelKey: "nav.finInvoices" },
];

function FinancialLayout() {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-3">
        <DollarSign className="w-6 h-6 text-green-500" />
        <div>
          <h1 className="text-xl font-bold">{t("fin.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("fin.subtitle")}</p>
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
