import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Database, Building2, Settings, Layers, FileText, MessageSquare,
  Users, Wrench, DollarSign, Package, Shield, Globe, Cuboid, Columns3, LayoutTemplate,
  Grip, LayoutPanelTop, SlidersHorizontal, FileJson, GitBranch, KeyRound, ScrollText,
  Monitor, Printer, Download, QrCode, Pen, History, Archive, FileDigit, FileSpreadsheet,
  BarChart3, Mail, CalendarDays, Send, Inbox, Zap, Activity, Radio, Workflow, Key,
  Users2, FileCheck, Flag, Cable, HardDrive, Palette, HeartPulse, Briefcase, Clock,
  ShieldAlert, Eye, ChevronDown, ChevronRight, Server, Warehouse, UserCheck, Container,
  Search, Brain, BookOpen, Lightbulb, ShoppingCart, Truck, HeartHandshake, Building,
  Ruler, CreditCard, CalendarRange, ConciergeBell, Bug, Tags, Cpu, Award, Factory,
  Smartphone, UserCircle, ShoppingBag, Upload, ArrowUp, ArrowDown, ArrowLeftRight, ArrowUpDown,
  ClipboardList, Bell, TrendingUp, Percent, ScanText, BarChartHorizontal, Gauge, Puzzle, Code2,
  RefreshCw, Share2, Leaf, ShieldCheck, Star, Sparkles, LogOut, Check, X, type LucideIcon,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { APP_NAME, APP_VERSION } from "@/core/constants";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useMenuFavorites } from "@/hooks/use-menu-favorites";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";

/* ───── TYPES ───── */

interface MenuItem {
  labelKey: string;
  icon: LucideIcon;
  path: string;
}

/* ───── SERVICE ORDERS ───── */

const SO_ITEMS: MenuItem[] = [
  { labelKey: "nav.dashboard", icon: LayoutDashboard, path: "/service-orders/dashboard" },
  { labelKey: "nav.soList", icon: FileSpreadsheet, path: "/service-orders" },
  { labelKey: "nav.soNew", icon: FileDigit, path: "/service-orders/new" },
  { labelKey: "nav.soTechnician", icon: Wrench, path: "/service-orders/technician" },
];

/* ───── CUSTOMERS ───── */

const CUSTOMER_ITEMS: MenuItem[] = [
  { labelKey: "nav.customersList", icon: Users, path: "/service-orders/customers/list" },
  { labelKey: "nav.customersImport", icon: Download, path: "/service-orders/customers/import" },
  { labelKey: "nav.customersExport", icon: Upload, path: "/service-orders/customers/export" },
];

/* ───── ASSETS ───── */

const ASSET_ITEMS: MenuItem[] = [
  { labelKey: "nav.assetsEquipment", icon: Server, path: "/service-orders/assets/equipment" },
  { labelKey: "nav.assetsBrands", icon: Award, path: "/service-orders/assets/brands" },
  { labelKey: "nav.assetsModels", icon: Cpu, path: "/service-orders/assets/models" },
  { labelKey: "nav.assetsTypes", icon: Layers, path: "/service-orders/assets/types" },
  { labelKey: "nav.assetsCategories", icon: Tags, path: "/service-orders/assets/categories" },
  { labelKey: "nav.assetsAnalytics", icon: BarChart3, path: "/service-orders/assets/analytics" },
  { labelKey: "nav.assetsImport", icon: Download, path: "/service-orders/assets/import" },
  { labelKey: "nav.assetsExport", icon: Upload, path: "/service-orders/assets/export" },
];

/* ───── KNOWLEDGE ───── */

const KNOWLEDGE_ITEMS: MenuItem[] = [
  { labelKey: "nav.knowledgeLibrary", icon: BookOpen, path: "/knowledge/library" },
  { labelKey: "nav.knowledgeSearch", icon: Search, path: "/knowledge/search" },
  { labelKey: "nav.knowledgeCategories", icon: Tags, path: "/knowledge/categories" },
  { labelKey: "nav.knowledgeAnalytics", icon: BarChart3, path: "/knowledge/analytics" },
  { labelKey: "nav.knowledgeImport", icon: Download, path: "/knowledge/import" },
];

/* ───── FINANCIAL ───── */

const FINANCIAL_ITEMS: MenuItem[] = [
  { labelKey: "nav.finAccounts", icon: CreditCard, path: "/financial/accounts" },
  { labelKey: "nav.finTransactions", icon: DollarSign, path: "/financial/transactions" },
  { labelKey: "nav.finInvoices", icon: FileText, path: "/financial/invoices" },
  { labelKey: "nav.finPayable", icon: ArrowUp, path: "/financial/payable" },
  { labelKey: "nav.finReceivable", icon: ArrowDown, path: "/financial/receivable" },
  { labelKey: "nav.finCostCenters", icon: Building2, path: "/financial/cost-centers" },
];

/* ───── INVENTORY ───── */

