// Browser-safe zod schemas shared by the client forms and the server functions.
import { z } from "zod";
import { DEFAULT_PREVIEW_LIMIT, DEFAULT_ROW_LIMIT } from "./types";

export const filterSchema = z.object({
  column: z.string().min(1).max(200),
  operator: z.enum([
    "eq",
    "neq",
    "contains",
    "starts",
    "ends",
    "gt",
    "lt",
    "gte",
    "lte",
    "between",
    "isnull",
    "notnull",
  ]),
  value: z.string().max(500).optional(),
  value2: z.string().max(500).optional(),
});

export const sortSchema = z.object({
  column: z.string().min(1).max(200),
  direction: z.enum(["asc", "desc"]),
});

export const runQuerySchema = z.object({
  dataSourceId: z.string().uuid(),
  sql: z.string().min(1).max(200000),
  limit: z.number().int().min(1).max(10000).default(DEFAULT_ROW_LIMIT),
  schemaName: z.string().max(200).nullable().optional(),
  workspaceId: z.string().uuid().nullable().optional(),
});

export const explainSchema = z.object({
  dataSourceId: z.string().uuid(),
  sql: z.string().min(1).max(200000),
  schemaName: z.string().max(200).nullable().optional(),
});

export const previewSchema = z.object({
  objectId: z.string().uuid(),
  limit: z.number().int().min(1).max(500).default(DEFAULT_PREVIEW_LIMIT),
  offset: z.number().int().min(0).max(1000000).default(0),
  filters: z.array(filterSchema).max(20).default([]),
  filterJoin: z.enum(["AND", "OR"]).default("AND"),
  sorts: z.array(sortSchema).max(8).default([]),
  withCount: z.boolean().default(false),
});