// Browser-safe value formatting used by every result grid.
export type ValueKind =
  | "null"
  | "boolean"
  | "number"
  | "currency"
  | "date"
  | "datetime"
  | "json"
  | "array"
  | "longtext"
  | "text";

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const DATE_TIME = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2})?/;
const MONEY_COLUMN = /(amount|price|value|valor|total|salary|salario|gross|net|cost|custo|fee)/i;

export function classifyValue(value: unknown, columnName = ""): ValueKind {
  if (value === null || value === undefined) return "null";
  if (typeof value === "boolean") return "boolean";
  if (Array.isArray(value)) return "array";
  if (value instanceof Date) return "datetime";
  if (typeof value === "object") return "json";
  if (typeof value === "number") return MONEY_COLUMN.test(columnName) ? "currency" : "number";
  const s = String(value);
  if (DATE_TIME.test(s)) return "datetime";
  if (DATE_ONLY.test(s)) return "date";
  if (/^-?\d+(\.\d+)?$/.test(s) && s.length < 18) {
    return MONEY_COLUMN.test(columnName) ? "currency" : "number";
  }
  const trimmed = s.trim();
  if (
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"))
  ) {
    try {
      JSON.parse(trimmed);
      return "json";
    } catch {
      /* plain text */
    }
  }
  if (s.length > 120) return "longtext";
  return "text";
}

export function formatValue(value: unknown, kind: ValueKind, locale: string): string {
  switch (kind) {
    case "null":
      return "NULL";
    case "boolean":
      return value ? "true" : "false";
    case "number": {
      const n = Number(value);
      return Number.isFinite(n) ? n.toLocaleString(locale) : String(value);
    }
    case "currency": {
      const n = Number(value);
      return Number.isFinite(n)
        ? n.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : String(value);
    }
    case "date": {
      const d = new Date(`${String(value)}T00:00:00`);
      return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString(locale);
    }
    case "datetime": {
      const d = value instanceof Date ? value : new Date(String(value));
      return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString(locale);
    }
    case "json":
    case "array":
      return typeof value === "string" ? value : JSON.stringify(value);
    default:
      return String(value);
  }
}

export function prettyJson(value: unknown): string {
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    return JSON.stringify(parsed, null, 2);
  } catch {
    return String(value);
  }
}

export function rawText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}