// Server-only. SQLite over libSQL/HTTP (Turso or any libsql-server). A plain
// local .sqlite file cannot be reached from a serverless runtime, so the host
// field holds an https:// or libsql:// URL and the password holds the auth token.
import { createClient } from "@libsql/client/web";
import type {
  ConnectionConfig,
  DatabaseDriver,
  DiscoveredColumn,
  DiscoveredConstraint,
  DiscoveredIndex,
  DiscoveredObject,
  DiscoveryResult,
  DsObjectType,
  ProbeResult,
} from "../types";
import { DriverError } from "../types";

const SCHEMA_NAME = "main";

function classify(error: unknown): DriverError {
  const message = error instanceof Error ? error.message : String(error);
  if (/401|403|unauthorized|token/i.test(message)) {
    return new DriverError(message, "invalid_credentials");
  }
  if (/timeout|timed out/i.test(message)) return new DriverError(message, "timeout");
  if (/404|ENOTFOUND|fetch failed|URL_INVALID/i.test(message)) {
    return new DriverError(message, "offline");
  }
  return new DriverError(message, "unstable");
}

function client(config: ConnectionConfig) {
  const url =
    config.host.startsWith("libsql://") || config.host.startsWith("http")
      ? config.host
      : `https://${config.host}`;
  return createClient({ url, authToken: config.password || undefined });
}

type Row = Record<string, unknown>;

async function q(config: ConnectionConfig, sql: string, args: unknown[] = []): Promise<Row[]> {
  try {
    const res = await client(config).execute({ sql, args: args as never });
    return res.rows as unknown as Row[];
  } catch (error) {
    throw classify(error);
  }
}

const str = (v: unknown): string | null => (v === null || v === undefined ? null : String(v));
const num = (v: unknown): number | null =>
  v === null || v === undefined || v === "" ? null : Number(v);

