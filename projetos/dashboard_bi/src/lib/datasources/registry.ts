// Browser-safe catalog of supported engines. Drives the UI (labels, icons,
// default ports, field hints) and gates which types can actually connect.
import type { DsType } from "./types";

export type EngineSpec = {
  type: DsType;
  label: string;
  /** false = can be catalogued/planned, but no live driver yet. */
  connectable: boolean;
  defaultPort: number | null;
  /** Transport used at runtime, shown to the user so expectations are clear. */
  transport: "tcp" | "http" | "none";
  needsHost: boolean;
  needsPort: boolean;
  needsDatabase: boolean;
  needsUsername: boolean;
  needsSchema: boolean;
  hostLabelKey: string;
  /** Short i18n key with setup guidance for this engine. */
  hintKey: string;
  accent: string;
};

export const ENGINES: Record<DsType, EngineSpec> = {
  postgresql: {
    type: "postgresql",
    label: "PostgreSQL",
    connectable: true,
    defaultPort: 5432,
    transport: "tcp",
    needsHost: true,
    needsPort: true,
    needsDatabase: true,
    needsUsername: true,
    needsSchema: true,
    hostLabelKey: "ds.field.host",
    hintKey: "ds.hint.postgresql",
    accent: "#336791",
  },
  mysql: {
    type: "mysql",
    label: "MySQL",
    connectable: true,
    defaultPort: null,
    transport: "http",
    needsHost: true,
    needsPort: false,
    needsDatabase: true,
    needsUsername: true,
    needsSchema: false,
    hostLabelKey: "ds.field.httpHost",
    hintKey: "ds.hint.mysql",
    accent: "#00758f",
  },
  mariadb: {
    type: "mariadb",
    label: "MariaDB",
    connectable: true,
    defaultPort: null,
    transport: "http",
    needsHost: true,
    needsPort: false,
    needsDatabase: true,
    needsUsername: true,
    needsSchema: false,
    hostLabelKey: "ds.field.httpHost",
    hintKey: "ds.hint.mariadb",
    accent: "#c0765a",
  },
  sqlite: {
    type: "sqlite",
    label: "SQLite",
    connectable: true,
    defaultPort: null,
    transport: "http",
    needsHost: true,
    needsPort: false,
    needsDatabase: false,
    needsUsername: false,
    needsSchema: false,
    hostLabelKey: "ds.field.libsqlUrl",
    hintKey: "ds.hint.sqlite",
    accent: "#0f80cc",
  },
  sqlserver: mkPlanned("sqlserver", "SQL Server", 1433, "#a91d22"),
  oracle: mkPlanned("oracle", "Oracle", 1521, "#c74634"),
  duckdb: mkPlanned("duckdb", "DuckDB", null, "#fff100"),
  snowflake: mkPlanned("snowflake", "Snowflake", 443, "#29b5e8"),
  bigquery: mkPlanned("bigquery", "BigQuery", null, "#4285f4"),
  redshift: mkPlanned("redshift", "Redshift", 5439, "#8c4fff"),
  clickhouse: mkPlanned("clickhouse", "ClickHouse", 8443, "#ffcc01"),
};

function mkPlanned(type: DsType, label: string, port: number | null, accent: string): EngineSpec {
  return {
    type,
    label,
    connectable: false,
    defaultPort: port,
    transport: "none",
    needsHost: true,
    needsPort: port !== null,
    needsDatabase: true,
    needsUsername: true,
    needsSchema: false,
    hostLabelKey: "ds.field.host",
    hintKey: "ds.hint.planned",
    accent,
  };
}

export const ENGINE_LIST = Object.values(ENGINES);
export const CONNECTABLE_ENGINES = ENGINE_LIST.filter((e) => e.connectable);

export function engineSpec(type: DsType): EngineSpec {
  return ENGINES[type];
}