const INVENTORY_ITEMS: MenuItem[] = [
  { labelKey: "nav.invProducts", icon: Package, path: "/inventory/products" },
  { labelKey: "nav.invWarehouses", icon: Warehouse, path: "/inventory/warehouses" },
  { labelKey: "nav.invMovements", icon: ArrowLeftRight, path: "/inventory/movements" },
  { labelKey: "nav.invTransfers", icon: ArrowUpDown, path: "/inventory/transfers" },
  { labelKey: "nav.invAdjustments", icon: SlidersHorizontal, path: "/inventory/adjustments" },
  { labelKey: "nav.invCounts", icon: ClipboardList, path: "/inventory/counts" },
  { labelKey: "nav.invAlerts", icon: Bell, path: "/inventory/alerts" },
];

/* ───── PURCHASING ───── */

const PURCHASING_ITEMS: MenuItem[] = [
  { labelKey: "nav.purOrders", icon: ShoppingCart, path: "/purchasing/orders" },
  { labelKey: "nav.purReceiving", icon: Truck, path: "/purchasing/receiving" },
  { labelKey: "nav.purSuppliers", icon: Building2, path: "/purchasing/suppliers" },
];

/* ───── CRM ───── */

const CRM_ITEMS: MenuItem[] = [
  { labelKey: "nav.crmLeads", icon: Users, path: "/crm/leads" },
  { labelKey: "nav.crmOpportunities", icon: TrendingUp, path: "/crm/opportunities" },
  { labelKey: "nav.crmCampaigns", icon: Flag, path: "/crm/campaigns" },
  { labelKey: "nav.crmAgreements", icon: FileCheck, path: "/crm/agreements" },
];

/* ───── HR ───── */

const HR_ITEMS: MenuItem[] = [
  { labelKey: "nav.hrEmployees", icon: Users2, path: "/hr/employees" },
  { labelKey: "nav.hrTimeSheets", icon: Clock, path: "/hr/timesheets" },
  { labelKey: "nav.hrPayroll", icon: DollarSign, path: "/hr/payroll" },
  { labelKey: "nav.hrCommissions", icon: Percent, path: "/hr/commissions" },
  { labelKey: "nav.hrShifts", icon: CalendarDays, path: "/hr/shifts" },
];

/* ───── COMMUNICATION ───── */

const COMM_ITEMS: MenuItem[] = [
  { labelKey: "nav.commDashboard", icon: BarChart3, path: "/communication/dashboard" },
  { labelKey: "nav.commTemplates", icon: FileText, path: "/communication/templates" },
  { labelKey: "nav.commChannels", icon: Mail, path: "/communication/channels" },
  { labelKey: "nav.commQueue", icon: Send, path: "/communication/queue" },
  { labelKey: "nav.commRules", icon: Zap, path: "/communication/rules" },
  { labelKey: "nav.commSchedules", icon: CalendarDays, path: "/communication/schedules" },
  { labelKey: "nav.commPreferences", icon: Settings, path: "/communication/preferences" },
  { labelKey: "nav.commInbox", icon: Inbox, path: "/communication/inbox" },
  { labelKey: "nav.commHistory", icon: History, path: "/communication/history" },
  { labelKey: "nav.commAudit", icon: ScrollText, path: "/communication/audit" },
];

/* ───── DOCUMENTS ───── */

const DOC_ITEMS: MenuItem[] = [
  { labelKey: "nav.docTemplates", icon: FileSpreadsheet, path: "/documents/templates" },
  { labelKey: "nav.docDesigner", icon: Pen, path: "/documents/designer" },
  { labelKey: "nav.docGenerator", icon: FileDigit, path: "/documents/generator" },
  { labelKey: "nav.docStorage", icon: Archive, path: "/documents/storage" },
  { labelKey: "nav.docVersions", icon: GitBranch, path: "/documents/versions" },
  { labelKey: "nav.docHistory", icon: History, path: "/documents/history" },
  { labelKey: "nav.docSignatures", icon: Pen, path: "/documents/signatures" },
  { labelKey: "nav.docQR", icon: QrCode, path: "/documents/qr-validation" },
  { labelKey: "nav.docPrint", icon: Printer, path: "/documents/print" },
  { labelKey: "nav.docExport", icon: Download, path: "/documents/export" },
  { labelKey: "nav.docAudit", icon: ScrollText, path: "/documents/audit" },
];

/* ───── EVENTS ───── */

const EVT_ITEMS: MenuItem[] = [
  { labelKey: "nav.evtMonitor", icon: Activity, path: "/events/monitor" },
  { labelKey: "nav.evtHistory", icon: History, path: "/events/history" },
  { labelKey: "nav.evtWorkflows", icon: Workflow, path: "/events/workflows" },
  { labelKey: "nav.evtSubscribers", icon: Radio, path: "/events/subscribers" },
  { labelKey: "nav.evtAudit", icon: ScrollText, path: "/events/audit" },
];

/* ───── AI ───── */

const AI_ITEMS: MenuItem[] = [
  { labelKey: "nav.aiPlayground", icon: Brain, path: "/ai/playground" },
  { labelKey: "nav.aiPrompts", icon: FileText, path: "/ai/prompts" },
  { labelKey: "nav.aiOcr", icon: ScanText, path: "/ai/ocr" },
  { labelKey: "nav.aiVision", icon: Eye, path: "/ai/vision" },
  { labelKey: "nav.aiConference", icon: Users, path: "/ai/conference" },
  { labelKey: "nav.aiProviders", icon: Cable, path: "/ai/providers" },
  { labelKey: "nav.aiConfig", icon: Settings, path: "/ai/config" },
  { labelKey: "nav.aiHistory", icon: History, path: "/ai/history" },
  { labelKey: "nav.aiQueue", icon: Send, path: "/ai/queue" },
  { labelKey: "nav.aiAudit", icon: ScrollText, path: "/ai/audit" },
];

