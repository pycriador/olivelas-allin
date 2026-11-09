export interface Dashboard {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "executive" | "technical" | "financial" | "administrative" | "operational" | "ai" | "integrations" | "audit" | "custom";
  companyId?: string;
  isGlobal: boolean;
  isDefault?: boolean;
  tabs: DashboardTab[];
  globalFilters: DashboardFilter[];
  layout: DashboardLayout;
  widgets: DashboardWidgetRef[];
  favorite: boolean;
  version: number;
  tags: string[];
  permissions: DashboardPermission[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface DashboardTab {
  id: string;
  name: string;
  icon?: string;
  order: number;
}

export interface DashboardFilter {
  id: string;
  field: string;
  label: string;
  type: "text" | "number" | "date" | "dateRange" | "select" | "multiSelect" | "boolean" | "company" | "period";
  defaultValue?: string;
  required: boolean;
}

export type DashboardLayout = "grid" | "freeform" | "columns" | "tabs";

export interface DashboardWidgetRef {
  widgetId: string;
  tabId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  filters: Record<string, string>;
}

export interface DashboardPermission {
  roleId?: string;
  userId?: string;
  canView: boolean;
  canEdit: boolean;
  canShare: boolean;
  canDelete: boolean;
}

export interface Widget {
  id: string;
  name: string;
  description: string;
  type: WidgetType;
  category: WidgetCategory;
  config: WidgetConfig;
  datasetId?: string;
  queryId?: string;
  kpiId?: string;
  isPublished: boolean;
  isSystem: boolean;
  tags: string[];
  thumbnail?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export type WidgetType =
  | "table" | "card" | "indicator" | "lineChart" | "barChart" | "pieChart"
  | "areaChart" | "doughnutChart" | "gauge" | "heatmap" | "calendar"
  | "timeline" | "kanban" | "map" | "text" | "image" | "html" | "iframe"
  | "kpi" | "metric" | "progress" | "stat" | "list";

export type WidgetCategory = "chart" | "data" | "metric" | "visual" | "custom";

export interface WidgetConfig {
  title?: string;
  subtitle?: string;
  width?: number;
  height?: number;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  borderRadius?: number;
  showHeader?: boolean;
  showFooter?: boolean;
  showBorder?: boolean;
  padding?: number;
  fontSize?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
  fontWeight?: "normal" | "medium" | "bold";
  refreshInterval?: number;
  drillDown?: string;
  link?: string;
  linkTarget?: "_blank" | "_self";
  trend?: "up" | "down" | "stable";
  trendColor?: string;
  min?: number;
  max?: number;
  target?: number;
  format?: "number" | "currency" | "percent" | "time" | "date" | "text";
  precision?: number;
  prefix?: string;
  suffix?: string;
  chartType?: "line" | "bar" | "pie" | "area" | "doughnut" | "radar" | "polar" | "scatter" | "bubble";
  chartOptions?: Record<string, unknown>;
  columns?: WidgetColumn[];
  sortBy?: string;
  sortDir?: "asc" | "desc";
  pageSize?: number;
  showPagination?: boolean;
  xField?: string;
  yField?: string;
  categoryField?: string;
  valueField?: string;
  seriesField?: string;
  colorField?: string;
  sizeField?: string;
  groupBy?: string;
  aggregate?: "count" | "sum" | "avg" | "min" | "max" | "distinct";
  htmlContent?: string;
  imageUrl?: string;
  altText?: string;
  iframeUrl?: string;
}

export interface WidgetColumn {
  field: string;
  header: string;
  width?: number;
  align?: "left" | "center" | "right";
  format?: string;
  visible: boolean;
  sortable: boolean;
  filterable: boolean;
}

export interface Report {
  id: string;
  name: string;
  description: string;
  type: ReportType;
  category: ReportCategory;
  companyId?: string;
  isGlobal: boolean;
  datasetId?: string;
  templateId?: string;
  config: ReportConfig;
  parameters: ReportParameter[];
  schedules: ReportSchedule[];
  tags: string[];
  favorite: boolean;
  version: number;
  publishedVersion?: number;
  status: "draft" | "published" | "archived";
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  lastExecutedAt?: string;
  lastExecutionStatus?: "success" | "failed";
}

export type ReportType = "tabular" | "summary" | "detail" | "label" | "form" | "document" | "dashboard" | "analytics";
export type ReportCategory = "operational" | "managerial" | "strategic" | "financial" | "technical" | "administrative" | "custom" | "serviceOrder" | "receipt" | "warranty" | "budget" | "certificate" | "declaration" | "protocol" | "checklist";

export interface ReportConfig {
  orientation: "portrait" | "landscape";
  pageSize: "A4" | "A5" | "letter" | "label" | "thermal";
  margins: { top: number; bottom: number; left: number; right: number };
  scale: number;
  header?: string;
  footer?: string;
  showPageNumbers: boolean;
  showDateTime: boolean;
  showLogo: boolean;
  showBarcode?: boolean;
  showQrCode?: boolean;
  qrContent?: string;
  watermark?: string;
  fontFamily?: string;
  fontSize?: number;
  primaryColor?: string;
  sections: ReportSection[];
}

export interface ReportSection {
  id: string;
  type: "header" | "footer" | "body" | "group" | "repetition" | "summary";
  order: number;
  columns: number;
  components: ReportComponent[];
}

export interface ReportComponent {
  id: string;
  type: "text" | "title" | "image" | "logo" | "table" | "field" | "barcode" | "qrCode" | "line" | "rectangle" | "signature" | "date" | "time" | "page" | "separator" | "dynamicField" | "group" | "repetition" | "subreport";
  content?: string;
  field?: string;
  entity?: string;
  dataset?: string;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  fontSize?: number;
  fontWeight?: "normal" | "bold";
  color?: string;
  backgroundColor?: string;
  align?: "left" | "center" | "right";
  border?: boolean;
  borderColor?: string;
  borderRadius?: number;
  repeatEvery?: number;
  repeatCount?: number;
  children?: ReportComponent[];
  styles?: Record<string, string>;
}

export interface ReportParameter {
  id: string;
  name: string;
  label: string;
  type: "text" | "number" | "date" | "dateRange" | "select" | "multiSelect" | "boolean" | "company" | "entity" | "user";
  required: boolean;
  defaultValue?: string;
  options?: { label: string; value: string }[];
  entityField?: string;
}

export interface ReportSchedule {
  id: string;
  name: string;
  type: "manual" | "daily" | "weekly" | "monthly" | "cron";
  cronExpression?: string;
  dayOfWeek?: number[];
  dayOfMonth?: number;
  time: string;
  enabled: boolean;
  formats: ExportFormat[];
  recipients: string[];
  subject?: string;
  body?: string;
  lastRun?: string;
  nextRun?: string;
}

export type ExportFormat = "pdf" | "excel" | "csv" | "json" | "xml" | "html" | "markdown" | "png" | "svg" | "pptx";

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: ReportType;
  category: ReportCategory;
  companyId?: string;
  isGlobal: boolean;
  isPublished: boolean;
  isArchived: boolean;
  version: number;
  publishedVersion?: number;
  sourceTemplateId?: string;
  config: ReportConfig;
  parameters: ReportParameter[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface Dataset {
  id: string;
  name: string;
  description: string;
  source: "metadata" | "query" | "sql" | "integration" | "file";
  entityId?: string;
  entityName?: string;
  queryId?: string;
  sql?: string;
  joins: DatasetJoin[];
  filters: DatasetFilter[];
  groups: DatasetGroup[];
  sorts: DatasetSort[];
  calculatedFields: CalculatedField[];
  companyId?: string;
  isGlobal: boolean;
  isPublished: boolean;
  version: number;
  fields: DatasetField[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface DatasetJoin {
  type: "inner" | "left" | "right" | "full";
  entityId: string;
  alias: string;
  on: string;
}

export interface DatasetFilter {
  field: string;
  operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "contains" | "startsWith" | "endsWith" | "in" | "between" | "isNull" | "isNotNull";
  value: string;
  logical: "and" | "or";
}

export interface DatasetGroup {
  field: string;
  aggregate: "count" | "sum" | "avg" | "min" | "max" | "distinct";
  alias: string;
}

export interface DatasetSort {
  field: string;
  dir: "asc" | "desc";
}

export interface CalculatedField {
  name: string;
  expression: string;
  type: "string" | "number" | "boolean" | "date";
  description?: string;
}

export interface DatasetField {
  name: string;
  label: string;
  type: string;
  entityField: string;
  entityId: string;
  aggregate?: string;
  format?: string;
  visible: boolean;
}

export interface Query {
  id: string;
  name: string;
  description: string;
  type: "visual" | "sql";
  entityId?: string;
  fields: string[];
  filters: DatasetFilter[];
  groups: DatasetGroup[];
  sorts: DatasetSort[];
  sql?: string;
  companyId?: string;
  isGlobal: boolean;
  favorite: boolean;
  version: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface Kpi {
  id: string;
  name: string;
  description: string;
  category: KpiCategory;
  value: number;
  target: number;
  unit: string;
  period: "daily" | "weekly" | "monthly" | "quarterly" | "yearly";
  trend: "up" | "down" | "stable";
  trendPercentage: number;
  icon: string;
  color: string;
  format: "number" | "currency" | "percent" | "time";
  precision: number;
  prefix?: string;
  suffix?: string;
  datasetId?: string;
  queryId?: string;
  formula?: string;
  companyId?: string;
  isGlobal: boolean;
  favorite: boolean;
  history: KpiHistory[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export type KpiCategory = "productivity" | "quality" | "financial" | "operational" | "commercial" | "technical" | "administrative" | "custom";

export interface KpiHistory {
  date: string;
  value: number;
  target: number;
  percentage: number;
}

export interface ExportJob {
  id: string;
  reportId: string;
  reportName: string;
  format: ExportFormat;
  status: "pending" | "processing" | "completed" | "failed";
  fileSize?: number;
  fileName?: string;
  startedAt: string;
  completedAt?: string;
  error?: string;
  createdBy: string;
  companyId?: string;
}

export interface ExecutionLog {
  id: string;
  type: "report" | "dashboard" | "dataset" | "export" | "print" | "schedule";
  referenceId: string;
  referenceName: string;
  action: "created" | "updated" | "deleted" | "executed" | "exported" | "printed" | "shared" | "downloaded" | "scheduled" | "error";
  status: "success" | "error";
  duration: number;
  details?: string;
  userId: string;
  userName: string;
  companyId?: string;
  companyName?: string;
  timestamp: string;
}

export interface AnalyticsEvent {
  id: string;
  event: string;
  category: string;
  label: string;
  value?: number;
  userId: string;
  companyId?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface Subscription {
  id: string;
  reportId?: string;
  dashboardId?: string;
  name: string;
  type: "email" | "notification" | "webhook";
  schedule: ReportSchedule;
  enabled: boolean;
  lastSent?: string;
  createdAt: string;
  updatedAt: string;
}

export const REPORTING_CONSTANTS = {
  WIDGET_TYPES: ["table","card","indicator","lineChart","barChart","pieChart","areaChart","doughnutChart","gauge","heatmap","calendar","timeline","kanban","map","text","image","html","iframe","kpi","metric","progress","stat","list"] as const,
  EXPORT_FORMATS: ["pdf","excel","csv","json","xml","html","markdown","png","svg","pptx"] as const,
  PAGE_SIZES: ["A4","A5","letter","label","thermal"] as const,
  ORIENTATIONS: ["portrait","landscape"] as const,
  REPORT_TYPES: ["tabular","summary","detail","label","form","document","dashboard","analytics"] as const,
  KPI_PERIODS: ["daily","weekly","monthly","quarterly","yearly"] as const,
  DASHBOARD_CATEGORIES: ["executive","technical","financial","administrative","operational","ai","integrations","audit","custom"] as const,
} as const;
