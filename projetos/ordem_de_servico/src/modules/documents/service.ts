import { getStorage } from "@/core/providers/storage";
import { eventBus, EVENT_NAMES } from "@/modules/events/service";
import type {
  DocTemplate, Document, DocVersion, DocHistory, Signature, PrintSettings, ExportSettings, QRData, DocComponent,
} from "./types";

const TPL_COL = "doc_templates";
const DOC_COL = "doc_documents";
const VER_COL = "doc_versions";
const HIST_COL = "doc_history";
const SIG_COL = "doc_signatures";
const PRINT_COL = "doc_print_settings";
const EXPORT_COL = "doc_export_settings";
const QR_COL = "doc_qr";

export const templateService = {
  async list(): Promise<DocTemplate[]> { return getStorage().findAll<DocTemplate>(TPL_COL); },
  async get(id: string): Promise<DocTemplate | null> { return getStorage().find<DocTemplate>(TPL_COL, id); },
  async create(data: Omit<DocTemplate, "id">): Promise<DocTemplate> {
    const created = await getStorage().create<DocTemplate>(TPL_COL, data);
    eventBus.publish(EVENT_NAMES.DOCUMENT_TEMPLATE_CREATED, "document", "documents", { id: created.id, name: created.name }).catch(() => {});
    return created;
  },
  async update(id: string, patch: Partial<DocTemplate>): Promise<DocTemplate> {
    const updated = await getStorage().update<DocTemplate>(TPL_COL, id, patch);
    eventBus.publish(EVENT_NAMES.DOCUMENT_TEMPLATE_UPDATED, "document", "documents", { id, ...patch }).catch(() => {});
    return updated;
  },
  async remove(id: string): Promise<void> {
    await getStorage().delete(TPL_COL, id);
    eventBus.publish(EVENT_NAMES.DOCUMENT_TEMPLATE_DELETED, "document", "documents", { id }).catch(() => {});
  },
};

export const documentService = {
  async list(): Promise<Document[]> { return getStorage().findAll<Document>(DOC_COL); },
  async get(id: string): Promise<Document | null> { return getStorage().find<Document>(DOC_COL, id); },
  async create(data: Omit<Document, "id">): Promise<Document> {
    const doc = await getStorage().create<Document>(DOC_COL, data);
    eventBus.publish(EVENT_NAMES.DOCUMENT_CREATED, "document", "documents", { id: doc.id, title: doc.name, publicId: doc.publicId }).catch(() => {});
    return doc;
  },
  async update(id: string, patch: Partial<Document>): Promise<Document> {
    const updated = await getStorage().update<Document>(DOC_COL, id, patch);
    eventBus.publish(EVENT_NAMES.DOCUMENT_UPDATED, "document", "documents", { id, ...patch }).catch(() => {});
    return updated;
  },
  async remove(id: string): Promise<void> {
    await getStorage().delete(DOC_COL, id);
    eventBus.publish(EVENT_NAMES.DOCUMENT_DELETED, "document", "documents", { id }).catch(() => {});
  },
};

export const versionService = {
  async list(documentId?: string): Promise<DocVersion[]> {
    const all = await getStorage().findAll<DocVersion>(VER_COL);
    return documentId ? all.filter((v) => v.documentId === documentId) : all;
  },
  async get(id: string): Promise<DocVersion | null> { return getStorage().find<DocVersion>(VER_COL, id); },
  async create(data: Omit<DocVersion, "id">): Promise<DocVersion> { return getStorage().create<DocVersion>(VER_COL, data); },
};

export const historyService = {
  async list(documentId?: string): Promise<DocHistory[]> {
    const all = await getStorage().findAll<DocHistory>(HIST_COL);
    return documentId ? all.filter((h) => h.documentId === documentId) : all;
  },
  async create(data: Omit<DocHistory, "id">): Promise<DocHistory> { return getStorage().create<DocHistory>(HIST_COL, data); },
};

