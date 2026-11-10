// Browser-safe contracts for the reporting layer (Datasets + Reports).
// No server-only imports may ever appear in this file.
import type { Database } from "@/integrations/supabase/types";
import type { QueryColumn, QueryRow } from "@/lib/sql/types";

export type DatasetStatus = Database["public"]["Enums"]["dataset_status"];
export type DatasetSourceKind = Database["public"]["Enums"]["dataset_source_kind"];
export type ReportStatus = Database["public"]["Enums"]["report_status"];
export type ReportVisibility = Database["public"]["Enums"]["report_visibility"];
export type VisualType = Database["public"]["Enums"]["column_visual_type"];
export type FilterType = Database["public"]["Enums"]["report_filter_type"];

export const VISUAL_TYPES: VisualType[] = [
  "text",
  "number",
  "integer",
  "decimal",
  "currency",
  "percentage",
  "date",
  "datetime",
  "boolean",
  "json",
];

export const FILTER_TYPES: FilterType[] = [
  "text",
  "number",
  "date",
  "datetime",
  "boolean",
  "select",
  "multiselect",
];

export const PAGE_SIZES = [25, 50, 100, 250, 500, 1000] as const;
export const DEFAULT_PAGE_SIZE = 50;

export const CACHE_OPTIONS = [
  { value: 0, label: "Sem cache" },
  { value: 300, label: "5 minutos" },
  { value: 900, label: "15 minutos" },
  { value: 1800, label: "30 minutos" },
  { value: 3600, label: "1 hora" },
  { value: 86400, label: "Diário" },
] as const;

/** Presentation formatting for one column. */
export type ColumnFormat = {
  decimals?: number;
  thousands?: boolean;
  currency?: string;
  dateFormat?: "short" | "medium" | "long" | "iso";
  timeFormat?: "short" | "medium" | "none";
  percentBase?: 1 | 100;
  prefix?: string;
  suffix?: string;
};

export type DatasetColumn = {
  id?: string;
  name: string;
  friendlyName: string | null;
  description: string | null;
  dataType: string | null;
  visualType: VisualType;
  nullable: boolean;
  visible: boolean;
  sortOrder: number;
  format: ColumnFormat;
};

export type FilterOperator =
  | "eq"
  | "neq"
  | "contains"
  | "ncontains"
  | "starts"
  | "ends"
  | "gt"
  | "lt"
  | "gte"
  | "lte"
  | "between"
  | "before"
  | "after"
  | "last_days"
  | "last_months"
  | "current_year"
  | "current_month"
  | "in"
  | "isnull"
  | "notnull";

export const OPERATORS_BY_TYPE: Record<FilterType, FilterOperator[]> = {
  text: ["eq", "neq", "contains", "ncontains", "starts", "ends", "isnull", "notnull"],
  number: ["eq", "neq", "gt", "lt", "gte", "lte", "between", "isnull", "notnull"],
  date: [
    "eq",
    "before",
    "after",
    "between",
    "last_days",
    "last_months",
    "current_year",
    "current_month",
    "isnull",
    "notnull",
  ],
  datetime: ["eq", "before", "after", "between", "last_days", "last_months", "isnull", "notnull"],
  boolean: ["eq", "isnull", "notnull"],
  select: ["eq", "neq", "isnull", "notnull"],
  multiselect: ["in", "isnull", "notnull"],
};

export const OPERATOR_LABELS: Record<FilterOperator, string> = {
  eq: "Igual",
  neq: "Diferente",
  contains: "Contém",
  ncontains: "Não contém",
  starts: "Começa com",
  ends: "Termina com",
  gt: "Maior",
  lt: "Menor",
  gte: "Maior ou igual",
  lte: "Menor ou igual",
  between: "Entre",
  before: "Antes",
  after: "Depois",
  last_days: "Últimos X dias",
  last_months: "Últimos X meses",
  current_year: "Ano atual",
  current_month: "Mês atual",
  in: "Está em",
  isnull: "Vazio",
  notnull: "Preenchido",
};

/** Operators that need no user-supplied value. */
export const NO_VALUE_OPERATORS: FilterOperator[] = [
  "isnull",
  "notnull",
  "current_year",
  "current_month",
];

export type FilterOption = { label: string; value: string };

/** A filter the report author exposes to the end user. */
export type ReportFilterDef = {
  id?: string;
  key: string;
  label: string;
  column: string;
  type: FilterType;
  operator: FilterOperator;
  required: boolean;
  defaultValue: FilterValue | null;
  options: FilterOption[];
  sortOrder: number;
};

/** A value the end user typed/selected for one filter. */
export type FilterValue = {
  value?: string | null;
  value2?: string | null;
  values?: string[];
  operator?: FilterOperator;
};

export type FilterState = Record<string, FilterValue>;

export type ReportColumnConfig = {
  name: string;
  label?: string;
  width?: number;
  visible: boolean;
  pinned?: boolean;
  order: number;
};

export type ReportTableConfig = {
  columns: ReportColumnConfig[];
  pageSize: number;
  sorts: { column: string; direction: "asc" | "desc" }[];
  showSearch: boolean;
  striped?: boolean;
  density?: "compact" | "normal";
};

export const DEFAULT_TABLE_CONFIG: ReportTableConfig = {
  columns: [],
  pageSize: DEFAULT_PAGE_SIZE,
  sorts: [],
  showSearch: true,
  density: "normal",
};

export type SortSpec = { column: string; direction: "asc" | "desc" };

/** Result of running a dataset or a report — never carries technical details. */
export type ReportRunResult = {
  columns: QueryColumn[];
  rows: QueryRow[];
  rowCount: number;
  total: number | null;
  page: number;
  pageSize: number;
  durationMs: number;
  truncated: boolean;
};

export type RunFailure = {
  ok: false;
  kind: string;
  /** Safe, user-facing message. Technical SQL/connection detail is stripped. */
  message: string;
};

export type RunOutcome = ({ ok: true } & ReportRunResult) | RunFailure;

export type DatasetPreview = {
  ok: true;
  columns: DatasetColumn[];
  rows: QueryRow[];
  rowCount: number;
  durationMs: number;
};

export type DatasetPreviewOutcome = DatasetPreview | RunFailure;

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  draft: "Rascunho",
  review: "Em revisão",
  published: "Publicado",
  archived: "Arquivado",
};

export const VISIBILITY_LABELS: Record<ReportVisibility, string> = {
  private: "Privado",
  workspace: "Workspace",
  organization: "Organização",
  groups: "Grupos",
  users: "Usuários",
};

export const DATASET_STATUS_LABELS: Record<DatasetStatus, string> = {
  draft: "Rascunho",
  published: "Publicado",
  archived: "Arquivado",
};