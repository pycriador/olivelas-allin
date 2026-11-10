import { mockForms, mockTemplates, mockVersions } from "./forms-db";
import {
  createPage,
  slugify,
  uid,
  type FormDefinition,
  type FormPage,
  type FormStatus,
  type FormTemplate,
  type SchemaVersion,
} from "@/types/forms";

const delay = (ms = 350) => new Promise((r) => setTimeout(r, ms));

let forms: FormDefinition[] = [...mockForms];
let versions: SchemaVersion[] = [...mockVersions];
/** Unsaved drafts kept apart from the persisted form (mock of a `drafts` table) */
const drafts = new Map<string, { pages: FormPage[]; savedAt: string }>();

function clonePages(pages: FormPage[]): FormPage[] {
  return pages.map((p) => ({
    ...p,
    id: uid("pg"),
    fields: p.fields.map((f) => ({
      ...f,
      id: uid("fld"),
      options: f.options.map((o) => ({ ...o, id: uid("opt") })),
    })),
  }));
}

function uniqueSlug(base: string, ignoreId?: string) {
  let slug = slugify(base) || "formulario";
  let i = 1;
  while (forms.some((f) => f.slug === slug && f.id !== ignoreId)) {
    i += 1;
    slug = `${slugify(base)}-${i}`;
  }
  return slug;
}

export interface CreateFormInput {
  name: string;
  description?: string;
  category: string;
  groupId?: string | null;
  visibility?: FormDefinition["visibility"];
  slug?: string;
  templateId?: string;
}

export const formsApi = {
  async list(): Promise<FormDefinition[]> {
    await delay(300);
    return forms.map((f) => ({ ...f }));
  },

  async get(id: string): Promise<FormDefinition> {
    await delay(250);
    const found = forms.find((f) => f.id === id);
    if (!found) throw new Error("Formulário não encontrado");
    return structuredClone(found);
  },

  async getBySlug(slug: string): Promise<FormDefinition> {
    await delay(250);
    const found = forms.find((f) => f.slug === slug);
    if (!found) throw new Error("Formulário não encontrado");
    return structuredClone(found);
  },

  async create(input: CreateFormInput): Promise<FormDefinition> {
    await delay(420);
    const template = input.templateId
      ? mockTemplates.find((t) => t.id === input.templateId)
      : undefined;
    const stamp = new Date().toISOString();
    const form: FormDefinition = {
      id: uid("frm"),
      name: input.name,
      description: input.description ?? "",
      slug: uniqueSlug(input.slug || input.name),
      category: input.category,
      groupId: input.groupId ?? null,
      status: "draft",
      visibility: input.visibility ?? "private",
      version: 1,
      pages: template ? clonePages(template.pages) : [createPage(0, "Página 1")],
      createdAt: stamp,
      updatedAt: stamp,
      publishedAt: null,
    };
    forms = [form, ...forms];
    versions = [
      { id: uid("ver"), formId: form.id, version: 1, label: "Versão 1", createdAt: stamp, snapshot: form.pages },
      ...versions,
    ];
    return structuredClone(form);
  },

  async update(id: string, patch: Partial<FormDefinition>): Promise<FormDefinition> {
    await delay(280);
    const stamp = new Date().toISOString();
    forms = forms.map((f) =>
      f.id === id
        ? {
            ...f,
            ...patch,
            slug: patch.slug ? uniqueSlug(patch.slug, id) : f.slug,
            updatedAt: stamp,
          }
        : f,
    );
    const updated = forms.find((f) => f.id === id);
    if (!updated) throw new Error("Formulário não encontrado");
    return structuredClone(updated);
  },

  /** Auto-save: stores the working pages as a draft and syncs the form */
  async saveDraft(id: string, pages: FormPage[]): Promise<{ savedAt: string }> {
    await delay(500);
    const savedAt = new Date().toISOString();
    drafts.set(id, { pages: structuredClone(pages), savedAt });
    forms = forms.map((f) => (f.id === id ? { ...f, pages: structuredClone(pages), updatedAt: savedAt } : f));
    return { savedAt };
  },

  async getDraft(id: string) {
    await delay(120);
    const d = drafts.get(id);
    return d ? structuredClone(d) : null;
  },

  async duplicate(id: string): Promise<FormDefinition> {
    await delay(400);
    const src = forms.find((f) => f.id === id);
    if (!src) throw new Error("Formulário não encontrado");
    const stamp = new Date().toISOString();
    const copy: FormDefinition = {
      ...structuredClone(src),
      id: uid("frm"),
      name: `${src.name} (cópia)`,
      slug: uniqueSlug(`${src.slug}-copia`),
      status: "draft",
      version: 1,
      pages: clonePages(src.pages),
      createdAt: stamp,
      updatedAt: stamp,
      publishedAt: null,
    };
    forms = [copy, ...forms];
    return structuredClone(copy);
  },

  async setStatus(id: string, status: FormStatus): Promise<FormDefinition> {
    await delay(300);
    const stamp = new Date().toISOString();
    forms = forms.map((f) =>
      f.id === id
        ? {
            ...f,
            status,
            updatedAt: stamp,
            publishedAt: status === "published" ? stamp : f.publishedAt,
            version: status === "published" ? f.version + 1 : f.version,
          }
        : f,
    );
    const updated = forms.find((f) => f.id === id)!;
    if (status === "published") {
      versions = [
        {
          id: uid("ver"),
          formId: id,
          version: updated.version,
          label: `Versão ${updated.version}`,
          createdAt: stamp,
          snapshot: structuredClone(updated.pages),
        },
        ...versions,
      ];
    }
    return structuredClone(updated);
  },

  async remove(id: string): Promise<void> {
    await delay(280);
    forms = forms.filter((f) => f.id !== id);
    versions = versions.filter((v) => v.formId !== id);
    drafts.delete(id);
  },

  async versions(formId: string): Promise<SchemaVersion[]> {
    await delay(220);
    return versions
      .filter((v) => v.formId === formId)
      .sort((a, b) => b.version - a.version)
      .map((v) => structuredClone(v));
  },

  /** Prepared for a future "restore version" action */
  async restoreVersion(formId: string, versionId: string): Promise<FormDefinition> {
    await delay(350);
    const v = versions.find((x) => x.id === versionId && x.formId === formId);
    if (!v) throw new Error("Versão não encontrada");
    return formsApi.update(formId, { pages: clonePages(v.snapshot) });
  },
};

export const templatesApi = {
  async list(): Promise<FormTemplate[]> {
    await delay(250);
    return mockTemplates.map((t) => structuredClone(t));
  },
  async get(id: string): Promise<FormTemplate> {
    await delay(200);
    const t = mockTemplates.find((x) => x.id === id);
    if (!t) throw new Error("Template não encontrado");
    return structuredClone(t);
  },
};

export const previewApi = {
  async get(id: string): Promise<FormDefinition> {
    await delay(200);
    const draft = drafts.get(id);
    const form = forms.find((f) => f.id === id);
    if (!form) throw new Error("Formulário não encontrado");
    return structuredClone(draft ? { ...form, pages: draft.pages } : form);
  },
};
