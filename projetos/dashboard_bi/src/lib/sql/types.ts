// Browser-safe shared contracts for the Query Service.
import type { DsType } from "@/lib/datasources/types";

export type QueryColumn = {
  name: string;
  dataType: string | null;
};

/** Values are normalized server-side to JSON-safe scalars before crossing RPC. */
export type QueryValue = string | number | boolean | null;
export type QueryRow = Record<string, QueryValue>;

export type QueryResult = {
  columns: QueryColumn[];
  rows: QueryRow[];
  rowCount: number;
  truncated: boolean;
  durationMs: number;
  command: string;
  dataSourceId: string;
  dataSourceName: string;
  databaseName: string | null;
  schemaName: string | null;
  serverVersion: string | null;
  limit: number;
};

export type QueryFailure = {
  ok: false;
  kind:
    | "guard"
    | "permission"
    | "connection"
    | "authentication"
    | "timeout"
    | "syntax"
    | "unknown";
  message: string;
  keyword?: string;
};

export type QuerySuccess = { ok: true; result: QueryResult };
export type QueryOutcome = QuerySuccess | QueryFailure;

export type ExplainOutcome =
  | { ok: true; supported: true; text: string; durationMs: number }
  | { ok: true; supported: false; message: string }
  | QueryFailure;

export const ROW_LIMITS = [100, 500, 1000, 5000, 10000] as const;
export const PREVIEW_LIMITS = [25, 50, 100, 250, 500] as const;
export const DEFAULT_ROW_LIMIT = 1000;
export const DEFAULT_PREVIEW_LIMIT = 100;

export type FilterOperator =
  | "eq"
  | "neq"
  | "contains"
  | "starts"
  | "ends"
  | "gt"
  | "lt"
  | "gte"
  | "lte"
  | "between"
  | "isnull"
  | "notnull";

export const FILTER_OPERATORS: { value: FilterOperator; arity: 0 | 1 | 2 }[] = [
  { value: "eq", arity: 1 },
  { value: "neq", arity: 1 },
  { value: "contains", arity: 1 },
  { value: "starts", arity: 1 },
  { value: "ends", arity: 1 },
  { value: "gt", arity: 1 },
  { value: "lt", arity: 1 },
  { value: "gte", arity: 1 },
  { value: "lte", arity: 1 },
  { value: "between", arity: 2 },
  { value: "isnull", arity: 0 },
  { value: "notnull", arity: 0 },
];

export type PreviewFilter = {
  column: string;
  operator: FilterOperator;
  value?: string;
  value2?: string;
};

export type PreviewSort = { column: string; direction: "asc" | "desc" };

export type TablePreviewInput = {
  objectId: string;
  limit: number;
  offset: number;
  filters: PreviewFilter[];
  filterJoin: "AND" | "OR";
  sorts: PreviewSort[];
};

export type SqlDialect = DsType;