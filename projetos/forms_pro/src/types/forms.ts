export type FieldType =
  | "short_text"
  | "long_text"
  | "number"
  | "email"
  | "phone"
  | "url"
  | "date"
  | "time"
  | "checkbox"
  | "radio"
  | "select"
  | "multi_select"
  | "scale"
  | "rating"
  | "file"
  | "heading"
  | "paragraph"
  | "divider";

export const FIELD_TYPES: FieldType[] = [
  "short_text",
  "long_text",
  "number",
  "email",
  "phone",
  "url",
  "date",
  "time",
  "checkbox",
  "radio",
  "select",
  "multi_select",
  "scale",
  "rating",
  "file",
  "heading",
  "paragraph",
  "divider",
];

/** Field types that accept a list of options */
export const OPTION_FIELDS: FieldType[] = ["radio", "select", "multi_select", "checkbox"];
/** Static/decorative field types (no input value) */
export const STATIC_FIELDS: FieldType[] = ["heading", "paragraph", "divider"];

export interface FieldOption {
  id: string;
  label: string;
  value: string;
}

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  helpText?: string;
  required: boolean;
  defaultValue?: string;
  /** regex source used as validation */
  validation?: string;
  /** input mask e.g. (99) 99999-9999 */
  mask?: string;
  min?: number;
  max?: number;
  options: FieldOption[];
  order: number;
}

export interface FormPage {
  id: string;
  title: string;
  description?: string;
  order: number;
  fields: FormField[];
}

export type FormStatus = "draft" | "published" | "archived";
export type FormVisibility = "public" | "private";

export interface FormDefinition {
  id: string;
  name: string;
  description: string;
  slug: string;
  category: string;
  groupId: string | null;
  status: FormStatus;
  visibility: FormVisibility;
  version: number;
  pages: FormPage[];
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

export interface SchemaVersion {
  id: string;
  formId: string;
  version: number;
  label: string;
  createdAt: string;
  snapshot: FormPage[];
}

export interface FormTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  pages: FormPage[];
}

export const FORM_CATEGORIES = [
  "survey",
  "registration",
  "event",
  "feedback",
  "internal",
  "other",
] as const;
export type FormCategory = (typeof FORM_CATEGORIES)[number];

let seq = 0;
export function uid(prefix: string) {
  seq += 1;
  return `${prefix}_${Date.now().toString(36)}${seq.toString(36)}${Math.random()
    .toString(36)
    .slice(2, 6)}`;
}

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 60);
}

export function createField(type: FieldType, order: number): FormField {
  const base: FormField = {
    id: uid("fld"),
    type,
    label: "",
    required: false,
    options: [],
    order,
  };
  if (OPTION_FIELDS.includes(type) && type !== "checkbox") {
    base.options = [
      { id: uid("opt"), label: "Opção 1", value: "opcao-1" },
      { id: uid("opt"), label: "Opção 2", value: "opcao-2" },
    ];
  }
  if (type === "scale") {
    base.min = 1;
    base.max = 10;
  }
  if (type === "rating") {
    base.max = 5;
  }
  return base;
}

export function createPage(order: number, title: string): FormPage {
  return { id: uid("pg"), title, order, fields: [] };
}
