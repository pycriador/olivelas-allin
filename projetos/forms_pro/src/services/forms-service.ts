import { supabase } from "@/integrations/supabase/client";
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

type Row = {
  id: string;
  name: string;
  description: string;
  slug: string;
  category: string;
  group_id: string | null;
  status: FormDefinition["status"];
  visibility: FormDefinition["visibility"];
  version: number;
  pages: unknown;
  created_at: string;
  updated_at: string;
  published_at: string | null;
};

function fail(message?: string): never {
  throw new Error(message ?? "Erro inesperado");
}

function mapForm(row: Row): FormDefinition {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    slug: row.slug,
    category: row.category,
    groupId: row.group_id,
    status: row.status,
    visibility: row.visibility,
    version: row.version,
    pages: (row.pages as FormPage[]) ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: row.published_at,
  };
}

function clonePages(pages: FormPage[]): FormPage[] {
  return pages.map((p) => ({
    ...p,
    id: uid("pg"),
    fields: (p.fields ?? []).map((f) => ({
      ...f,
      id: uid("fld"),
      options: (f.options ?? []).map((o) => ({ ...o, id: uid("opt") })),
    })),
  }));
}

async function uniqueSlug(base: string, ignoreId?: string) {
  const root = slugify(base) || "formulario";
  let slug = root;
  let i = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data } = await supabase.from("forms").select("id").eq("slug", slug).maybeSingle();
    if (!data || (ignoreId && data.id === ignoreId)) return slug;
    i += 1;
    slug = `${root}-${i}`;
  }
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
    const { data, error } = await supabase
      .from("forms")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) fail(error.message);
    return ((data ?? []) as Row[]).map(mapForm);
  },

  async get(id: string): Promise<FormDefinition> {
    const { data, error } = await supabase.from("forms").select("*").eq("id", id).maybeSingle();
    if (error) fail(error.message);
    if (!data) fail("Formulário não encontrado");
    return mapForm(data as Row);
  },

  async getBySlug(slug: string): Promise<FormDefinition> {
    const { data, error } = await supabase
      .from("forms")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (error) fail(error.message);
    if (!data) fail("Formulário não encontrado");
    return mapForm(data as Row);
  },

  async create(input: CreateFormInput): Promise<FormDefinition> {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) fail("Sessão expirada");

    let pages: FormPage[] = [createPage(0, "Página 1")];
    if (input.templateId) {
      const { data: tpl } = await supabase
        .from("form_templates")
        .select("schema")
        .eq("id", input.templateId)
        .maybeSingle();
      if (tpl?.schema) pages = clonePages(tpl.schema as unknown as FormPage[]);
    }

    const slug = await uniqueSlug(input.slug || input.name);
    const { data, error } = await supabase
      .from("forms")
      .insert({
        owner_id: auth.user.id,
        name: input.name,
        description: input.description ?? "",
        slug,
        category: input.category,
        group_id: input.groupId ?? null,
        visibility: input.visibility ?? "private",
        pages: pages as never,
      })
      .select("*")
      .single();
    if (error) fail(error.message);
    const form = mapForm(data as Row);
    await supabase.from("form_versions").insert({
      form_id: form.id,
      version: 1,
      label: "Versão 1",
      schema: form.pages as never,
      created_by: auth.user.id,
    });
    return form;
  },

  async update(id: string, patch: Partial<FormDefinition>): Promise<FormDefinition> {
    const update: Record<string, unknown> = {};
    if (patch.name !== undefined) update["name"] = patch.name;
    if (patch.description !== undefined) update["description"] = patch.description;
    if (patch.category !== undefined) update["category"] = patch.category;
    if (patch.groupId !== undefined) update["group_id"] = patch.groupId;
    if (patch.visibility !== undefined) update["visibility"] = patch.visibility;
    if (patch.pages !== undefined) update["pages"] = patch.pages;
    if (patch.slug !== undefined) update["slug"] = await uniqueSlug(patch.slug, id);

    const { data, error } = await supabase
      .from("forms")
      .update(update as never)
      .eq("id", id)
      .select("*")
      .single();
    if (error) fail(error.message);
    return mapForm(data as Row);
  },

  async saveDraft(id: string, pages: FormPage[]): Promise<{ savedAt: string }> {
    const savedAt = new Date().toISOString();
    const { error } = await supabase
      .from("forms")
      .update({ pages: pages as never, updated_at: savedAt })
      .eq("id", id);
    if (error) fail(error.message);
    return { savedAt };
  },

  async duplicate(id: string): Promise<FormDefinition> {
    const src = await formsApi.get(id);
    return formsApi.create({
      name: `${src.name} (cópia)`,
      description: src.description,
      category: src.category,
      groupId: src.groupId,
      visibility: src.visibility,
      slug: `${src.slug}-copia`,
    }).then(async (created) => {
      const pages = clonePages(src.pages);
      return formsApi.update(created.id, { pages });
    });
  },

  async setStatus(id: string, status: FormStatus): Promise<FormDefinition> {
    const current = await formsApi.get(id);
    const stamp = new Date().toISOString();
    const version = status === "published" ? current.version + 1 : current.version;
    const { data, error } = await supabase
      .from("forms")
      .update({
        status,
        version,
        published_at: status === "published" ? stamp : current.publishedAt,
      })
      .eq("id", id)
      .select("*")
      .single();
    if (error) fail(error.message);
    const updated = mapForm(data as Row);
    if (status === "published") {
      const { data: auth } = await supabase.auth.getUser();
      await supabase.from("form_versions").insert({
        form_id: id,
        version: updated.version,
        label: `Versão ${updated.version}`,
        schema: updated.pages as never,
        created_by: auth.user?.id ?? null,
      });
    }
    return updated;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("forms").delete().eq("id", id);
    if (error) fail(error.message);
  },

  async versions(formId: string): Promise<SchemaVersion[]> {
    const { data, error } = await supabase
      .from("form_versions")
      .select("*")
      .eq("form_id", formId)
      .order("version", { ascending: false });
    if (error) fail(error.message);
    return (data ?? []).map((v) => ({
      id: v.id as string,
      formId: v.form_id as string,
      version: v.version as number,
      label: v.label as string,
      createdAt: v.created_at as string,
      snapshot: (v.schema as unknown as FormPage[]) ?? [],
    }));
  },

  async restoreVersion(formId: string, versionId: string): Promise<FormDefinition> {
    const all = await formsApi.versions(formId);
    const v = all.find((x) => x.id === versionId);
    if (!v) fail("Versão não encontrada");
    return formsApi.update(formId, { pages: clonePages(v.snapshot) });
  },
};

export const templatesApi = {
  async list(): Promise<FormTemplate[]> {
    const { data, error } = await supabase
      .from("form_templates")
      .select("*")
      .eq("active", true)
      .order("name");
    if (error) fail(error.message);
    return (data ?? []).map((t) => ({
      id: t.id as string,
      name: t.name as string,
      description: t.description as string,
      category: t.category as string,
      pages: (t.schema as unknown as FormPage[]) ?? [],
    }));
  },
  async get(id: string): Promise<FormTemplate> {
    const all = await templatesApi.list();
    const t = all.find((x) => x.id === id);
    if (!t) fail("Template não encontrado");
    return t;
  },
};

export const previewApi = {
  get: (id: string) => formsApi.get(id),
};