/* ───── AUTOMATION ───── */

const AUTO_ITEMS: MenuItem[] = [
  { labelKey: "nav.autoRules", icon: Zap, path: "/automation/rules" },
  { labelKey: "nav.autoWorkflows", icon: Workflow, path: "/automation/workflows" },
  { labelKey: "nav.autoDesigner", icon: Pen, path: "/automation/designer" },
  { labelKey: "nav.autoStateMachine", icon: GitBranch, path: "/automation/statemachine" },
  { labelKey: "nav.autoJobs", icon: Briefcase, path: "/automation/jobs" },
  { labelKey: "nav.autoApprovals", icon: FileCheck, path: "/automation/approvals" },
  { labelKey: "nav.autoScheduler", icon: CalendarDays, path: "/automation/scheduler" },
  { labelKey: "nav.autoScripts", icon: FileDigit, path: "/automation/scripts" },
  { labelKey: "nav.autoTimers", icon: Clock, path: "/automation/timers" },
  { labelKey: "nav.autoTemplates", icon: FileSpreadsheet, path: "/automation/templates" },
  { labelKey: "nav.autoMonitor", icon: Monitor, path: "/automation/monitor" },
  { labelKey: "nav.autoHistory", icon: History, path: "/automation/history" },
  { labelKey: "nav.autoConfig", icon: Settings, path: "/automation/config" },
  { labelKey: "nav.autoAudit", icon: ScrollText, path: "/automation/audit" },
];

/* ───── REPORTING ───── */

const REPORT_ITEMS: MenuItem[] = [
  { labelKey: "nav.rptDashboard", icon: LayoutDashboard, path: "/reporting/dashboard" },
  { labelKey: "nav.rptReports", icon: BarChart3, path: "/reporting/reports" },
  { labelKey: "nav.rptCharts", icon: BarChartHorizontal, path: "/reporting/charts" },
  { labelKey: "nav.rptKPIs", icon: Gauge, path: "/reporting/kpis" },
  { labelKey: "nav.rptDashboards", icon: LayoutPanelTop, path: "/reporting/dashboards" },
  { labelKey: "nav.rptWidgets", icon: Grip, path: "/reporting/widgets" },
  { labelKey: "nav.rptDatasets", icon: Database, path: "/reporting/datasets" },
  { labelKey: "nav.rptTemplates", icon: FileSpreadsheet, path: "/reporting/templates" },
  { labelKey: "nav.rptSchedules", icon: CalendarDays, path: "/reporting/schedules" },
  { labelKey: "nav.rptExports", icon: Download, path: "/reporting/exports" },
  { labelKey: "nav.rptHistory", icon: History, path: "/reporting/history" },
  { labelKey: "nav.rptConfig", icon: Settings, path: "/reporting/config" },
];

/* ───── INTEGRATIONS ───── */

const INTEGRATION_ITEMS: MenuItem[] = [
  { labelKey: "nav.intConnections", icon: Cable, path: "/integrations/connections" },
  { labelKey: "nav.intConnectors", icon: Puzzle, path: "/integrations/connectors" },
  { labelKey: "nav.intApis", icon: Code2, path: "/integrations/apis" },
  { labelKey: "nav.intWebhooks", icon: Radio, path: "/integrations/webhooks" },
  { labelKey: "nav.intSyncs", icon: RefreshCw, path: "/integrations/syncs" },
  { labelKey: "nav.intMarketplace", icon: ShoppingBag, path: "/integrations/marketplace" },
  { labelKey: "nav.intTemplates", icon: FileSpreadsheet, path: "/integrations/templates" },
  { labelKey: "nav.intMonitoring", icon: Monitor, path: "/integrations/monitoring" },
  { labelKey: "nav.intHealth", icon: HeartPulse, path: "/integrations/health" },
  { labelKey: "nav.intLogs", icon: ScrollText, path: "/integrations/logs" },
];

/* ───── PORTAL ───── */

const PORTAL_ITEMS: MenuItem[] = [
  { labelKey: "nav.portalHome", icon: Globe, path: "/portal/home" },
  { labelKey: "nav.portalOrders", icon: FileText, path: "/portal/orders" },
  { labelKey: "nav.portalApprovals", icon: FileCheck, path: "/portal/approvals" },
  { labelKey: "nav.portalGuarantees", icon: Shield, path: "/portal/guarantees" },
  { labelKey: "nav.portalDownloads", icon: Download, path: "/portal/downloads" },
  { labelKey: "nav.portalUploads", icon: Upload, path: "/portal/uploads" },
  { labelKey: "nav.portalShares", icon: Share2, path: "/portal/shares" },
  { labelKey: "nav.portalAnalytics", icon: BarChart3, path: "/portal/analytics" },
  { labelKey: "nav.portalConfig", icon: Settings, path: "/portal/config" },
  { labelKey: "nav.portalBranding", icon: Palette, path: "/portal/branding" },
  { labelKey: "nav.portalAudit", icon: ScrollText, path: "/portal/audit" },
];

