// Server-only Query Service. It sits between the server functions and the
// database adapters:
//   server fn -> Query Service -> Connection Adapter (driver) -> engine
// Responsibilities: RBAC, read-only guard, row limiting, error classification,
// history recording and audit logging. Adapters know nothing about tenancy.
import type { Db } from "@/lib/datasources/ds.server";
import type { DsType } from "@/lib/datasources/types";
import { DriverError } from "@/lib/datasources/types";
import { applyRowLimit } from "./dialect";
import { guardReadOnlySql, isRowReturningCommand } from "./guard";
import type { QueryFailure, QueryOutcome, QueryResult, QueryRow, QueryValue } from "./types";

/** Normalizes driver values into JSON-safe scalars for the RPC boundary. */
export function toQueryValue(value: unknown): QueryValue {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return Number.isNaN(value as number) ? null : (value as QueryValue);
  }
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Uint8Array) return `\\x${Buffer.from(value).toString("hex")}`;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function toQueryRows(rows: Record<string, unknown>[]): QueryRow[] {
  return rows.map((row) => {
    const out: QueryRow = {};
    for (const [key, value] of Object.entries(row)) out[key] = toQueryValue(value);
    return out;
  });
}

export const SQL_STUDIO_ROLES = ["administrator", "dba", "developer", "analyst"] as const;

export type SqlContext = {
  supabase: Db;
  userId: string;
  orgId: string;
};

/** Signed-in users without a SQL-capable role are rejected before any connect. */
export async function assertCanRunSql(ctx: SqlContext) {
  const { data, error } = await ctx.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", ctx.userId)
    .eq("organization_id", ctx.orgId);
  if (error) throw new Error(error.message);
  const roles = (data ?? []).map((r) => r.role as string);
  const allowed = roles.some((r) => (SQL_STUDIO_ROLES as readonly string[]).includes(r));
  if (!allowed) {
    throw new PermissionError(
      "Seu perfil não possui acesso ao SQL Studio. Fale com um administrador da organização.",
    );
  }
  return roles;
}

export class PermissionError extends Error {}

export type SourceContext = {
  id: string;
  name: string;
  type: DsType;
  databaseName: string | null;
  defaultSchema: string | null;
  config: import("@/lib/datasources/types").ConnectionConfig;
};

/** Loads a data source (with credentials, service-role) after tenancy checks. */
export async function loadSource(ctx: SqlContext, dataSourceId: string): Promise<SourceContext> {
  const s = await import("@/lib/datasources/ds.server");
  const { data: visible, error } = await ctx.supabase
    .from("data_sources")
    .select("id, name, type, database_name, default_schema, active")
    .eq("id", dataSourceId)
    .eq("organization_id", ctx.orgId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!visible) throw new PermissionError("Fonte de dados não encontrada nesta organização.");
  if (!visible.active) throw new PermissionError("Esta fonte de dados está inativa.");

  const row = await s.loadRowWithSecret(ctx.orgId, dataSourceId);
  return {
    id: visible.id,
    name: visible.name,
    type: visible.type as DsType,
    databaseName: visible.database_name,
    defaultSchema: visible.default_schema,
    config: s.configFromRow(row),
  };
}

export function classifyQueryError(error: unknown): QueryFailure {
  const message = error instanceof Error ? error.message : String(error);
  if (error instanceof PermissionError) return { ok: false, kind: "permission", message };
  if (error instanceof DriverError) {
    switch (error.health) {
      case "invalid_credentials":
        return { ok: false, kind: "authentication", message };
      case "timeout":
        return { ok: false, kind: "timeout", message };
      case "offline":
        return { ok: false, kind: "connection", message };
      default:
        break;
    }
  }
  if (/syntax error|unrecognized token|near ".*": syntax/i.test(message)) {
    return { ok: false, kind: "syntax", message };
  }
  if (/permission denied|access denied|not authorized/i.test(message)) {
    return { ok: false, kind: "permission", message };
  }
  if (/timeout|timed out|canceling statement/i.test(message)) {
    return { ok: false, kind: "timeout", message };
  }
  if (/does not exist|unknown table|no such table|unknown column|no such column/i.test(message)) {
    return { ok: false, kind: "syntax", message };
  }
  if (/ECONNREFUSED|ENOTFOUND|fetch failed|unavailable/i.test(message)) {
    return { ok: false, kind: "connection", message };
  }
  return { ok: false, kind: "unknown", message };
}

