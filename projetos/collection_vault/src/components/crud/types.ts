export type FieldType = "text" | "textarea" | "number" | "boolean" | "select" | "date";

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  options?: { value: string; label: string }[];
  required?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  format?: (v: any) => string;
}

export type FilterOp =
  | "eq" | "neq" | "contains" | "gt" | "gte" | "lt" | "lte"
  | "is_null" | "not_null" | "in";

export interface FilterRule {
  field: string;
  op: FilterOp;
  value?: string;
}

export interface FilterConfig {
  rules: FilterRule[];
}
