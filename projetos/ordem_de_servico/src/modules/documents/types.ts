export type DocTemplateCategory =
  | "ordem-servico" | "recibo" | "orcamento" | "garantia" | "comprovante"
  | "etiqueta" | "financeiro" | "administracao" | "relatorios" | "sistema";

export const TEMPLATE_CATEGORIES: DocTemplateCategory[] = [
  "ordem-servico", "recibo", "orcamento", "garantia", "comprovante",
  "etiqueta", "financeiro", "administracao", "relatorios", "sistema",
];

export const TEMPLATE_CATEGORY_LABELS: Record<DocTemplateCategory, string> = {
  "ordem-servico": "Ordem de Serviço", recibo: "Recibo", orcamento: "Orçamento",
  garantia: "Garantia", comprovante: "Comprovante", etiqueta: "Etiqueta",
  financeiro: "Financeiro", administracao: "Administração", relatorios: "Relatórios",
  sistema: "Sistema",
};

export type DocStatus = "active" | "archived";
export type DocVersionStatus = "draft" | "published" | "archived";
export type DocFormat = "html" | "pdf" | "docx" | "png" | "json";
export type PrintLayout = "a4" | "a5" | "letter" | "58mm" | "80mm" | "label";
export type PrintOrientation = "portrait" | "landscape";
export type SignatureType = "client" | "technician" | "admin" | "company";
export type DocEventType =
  | "created" | "edited" | "duplicated" | "generated" | "exported" | "printed"
  | "signed" | "archived" | "restored" | "deleted" | "viewed" | "shared";

export interface DocTemplate {
  id: string;
  name: string;
  category: DocTemplateCategory;
  description: string;
  version: number;
  status: DocVersionStatus;
  companyId: string | null;
  global: boolean;
  tags: string[];
  icon: string;
  color: string;
  content: DocComponent[];
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocComponent {
  id: string;
  type: ComponentType;
  props: Record<string, unknown>;
  x: number;
  y: number;
  width: number;
  height: number;
  layer: number;
  visible: boolean;
  rotation: number;
}

export type ComponentType =
  | "text" | "image" | "logo" | "field" | "table" | "line" | "rectangle"
  | "qrcode" | "barcode" | "signature" | "date" | "time" | "page"
  | "header" | "footer" | "expression" | "list" | "repeater" | "spacer";

export const COMPONENT_TYPE_LABELS: Record<ComponentType, string> = {
  text: "Texto", image: "Imagem", logo: "Logo", field: "Campo", table: "Tabela",
  line: "Linha", rectangle: "Retângulo", qrcode: "QR Code", barcode: "Código de Barras",
  signature: "Assinatura", date: "Data", time: "Hora", page: "Página",
  header: "Cabeçalho", footer: "Rodapé", expression: "Expressão", list: "Lista",
  repeater: "Repetidor", spacer: "Espaçador",
};

export interface DocFieldMapping {
  id: string;
  category: string;
  fieldId: string;
  label: string;
  componentId: string;
}

export interface Document {
  id: string;
  name: string;
  category: DocTemplateCategory;
  companyId: string | null;
  templateId: string;
  templateVersion: number;
  entityId: string | null;
  recordId: string | null;
  version: number;
  hash: string;
  checksum: string;
  publicId: string;
  format: DocFormat;
  size: number;
  content: string;
  status: DocVersionStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocVersion {
  id: string;
  documentId: string;
  version: number;
  content: string;
  hash: string;
  size: number;
  createdBy: string;
  createdAt: string;
  description: string;
}

export interface DocHistory {
  id: string;
  documentId: string;
  event: DocEventType;
  userId: string;
  userName: string;
  description: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface Signature {
  id: string;
  documentId: string;
  type: SignatureType;
  label: string;
  imageData: string;
  signedBy: string;
  signedByName: string;
  signedAt: string;
  valid: boolean;
}

export interface PrintSettings {
  id: string;
  layout: PrintLayout;
  orientation: PrintOrientation;
  marginTop: number;
  marginRight: number;
  marginBottom: number;
  marginLeft: number;
  zoom: number;
  copies: number;
  collate: boolean;
  colorMode: "color" | "grayscale";
}

export interface ExportSettings {
  id: string;
  format: DocFormat;
  includeMetadata: boolean;
  includeHistory: boolean;
  includeSignatures: boolean;
  dpi: number;
  quality: number;
}

export interface QRData {
  id: string;
  publicId: string;
  hash: string;
  checksum: string;
  version: number;
  documentId: string;
  url: string;
  createdAt: string;
}

export const DEFAULT_PRINT_SETTINGS: PrintSettings = {
  id: "default",
  layout: "a4", orientation: "portrait",
  marginTop: 20, marginRight: 20, marginBottom: 20, marginLeft: 20,
  zoom: 100, copies: 1, collate: true, colorMode: "color",
};

export const PRINT_LAYOUT_LABELS: Record<PrintLayout, string> = {
  a4: "A4", a5: "A5", letter: "Carta", "58mm": "58mm", "80mm": "80mm", label: "Etiqueta",
};

export const PRINT_ORIENTATION_LABELS: Record<PrintOrientation, string> = {
  portrait: "Retrato", landscape: "Paisagem",
};

export const SIGNATURE_TYPE_LABELS: Record<SignatureType, string> = {
  client: "Cliente", technician: "Técnico", admin: "Administrador", company: "Empresa",
};

export const DOC_EVENT_LABELS: Record<DocEventType, string> = {
  created: "Criado", edited: "Editado", duplicated: "Duplicado", generated: "Gerado",
  exported: "Exportado", printed: "Impresso", signed: "Assinado", archived: "Arquivado",
  restored: "Restaurado", deleted: "Excluído", viewed: "Visualizado", shared: "Compartilhado",
};
