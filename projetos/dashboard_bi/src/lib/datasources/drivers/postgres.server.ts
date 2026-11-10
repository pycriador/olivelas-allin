// Server-only. Live TCP driver for PostgreSQL (also the base for Redshift and
// other wire-compatible engines once they are enabled in the registry).
import { Client } from "pg";
import type {
  ConnectionConfig,
  DatabaseDriver,
  DiscoveredColumn,
  DiscoveredConstraint,
  DiscoveredIndex,
  DiscoveredObject,
  DiscoveredSchema,
  DiscoveryResult,
  DsObjectType,
  ProbeResult,
} from "../types";
import { DriverError } from "../types";

const SYSTEM_SCHEMAS = ["pg_catalog", "information_schema", "pg_toast"];

function classify(error: unknown): DriverError {
  const message = error instanceof Error ? error.message : String(error);
  const code = (error as { code?: string } | null)?.code;
  if (code === "28P01" || code === "28000" || /password authentication failed/i.test(message)) {
    return new DriverError(message, "invalid_credentials");
  }
  if (code === "3D000") return new DriverError(message, "offline");
  if (/timeout|ETIMEDOUT|timed out/i.test(message)) return new DriverError(message, "timeout");
  if (/ECONNREFUSED|ENOTFOUND|EHOSTUNREACH|EAI_AGAIN/i.test(message)) {
    return new DriverError(message, "offline");
  }
  return new DriverError(message, "unstable");
}

async function withClient<T>(
  config: ConnectionConfig,
  fn: (client: Client) => Promise<T>,
): Promise<T> {
  const client = new Client({
    host: config.host,
    port: config.port ?? 5432,
    database: config.database,
    user: config.username,
    password: config.password,
    ssl: config.sslEnabled
      ? config.sslCaCertificate
        ? { ca: config.sslCaCertificate }
        : { rejectUnauthorized: false }
      : false,
    connectionTimeoutMillis: config.timeoutMs,
    query_timeout: config.timeoutMs,
    statement_timeout: config.timeoutMs,
    application_name: "nexus-data-catalog",
  });

  try {
    await client.connect();
  } catch (error) {
    await client.end().catch(() => undefined);
    throw classify(error);
  }

  try {
    return await fn(client);
  } catch (error) {
    throw classify(error);
  } finally {
    await client.end().catch(() => undefined);
  }
}

function targetSchemas(config: ConnectionConfig): string[] | null {
  const raw = config.extra["schemas"];
  if (Array.isArray(raw) && raw.length) return raw.map(String);
  if (config.defaultSchema) return [config.defaultSchema];
  return null;
}

const RELKIND_TO_TYPE: Record<string, DsObjectType> = {
  r: "table",
  p: "table",
  f: "table",
  v: "view",
  m: "materialized_view",
};

