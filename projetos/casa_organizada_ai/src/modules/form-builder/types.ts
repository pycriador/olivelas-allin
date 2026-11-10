// Universal Form Builder — canonical schema types.
// Everything the builder produces and consumes is described here so the same
// shape flows through: store → autosave → persistence → renderer/preview →
// planner engine. Keep it framework-agnostic (no React imports).

export type FieldType =
  // basics (Phase 1)
  | "short_text"
  | "long_text"
  | "number"
  | "decimal"
  | "date"
  | "time"
  | "datetime"
  | "checkbox"
  | "switch"
  | "radio"
  | "select"
  | "multi_select"
  // layout (Phase 1)
  | "heading"
  | "paragraph"
  | "divider"
  | "spacer";

export type FieldOption = { id: string; label: string; value: string };

export type FieldValidator =
  | { kind: "min"; value: number }
  | { kind: "max"; value: number }
  | { kind: "minLength"; value: number }
  | { kind: "maxLength"; value: number }
  | { kind: "regex"; value: string; message?: string };

export type Field = {
  id: string;
  type: FieldType;
  name: string;              // internal, machine key
  label: string;
  description?: string;
  placeholder?: string;
  help?: string;
  tooltip?: string;
  required?: boolean;
  readOnly?: boolean;
  hidden?: boolean;
  defaultValue?: unknown;
  mask?: string;
  regex?: string;
  min?: number;
  max?: number;
  maxLength?: number;
  options?: FieldOption[];
  validators?: FieldValidator[];
  meta?: Record<string, unknown>;
};

export type Page = {
  id: string;
  title: string;
  description?: string;
  fields: Field[];
};

// Reserved for Phase 2 — kept in the schema now so persisted docs are stable.
export type LogicOp = "eq" | "neq" | "gt" | "lt" | "contains" | "empty" | "notEmpty";
export type LogicAction =
  | { kind: "show" | "hide" | "require" | "lock" }
  | { kind: "setValue"; value: unknown };
export type LogicRule = {
  id: string;
  combinator: "and" | "or";
  when: { fieldId: string; op: LogicOp; value?: unknown }[];
  then: { fieldId: string; action: LogicAction }[];
};

export type PlannerView =
  | "checklist"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "agenda"
  | "shopping"
  | "medications"
  | "vaccination"
  | "kids_routine"
  | "pet_routine"
  | "study"
  | "work";

export type FormSchema = {
  pages: Page[];
  logic: LogicRule[];
  settings: {
    autosave?: boolean;
    submitOnce?: boolean;
  };
};

export function emptySchema(): FormSchema {
  return {
    pages: [{ id: "p1", title: "Página 1", fields: [] }],
    logic: [],
    settings: { autosave: true },
  };
}

export type FormRow = {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  category: string | null;
  icon: string | null;
  emoji: string | null;
  cover_url: string | null;
  banner_url: string | null;
  tags: string[];
  status: string;
  privacy: string;
  planner_view: string;
  theme_overrides: Record<string, unknown>;
  schema: FormSchema;
  is_favorite: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
};