export const sqliteDriver: DatabaseDriver = {
  type: "sqlite",

  async getVersion(config) {
    const version = await q(config, "SELECT sqlite_version() AS v");
    return `SQLite ${str(version[0]?.["v"]) ?? ""}`.trim();
  },

  async executeReadQuery(config, sql, params) {
    try {
      const res = await client(config).execute({
        sql,
        args: (params ?? []) as never,
      });
      const columns = (res.columns ?? []).map((name, i) => ({
        name,
        dataType: (res.columnTypes?.[i] as string | undefined) ?? null,
      }));
      const rows = (res.rows as unknown as Row[]).map((row) => {
        const out: Record<string, unknown> = {};
        columns.forEach((c) => {
          out[c.name] = (row as Record<string, unknown>)[c.name] ?? null;
        });
        return out;
      });
      return { columns, rows, rowCount: rows.length };
    } catch (error) {
      throw classify(error);
    }
  },

  async explainQuery(config, sql) {
    const rows = await q(config, `EXPLAIN QUERY PLAN ${sql}`);
    const text = rows
      .map((r) => String(r["detail"] ?? Object.values(r).join(" | ")))
      .join("\n");
    return { supported: true as const, text, rows: rows as Record<string, unknown>[] };
  },

  async probe(config): Promise<ProbeResult> {
    const started = Date.now();
    const version = await q(config, "SELECT sqlite_version() AS v");
    const counts = await q(
      config,
      `SELECT COUNT(*) AS c FROM sqlite_master WHERE type IN ('table','view') AND name NOT LIKE 'sqlite_%'`,
    );
    return {
      ok: true as const,
      serverVersion: `SQLite ${str(version[0]?.["v"]) ?? ""}`.trim(),
      databaseName: config.database || SCHEMA_NAME,
      schemaCount: 1,
      tableCount: num(counts[0]?.["c"]) ?? 0,
      latencyMs: Date.now() - started,
    };
  },

  async discover(config): Promise<DiscoveryResult> {
    const version = await q(config, "SELECT sqlite_version() AS v");
    const master = await q(
      config,
      `SELECT name, type, sql FROM sqlite_master
       WHERE type IN ('table','view') AND name NOT LIKE 'sqlite_%' ORDER BY name`,
    );

    const objects: DiscoveredObject[] = [];
    for (const row of master) {
      const name = String(row["name"]);
      const objectType: DsObjectType = String(row["type"]) === "view" ? "view" : "table";

      const info = await q(config, `SELECT * FROM pragma_table_info(?)`, [name]);
      const fks = await q(config, `SELECT * FROM pragma_foreign_key_list(?)`, [name]);
      const idxList = await q(config, `SELECT * FROM pragma_index_list(?)`, [name]);

      const fkByColumn = new Map<
        string,
        { schema: string | null; table: string | null; column: string | null }
      >();
      const constraints: DiscoveredConstraint[] = [];
      const fkGroups = new Map<string, Row[]>();
      for (const fk of fks)
        fkGroups.set(String(fk["id"]), [...(fkGroups.get(String(fk["id"])) ?? []), fk]);
      for (const [id, group] of fkGroups) {
        const cols = group.map((g) => String(g["from"]));
        const refCols = group.map((g) => String(g["to"] ?? ""));
        cols.forEach((c, i) => {
          fkByColumn.set(c, {
            schema: SCHEMA_NAME,
            table: str(group[0]?.["table"]),
            column: refCols[i] || null,
          });
        });
        constraints.push({
          name: `fk_${name}_${id}`,
          constraintType: "FOREIGN KEY",
          columns: cols,
          referencedSchema: SCHEMA_NAME,
          referencedTable: str(group[0]?.["table"]),
          referencedColumns: refCols.filter(Boolean),
          definition: null,
        });
      }

      const pkNames = info.filter((c) => Number(c["pk"]) > 0).map((c) => String(c["name"]));
      if (pkNames.length) {
        constraints.push({
          name: `pk_${name}`,
          constraintType: "PRIMARY KEY",
          columns: pkNames,
          referencedSchema: null,
          referencedTable: null,
          referencedColumns: [],
          definition: null,
        });
      }

      const indexes: DiscoveredIndex[] = [];
      const uniqueColumns = new Set<string>();
      for (const ix of idxList) {
        const ixName = String(ix["name"]);
        const cols = (await q(config, `SELECT * FROM pragma_index_info(?)`, [ixName]))
          .map((c) => str(c["name"]))
          .filter((c): c is string => Boolean(c));
        const isUnique = Number(ix["unique"]) === 1;
        if (isUnique && cols.length === 1) uniqueColumns.add(cols[0]!);
        indexes.push({
          name: ixName,
          isUnique,
          isPrimary: String(ix["origin"]) === "pk",
          method: "btree",
          columns: cols,
          definition: null,
        });
      }

      const columns: DiscoveredColumn[] = info.map((c) => {
        const cname = String(c["name"]);
        const fk = fkByColumn.get(cname);
        return {
          name: cname,
          ordinalPosition: (num(c["cid"]) ?? 0) + 1,
          dataType: String(c["type"] || "BLOB"),
          isNullable: Number(c["notnull"]) === 0,
          isPrimaryKey: Number(c["pk"]) > 0,
          isForeignKey: Boolean(fk),
          isUnique: uniqueColumns.has(cname),
          referencesSchema: fk?.schema ?? null,
          referencesTable: fk?.table ?? null,
          referencesColumn: fk?.column ?? null,
          defaultValue: str(c["dflt_value"]),
          numericPrecision: null,
          numericScale: null,
          characterMaxLength: null,
          comment: null,
        };
      });

      objects.push({
        name,
        objectType,
        estimatedRows: null,
        sizeBytes: null,
        comment: null,
        definition: objectType === "view" ? str(row["sql"]) : null,
        columns,
        indexes,
        constraints,
      });
    }

    return {
      serverVersion: `SQLite ${str(version[0]?.["v"]) ?? ""}`.trim(),
      databaseName: config.database || SCHEMA_NAME,
      schemas: [{ name: SCHEMA_NAME, comment: null, objects }],
    };
  },
};
