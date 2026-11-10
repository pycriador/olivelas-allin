import { format } from "sql-formatter";
import type { DsType } from "@/lib/datasources/types";

const DIALECTS: Partial<Record<DsType, string>> = {
  postgresql: "postgresql",
  redshift: "redshift",
  mysql: "mysql",
  mariadb: "mariadb",
  sqlite: "sqlite",
  sqlserver: "transactsql",
  bigquery: "bigquery",
  snowflake: "snowflake",
  duckdb: "postgresql",
};

export function formatSql(sql: string, type: DsType | null): string {
  try {
    return format(sql, {
      language: (DIALECTS[type ?? "postgresql"] ?? "sql") as never,
      keywordCase: "upper",
      tabWidth: 2,
      linesBetweenQueries: 1,
    });
  } catch {
    return sql;
  }
}