export const postgresDriver: DatabaseDriver = {
  type: "postgresql",

  async getVersion(config) {
    return withClient(config, async (client) => {
      const r = await client.query<{ version: string }>("SELECT version() AS version");
      return (r.rows[0]?.version ?? "PostgreSQL").split(" on ")[0]!.trim();
    });
  },

  async executeReadQuery(config, sql, params) {
    return withClient(config, async (client) => {
      await client.query("SET TRANSACTION READ ONLY").catch(() => undefined);
      const res = await client.query({
        text: sql,
        rowMode: "array",
        ...(params && params.length ? { values: params } : {}),
      });
      const oids = Array.from(new Set(res.fields.map((f) => f.dataTypeID)));
      const typeNames = new Map<number, string>();
      if (oids.length) {
        const t = await client.query<{ oid: string; typname: string }>(
          "SELECT oid::text AS oid, typname FROM pg_type WHERE oid = ANY($1::oid[])",
          [oids],
        );
        t.rows.forEach((r) => typeNames.set(Number(r.oid), r.typname));
      }
      const columns = res.fields.map((f) => ({
        name: f.name,
        dataType: typeNames.get(f.dataTypeID) ?? null,
      }));
      const rows = (res.rows as unknown as unknown[][]).map((tuple) => {
        const row: Record<string, unknown> = {};
        columns.forEach((c, i) => {
          const key = row[c.name] === undefined ? c.name : `${c.name}_${i}`;
          row[key] = tuple[i] ?? null;
        });
        return row;
      });
      return { columns, rows, rowCount: rows.length };
    });
  },

  async explainQuery(config, sql) {
    return withClient(config, async (client) => {
      const res = await client.query<{ plan: string }>(
        `EXPLAIN (VERBOSE true, COSTS true, FORMAT TEXT) ${sql}`,
      );
      const lines = res.rows.map((r) => String((r as Record<string, unknown>)["QUERY PLAN"] ?? ""));
      return {
        supported: true as const,
        text: lines.join("\n"),
        rows: lines.map((line) => ({ plan: line })),
      };
    });
  },

  async probe(config): Promise<ProbeResult> {
    const started = Date.now();
    return withClient(config, async (client) => {
      const version = await client.query<{ version: string }>("SELECT version() AS version");
      const db = await client.query<{ name: string }>("SELECT current_database() AS name");
      const schemas = await client.query<{ count: string }>(
        `SELECT count(*)::text AS count FROM information_schema.schemata
         WHERE schema_name <> ALL($1) AND schema_name NOT LIKE 'pg_temp%' AND schema_name NOT LIKE 'pg_toast_temp%'`,
        [SYSTEM_SCHEMAS],
      );
      const tables = await client.query<{ count: string }>(
        `SELECT count(*)::text AS count FROM pg_class c
         JOIN pg_namespace n ON n.oid = c.relnamespace
         WHERE c.relkind IN ('r','p','v','m','f') AND n.nspname <> ALL($1)`,
        [SYSTEM_SCHEMAS],
      );
      return {
        ok: true as const,
        serverVersion: (version.rows[0]?.version ?? "PostgreSQL").split(" on ")[0]!.trim(),
        databaseName: db.rows[0]?.name ?? config.database,
        schemaCount: Number(schemas.rows[0]?.count ?? 0),
        tableCount: Number(tables.rows[0]?.count ?? 0),
        latencyMs: Date.now() - started,
      };
    });
  },

  async discover(config): Promise<DiscoveryResult> {
    return withClient(config, async (client) => {
      const version = await client.query<{ version: string }>("SELECT version() AS version");
      const db = await client.query<{ name: string }>("SELECT current_database() AS name");

      const only = targetSchemas(config);
      const schemaRows = await client.query<{ name: string; comment: string | null }>(
        `SELECT n.nspname AS name, obj_description(n.oid, 'pg_namespace') AS comment
         FROM pg_namespace n
         WHERE n.nspname <> ALL($1)
           AND n.nspname NOT LIKE 'pg_temp%' AND n.nspname NOT LIKE 'pg_toast_temp%'
           AND ($2::text[] IS NULL OR n.nspname = ANY($2))
         ORDER BY 1`,
        [SYSTEM_SCHEMAS, only],
      );
      const names = schemaRows.rows.map((r) => r.name);
      if (!names.length) {
        return {
          serverVersion: (version.rows[0]?.version ?? "PostgreSQL").split(" on ")[0]!.trim(),
          databaseName: db.rows[0]?.name ?? config.database,
          schemas: [],
        };
      }

      const objects = await client.query<{
        schema: string;
        name: string;
        relkind: string;
        estimated_rows: string | null;
        size_bytes: string | null;
        comment: string | null;
        definition: string | null;
      }>(
        `SELECT n.nspname AS schema, c.relname AS name, c.relkind::text AS relkind,
                c.reltuples::bigint::text AS estimated_rows,
                CASE WHEN c.relkind IN ('r','p','m') THEN pg_total_relation_size(c.oid)::text END AS size_bytes,
                obj_description(c.oid, 'pg_class') AS comment,
                CASE WHEN c.relkind IN ('v','m') THEN pg_get_viewdef(c.oid, true) END AS definition
         FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
         WHERE c.relkind IN ('r','p','v','m','f') AND n.nspname = ANY($1)
         ORDER BY 1, 2`,
        [names],
      );

      const columns = await client.query<{
        schema: string;
        table: string;
        name: string;
        ordinal: number;
        data_type: string;
        is_nullable: string;
        column_default: string | null;
        numeric_precision: number | null;
        numeric_scale: number | null;
        character_maximum_length: number | null;
      }>(
        `SELECT table_schema AS schema, table_name AS table, column_name AS name,
                ordinal_position AS ordinal, data_type, is_nullable, column_default,
                numeric_precision, numeric_scale, character_maximum_length
         FROM information_schema.columns
         WHERE table_schema = ANY($1)
         ORDER BY 1, 2, 4`,
        [names],
      );

      const colComments = await client.query<{
        schema: string;
        table: string;
        name: string;
        comment: string;
      }>(
        `SELECT n.nspname AS schema, c.relname AS table, a.attname AS name,
                col_description(c.oid, a.attnum) AS comment
         FROM pg_attribute a
         JOIN pg_class c ON c.oid = a.attrelid
         JOIN pg_namespace n ON n.oid = c.relnamespace
         WHERE a.attnum > 0 AND NOT a.attisdropped AND n.nspname = ANY($1)
           AND col_description(c.oid, a.attnum) IS NOT NULL`,
        [names],
      );

      const constraints = await client.query<{
        schema: string;
        table: string;
        name: string;
        ctype: string;
        definition: string;
        columns: string[] | null;
        ref_schema: string | null;
        ref_table: string | null;
        ref_columns: string[] | null;
      }>(
        `SELECT n.nspname AS schema, c.relname AS table, con.conname AS name,
                con.contype::text AS ctype, pg_get_constraintdef(con.oid) AS definition,
                (SELECT array_agg(a.attname ORDER BY k.ord)
                   FROM unnest(con.conkey) WITH ORDINALITY AS k(attnum, ord)
                   JOIN pg_attribute a ON a.attrelid = con.conrelid AND a.attnum = k.attnum) AS columns,
                fn.nspname AS ref_schema, fc.relname AS ref_table,
                (SELECT array_agg(a.attname ORDER BY k.ord)
                   FROM unnest(con.confkey) WITH ORDINALITY AS k(attnum, ord)
                   JOIN pg_attribute a ON a.attrelid = con.confrelid AND a.attnum = k.attnum) AS ref_columns
         FROM pg_constraint con
         JOIN pg_class c ON c.oid = con.conrelid
         JOIN pg_namespace n ON n.oid = c.relnamespace
         LEFT JOIN pg_class fc ON fc.oid = con.confrelid
         LEFT JOIN pg_namespace fn ON fn.oid = fc.relnamespace
         WHERE n.nspname = ANY($1)
         ORDER BY 1, 2, 3`,
        [names],
      );

      const indexes = await client.query<{
        schema: string;
        table: string;
        name: string;
        is_unique: boolean;
        is_primary: boolean;
        method: string;
        definition: string;
        columns: string[] | null;
      }>(
        `SELECT n.nspname AS schema, c.relname AS table, i.relname AS name,
                x.indisunique AS is_unique, x.indisprimary AS is_primary,
                am.amname AS method, pg_get_indexdef(x.indexrelid) AS definition,
                (SELECT array_agg(pg_get_indexdef(x.indexrelid, (k + 1)::int, true) ORDER BY k)
                   FROM generate_subscripts(x.indkey, 1) AS k) AS columns
         FROM pg_index x
         JOIN pg_class c ON c.oid = x.indrelid
         JOIN pg_class i ON i.oid = x.indexrelid
         JOIN pg_namespace n ON n.oid = c.relnamespace
         JOIN pg_am am ON am.oid = i.relam
         WHERE n.nspname = ANY($1)
         ORDER BY 1, 2, 3`,
        [names],
      );

      const keyOf = (s: string, t: string) => `${s}\u0000${t}`;

      const commentMap = new Map<string, string>();
      for (const r of colComments.rows) {
        commentMap.set(`${keyOf(r.schema, r.table)}\u0000${r.name}`, r.comment);
      }

      const pkCols = new Map<string, Set<string>>();
      const uniqueCols = new Map<string, Set<string>>();
      const fkInfo = new Map<
        string,
        { schema: string | null; table: string | null; column: string | null }
      >();
      const constraintsByTable = new Map<string, DiscoveredConstraint[]>();

      for (const r of constraints.rows) {
        const tk = keyOf(r.schema, r.table);
        const cols = r.columns ?? [];
        if (r.ctype === "p") {
          if (!pkCols.has(tk)) pkCols.set(tk, new Set());
          cols.forEach((c) => pkCols.get(tk)!.add(c));
        }
        if (r.ctype === "u") {
          if (!uniqueCols.has(tk)) uniqueCols.set(tk, new Set());
          cols.forEach((c) => uniqueCols.get(tk)!.add(c));
        }
        if (r.ctype === "f") {
          cols.forEach((c, i) => {
            fkInfo.set(`${tk}\u0000${c}`, {
              schema: r.ref_schema,
              table: r.ref_table,
              column: r.ref_columns?.[i] ?? null,
            });
          });
        }
        const list = constraintsByTable.get(tk) ?? [];
        list.push({
          name: r.name,
          constraintType:
            { p: "PRIMARY KEY", f: "FOREIGN KEY", u: "UNIQUE", c: "CHECK", x: "EXCLUDE" }[
              r.ctype
            ] ?? r.ctype,
          columns: cols,
          referencedSchema: r.ref_schema,
          referencedTable: r.ref_table,
          referencedColumns: r.ref_columns ?? [],
          definition: r.definition,
        });
        constraintsByTable.set(tk, list);
      }

      const indexesByTable = new Map<string, DiscoveredIndex[]>();
      for (const r of indexes.rows) {
        const tk = keyOf(r.schema, r.table);
        const list = indexesByTable.get(tk) ?? [];
        list.push({
          name: r.name,
          isUnique: r.is_unique,
          isPrimary: r.is_primary,
          method: r.method,
          columns: (r.columns ?? []).filter(Boolean),
          definition: r.definition,
        });
        indexesByTable.set(tk, list);
      }

      const columnsByTable = new Map<string, DiscoveredColumn[]>();
      for (const r of columns.rows) {
        const tk = keyOf(r.schema, r.table);
        const fk = fkInfo.get(`${tk}\u0000${r.name}`);
        const list = columnsByTable.get(tk) ?? [];
        list.push({
          name: r.name,
          ordinalPosition: r.ordinal,
          dataType: r.data_type,
          isNullable: r.is_nullable === "YES",
          isPrimaryKey: pkCols.get(tk)?.has(r.name) ?? false,
          isForeignKey: Boolean(fk),
          isUnique: uniqueCols.get(tk)?.has(r.name) ?? false,
          referencesSchema: fk?.schema ?? null,
          referencesTable: fk?.table ?? null,
          referencesColumn: fk?.column ?? null,
          defaultValue: r.column_default,
          numericPrecision: r.numeric_precision,
          numericScale: r.numeric_scale,
          characterMaxLength: r.character_maximum_length,
          comment: commentMap.get(`${tk}\u0000${r.name}`) ?? null,
        });
        columnsByTable.set(tk, list);
      }

      const objectsBySchema = new Map<string, DiscoveredObject[]>();
      for (const r of objects.rows) {
        const tk = keyOf(r.schema, r.name);
        const rows = r.estimated_rows === null ? null : Number(r.estimated_rows);
        const list = objectsBySchema.get(r.schema) ?? [];
        list.push({
          name: r.name,
          objectType: RELKIND_TO_TYPE[r.relkind] ?? "table",
          estimatedRows: rows !== null && rows >= 0 ? rows : null,
          sizeBytes: r.size_bytes === null ? null : Number(r.size_bytes),
          comment: r.comment,
          definition: r.definition,
          columns: columnsByTable.get(tk) ?? [],
          indexes: indexesByTable.get(tk) ?? [],
          constraints: constraintsByTable.get(tk) ?? [],
        });
        objectsBySchema.set(r.schema, list);
      }

      const schemas: DiscoveredSchema[] = schemaRows.rows.map((s) => ({
        name: s.name,
        comment: s.comment,
        objects: objectsBySchema.get(s.name) ?? [],
      }));

      return {
        serverVersion: (version.rows[0]?.version ?? "PostgreSQL").split(" on ")[0]!.trim(),
        databaseName: db.rows[0]?.name ?? config.database,
        schemas,
      };
    });
  },
};
