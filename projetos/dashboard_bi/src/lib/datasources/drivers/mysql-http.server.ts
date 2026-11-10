// Server-only. MySQL / MariaDB over the HTTP (serverless) protocol, which is
// what works in this edge runtime. Compatible with PlanetScale and any
// mysql-http gateway that speaks the same endpoint.
import { connect } from "@planetscale/database";
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
  DsType,
  ProbeResult,
} from "../types";
import { DriverError } from "../types";

function classify(error: unknown): DriverError {
  const message = error instanceof Error ? error.message : String(error);
  if (/401|403|unauthorized|access denied|authentication/i.test(message)) {
    return new DriverError(message, "invalid_credentials");
  }
  if (/timeout|timed out/i.test(message)) return new DriverError(message, "timeout");
  if (/404|ENOTFOUND|getaddrinfo|fetch failed/i.test(message)) {
    return new DriverError(message, "offline");
  }
  return new DriverError(message, "unstable");
}

function client(config: ConnectionConfig) {
  return connect({
    host: config.host.replace(/^https?:\/\//, ""),
    username: config.username,
    password: config.password,
    fetch: (input: string, init?: Record<string, unknown>) =>
      fetch(input, init as RequestInit) as never,
  });
}

type Row = Record<string, string | number | null>;

async function q(config: ConnectionConfig, sql: string, args: unknown[] = []): Promise<Row[]> {
  try {
    const result = await client(config).execute(sql, args);
    return (result.rows as Row[]) ?? [];
  } catch (error) {
    throw classify(error);
  }
}

const str = (v: unknown): string | null => (v === null || v === undefined ? null : String(v));
const num = (v: unknown): number | null =>
  v === null || v === undefined || v === "" ? null : Number(v);

function makeDriver(type: DsType): DatabaseDriver {
  return {
    type,

    async getVersion(config) {
      const version = await q(config, "SELECT VERSION() AS v");
      return `${type === "mariadb" ? "MariaDB" : "MySQL"} ${str(version[0]?.["v"]) ?? ""}`.trim();
    },

    async executeReadQuery(config, sql, params) {
      try {
        const result = await client(config).execute(sql, (params ?? []) as never);
        const columns = (result.fields ?? []).map((f) => ({
          name: String(f.name),
          dataType: (f.type as string | undefined) ?? null,
        }));
        const raw = (result.rows as Record<string, unknown>[]) ?? [];
        const cols = columns.length
          ? columns
          : Object.keys(raw[0] ?? {}).map((name) => ({ name, dataType: null }));
        const rows = raw.map((row) => {
          const out: Record<string, unknown> = {};
          cols.forEach((c) => {
            out[c.name] = row[c.name] ?? null;
          });
          return out;
        });
        return { columns: cols, rows, rowCount: rows.length };
      } catch (error) {
        throw classify(error);
      }
    },

    async explainQuery(config, sql) {
      const rows = (await q(config, `EXPLAIN ${sql}`)) as Record<string, unknown>[];
      if (!rows.length) {
        return { supported: false as const, message: "O driver não retornou plano de execução." };
      }
      const keys = Object.keys(rows[0]!);
      const text = [
        keys.join(" | "),
        ...rows.map((r) => keys.map((k) => String(r[k] ?? "")).join(" | ")),
      ].join("\n");
      return { supported: true as const, text, rows };
    },

    async probe(config): Promise<ProbeResult> {
      const started = Date.now();
      const version = await q(config, "SELECT VERSION() AS v, DATABASE() AS d");
      const counts = await q(
        config,
        `SELECT
           (SELECT COUNT(*) FROM information_schema.schemata
             WHERE schema_name NOT IN ('mysql','information_schema','performance_schema','sys')) AS schemas,
           (SELECT COUNT(*) FROM information_schema.tables
             WHERE table_schema NOT IN ('mysql','information_schema','performance_schema','sys')) AS tables`,
      );
      return {
        ok: true as const,
        serverVersion:
          `${type === "mariadb" ? "MariaDB" : "MySQL"} ${str(version[0]?.["v"]) ?? ""}`.trim(),
        databaseName: str(version[0]?.["d"]) ?? config.database,
        schemaCount: num(counts[0]?.["schemas"]) ?? 0,
        tableCount: num(counts[0]?.["tables"]) ?? 0,
        latencyMs: Date.now() - started,
      };
    },

    async discover(config): Promise<DiscoveryResult> {
      const version = await q(config, "SELECT VERSION() AS v, DATABASE() AS d");
      // In MySQL a "schema" IS a database, so the target set is the configured
      // database when present, otherwise every non-system schema.
      const only = config.database ? [config.database] : null;
      const schemaRows = only
        ? only.map((name) => ({ name, comment: null as string | null }))
        : (
            await q(
              config,
              `SELECT schema_name AS name FROM information_schema.schemata
               WHERE schema_name NOT IN ('mysql','information_schema','performance_schema','sys')
               ORDER BY 1`,
            )
          ).map((r) => ({ name: String(r["name"]), comment: null as string | null }));

      const names = schemaRows.map((s) => s.name);
      if (!names.length) {
        return {
          serverVersion: str(version[0]?.["v"]) ?? "MySQL",
          databaseName: str(version[0]?.["d"]) ?? config.database,
          schemas: [],
        };
      }
      const placeholders = names.map(() => "?").join(",");

      const objects = await q(
        config,
        `SELECT table_schema AS s, table_name AS n, table_type AS tt,
                table_rows AS rows_est, (data_length + index_length) AS size_bytes,
                table_comment AS cmt
         FROM information_schema.tables WHERE table_schema IN (${placeholders})
         ORDER BY 1, 2`,
        names,
      );
      const columns = await q(
        config,
        `SELECT table_schema AS s, table_name AS t, column_name AS n, ordinal_position AS ord,
                column_type AS dt, is_nullable AS nullable, column_default AS dflt,
                numeric_precision AS np, numeric_scale AS ns, character_maximum_length AS cml,
                column_key AS ckey, column_comment AS cmt
         FROM information_schema.columns WHERE table_schema IN (${placeholders})
         ORDER BY 1, 2, 4`,
        names,
      );
      const keys = await q(
        config,
        `SELECT k.table_schema AS s, k.table_name AS t, k.constraint_name AS cn,
                k.column_name AS col, k.ordinal_position AS ord,
                k.referenced_table_schema AS rs, k.referenced_table_name AS rt,
                k.referenced_column_name AS rc, c.constraint_type AS ctype
         FROM information_schema.key_column_usage k
         JOIN information_schema.table_constraints c
           ON c.constraint_schema = k.constraint_schema
          AND c.constraint_name = k.constraint_name
          AND c.table_name = k.table_name
         WHERE k.table_schema IN (${placeholders})
         ORDER BY 1, 2, 3, 5`,
        names,
      );
      const idx = await q(
        config,
        `SELECT table_schema AS s, table_name AS t, index_name AS n, non_unique AS nu,
                index_type AS method, column_name AS col, seq_in_index AS seq
         FROM information_schema.statistics WHERE table_schema IN (${placeholders})
         ORDER BY 1, 2, 3, 7`,
        names,
      );

      const keyOf = (s: string, t: string) => `${s}\u0000${t}`;

      const fkInfo = new Map<
        string,
        { schema: string | null; table: string | null; column: string | null }
      >();
      const constraintsByTable = new Map<string, Map<string, DiscoveredConstraint>>();
      for (const r of keys) {
        const tk = keyOf(String(r["s"]), String(r["t"]));
        const cn = String(r["cn"]);
        const ctype = String(r["ctype"]);
        const col = String(r["col"]);
        if (ctype === "FOREIGN KEY") {
          fkInfo.set(`${tk}\u0000${col}`, {
            schema: str(r["rs"]),
            table: str(r["rt"]),
            column: str(r["rc"]),
          });
        }
        const bucket = constraintsByTable.get(tk) ?? new Map<string, DiscoveredConstraint>();
        const existing = bucket.get(cn);
        if (existing) {
          existing.columns.push(col);
          if (r["rc"]) existing.referencedColumns.push(String(r["rc"]));
        } else {
          bucket.set(cn, {
            name: cn,
            constraintType: ctype,
            columns: [col],
            referencedSchema: str(r["rs"]),
            referencedTable: str(r["rt"]),
            referencedColumns: r["rc"] ? [String(r["rc"])] : [],
            definition: null,
          });
        }
        constraintsByTable.set(tk, bucket);
      }

      const indexesByTable = new Map<string, Map<string, DiscoveredIndex>>();
      for (const r of idx) {
        const tk = keyOf(String(r["s"]), String(r["t"]));
        const n = String(r["n"]);
        const bucket = indexesByTable.get(tk) ?? new Map<string, DiscoveredIndex>();
        const existing = bucket.get(n);
        if (existing) {
          existing.columns.push(String(r["col"]));
        } else {
          bucket.set(n, {
            name: n,
            isUnique: Number(r["nu"]) === 0,
            isPrimary: n === "PRIMARY",
            method: str(r["method"]),
            columns: [String(r["col"])],
            definition: null,
          });
        }
        indexesByTable.set(tk, bucket);
      }

      const columnsByTable = new Map<string, DiscoveredColumn[]>();
      for (const r of columns) {
        const tk = keyOf(String(r["s"]), String(r["t"]));
        const name = String(r["n"]);
        const fk = fkInfo.get(`${tk}\u0000${name}`);
        const ckey = String(r["ckey"] ?? "");
        const list = columnsByTable.get(tk) ?? [];
        list.push({
          name,
          ordinalPosition: num(r["ord"]) ?? 0,
          dataType: String(r["dt"]),
          isNullable: String(r["nullable"]).toUpperCase() === "YES",
          isPrimaryKey: ckey === "PRI",
          isForeignKey: Boolean(fk),
          isUnique: ckey === "UNI",
          referencesSchema: fk?.schema ?? null,
          referencesTable: fk?.table ?? null,
          referencesColumn: fk?.column ?? null,
          defaultValue: str(r["dflt"]),
          numericPrecision: num(r["np"]),
          numericScale: num(r["ns"]),
          characterMaxLength: num(r["cml"]),
          comment: str(r["cmt"]) || null,
        });
        columnsByTable.set(tk, list);
      }

      const typeMap: Record<string, DsObjectType> = {
        "BASE TABLE": "table",
        VIEW: "view",
        "SYSTEM VIEW": "view",
      };
      const objectsBySchema = new Map<string, DiscoveredObject[]>();
      for (const r of objects) {
        const s = String(r["s"]);
        const n = String(r["n"]);
        const tk = keyOf(s, n);
        const list = objectsBySchema.get(s) ?? [];
        list.push({
          name: n,
          objectType: typeMap[String(r["tt"])] ?? "table",
          estimatedRows: num(r["rows_est"]),
          sizeBytes: num(r["size_bytes"]),
          comment: str(r["cmt"]) || null,
          definition: null,
          columns: columnsByTable.get(tk) ?? [],
          indexes: [...(indexesByTable.get(tk)?.values() ?? [])],
          constraints: [...(constraintsByTable.get(tk)?.values() ?? [])],
        });
        objectsBySchema.set(s, list);
      }

      const schemas: DiscoveredSchema[] = schemaRows.map((s) => ({
        name: s.name,
        comment: s.comment,
        objects: objectsBySchema.get(s.name) ?? [],
      }));

      return {
        serverVersion:
          `${type === "mariadb" ? "MariaDB" : "MySQL"} ${str(version[0]?.["v"]) ?? ""}`.trim(),
        databaseName: str(version[0]?.["d"]) ?? config.database,
        schemas,
      };
    },
  };
}

export const mysqlDriver = makeDriver("mysql");
export const mariadbDriver = makeDriver("mariadb");
