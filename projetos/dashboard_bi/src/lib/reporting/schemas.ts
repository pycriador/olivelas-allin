// Browser-safe zod schemas shared by the forms and the server functions.
import { z } from "zod";

export const visualTypeSchema = z.enum([
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
]);

export const filterTypeSchema = z.enum([
  "text",
  "number",
  "date",
  "datetime",
  "boolean",
  "select",
  "multiselect",
]);

export const operatorSchema = z.enum([
  "eq",
  "neq",
  "contains",
  "ncontains",
  "starts",
  "ends",
  "gt",
  "lt",
  "gte",
  "lte",
  "between",
  "before",
  "after",
  "last_days",
  "last_months",
  "current_year",
  "current_month",
  "in",
  "isnull",
  "notnull",
]);

export const columnFormatSchema = z.object({
  decimals: z.number().int().min(0).max(10).optional(),
  thousands: z.boolean().optional(),
  currency: z.string().max(8).optional(),
  dateFormat: z.enum(["short", "medium", "long", "iso"]).optional(),
  timeFormat: z.enum(["short", "medium", "none"]).optional(),
  percentBase: z.union([z.literal(1), z.literal(100)]).optional(),
  prefix: z.string().max(12).optional(),
  suffix: z.string().max(12).optional(),
});

export const datasetColumnSchema = z.object({
  name: z.string().min(1).max(300),
  friendlyName: z.string().max(300).nullable().default(null),
  description: z.string().max(1000).nullable().default(null),
  dataType: z.string().max(120).nullable().default(null),
  visualType: visualTypeSchema.default("text"),
  nullable: z.boolean().default(true),
  visible: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(500).default(0),
  format: columnFormatSchema.default({}),
});

export const datasetInputSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2, "Informe um nome").max(160),
  description: z.string().trim().max(1000).nullable().optional(),
  dataSourceId: z.string().uuid("Selecione a fonte de dados"),
  workspaceId: z.string().uuid().nullable().optional(),
  savedQueryId: z.string().uuid().nullable().optional(),
  sourceKind: z.enum(["sql", "table", "view", "saved_query"]).default("sql"),
  databaseName: z.string().max(200).nullable().optional(),
  schemaName: z.string().max(200).nullable().optional(),
  objectName: z.string().max(300).nullable().optional(),
  sql: z.string().trim().min(1, "Informe a consulta").max(200000),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  cacheTtlSeconds: z.number().int().min(0).max(86400).default(0),
  rowLimit: z.number().int().min(1).max(10000).default(1000),
  columns: z.array(datasetColumnSchema).max(300).default([]),
});

export const filterValueSchema = z.object({
  value: z.string().max(500).nullable().optional(),
  value2: z.string().max(500).nullable().optional(),
  values: z.array(z.string().max(500)).max(100).optional(),
  operator: operatorSchema.optional(),
});

export const filterStateSchema = z.record(z.string().max(80), filterValueSchema);

export const reportFilterSchema = z.object({
  key: z
    .string()
    .trim()
    .min(1)
    .max(60)
    .regex(/^[a-z0-9_]+$/i, "Use apenas letras, números e _"),
  label: z.string().trim().min(1).max(120),
  column: z.string().trim().min(1).max(300),
  type: filterTypeSchema,
  operator: operatorSchema,
  required: z.boolean().default(false),
  defaultValue: filterValueSchema.nullable().default(null),
  options: z
    .array(z.object({ label: z.string().max(200), value: z.string().max(200) }))
    .max(200)
    .default([]),
  sortOrder: z.number().int().min(0).max(100).default(0),
});

export const tableConfigSchema = z.object({
  columns: z
    .array(
      z.object({
        name: z.string().min(1).max(300),
        label: z.string().max(300).optional(),
        width: z.number().int().min(60).max(1200).optional(),
        visible: z.boolean().default(true),
        pinned: z.boolean().optional(),
        order: z.number().int().min(0).max(500).default(0),
      }),
    )
    .max(300)
    .default([]),
  pageSize: z.number().int().min(25).max(1000).default(50),
  sorts: z
    .array(z.object({ column: z.string().max(300), direction: z.enum(["asc", "desc"]) }))
    .max(6)
    .default([]),
  showSearch: z.boolean().default(true),
  striped: z.boolean().optional(),
  density: z.enum(["compact", "normal"]).optional(),
});

export const reportInputSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2, "Informe um nome").max(160),
  description: z.string().trim().max(1000).nullable().optional(),
  datasetId: z.string().uuid("Selecione um dataset"),
  workspaceId: z.string().uuid().nullable().optional(),
  category: z.string().trim().max(80).nullable().optional(),
  visibility: z.enum(["private", "workspace", "organization", "groups", "users"]).default("organization"),
  status: z.enum(["draft", "review", "published", "archived"]).default("draft"),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  cacheTtlSeconds: z.number().int().min(0).max(86400).default(0),
  config: tableConfigSchema,
  filters: z.array(reportFilterSchema).max(30).default([]),
  versionNote: z.string().max(300).nullable().optional(),
});

export const runReportSchema = z.object({
  reportId: z.string().uuid(),
  filters: filterStateSchema.default({}),
  search: z.string().max(200).default(""),
  sorts: z
    .array(z.object({ column: z.string().max(300), direction: z.enum(["asc", "desc"]) }))
    .max(6)
    .default([]),
  page: z.number().int().min(1).max(100000).default(1),
  pageSize: z.number().int().min(25).max(1000).default(50),
  withCount: z.boolean().default(true),
  /** Export runs bypass pagination up to a hard cap and are audited as exports. */
  exportFormat: z.enum(["csv", "xlsx", "json", "pdf"]).nullable().default(null),
});

export const previewDatasetSchema = z.object({
  datasetId: z.string().uuid().nullable().optional(),
  dataSourceId: z.string().uuid(),
  sql: z.string().trim().min(1).max(200000),
  limit: z.number().int().min(1).max(500).default(50),
  schemaName: z.string().max(200).nullable().optional(),
});

export const runDatasetSchema = z.object({
  datasetId: z.string().uuid(),
  page: z.number().int().min(1).max(100000).default(1),
  pageSize: z.number().int().min(25).max(1000).default(50),
  search: z.string().max(200).default(""),
  sorts: z
    .array(z.object({ column: z.string().max(300), direction: z.enum(["asc", "desc"]) }))
    .max(6)
    .default([]),
  withCount: z.boolean().default(true),
});

export const idSchema = z.object({ id: z.string().uuid() });
export const publishSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["draft", "review", "published", "archived"]),
});
export const duplicateSchema = z.object({ id: z.string().uuid(), name: z.string().trim().max(160).optional() });
export const restoreVersionSchema = z.object({ reportId: z.string().uuid(), versionId: z.string().uuid() });
export const shareSchema = z.object({
  reportId: z.string().uuid(),
  visibility: z.enum(["private", "workspace", "organization", "groups", "users"]),
  groupIds: z.array(z.string().uuid()).max(50).default([]),
  userIds: z.array(z.string().uuid()).max(200).default([]),
  access: z.enum(["view", "edit"]).default("view"),
});

export type DatasetInput = z.infer<typeof datasetInputSchema>;
export type ReportInput = z.infer<typeof reportInputSchema>;
export type RunReportInput = z.infer<typeof runReportSchema>;