/* ───── ERP ───── */

const ERP_ITEMS: MenuItem[] = [
  { labelKey: "nav.erpCompanies", icon: Building2, path: "/erp/companies" },
  { labelKey: "nav.erpContracts", icon: FileCheck, path: "/erp/contracts" },
  { labelKey: "nav.erpDepartments", icon: Building, path: "/erp/departments" },
  { labelKey: "nav.erpRules", icon: Zap, path: "/erp/rules" },
];

/* ───── ADMIN ───── */

const ADMIN_DEMO_ITEMS: MenuItem[] = [
  { labelKey: "nav.adminDemoEnv", icon: Container, path: "/admin/demo-env" },
  { labelKey: "nav.adminDemoScenarios", icon: LayoutTemplate, path: "/admin/demo-env/scenarios" },
  { labelKey: "nav.adminDemoGenerator", icon: FileDigit, path: "/admin/demo-env/generator" },
  { labelKey: "nav.adminDemoSeeds", icon: Leaf, path: "/admin/demo-env/seeds" },
  { labelKey: "nav.adminDemoExport", icon: Download, path: "/admin/demo-env/export" },
  { labelKey: "nav.adminDemoImport", icon: Upload, path: "/admin/demo-env/import" },
  { labelKey: "nav.adminDemoStatistics", icon: BarChart3, path: "/admin/demo-env/statistics" },
  { labelKey: "nav.adminDemoHistory", icon: History, path: "/admin/demo-env/history" },
  { labelKey: "nav.adminDemoLogs", icon: ScrollText, path: "/admin/demo-env/logs" },
  { labelKey: "nav.adminDemoDiagnosis", icon: HeartPulse, path: "/admin/demo-env/diagnosis" },
  { labelKey: "nav.adminDemoIntegrity", icon: ShieldCheck, path: "/admin/demo-env/integrity" },
];

const ADMIN_SECTIONS: { labelKey: string; items: MenuItem[]; demoItems?: MenuItem[] }[] = [
  { labelKey: "nav.adminSectionGeneral", items: [
    { labelKey: "nav.adminDashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
    { labelKey: "nav.adminCompanies", icon: Building2, path: "/admin/companies" },
    { labelKey: "nav.adminUsers", icon: Users, path: "/admin/users" },
    { labelKey: "nav.adminGroups", icon: Users2, path: "/admin/groups" },
  ]},
  { labelKey: "nav.adminSectionSecurity", items: [
    { labelKey: "nav.adminRoles", icon: Shield, path: "/admin/roles" },
    { labelKey: "nav.adminPermissions", icon: Key, path: "/admin/permissions" },
    { labelKey: "nav.adminPolicies", icon: FileCheck, path: "/admin/policies" },
    { labelKey: "nav.adminImpersonation", icon: UserCheck, path: "/admin/impersonation" },
    { labelKey: "nav.adminFeatureFlags", icon: Flag, path: "/admin/feature-flags" },
  ]},
  { labelKey: "nav.adminSectionInfra", items: [
    { labelKey: "nav.adminDatabase", icon: Database, path: "/admin/database" },
    { labelKey: "nav.adminProviders", icon: Cable, path: "/admin/providers" },
    { labelKey: "nav.adminDataSources", icon: HardDrive, path: "/admin/data-sources" },
    { labelKey: "nav.adminConnectors", icon: Cable, path: "/admin/connectors" },
  ]},
  { labelKey: "nav.adminSectionPersonalization", items: [
    { labelKey: "nav.adminThemes", icon: Palette, path: "/admin/themes" },
    { labelKey: "nav.adminLanguages", icon: Globe, path: "/admin/languages" },
    { labelKey: "nav.adminSettings", icon: Settings, path: "/admin/settings" },
  ], demoItems: ADMIN_DEMO_ITEMS },
  { labelKey: "nav.adminSectionObservability", items: [
    { labelKey: "nav.adminLogs", icon: ScrollText, path: "/admin/logs" },
    { labelKey: "nav.adminAudit", icon: Eye, path: "/admin/audit" },
    { labelKey: "nav.adminHealth", icon: HeartPulse, path: "/admin/health" },
    { labelKey: "nav.adminMonitoring", icon: Monitor, path: "/admin/monitoring" },
    { labelKey: "nav.adminJobs", icon: Briefcase, path: "/admin/jobs" },
    { labelKey: "nav.adminSchedules", icon: Clock, path: "/admin/schedules" },
  ]},
  { labelKey: "nav.adminSectionSystem", items: [
    { labelKey: "nav.adminEnv", icon: ShieldAlert, path: "/admin/env" },
    { labelKey: "nav.adminSecrets", icon: KeyRound, path: "/admin/secrets" },
    { labelKey: "nav.adminBackup", icon: Archive, path: "/admin/backup" },
    { labelKey: "nav.adminMaintenance", icon: Wrench, path: "/admin/maintenance" },
    { labelKey: "nav.adminLicense", icon: Key, path: "/admin/license" },
    { labelKey: "modules.metadata", icon: Warehouse, path: "/admin/metadata" },
    { labelKey: "nav.adminSystem", icon: Server, path: "/admin/system" },
  ]},
];

/* ───── ALL NAV ITEMS (flat, for favorites and exact matching) ───── */

const ALL_NAV_ITEMS: MenuItem[] = [
  { labelKey: "nav.dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { labelKey: "nav.companies", icon: Building2, path: "/companies" },
  { labelKey: "nav.database", icon: Database, path: "/database" },
  { labelKey: "nav.systemTests", icon: ShieldCheck, path: "/system-tests" },
  { labelKey: "nav.howItWorks", icon: Sparkles, path: "/how-it-works" },
  ...SO_ITEMS, ...CUSTOMER_ITEMS, ...ASSET_ITEMS, ...KNOWLEDGE_ITEMS, ...FINANCIAL_ITEMS,
  ...INVENTORY_ITEMS, ...PURCHASING_ITEMS, ...CRM_ITEMS, ...HR_ITEMS,
  ...COMM_ITEMS, ...DOC_ITEMS, ...EVT_ITEMS, ...AI_ITEMS, ...AUTO_ITEMS, ...REPORT_ITEMS,
  ...INTEGRATION_ITEMS, ...PORTAL_ITEMS, ...ERP_ITEMS,
  ...ADMIN_SECTIONS.flatMap((s) => s.items),
  ...ADMIN_SECTIONS.flatMap((s) => s.demoItems ?? []),
  { labelKey: "nav.settings", icon: Settings, path: "/settings" },
];

const ALL_PATHS = ALL_NAV_ITEMS.map((item) => item.path);

/**
 * Ensures NEVER two items are active at the same time in the sidemenu.
 * If pathname is '/service-orders/new', only '/service-orders/new' is active, NOT '/service-orders'.
 */
export function isNavActive(itemPath: string, currentPath: string): boolean {
  if (currentPath === itemPath) return true;
  if (!currentPath.startsWith(itemPath + "/")) return false;
  // If there is another registered nav item whose path is longer and also matches currentPath,
  // then itemPath is just a parent prefix and should NOT be marked active!
  const hasMoreSpecific = ALL_PATHS.some(
    (other) => other !== itemPath && other.length > itemPath.length && (currentPath === other || currentPath.startsWith(other + "/"))
  );
  return !hasMoreSpecific;
}

/* ───── STAR TOGGLE ───── */

function StarToggle({ path, isFav, onToggle }: { path: string; isFav: boolean; onToggle: (p: string) => void }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggle(path); }}
      className="flex items-center justify-center h-7 w-7 shrink-0 rounded-md hover:bg-accent transition-colors group-data-[collapsible=icon]:hidden"
      title={isFav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
    >
      <Star className={`h-3 w-3 ${isFav ? "text-amber-500 fill-amber-500" : "text-muted-foreground/60 hover:text-muted-foreground"}`} />
    </button>
  );
}