export async function recordHistory(
  ctx: SqlContext,
  entry: {
    dataSourceId: string | null;
    dataSourceName: string | null;
    databaseName: string | null;
    schemaName: string | null;
    sql: string;
    status: "success" | "error" | "cancelled" | "blocked";
    durationMs: number | null;
    rowCount: number | null;
    columnCount: number | null;
    errorMessage: string | null;
    workspaceId?: string | null;
  },
) {
  await ctx.supabase.from("query_history").insert({
    organization_id: ctx.orgId,
    workspace_id: entry.workspaceId ?? null,
    user_id: ctx.userId,
    data_source_id: entry.dataSourceId,
    data_source_name: entry.dataSourceName,
    database_name: entry.databaseName,
    schema_name: entry.schemaName,
    sql: entry.sql,
    status: entry.status,
    duration_ms: entry.durationMs,
    row_count: entry.rowCount,
    column_count: entry.columnCount,
    error_message: entry.errorMessage,
  });

  await ctx.supabase.from("audit_logs").insert({
    organization_id: ctx.orgId,
    user_id: ctx.userId,
    action: `sql.query.${entry.status}`,
    resource: "data_source",
    resource_id: entry.dataSourceId,
    metadata: {
      data_source: entry.dataSourceName,
      database: entry.databaseName,
      schema: entry.schemaName,
      duration_ms: entry.durationMs,
      row_count: entry.rowCount,
      sql: entry.sql.slice(0, 4000),
    },
  });
}

/** Full read-only execution pipeline for one statement. */
export async function runReadQuery(
  ctx: SqlContext,
  input: {
    dataSourceId: string;
    sql: string;
    limit: number;
    schemaName?: string | null;
    workspaceId?: string | null;
    /** Skip guard/history bookkeeping for internal, machine-built SQL. */
    internal?: boolean;
    /** Engine-bound parameters; never string-interpolated into the statement. */
    params?: unknown[];
  },
): Promise<QueryOutcome> {
  await assertCanRunSql(ctx);

  const guard = guardReadOnlySql(input.sql);
  if (!guard.ok) {
    if (!input.internal) {
      await recordHistory(ctx, {
        dataSourceId: input.dataSourceId,
        dataSourceName: null,
        databaseName: null,
        schemaName: input.schemaName ?? null,
        sql: input.sql,
        status: "blocked",
        durationMs: 0,
        rowCount: null,
        columnCount: null,
        errorMessage: guard.message,
        workspaceId: input.workspaceId ?? null,
      });
    }
    return { ok: false, kind: "guard", message: guard.message, keyword: guard.keyword };
  }

  let source: SourceContext | null = null;
  const started = Date.now();
  try {
    source = await loadSource(ctx, input.dataSourceId);
    const { getDriver } = await import("@/lib/datasources/drivers/index.server");
    const driver = getDriver(source.type);

    const effective = isRowReturningCommand(guard.command)
      ? applyRowLimit(guard.statement, input.limit + 1)
      : guard.statement;

    const raw = await driver.executeReadQuery(source.config, effective, input.params);
    const truncated = raw.rows.length > input.limit;
    const rows = toQueryRows(truncated ? raw.rows.slice(0, input.limit) : raw.rows);

    const result: QueryResult = {
      columns: raw.columns,
      rows,
      rowCount: rows.length,
      truncated,
      durationMs: Date.now() - started,
      command: guard.command,
      dataSourceId: source.id,
      dataSourceName: source.name,
      databaseName: source.databaseName,
      schemaName: input.schemaName ?? source.defaultSchema ?? null,
      serverVersion: null,
      limit: input.limit,
    };

    if (!input.internal) {
      await recordHistory(ctx, {
        dataSourceId: source.id,
        dataSourceName: source.name,
        databaseName: source.databaseName,
        schemaName: result.schemaName,
        sql: guard.statement,
        status: "success",
        durationMs: result.durationMs,
        rowCount: result.rowCount,
        columnCount: result.columns.length,
        errorMessage: null,
        workspaceId: input.workspaceId ?? null,
      });
    }
    return { ok: true, result };
  } catch (error) {
    const failure = classifyQueryError(error);
    if (!input.internal) {
      await recordHistory(ctx, {
        dataSourceId: input.dataSourceId,
        dataSourceName: source?.name ?? null,
        databaseName: source?.databaseName ?? null,
        schemaName: input.schemaName ?? null,
        sql: guard.statement,
        status: "error",
        durationMs: Date.now() - started,
        rowCount: null,
        columnCount: null,
        errorMessage: failure.message,
        workspaceId: input.workspaceId ?? null,
      });
    }
    return failure;
  }
}