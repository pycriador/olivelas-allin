// FilterService — turns author-defined filters plus end-user values into a
// parameterized SQL predicate. Values are ALWAYS bound as engine parameters:
// nothing typed by a user is ever concatenated into the statement.
import type { DsType } from "@/lib/datasources/types";
import { quoteIdent } from "@/lib/sql/dialect";
import type { FilterState, FilterValue, ReportFilterDef } from "./types";
import { NO_VALUE_OPERATORS } from "./types";

export type CompiledFilters = { where: string; params: unknown[]; applied: number };

function placeholder(type: DsType, index: number): string {
  return type === "postgresql" ? `$${index}` : "?";
}

function castText(type: DsType, col: string): string {
  if (type === "postgresql") return `${col}::text`;
  if (type === "sqlite") return `CAST(${col} AS TEXT)`;
  return `CAST(${col} AS CHAR)`;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function endOfDay(d: Date): string {
  return `${isoDate(d)} 23:59:59`;
}

/** Coerces a raw string into the type the engine expects for that column. */
function coerce(def: ReportFilterDef, raw: string): unknown {
  if (def.type === "number") {
    const n = Number(String(raw).replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }
  if (def.type === "boolean") return raw === "true" || raw === "1";
  return raw;
}

function nonEmpty(v: string | null | undefined): v is string {
  return typeof v === "string" && v.trim() !== "";
}

type Ctx = { type: DsType; params: unknown[] };

function bind(ctx: Ctx, value: unknown): string {
  ctx.params.push(value);
  return placeholder(ctx.type, ctx.params.length);
}

/** Compiles one filter definition + value into a predicate, or null to skip. */
function compileOne(ctx: Ctx, def: ReportFilterDef, value: FilterValue): string | null {
  const col = quoteIdent(ctx.type, def.column);
  const op = value.operator ?? def.operator;
  const v = value.value ?? null;
  const v2 = value.value2 ?? null;

  if (!NO_VALUE_OPERATORS.includes(op)) {
    if (op === "in") {
      if (!value.values || value.values.length === 0) return null;
    } else if (op === "between") {
      if (!nonEmpty(v) && !nonEmpty(v2)) return null;
    } else if (!nonEmpty(v)) {
      return null;
    }
  }

  switch (op) {
    case "isnull":
      return `${col} IS NULL`;
    case "notnull":
      return `${col} IS NOT NULL`;
    case "eq":
      return `${col} = ${bind(ctx, coerce(def, v as string))}`;
    case "neq":
      return `${col} <> ${bind(ctx, coerce(def, v as string))}`;
    case "gt":
    case "after":
      return `${col} > ${bind(ctx, coerce(def, v as string))}`;
    case "lt":
    case "before":
      return `${col} < ${bind(ctx, coerce(def, v as string))}`;
    case "gte":
      return `${col} >= ${bind(ctx, coerce(def, v as string))}`;
    case "lte":
      return `${col} <= ${bind(ctx, coerce(def, v as string))}`;
    case "contains":
      return `${castText(ctx.type, col)} LIKE ${bind(ctx, `%${v}%`)}`;
    case "ncontains":
      return `${castText(ctx.type, col)} NOT LIKE ${bind(ctx, `%${v}%`)}`;
    case "starts":
      return `${castText(ctx.type, col)} LIKE ${bind(ctx, `${v}%`)}`;
    case "ends":
      return `${castText(ctx.type, col)} LIKE ${bind(ctx, `%${v}`)}`;
    case "between": {
      const isDate = def.type === "date" || def.type === "datetime";
      const lo = nonEmpty(v) ? coerce(def, v) : null;
      const hi = nonEmpty(v2)
        ? def.type === "datetime" && /^\d{4}-\d{2}-\d{2}$/.test(v2)
          ? `${v2} 23:59:59`
          : coerce(def, v2)
        : null;
      if (lo !== null && hi !== null) {
        return `${col} >= ${bind(ctx, lo)} AND ${col} <= ${bind(ctx, hi)}`;
      }
      if (lo !== null) return `${col} >= ${bind(ctx, lo)}`;
      if (hi !== null) return `${col} <= ${bind(ctx, hi)}`;
      void isDate;
      return null;
    }
    case "in": {
      const list = (value.values ?? []).filter(nonEmpty);
      if (!list.length) return null;
      const marks = list.map((item) => bind(ctx, coerce(def, item)));
      return `${col} IN (${marks.join(", ")})`;
    }
    case "last_days":
    case "last_months": {
      const n = Math.max(1, Math.min(3650, Number(v) || 0));
      const start = new Date();
      if (op === "last_days") start.setDate(start.getDate() - n);
      else start.setMonth(start.getMonth() - n);
      const now = new Date();
      const lo = def.type === "datetime" ? `${isoDate(start)} 00:00:00` : isoDate(start);
      const hi = def.type === "datetime" ? endOfDay(now) : isoDate(now);
      return `${col} >= ${bind(ctx, lo)} AND ${col} <= ${bind(ctx, hi)}`;
    }
    case "current_month":
    case "current_year": {
      const now = new Date();
      const start =
        op === "current_month"
          ? new Date(now.getFullYear(), now.getMonth(), 1)
          : new Date(now.getFullYear(), 0, 1);
      const end =
        op === "current_month"
          ? new Date(now.getFullYear(), now.getMonth() + 1, 0)
          : new Date(now.getFullYear(), 11, 31);
      const lo = def.type === "datetime" ? `${isoDate(start)} 00:00:00` : isoDate(start);
      const hi = def.type === "datetime" ? endOfDay(end) : isoDate(end);
      return `${col} >= ${bind(ctx, lo)} AND ${col} <= ${bind(ctx, hi)}`;
    }
    default:
      return null;
  }
}

/**
 * Compiles the whole filter bar. `startParamIndex` lets callers reserve
 * placeholders that were already bound before the WHERE clause.
 */
export function compileFilters(
  type: DsType,
  defs: ReportFilterDef[],
  state: FilterState,
  startParamIndex = 0,
): CompiledFilters {
  const ctx: Ctx = { type, params: [] };
  // pre-pad so postgres placeholder numbering continues from the caller's offset
  for (let i = 0; i < startParamIndex; i += 1) ctx.params.push(undefined);
  const clauses: string[] = [];
  for (const def of defs) {
    const value = state[def.key];
    if (!value) continue;
    const clause = compileOne(ctx, def, value);
    if (clause) clauses.push(`(${clause})`);
  }
  const params = ctx.params.slice(startParamIndex);
  return {
    where: clauses.length ? ` WHERE ${clauses.join(" AND ")}` : "",
    params,
    applied: clauses.length,
  };
}

/** Free-text search across the visible columns, also fully parameterized. */
export function compileSearch(
  type: DsType,
  columns: string[],
  term: string,
  startParamIndex = 0,
): CompiledFilters {
  const clean = term.trim();
  if (!clean || !columns.length) return { where: "", params: [], applied: 0 };
  const ctx: Ctx = { type, params: [] };
  for (let i = 0; i < startParamIndex; i += 1) ctx.params.push(undefined);
  const parts = columns.map(
    (c) => `${castText(type, quoteIdent(type, c))} LIKE ${bind(ctx, `%${clean}%`)}`,
  );
  return {
    where: ` WHERE (${parts.join(" OR ")})`,
    params: ctx.params.slice(startParamIndex),
    applied: 1,
  };
}

/** Merges filter + search predicates into a single WHERE clause. */
export function mergeWhere(...clauses: string[]): string {
  const parts = clauses
    .map((c) => c.replace(/^\s*WHERE\s+/i, "").trim())
    .filter((c) => c.length > 0);
  if (!parts.length) return "";
  return ` WHERE ${parts.map((p) => `(${p})`).join(" AND ")}`;
}

export function hasValue(v: FilterValue | undefined): boolean {
  if (!v) return false;
  if (v.values?.length) return true;
  return nonEmpty(v.value ?? null) || nonEmpty(v.value2 ?? null);
}