export const signatureService = {
  async list(documentId?: string): Promise<Signature[]> {
    const all = await getStorage().findAll<Signature>(SIG_COL);
    return documentId ? all.filter((s) => s.documentId === documentId) : all;
  },
  async create(data: Omit<Signature, "id">): Promise<Signature> {
    const sig = await getStorage().create<Signature>(SIG_COL, data);
    eventBus.publish(EVENT_NAMES.DOCUMENT_SIGNED, "document", "documents", { documentId: sig.documentId, signatoryName: sig.signedByName, type: sig.type }).catch(() => {});
    return sig;
  },
  async update(id: string, patch: Partial<Signature>): Promise<Signature> { return getStorage().update<Signature>(SIG_COL, id, patch); },
  async remove(id: string): Promise<void> { await getStorage().delete(SIG_COL, id); },
};

export const printSettingsService = {
  async get(): Promise<PrintSettings> {
    const found = await getStorage().find<PrintSettings>(PRINT_COL, "default");
    if (found) return found;
    const { DEFAULT_PRINT_SETTINGS } = await import("./types");
    await getStorage().create<PrintSettings>(PRINT_COL, { ...DEFAULT_PRINT_SETTINGS, id: "default" });
    return DEFAULT_PRINT_SETTINGS;
  },
  async update(patch: Partial<PrintSettings>): Promise<PrintSettings> {
    const { DEFAULT_PRINT_SETTINGS } = await import("./types");
    let current = await getStorage().find<PrintSettings>(PRINT_COL, "default");
    if (!current) {
      current = { ...DEFAULT_PRINT_SETTINGS, id: "default" } as PrintSettings;
      await getStorage().create<PrintSettings>(PRINT_COL, current);
    }
    const updated = { ...current, ...patch };
    return getStorage().update<PrintSettings>(PRINT_COL, "default", updated);
  },
};

export const exportSettingsService = {
  async get(): Promise<ExportSettings> {
    const found = await getStorage().find<ExportSettings>(EXPORT_COL, "default");
    if (found) return found;
    const defaults: ExportSettings = { id: "default", format: "html", includeMetadata: true, includeHistory: false, includeSignatures: true, dpi: 300, quality: 90 };
    await getStorage().create<ExportSettings>(EXPORT_COL, defaults);
    return defaults;
  },
  async update(patch: Partial<ExportSettings>): Promise<ExportSettings> {
    let current = await getStorage().find<ExportSettings>(EXPORT_COL, "default");
    if (!current) {
      current = { id: "default", format: "html", includeMetadata: true, includeHistory: false, includeSignatures: true, dpi: 300, quality: 90 };
      await getStorage().create<ExportSettings>(EXPORT_COL, current);
    }
    const updated = { ...current, ...patch };
    return getStorage().update<ExportSettings>(EXPORT_COL, "default", updated);
  },
};

export const qrService = {
  async list(): Promise<QRData[]> { return getStorage().findAll<QRData>(QR_COL); },
  async get(documentId: string): Promise<QRData | null> {
    const all = await this.list();
    return all.find((q) => q.documentId === documentId) ?? null;
  },
  async generate(documentId: string): Promise<QRData> {
    const doc = await documentService.get(documentId);
    if (!doc) throw new Error("Document not found");
    const data: QRData = {
      id: documentId,
      publicId: doc.publicId, hash: doc.hash, checksum: doc.checksum,
      version: doc.version, documentId: doc.id,
      url: `${window.location.origin}/validate/${doc.publicId}`,
      createdAt: new Date().toISOString(),
    };
    await getStorage().create<QRData>(QR_COL, data);
    return data;
  },
};

export async function addHistory(documentId: string, event: DocHistory["event"], userId: string, userName: string, description: string, metadata?: Record<string, unknown>): Promise<DocHistory> {
  return historyService.create({
    documentId, event, userId, userName, description,
    metadata: metadata ?? {}, createdAt: new Date().toISOString(),
  });
}

export async function publishTemplate(id: string): Promise<DocTemplate> {
  const tpl = await templateService.get(id);
  if (!tpl) throw new Error("Template not found");
  const updated = await templateService.update(id, { status: "published", version: tpl.version + 1 });
  eventBus.publish(EVENT_NAMES.DOCUMENT_TEMPLATE_PUBLISHED, "document", "documents", { id, name: tpl.name, version: updated.version }).catch(() => {});
  return updated;
}

