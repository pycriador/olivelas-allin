// Browser + server safe dialect helpers: identifier quoting, LIMIT wrapping and
// filter compilation. Everything engine-specific lives here so the UI and the
// query service stay engine-agnostic.
import type { DsType } from "@/lib/datasources/types";
import type { PreviewFilter, PreviewSort } from "./types";

export function quoteIdent(type: DsType, ident: string): string {
  if (type === "mysql" || type === "mariadb") return `\`${ident.replace(/`/g, "``")}\``;
  return `"${ident.replace(/"/g, '""')}"`;
}

export function qualify(type: DsType, schema: string | null, table: string): string {
  const t = quoteIdent(type, table);
  if (!schema) return t;
  if (type === "sqlite" && (schema === "main" || schema === "")) return t;
  return `${quoteIdent(type, schema)}.${t}`;
}

export function quoteLiteral(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function isNumericLiteral(value: string): boolean {
  return /^-?\d+(\.\d+)?$/.test(value.trim());
}

function scalar(value: string): string {
  return isNumericLiteral(value) ? value.trim() : quoteLiteral(value);
}

/** Compiles a UI filter into a safe SQL predicate (values are escaped literals). */
export function compileFilter(type: DsType, filter: PreviewFilter): string | null {
  const col = quoteIdent(type, filter.column);
  const v = filter.value ?? "";
  switch (filter.operator) {
    case "isnull":
      return `${col} IS NULL`;
    case "notnull":
      return `${col} IS NOT NULL`;
    case "eq":
      return v === "" ? null : `${col} = ${scalar(v)}`;
    case "neq":
      return v === "" ? null : `${col} <> ${scalar(v)}`;
    case "gt":
      return v === "" ? null : `${col} > ${scalar(v)}`;
    case "lt":
      return v === "" ? null : `${col} < ${scalar(v)}`;
    case "gte":
      return v === "" ? null : `${col} >= ${scalar(v)}`;
    case "lte":
      return v === "" ? null : `${col} <= ${scalar(v)}`;
    case "contains":
      return v === "" ? null : `${castText(type, col)} LIKE ${quoteLiteral(`%${v}%`)}`;
    case "starts":
      return v === "" ? null : `${castText(type, col)} LIKE ${quoteLiteral(`${v}%`)}`;
    case "ends":
      return v === "" ? null : `${castText(type, col)} LIKE ${quoteLiteral(`%${v}`)}`;
    case "between":
      if (v === "" || !filter.value2) return null;
      return `${col} BETWEEN ${scalar(v)} AND ${scalar(filter.value2)}`;
    default:
      return null;
  }
}

function castText(type: DsType, col: string): string {
  if (type === "postgresql") return `${col}::text`;
  if (type === "sqlite") return `CAST(${col} AS TEXT)`;
  return `CAST(${col} AS CHAR)`;
}

export function compileWhere(
  type: DsType,
  filters: PreviewFilter[],
  join: "AND" | "OR",
): string {
  const parts = filters
    .map((f) => compileFilter(type, f))
    .filter((p): p is string => Boolean(p));
  if (!parts.length) return "";
  return ` WHERE ${parts.join(` ${join} `)}`;
}

export function compileOrderBy(type: DsType, sorts: PreviewSort[]): string {
  if (!sorts.length) return "";
  const parts = sorts.map(
    (s) => `${quoteIdent(type, s.column)} ${s.direction === "desc" ? "DESC" : "ASC"}`,
  );
  return ` ORDER BY ${parts.join(", ")}`;
}

export function buildPreviewSql(
  type: DsType,
  schema: string | null,
  table: string,
  opts: {
    filters: PreviewFilter[];
    filterJoin: "AND" | "OR";
    sorts: PreviewSort[];
    limit: number;
    offset: number;
  },
): string {
  const target = qualify(type, schema, table);
  return (
    `SELECT * FROM ${target}` +
    compileWhere(type, opts.filters, opts.filterJoin) +
    compileOrderBy(type, opts.sorts) +
    ` LIMIT ${Math.max(1, Math.floor(opts.limit))} OFFSET ${Math.max(0, Math.floor(opts.offset))}`
  );
}

export function buildCountSql(
  type: DsType,
  schema: string | null,
  table: string,
  opts: { filters: PreviewFilter[]; filterJoin: "AND" | "OR" },
): string {
  return (
    `SELECT COUNT(*) AS total FROM ${qualify(type, schema, table)}` +
    compileWhere(type, opts.filters, opts.filterJoin)
  );
}

/** Wraps a user statement so the engine never streams more rows than allowed. */
export function applyRowLimit(sql: string, limit: number): string {
  const clean = sql.replace(/;\s*$/, "");
  const capped = Math.max(1, Math.floor(limit));
  if (/\blimit\s+\d+/i.test(clean.slice(-120))) return clean;
  return `SELECT * FROM (${clean}) AS q_limited LIMIT ${capped}`;
}