// Server-only orchestration for data sources: credential resolution, health
// probes and persisting a discovery run into the catalog tables.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { decryptSecret } from "./crypto.server";
import { getDriver } from "./drivers/index.server";
import type {
  ConnectionConfig,
  DiscoveryResult,
  DsHealth,
  DsType,
  TestConnectionResult,
} from "./types";
import { DriverError } from "./types";

export type Db = SupabaseClient<Database>;
type DsRow = Database["public"]["Tables"]["data_sources"]["Row"];

export async function resolveOrgId(supabase: Db, userId: string): Promise<string> {
  const { data } = await supabase
    .from("profiles")
    .select("current_organization_id")
    .eq("id", userId)
    .maybeSingle();
  const orgId = data?.current_organization_id;
  if (!orgId) throw new Error("No active organization for this user.");
  return orgId;
}

export async function assertCanManage(supabase: Db, userId: string, orgId: string) {
  const { data, error } = await supabase.rpc("can_manage_datasources", {
    _user_id: userId,
    _org_id: orgId,
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("You do not have permission to manage data sources.");
}

export function buildConfig(
  input: {
    type: DsType;
    host: string | null;
    port: number | null;
    database_name: string | null;
    default_schema: string | null;
    username: string | null;
    ssl_enabled: boolean;
    ssl_ca_certificate: string | null;
    timeout_ms: number;
    extra_config: unknown;
  },
  password: string,
): ConnectionConfig {
  return {
    type: input.type,
    host: input.host ?? "",
    port: input.port,
    database: input.database_name ?? "",
    defaultSchema: input.default_schema,
    username: input.username ?? "",
    password,
    sslEnabled: input.ssl_enabled,
    sslCaCertificate: input.ssl_ca_certificate,
    timeoutMs: input.timeout_ms || 15000,
    extra: (input.extra_config as Record<string, unknown>) ?? {},
  };
}

export function configFromRow(row: DsRow, overridePassword?: string | null): ConnectionConfig {
  // Internal source: the platform's own database. Credentials never live in a
  // table — they are resolved from the server environment at call time.
  const extra = (row.extra_config as Record<string, unknown> | null) ?? {};
  if (extra["internal"] === true || extra["internal"] === "true") {
    return internalConfig(row);
  }
  const password =
    overridePassword && overridePassword.length > 0
      ? overridePassword
      : row.secret_ciphertext
        ? decryptSecret(row.secret_ciphertext)
        : "";
  return buildConfig(row, password);
}

/** Builds a connection to the platform database from SUPABASE_DB_URL. */
function internalConfig(row: DsRow): ConnectionConfig {
  const raw = process.env["SUPABASE_DB_URL"];
  if (!raw) throw new DriverError("Fonte interna indisponível neste ambiente.", "offline");
  const url = new URL(raw);
  return {
    type: "postgresql",
    host: url.hostname,
    port: url.port ? Number(url.port) : 5432,
    database: url.pathname.replace(/^\//, "") || "postgres",
    defaultSchema: row.default_schema ?? "public",
    username: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    sslEnabled: true,
    sslCaCertificate: null,
    timeoutMs: row.timeout_ms || 20000,
    extra: { internal: true },
  };
}

export async function probe(config: ConnectionConfig): Promise<TestConnectionResult> {
  const started = Date.now();
  try {
    return await getDriver(config.type).probe(config);
  } catch (error) {
    const health: DsHealth = error instanceof DriverError ? error.health : "offline";
    return {
      ok: false as const,
      health,
      message: error instanceof Error ? error.message : String(error),
      latencyMs: Date.now() - started,
    };
  }
}

export async function applyHealth(
  supabase: Db,
  dataSourceId: string,
  result: TestConnectionResult,
) {
  await supabase
    .from("data_sources")
    .update(
      result.ok
        ? {
            health: "online",
            health_message: null,
            health_checked_at: new Date().toISOString(),
            latency_ms: result.latencyMs,
            server_version: result.serverVersion,
          }
        : {
            health: result.health,
            health_message: result.message,
            health_checked_at: new Date().toISOString(),
            latency_ms: result.latencyMs,
          },
    )
    .eq("id", dataSourceId);
}

/** Replaces the catalogued structure of one data source with a fresh crawl. */
export async function persistDiscovery(
  supabase: Db,
  orgId: string,
  dataSourceId: string,
  result: DiscoveryResult,
) {
  for (const table of [
    "ds_constraints",
    "ds_indexes",
    "ds_columns",
    "ds_objects",
    "ds_schemas",
  ] as const) {
    const { error } = await supabase.from(table).delete().eq("data_source_id", dataSourceId);
    if (error) throw new Error(error.message);
  }

  let tableCount = 0;
  let viewCount = 0;
  let columnCount = 0;
  const now = new Date().toISOString();

  for (const schema of result.schemas) {
    const { data: schemaRow, error: schemaErr } = await supabase
      .from("ds_schemas")
      .insert({
        organization_id: orgId,
        data_source_id: dataSourceId,
        name: schema.name,
        comment: schema.comment,
      })
      .select("id")
      .single();
    if (schemaErr || !schemaRow) throw new Error(schemaErr?.message ?? "Failed to store schema.");

    for (const object of schema.objects) {
      if (object.objectType === "table") tableCount += 1;
      else viewCount += 1;

      const { data: objectRow, error: objectErr } = await supabase
        .from("ds_objects")
        .insert({
          organization_id: orgId,
          data_source_id: dataSourceId,
          schema_id: schemaRow.id,
          name: object.name,
          object_type: object.objectType,
          estimated_rows: object.estimatedRows,
          size_bytes: object.sizeBytes,
          comment: object.comment,
          definition: object.definition,
          last_synced_at: now,
        })
        .select("id")
        .single();
      if (objectErr || !objectRow) throw new Error(objectErr?.message ?? "Failed to store object.");

      if (object.columns.length) {
        columnCount += object.columns.length;
        const { error } = await supabase.from("ds_columns").insert(
          object.columns.map((c) => ({
            organization_id: orgId,
            data_source_id: dataSourceId,
            object_id: objectRow.id,
            name: c.name,
            ordinal_position: c.ordinalPosition,
            data_type: c.dataType,
            is_nullable: c.isNullable,
            is_primary_key: c.isPrimaryKey,
            is_foreign_key: c.isForeignKey,
            is_unique: c.isUnique,
            references_schema: c.referencesSchema,
            references_table: c.referencesTable,
            references_column: c.referencesColumn,
            default_value: c.defaultValue,
            numeric_precision: c.numericPrecision,
            numeric_scale: c.numericScale,
            character_max_length: c.characterMaxLength,
            comment: c.comment,
          })),
        );
        if (error) throw new Error(error.message);
      }

      if (object.indexes.length) {
        const { error } = await supabase.from("ds_indexes").insert(
          object.indexes.map((i) => ({
            organization_id: orgId,
            data_source_id: dataSourceId,
            object_id: objectRow.id,
            name: i.name,
            is_unique: i.isUnique,
            is_primary: i.isPrimary,
            method: i.method,
            columns: i.columns,
            definition: i.definition,
          })),
        );
        if (error) throw new Error(error.message);
      }

      if (object.constraints.length) {
        const { error } = await supabase.from("ds_constraints").insert(
          object.constraints.map((c) => ({
            organization_id: orgId,
            data_source_id: dataSourceId,
            object_id: objectRow.id,
            name: c.name,
            constraint_type: c.constraintType,
            columns: c.columns,
            referenced_schema: c.referencedSchema,
            referenced_table: c.referencedTable,
            referenced_columns: c.referencedColumns,
            definition: c.definition,
          })),
        );
        if (error) throw new Error(error.message);
      }
    }
  }

  await supabase
    .from("data_sources")
    .update({
      schema_count: result.schemas.length,
      table_count: tableCount,
      view_count: viewCount,
      column_count: columnCount,
      server_version: result.serverVersion,
      last_synced_at: now,
      health: "online",
      health_message: null,
      health_checked_at: now,
    })
    .eq("id", dataSourceId);

  return { schemaCount: result.schemas.length, tableCount, viewCount, columnCount };
}

export async function discover(config: ConnectionConfig): Promise<DiscoveryResult> {
  return getDriver(config.type).discover(config);
}

/** Parses the platform's own Postgres URL so it can be catalogued as a demo source. */
export function platformPostgresConfig(): {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
} | null {
  const url = process.env["SUPABASE_DB_URL"];
  if (!url) return null;
  try {
    const u = new URL(url);
    return {
      host: u.hostname,
      port: Number(u.port || 5432),
      database: u.pathname.replace(/^\//, "") || "postgres",
      username: decodeURIComponent(u.username),
      password: decodeURIComponent(u.password),
    };
  } catch {
    return null;
  }
}

/**
 * Reads one data_sources row including its credential columns.
 * SELECT on those columns is revoked for `authenticated`, so this deliberately
 * uses the service-role client. Callers MUST have passed `assertCanManage`
 * for the owning organization before calling this.
 */
export async function loadRowWithSecret(orgId: string, id: string): Promise<DsRow> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("data_sources")
    .select("*")
    .eq("id", id)
    .eq("organization_id", orgId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Data source not found.");
  return data as DsRow;
}