export async function archiveTemplate(id: string): Promise<DocTemplate> {
  const tpl = await templateService.get(id);
  if (!tpl) throw new Error("Template not found");
  const updated = await templateService.update(id, { status: "archived" });
  eventBus.publish(EVENT_NAMES.DOCUMENT_TEMPLATE_ARCHIVED, "document", "documents", { id, name: tpl.name }).catch(() => {});
  return updated;
}

export async function restoreTemplate(id: string): Promise<DocTemplate> {
  const updated = await templateService.update(id, { status: "draft" });
  eventBus.publish(EVENT_NAMES.DOCUMENT_TEMPLATE_RESTORED, "document", "documents", { id }).catch(() => {});
  return updated;
}

export async function archiveDocument(id: string): Promise<Document> {
  const updated = await documentService.update(id, { status: "archived" });
  eventBus.publish(EVENT_NAMES.DOCUMENT_ARCHIVED, "document", "documents", { id }).catch(() => {});
  return updated;
}

export async function restoreDocument(id: string): Promise<Document> {
  const updated = await documentService.update(id, { status: "draft" });
  eventBus.publish(EVENT_NAMES.DOCUMENT_RESTORED, "document", "documents", { id }).catch(() => {});
  return updated;
}

export async function duplicateTemplate(id: string, newName: string): Promise<DocTemplate> {
  const tpl = await templateService.get(id);
  if (!tpl) throw new Error("Template not found");
  const { id: _oldId, ...rest } = tpl;
  const created = await templateService.create({ ...rest, name: newName, status: "draft", version: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  eventBus.publish(EVENT_NAMES.DOCUMENT_TEMPLATE_DUPLICATED, "document", "documents", { originalId: id, newId: created.id, name: newName }).catch(() => {});
  return created;
}

export function generateHash(): string {
  return Array.from({ length: 32 }, () => Math.floor(Math.random() * 36).toString(36)).join("");
}

export function generatePublicId(): string {
  return `DOC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}

export const COMPONENT_PROPERTIES: Record<string, { key: string; label: string; type: "text" | "number" | "color" | "boolean" | "select"; options?: string[] }[]> = {
  text: [
    { key: "content", label: "Conteúdo", type: "text" },
    { key: "fontSize", label: "Tamanho Fonte", type: "number" },
    { key: "fontFamily", label: "Fonte", type: "text" },
    { key: "color", label: "Cor", type: "color" },
    { key: "bold", label: "Negrito", type: "boolean" },
    { key: "italic", label: "Itálico", type: "boolean" },
    { key: "align", label: "Alinhamento", type: "select", options: ["left", "center", "right", "justify"] },
  ],
  field: [
    { key: "fieldId", label: "Campo", type: "text" },
    { key: "category", label: "Categoria", type: "text" },
    { key: "fontSize", label: "Tamanho Fonte", type: "number" },
    { key: "color", label: "Cor", type: "color" },
  ],
  table: [
    { key: "columns", label: "Colunas", type: "text" },
    { key: "showHeader", label: "Mostrar Cabeçalho", type: "boolean" },
    { key: "bordered", label: "Com Borda", type: "boolean" },
    { key: "striped", label: "Listrado", type: "boolean" },
  ],
  qrcode: [
    { key: "size", label: "Tamanho", type: "number" },
    { key: "foreground", label: "Cor", type: "color" },
    { key: "background", label: "Fundo", type: "color" },
  ],
  signature: [
    { key: "type", label: "Tipo Assinatura", type: "select", options: ["client", "technician", "admin", "company"] },
    { key: "label", label: "Label", type: "text" },
    { key: "size", label: "Tamanho", type: "number" },
  ],
  line: [
    { key: "thickness", label: "Espessura", type: "number" },
    { key: "color", label: "Cor", type: "color" },
    { key: "style", label: "Estilo", type: "select", options: ["solid", "dashed", "dotted"] },
  ],
};
