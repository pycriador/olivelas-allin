// Browser-safe presentation layer for dataset columns: visual type inference
// and value formatting. Used by the builder preview and the report viewer.
import type { ColumnFormat, VisualType } from "./types";

const INT_TYPES = /^(int|integer|int2|int4|int8|smallint|bigint|serial|bigserial|mediumint|tinyint)/i;
const DEC_TYPES = /^(numeric|decimal|real|double|float|money)/i;
const DATE_TYPES = /^date$/i;
const DATETIME_TYPES = /^(timestamp|timestamptz|datetime)/i;
const BOOL_TYPES = /^(bool|boolean|bit)/i;
const JSON_TYPES = /^(json|jsonb)/i;
const MONEY_NAME = /(amount|valor|price|preco|preço|salary|salario|salário|gross|net|total|cost|custo|receita|despesa|fee)/i;
const PERCENT_NAME = /(percent|percentual|pct|taxa|rate)/i;

export function inferVisualType(dataType: string | null, columnName = ""): VisualType {
  const t = (dataType ?? "").toLowerCase();
  if (JSON_TYPES.test(t)) return "json";
  if (BOOL_TYPES.test(t)) return "boolean";
  if (DATETIME_TYPES.test(t)) return "datetime";
  if (DATE_TYPES.test(t)) return "date";
  if (DEC_TYPES.test(t)) {
    if (MONEY_NAME.test(columnName)) return "currency";
    if (PERCENT_NAME.test(columnName)) return "percentage";
    return "decimal";
  }
  if (INT_TYPES.test(t)) {
    if (MONEY_NAME.test(columnName)) return "currency";
    return "integer";
  }
  if (!t) {
    if (MONEY_NAME.test(columnName)) return "currency";
    if (/(_at|_date|data)$/i.test(columnName)) return "datetime";
  }
  return "text";
}

export function defaultFormat(visual: VisualType): ColumnFormat {
  switch (visual) {
    case "currency":
      return { decimals: 2, thousands: true, currency: "BRL" };
    case "decimal":
      return { decimals: 2, thousands: true };
    case "number":
      return { decimals: 2, thousands: true };
    case "integer":
      return { decimals: 0, thousands: true };
    case "percentage":
      return { decimals: 1, percentBase: 100 };
    case "date":
      return { dateFormat: "short" };
    case "datetime":
      return { dateFormat: "short", timeFormat: "short" };
    default:
      return {};
  }
}

function numberOptions(fmt: ColumnFormat, fallbackDecimals: number): Intl.NumberFormatOptions {
  const decimals = fmt.decimals ?? fallbackDecimals;
  return {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: fmt.thousands !== false,
  };
}

function parseDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const s = String(value);
  const d = /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(`${s}T00:00:00`) : new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Renders a raw value for the end user. Never leaks technical detail. */
export function formatCell(
  value: unknown,
  visual: VisualType,
  fmt: ColumnFormat = {},
  locale = "pt-BR",
): string {
  if (value === null || value === undefined || value === "") return "—";
  const prefix = fmt.prefix ?? "";
  const suffix = fmt.suffix ?? "";
  const wrap = (s: string) => `${prefix}${s}${suffix}`;

  switch (visual) {
    case "boolean": {
      const truthy = value === true || value === 1 || value === "true" || value === "t" || value === "1";
      return wrap(truthy ? "Sim" : "Não");
    }
    case "currency": {
      const n = Number(value);
      if (!Number.isFinite(n)) return wrap(String(value));
      return wrap(
        n.toLocaleString(locale, {
          style: "currency",
          currency: fmt.currency || "BRL",
          ...numberOptions(fmt, 2),
        }),
      );
    }
    case "percentage": {
      const n = Number(value);
      if (!Number.isFinite(n)) return wrap(String(value));
      const base = fmt.percentBase ?? 100;
      const shown = base === 1 ? n * 100 : n;
      return wrap(`${shown.toLocaleString(locale, numberOptions(fmt, 1))}%`);
    }
    case "integer": {
      const n = Number(value);
      return Number.isFinite(n)
        ? wrap(n.toLocaleString(locale, numberOptions(fmt, 0)))
        : wrap(String(value));
    }
    case "number":
    case "decimal": {
      const n = Number(value);
      return Number.isFinite(n)
        ? wrap(n.toLocaleString(locale, numberOptions(fmt, 2)))
        : wrap(String(value));
    }
    case "date": {
      const d = parseDate(value);
      if (!d) return wrap(String(value));
      if (fmt.dateFormat === "iso") return wrap(d.toISOString().slice(0, 10));
      return wrap(
        d.toLocaleDateString(locale, {
          dateStyle: fmt.dateFormat === "long" ? "long" : fmt.dateFormat === "medium" ? "medium" : "short",
        }),
      );
    }
    case "datetime": {
      const d = parseDate(value);
      if (!d) return wrap(String(value));
      if (fmt.dateFormat === "iso") return wrap(d.toISOString());
      const dateStyle =
        fmt.dateFormat === "long" ? "long" : fmt.dateFormat === "medium" ? "medium" : "short";
      if (fmt.timeFormat === "none") return wrap(d.toLocaleDateString(locale, { dateStyle }));
      return wrap(
        d.toLocaleString(locale, {
          dateStyle,
          timeStyle: fmt.timeFormat === "medium" ? "medium" : "short",
        }),
      );
    }
    case "json":
      return typeof value === "string" ? value : JSON.stringify(value);
    default:
      return wrap(String(value));
  }
}

/** Plain (unformatted-but-typed) value used by exports. */
export function exportValue(value: unknown, visual: VisualType): string | number | boolean | null {
  if (value === null || value === undefined) return null;
  if (visual === "integer" || visual === "number" || visual === "decimal" || visual === "currency" || visual === "percentage") {
    const n = Number(value);
    return Number.isFinite(n) ? n : String(value);
  }
  if (visual === "boolean") {
    return value === true || value === 1 || value === "true" || value === "t" || value === "1";
  }
  if (typeof value === "object") return JSON.stringify(value);
  return value as string | number | boolean;
}

export function isNumericVisual(visual: VisualType): boolean {
  return ["number", "integer", "decimal", "currency", "percentage"].includes(visual);
}

export const VISUAL_TYPE_LABELS: Record<VisualType, string> = {
  text: "Texto",
  number: "Número",
  integer: "Inteiro",
  decimal: "Decimal",
  currency: "Moeda",
  percentage: "Percentual",
  date: "Data",
  datetime: "Data e hora",
  boolean: "Booleano",
  json: "JSON",
};