/* ───── BUSINESS MODULES (collapsible groups) ───── */

const BUSINESS_GROUPS: { labelKey: string; icon: LucideIcon; items: MenuItem[]; defaultOpen?: boolean }[] = [
  { labelKey: "modules.serviceOrders", icon: Wrench, items: SO_ITEMS, defaultOpen: true },
  { labelKey: "nav.soCustomers", icon: Users, items: CUSTOMER_ITEMS },
  { labelKey: "nav.soAssets", icon: Package, items: ASSET_ITEMS },
  { labelKey: "modules.knowledge", icon: Lightbulb, items: KNOWLEDGE_ITEMS },
  { labelKey: "modules.financial", icon: DollarSign, items: FINANCIAL_ITEMS },
  { labelKey: "modules.inventory", icon: Package, items: INVENTORY_ITEMS },
  { labelKey: "modules.purchasing", icon: ShoppingCart, items: PURCHASING_ITEMS },
  { labelKey: "modules.crm", icon: HeartHandshake, items: CRM_ITEMS },
  { labelKey: "modules.hr", icon: Users2, items: HR_ITEMS },
];

/* ───── PLATFORM MODULES (collapsible groups) ───── */

const PLATFORM_GROUPS: { labelKey: string; icon: LucideIcon; items: MenuItem[]; defaultOpen?: boolean }[] = [
  { labelKey: "modules.communication", icon: MessageSquare, items: COMM_ITEMS },
  { labelKey: "modules.documents", icon: FileText, items: DOC_ITEMS },
  { labelKey: "nav.events", icon: Radio, items: EVT_ITEMS },
  { labelKey: "modules.ai", icon: Brain, items: AI_ITEMS },
  { labelKey: "modules.automation", icon: Workflow, items: AUTO_ITEMS },
  { labelKey: "modules.reporting", icon: BarChart3, items: REPORT_ITEMS },
  { labelKey: "modules.integrations", icon: Cable, items: INTEGRATION_ITEMS },
  { labelKey: "modules.portal", icon: Globe, items: PORTAL_ITEMS },
  { labelKey: "modules.erp", icon: Building, items: ERP_ITEMS },
];

/* ───── COLLAPSIBLE SECTION COMPONENT ───── */

