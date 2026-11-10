// Browser-safe Zod schemas shared by the data source forms and server functions.
import { z } from "zod";

export const dsTypeSchema = z.enum([
  "postgresql",
  "mysql",
  "mariadb",
  "sqlite",
  "sqlserver",
  "oracle",
  "duckdb",
  "snowflake",
  "bigquery",
  "redshift",
  "clickhouse",
]);

export const dataSourceInputSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2).max(120),
  description: z.string().max(500).nullish(),
  type: dsTypeSchema,
  environment: z.enum(["production", "staging", "development"]).default("development"),
  workspaceId: z.string().uuid().nullish(),
  host: z.string().max(255).nullish(),
  port: z.number().int().min(1).max(65535).nullish(),
  databaseName: z.string().max(120).nullish(),
  defaultSchema: z.string().max(120).nullish(),
  username: z.string().max(120).nullish(),
  password: z.string().max(2000).nullish(),
  sslEnabled: z.boolean().default(false),
  timeoutMs: z.number().int().min(1000).max(120000).default(15000),
  tags: z.array(z.string().max(40)).default([]),
  syncMode: z.enum(["manual", "automatic", "scheduled"]).default("manual"),
  syncFrequency: z
    .enum(["manual", "every_5_min", "every_15_min", "hourly", "daily"])
    .default("manual"),
  active: z.boolean().default(true),
});

export type DataSourceInput = z.infer<typeof dataSourceInputSchema>;

export const testConnectionSchema = z.object({
  dataSourceId: z.string().uuid().optional(),
  draft: dataSourceInputSchema.optional(),
});

export const idSchema = z.object({ id: z.string().uuid() });
