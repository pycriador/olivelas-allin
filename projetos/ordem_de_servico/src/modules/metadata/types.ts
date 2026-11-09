export type FieldType =
  | "text" | "longtext" | "number" | "currency" | "boolean" | "date" | "time" | "datetime"
  | "cpf" | "cnpj" | "phone" | "email" | "url" | "image" | "file" | "color" | "signature"
  | "lookup" | "list" | "multilist" | "status" | "json" | "markdown" | "richtext" | "relationship";

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text: "Texto", longtext: "Texto Longo", number: "Número", currency: "Moeda",
  boolean: "Boolean", date: "Data", time: "Hora", datetime: "Data/Hora",
  cpf: "CPF", cnpj: "CNPJ", phone: "Telefone", email: "Email", url: "URL",
  image: "Imagem", file: "Arquivo", color: "Cor", signature: "Assinatura",
  lookup: "Lookup", list: "Lista", multilist: "MultiLista", status: "Status",
  json: "JSON", markdown: "Markdown", richtext: "Rich Text", relationship: "Relacionamento",
};

export const FIELD_TYPE_CATEGORIES: Record<string, FieldType[]> = {
  basic: ["text", "longtext", "number", "currency", "boolean"],
  temporal: ["date", "time", "datetime"],
  identity: ["cpf", "cnpj", "phone", "email", "url"],
  media: ["image", "file", "color", "signature"],
  relational: ["lookup", "list", "multilist", "status", "relationship"],
  advanced: ["json", "markdown", "richtext"],
};

export type WidgetType = "indicator" | "table" | "list" | "line" | "bar" | "pie" | "gauge" | "timeline" | "calendar" | "cards";

export const WIDGET_TYPE_LABELS: Record<WidgetType, string> = {
  indicator: "Indicador", table: "Tabela", list: "Lista",
  line: "Gráfico Linha", bar: "Gráfico Barra", pie: "Gráfico Pizza",
  gauge: "Gauge", timeline: "Timeline", calendar: "Calendário", cards: "Cards",
};

export type ViewMode = "table" | "cards" | "kanban" | "timeline" | "calendar" | "list";

export const VIEW_MODE_LABELS: Record<ViewMode, string> = {
  table: "Tabela", cards: "Cards", kanban: "Kanban",
  timeline: "Timeline", calendar: "Calendário", list: "Lista",
};

export type VersionStatus = "draft" | "published" | "archived";
export type EntityStatus = "active" | "inactive";

export type Level = "global" | "company" | "user";

export interface MetadataEntity {
  id: string;
  name: string;
  pluralName: string;
  description: string;
  icon: string;
  category: string;
  status: EntityStatus;
  auditable: boolean;
  hasFiles: boolean;
  hasTimeline: boolean;
  hasComments: boolean;
  hasVersioning: boolean;
  companyId: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  level: Level;
}

export interface MetadataField {
  id: string;
  entityId: string;
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  visible: boolean;
  editable: boolean;
  searchable: boolean;
  unique: boolean;
  defaultValue: string;
  placeholder: string;
  tooltip: string;
  mask: string;
  regex: string;
  validation: string;
  group: string;
  order: number;
  width: number;
  companyId: string | null;
  version: number;
  level: Level;
  status: EntityStatus;
  createdAt: string;
  updatedAt: string;
}

export interface FormTab {
  id: string;
  label: string;
  icon: string;
  order: number;
}

export interface FormSection {
  id: string;
  tabId: string;
  label: string;
  type: "card" | "accordion" | "grid";
  columns: number;
  order: number;
  fieldIds: string[];
}

export interface MetadataForm {
  id: string;
  name: string;
  description: string;
  entityId: string;
  tabs: FormTab[];
  sections: FormSection[];
  layoutDesktop: Record<string, unknown>;
  layoutTablet: Record<string, unknown>;
  layoutMobile: Record<string, unknown>;
  status: VersionStatus;
  version: number;
  publishedVersion: number | null;
  duplicatedFrom: string | null;
  companyId: string | null;
  level: Level;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface ViewColumn {
  id: string;
  fieldId: string;
  label: string;
  order: number;
  width: number;
  visible: boolean;
  sortable: boolean;
  filterable: boolean;
}

export interface ViewFilter {
  id: string;
  fieldId: string;
  operator: string;
  value: string;
}

export interface MetadataView {
  id: string;
  name: string;
  description: string;
  entityId: string;
  mode: ViewMode;
  columns: ViewColumn[];
  filters: ViewFilter[];
  defaultSort: string;
  defaultSortDir: "asc" | "desc";
  pageSize: number;
  exportEnabled: boolean;
  actions: string[];
  status: VersionStatus;
  version: number;
  publishedVersion: number | null;
  duplicatedFrom: string | null;
  companyId: string | null;
  level: Level;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  entityId: string;
  width: number;
  height: number;
  x: number;
  y: number;
  config: Record<string, unknown>;
}

export interface MetadataDashboard {
  id: string;
  name: string;
  description: string;
  widgets: DashboardWidget[];
  status: VersionStatus;
  version: number;
  publishedVersion: number | null;
  duplicatedFrom: string | null;
  companyId: string | null;
  level: Level;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export type TemplateType = "form" | "view" | "dashboard" | "document";

export const TEMPLATE_TYPE_LABELS: Record<TemplateType, string> = {
  form: "Formulário", view: "View", dashboard: "Dashboard", document: "Documento",
};

export interface MetadataTemplate {
  id: string;
  name: string;
  description: string;
  type: TemplateType;
  category: string;
  entityId: string | null;
  content: Record<string, unknown>;
  scope: "global" | "company" | "custom";
  companyId: string | null;
  status: VersionStatus;
  version: number;
  publishedVersion: number | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface MetadataVersion {
  id: string;
  entityType: "entity" | "field" | "form" | "view" | "dashboard" | "template";
  entityId: string;
  version: number;
  status: VersionStatus;
  data: Record<string, unknown>;
  comparison: string;
  createdBy: string;
  createdAt: string;
  description: string;
}

export interface MetadataConfig {
  id: "metadata";
  fieldDefaults: Record<string, unknown>;
  formDefaults: Record<string, unknown>;
  viewDefaults: Record<string, unknown>;
  dashboardDefaults: Record<string, unknown>;
  templateDefaults: Record<string, unknown>;
  versioningEnabled: boolean;
  maxVersions: number;
  autoPublish: boolean;
  requireApproval: boolean;
  defaultLevel: Level;
  inheritEnabled: boolean;
}

export const DEFAULT_METADATA_CONFIG: MetadataConfig = {
  id: "metadata",
  fieldDefaults: { visible: true, editable: true, searchable: false, required: false, unique: false, width: 12 },
  formDefaults: {},
  viewDefaults: { pageSize: 20, exportEnabled: true, mode: "table" },
  dashboardDefaults: {},
  templateDefaults: { scope: "global" },
  versioningEnabled: true,
  maxVersions: 50,
  autoPublish: false,
  requireApproval: true,
  defaultLevel: "global",
  inheritEnabled: true,
};

export const ENTITY_CATEGORIES = ["platform", "business", "admin", "financial", "inventory", "communication", "documents"];