function CollapsibleSection({
  labelKey,
  icon: Icon,
  items,
  defaultOpen = false,
  depth = 0,
  isFavorite,
  onToggleFavorite,
  onItemClick,
}: {
  labelKey: string;
  icon?: LucideIcon;
  items: MenuItem[];
  defaultOpen?: boolean;
  depth?: number;
  isFavorite?: (path: string) => boolean;
  onToggleFavorite?: (path: string) => void;
  onItemClick?: () => void;
}) {
  const { t } = useTranslation();
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const hasActiveChild = items.some((item) => isNavActive(item.path, pathname));
  const [open, setOpen] = useState(defaultOpen || hasActiveChild);

  return (
    <div className={cn(depth > 0 && "ml-2")}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-1.5 w-full text-xs font-semibold uppercase tracking-wider px-2 py-1.5 hover:text-foreground transition-colors rounded-lg",
          hasActiveChild ? "text-primary font-bold" : "text-muted-foreground",
          "group-data-[collapsible=icon]:hidden cursor-pointer"
        )}
      >
        {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
        {open ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />}
        <span className="truncate flex-1 text-left">{t(labelKey)}</span>
      </button>
      {open && (
        <div className={depth > 0 ? "ml-1 border-l border-border/40 pl-2 space-y-0.5" : "space-y-0.5"}>
          {items.map((item) => {
            const active = isNavActive(item.path, pathname);
            return (
              <SidebarMenuItem key={item.path}>
                <div className="flex items-center w-full">
                  <SidebarMenuButton
                    asChild
                    isActive={active}
                    className={cn(
                      "flex-1 h-8 rounded-lg text-xs font-medium transition-all",
                      active
                        ? "bg-primary text-primary-foreground shadow-xs font-semibold hover:bg-primary hover:text-primary-foreground"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    )}
                  >
                    <Link to={item.path} onClick={onItemClick}>
                      <item.icon className={cn("h-3.5 w-3.5 shrink-0", active ? "text-primary-foreground" : "text-muted-foreground")} />
                      <span className="truncate">{t(item.labelKey)}</span>
                    </Link>
                  </SidebarMenuButton>
                  {isFavorite && onToggleFavorite && (
                    <StarToggle path={item.path} isFav={isFavorite(item.path)} onToggle={onToggleFavorite} />
                  )}
                </div>
              </SidebarMenuItem>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ───── SIDEBAR COMPONENT ───── */

export function AppSidebar() {
  const { t } = useTranslation();
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { user, companies, currentCompany, switchCompany, logout } = useAuth();
  const { isMobile, setOpenMobile } = useSidebar();

  const [companyMenuOpen, setCompanyMenuOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminSection, setAdminSection] = useState<Record<number, boolean>>({});
  const [demoOpen, setDemoOpen] = useState(false);
  const { isFavorite, toggleFavorite } = useMenuFavorites();

  const favoriteItems = ALL_NAV_ITEMS.filter((i) => isFavorite(i.path));

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
      {/* ─── BRAND & TENANT SWITCHER (Olivelas Style) ─── */}
      <SidebarHeader className="p-3 border-b border-sidebar-border space-y-2">
        <div className="flex items-center justify-between px-1">
          <Link
            to="/dashboard"
            onClick={handleLinkClick}
            className="flex items-center gap-2.5 truncate"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold shadow-md shadow-primary/25 shrink-0">
              SF
            </div>
            <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden truncate">
              <span className="text-sm font-bold tracking-tight text-sidebar-foreground">{APP_NAME}</span>
              <span className="text-[10px] text-muted-foreground font-mono">v{APP_VERSION} · SERVICEFORGE</span>
            </div>
          </Link>
          {isMobile && (
            <button
              type="button"
              onClick={() => setOpenMobile(false)}
              className="p-1 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
              aria-label="Fechar menu"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Company Switcher Dropdown */}
        <div className="relative group-data-[collapsible=icon]:hidden">
          <button
            type="button"
            onClick={() => setCompanyMenuOpen(!companyMenuOpen)}
            className="w-full flex items-center justify-between p-2 rounded-xl bg-sidebar-accent/50 hover:bg-sidebar-accent transition-colors text-left border border-border/50 cursor-pointer"
          >
            <div className="flex items-center gap-2 truncate min-w-0">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0">
                <Building2 className="h-4 w-4" />
              </div>
              <div className="truncate min-w-0">
                <div className="text-xs font-semibold text-sidebar-foreground truncate">
                  {currentCompany?.name ?? "ServiceForge Matriz"}
                </div>
                <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Badge variant="outline" className="text-[9px] px-1 py-0 uppercase">
                    {currentCompany?.role?.replace("_", " ") ?? "ADMIN"}
                  </Badge>
                </div>
              </div>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 ml-1" />
          </button>

          {companyMenuOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-xl shadow-xl z-50 p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150">
              <div className="text-[10px] font-semibold text-muted-foreground px-2 py-1 uppercase">
                Empresas ({companies.length})
              </div>
              <div className="max-h-56 overflow-y-auto space-y-0.5 custom-scrollbar">
                {companies.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      switchCompany(c.id);
                      setCompanyMenuOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between p-2 rounded-lg text-xs transition-colors text-left cursor-pointer",
                      c.id === currentCompany?.id
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "hover:bg-accent text-foreground"
                    )}
                  >
                    <span className="truncate">{c.name}</span>
                    {c.id === currentCompany?.id && <Check className="h-3.5 w-3.5 shrink-0 ml-1" />}
                  </button>
                ))}
              </div>
              <Link
                to="/companies"
                onClick={() => {
                  setCompanyMenuOpen(false);
                  handleLinkClick();
                }}
                className="block p-1.5 text-center text-xs font-medium text-primary hover:bg-accent rounded-lg transition-colors border-t border-border mt-1"
              >
                + Gerenciar Empresas
              </Link>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="custom-scrollbar px-2">
        {/* Favorites */}
        {favoriteItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-[11px] font-semibold uppercase text-muted-foreground">
              {t("nav.favorites")}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-0.5">
                {favoriteItems.map((item) => {
                  const active = isNavActive(item.path, pathname);
                  return (
                    <SidebarMenuItem key={item.path}>
                      <div className="flex items-center w-full">
                        <SidebarMenuButton
                          asChild
                          isActive={active}
                          className={cn(
                            "flex-1 h-8 rounded-lg text-xs font-medium transition-all",
                            active
                              ? "bg-primary text-primary-foreground shadow-xs font-semibold hover:bg-primary hover:text-primary-foreground"
                              : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                          )}
                        >
                          <Link to={item.path} onClick={handleLinkClick}>
                            <item.icon className={cn("h-3.5 w-3.5", active ? "text-primary-foreground" : "text-muted-foreground")} />
                            <span>{t(item.labelKey)}</span>
                          </Link>
                        </SidebarMenuButton>
                        <StarToggle path={item.path} isFav={true} onToggle={toggleFavorite} />
                      </div>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* ─── GLOBAL NAV ─── */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-semibold uppercase text-muted-foreground">
            {t("nav.general")}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {[
                { path: "/dashboard", icon: LayoutDashboard, labelKey: "nav.dashboard" },
                { path: "/companies", icon: Building2, labelKey: "nav.companies" },
                { path: "/database", icon: Database, labelKey: "nav.database" },
              ].map((item) => {
                const active = isNavActive(item.path, pathname);
                return (
                  <SidebarMenuItem key={item.path}>
                    <div className="flex items-center w-full">
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        className={cn(
                          "flex-1 h-8 rounded-lg text-xs font-medium transition-all",
                          active
                            ? "bg-primary text-primary-foreground shadow-xs font-semibold hover:bg-primary hover:text-primary-foreground"
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                        )}
                      >
                        <Link to={item.path} onClick={handleLinkClick}>
                          <item.icon className={cn("h-3.5 w-3.5", active ? "text-primary-foreground" : "text-muted-foreground")} />
                          <span>{t(item.labelKey)}</span>
                        </Link>
                      </SidebarMenuButton>
                      <StarToggle path={item.path} isFav={isFavorite(item.path)} onToggle={toggleFavorite} />
                    </div>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* ─── BUSINESS MODULES ─── */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-semibold uppercase text-muted-foreground">
            {t("nav.business")}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {BUSINESS_GROUPS.map((g) => (
                <CollapsibleSection
                  key={g.labelKey}
                  labelKey={g.labelKey}
                  icon={g.icon}
                  items={g.items}
                  defaultOpen={g.defaultOpen}
                  isFavorite={isFavorite}
                  onToggleFavorite={toggleFavorite}
                  onItemClick={handleLinkClick}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* ─── PLATFORM MODULES ─── */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-semibold uppercase text-muted-foreground">
            {t("nav.platform")}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {PLATFORM_GROUPS.map((g) => (
                <CollapsibleSection
                  key={g.labelKey}
                  labelKey={g.labelKey}
                  icon={g.icon}
                  items={g.items}
                  defaultOpen={g.defaultOpen}
                  isFavorite={isFavorite}
                  onToggleFavorite={toggleFavorite}
                  onItemClick={handleLinkClick}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* ─── ADMIN ─── */}
        <SidebarGroup>
          <SidebarGroupLabel>
            <button
              type="button"
              onClick={() => setAdminOpen(!adminOpen)}
              className="flex items-center gap-1.5 flex-1 text-left text-[11px] font-semibold uppercase text-muted-foreground hover:text-foreground cursor-pointer"
            >
              {adminOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              <span>{t("nav.admin")}</span>
            </button>
          </SidebarGroupLabel>
          {adminOpen && (
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {ADMIN_SECTIONS.map((section, i) => (
                  <div key={i} className="mb-1">
                    <button
                      type="button"
                      onClick={() => setAdminSection((prev) => ({ ...prev, [i]: !prev[i] }))}
                      className={cn(
                        "flex items-center gap-1.5 w-full text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1 hover:text-foreground transition-colors rounded-sm cursor-pointer",
                        "group-data-[collapsible=icon]:hidden"
                      )}
                    >
                      {adminSection[i] !== false ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />}
                      <span className="truncate">{t(section.labelKey)}</span>
                    </button>
                    {adminSection[i] !== false && (
                      <div className="ml-1 space-y-0.5">
                        {section.items.map((item) => {
                          const active = isNavActive(item.path, pathname);
                          return (
                            <SidebarMenuItem key={item.path}>
                              <div className="flex items-center w-full">
                                <SidebarMenuButton
                                  asChild
                                  isActive={active}
                                  className={cn(
                                    "flex-1 h-8 rounded-lg text-xs font-medium transition-all",
                                    active
                                      ? "bg-primary text-primary-foreground shadow-xs font-semibold hover:bg-primary hover:text-primary-foreground"
                                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                                  )}
                                >
                                  <Link to={item.path} onClick={handleLinkClick}>
                                    <item.icon className={cn("h-3.5 w-3.5", active ? "text-primary-foreground" : "text-muted-foreground")} />
                                    <span>{t(item.labelKey)}</span>
                                  </Link>
                                </SidebarMenuButton>
                                <StarToggle path={item.path} isFav={isFavorite(item.path)} onToggle={toggleFavorite} />
                              </div>
                            </SidebarMenuItem>
                          );
                        })}

                        {/* Demo Environment */}
                        {section.demoItems && (
                          <div className="ml-2 mt-1 mb-2">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setDemoOpen(!demoOpen); }}
                              className={cn(
                                "flex items-center gap-1 w-full text-xs font-medium text-muted-foreground px-2 py-0.5 hover:text-foreground transition-colors rounded-sm cursor-pointer",
                                "group-data-[collapsible=icon]:hidden"
                              )}
                            >
                              {demoOpen ? <ChevronDown className="h-2.5 w-2.5 shrink-0" /> : <ChevronRight className="h-2.5 w-2.5 shrink-0" />}
                              <Container className="h-3 w-3" />
                              <span>{t("nav.adminDemoEnv")}</span>
                            </button>
                            {demoOpen && (
                              <div className="ml-2 border-l border-border/40 pl-1 space-y-0.5">
                                {section.demoItems.map((item) => {
                                  const active = isNavActive(item.path, pathname);
                                  return (
                                    <SidebarMenuItem key={item.path}>
                                      <div className="flex items-center w-full">
                                        <SidebarMenuButton
                                          asChild
                                          isActive={active}
                                          className={cn(
                                            "flex-1 h-7 rounded-md text-xs font-medium transition-all",
                                            active
                                              ? "bg-primary text-primary-foreground shadow-xs font-semibold hover:bg-primary hover:text-primary-foreground"
                                              : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                                          )}
                                        >
                                          <Link to={item.path} onClick={handleLinkClick}>
                                            <item.icon className={cn("h-3 w-3", active ? "text-primary-foreground" : "text-muted-foreground")} />
                                            <span>{t(item.labelKey)}</span>
                                          </Link>
                                        </SidebarMenuButton>
                                        <StarToggle path={item.path} isFav={isFavorite(item.path)} onToggle={toggleFavorite} />
                                      </div>
                                    </SidebarMenuItem>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          )}
        </SidebarGroup>
      </SidebarContent>

      {/* ─── FOOTER WITH PROFILE (Olivelas Style) ─── */}
      <SidebarFooter className="border-t border-sidebar-border bg-sidebar-accent/30 p-2 space-y-2">
        <SidebarMenu className="space-y-0.5">
          <SidebarMenuItem>
            <div className="flex items-center w-full">
              <SidebarMenuButton asChild isActive={isNavActive("/system-tests", pathname)} className="flex-1 h-8 rounded-lg">
                <Link to="/system-tests" onClick={handleLinkClick}>
                  <ShieldCheck className="text-emerald-500 h-4 w-4" />
                  <span className="text-xs font-medium">Testes & Evidências</span>
                </Link>
              </SidebarMenuButton>
              <StarToggle path="/system-tests" isFav={isFavorite("/system-tests")} onToggle={toggleFavorite} />
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <div className="flex items-center w-full">
              <SidebarMenuButton asChild isActive={isNavActive("/how-it-works", pathname)} className="flex-1 h-8 rounded-lg">
                <Link to="/how-it-works" onClick={handleLinkClick}>
                  <Sparkles className="text-primary h-4 w-4" />
                  <span className="text-xs font-medium">Manual & Como Funciona</span>
                </Link>
              </SidebarMenuButton>
              <StarToggle path="/how-it-works" isFav={isFavorite("/how-it-works")} onToggle={toggleFavorite} />
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <div className="flex items-center w-full">
              <SidebarMenuButton asChild isActive={isNavActive("/settings", pathname)} className="flex-1 h-8 rounded-lg">
                <Link to="/settings" onClick={handleLinkClick}>
                  <Settings className="h-4 w-4" />
                  <span className="text-xs font-medium">{t("nav.settings")}</span>
                </Link>
              </SidebarMenuButton>
              <StarToggle path="/settings" isFav={isFavorite("/settings")} onToggle={toggleFavorite} />
            </div>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* User profile row */}
        <div className="flex items-center justify-between p-2 rounded-xl bg-sidebar-accent/60 group-data-[collapsible=icon]:justify-center">
          <div className="flex items-center gap-2 truncate group-data-[collapsible=icon]:hidden min-w-0">
            <div className="h-8 w-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs uppercase shrink-0">
              {user?.name?.slice(0, 2) || user?.email?.slice(0, 2) || "US"}
            </div>
            <div className="truncate min-w-0">
              <div className="text-xs font-semibold text-sidebar-foreground truncate">
                {user?.name || "Administrador"}
              </div>
              <div className="text-[10px] text-muted-foreground truncate">{user?.email}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => logout()}
            title="Sair da conta"
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-destructive/15 hover:text-destructive transition-colors shrink-0 cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
