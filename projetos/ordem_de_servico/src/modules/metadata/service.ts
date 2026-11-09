import { getStorage } from "@/core/providers/storage";
import { eventBus, EVENT_NAMES } from "@/modules/events/service";
import type {
  MetadataEntity, MetadataField, MetadataForm, MetadataView, MetadataDashboard,
  MetadataTemplate, MetadataVersion, MetadataConfig, Level,
} from "./types";
import { DEFAULT_METADATA_CONFIG } from "./types";

const ENTITIES_COL = "metadata_entities";
const FIELDS_COL = "metadata_fields";
const FORMS_COL = "metadata_forms";
const VIEWS_COL = "metadata_views";
const DASHBOARDS_COL = "metadata_dashboards";
const TEMPLATES_COL = "metadata_templates";
const VERSIONS_COL = "metadata_versions";
const CONFIG_COL = "metadata_config";

export const metadataEntityService = {
  async list(): Promise<MetadataEntity[]> { return getStorage().findAll<MetadataEntity>(ENTITIES_COL); },
  async get(id: string): Promise<MetadataEntity | null> { return getStorage().find<MetadataEntity>(ENTITIES_COL, id); },
  async count(): Promise<number> { return getStorage().count(ENTITIES_COL); },
  async create(data: Omit<MetadataEntity, "id">): Promise<MetadataEntity> {
    const created = await getStorage().create<MetadataEntity>(ENTITIES_COL, data);
    eventBus.publish(EVENT_NAMES.METADATA_ENTITY_CREATED, "system", "metadata", { id: created.id, name: created.name }).catch(() => {});
    return created;
  },
  async update(id: string, patch: Partial<MetadataEntity>): Promise<MetadataEntity> {
    const updated = await getStorage().update<MetadataEntity>(ENTITIES_COL, id, patch);
    eventBus.publish(EVENT_NAMES.METADATA_ENTITY_UPDATED, "system", "metadata", { id, ...patch }).catch(() => {});
    return updated;
  },
  async remove(id: string): Promise<void> {
    await getStorage().delete(ENTITIES_COL, id);
    eventBus.publish(EVENT_NAMES.METADATA_ENTITY_DELETED, "system", "metadata", { id }).catch(() => {});
  },
};

export const metadataFieldService = {
  async list(entityId?: string): Promise<MetadataField[]> {
    const all = await getStorage().findAll<MetadataField>(FIELDS_COL);
    return entityId ? all.filter((f) => f.entityId === entityId) : all;
  },
  async get(id: string): Promise<MetadataField | null> { return getStorage().find<MetadataField>(FIELDS_COL, id); },
  async count(entityId?: string): Promise<number> {
    const all = await this.list(entityId);
    return all.length;
  },
  async create(data: Omit<MetadataField, "id">): Promise<MetadataField> {
    const created = await getStorage().create<MetadataField>(FIELDS_COL, data);
    eventBus.publish(EVENT_NAMES.METADATA_FIELD_CREATED, "system", "metadata", { id: created.id, name: created.name, entityId: created.entityId }).catch(() => {});
    return created;
  },
  async update(id: string, patch: Partial<MetadataField>): Promise<MetadataField> {
    const updated = await getStorage().update<MetadataField>(FIELDS_COL, id, patch);
    eventBus.publish(EVENT_NAMES.METADATA_FIELD_UPDATED, "system", "metadata", { id, ...patch }).catch(() => {});
    return updated;
  },
  async remove(id: string): Promise<void> {
    await getStorage().delete(FIELDS_COL, id);
    eventBus.publish(EVENT_NAMES.METADATA_FIELD_DELETED, "system", "metadata", { id }).catch(() => {});
  },
};

export const metadataFormService = {
  async list(entityId?: string): Promise<MetadataForm[]> {
    const all = await getStorage().findAll<MetadataForm>(FORMS_COL);
    return entityId ? all.filter((f) => f.entityId === entityId) : all;
  },
  async get(id: string): Promise<MetadataForm | null> { return getStorage().find<MetadataForm>(FORMS_COL, id); },
  async count(): Promise<number> { return getStorage().count(FORMS_COL); },
  async create(data: Omit<MetadataForm, "id">): Promise<MetadataForm> {
    const created = await getStorage().create<MetadataForm>(FORMS_COL, data);
    eventBus.publish(EVENT_NAMES.METADATA_FORM_CREATED, "system", "metadata", { id: created.id, name: created.name, entityId: created.entityId }).catch(() => {});
    return created;
  },
  async update(id: string, patch: Partial<MetadataForm>): Promise<MetadataForm> {
    const updated = await getStorage().update<MetadataForm>(FORMS_COL, id, patch);
    eventBus.publish(EVENT_NAMES.METADATA_FORM_UPDATED, "system", "metadata", { id, ...patch }).catch(() => {});
    return updated;
  },
  async remove(id: string): Promise<void> {
    await getStorage().delete(FORMS_COL, id);
    eventBus.publish(EVENT_NAMES.METADATA_FORM_DELETED, "system", "metadata", { id }).catch(() => {});
  },
};

export const metadataViewService = {
  async list(entityId?: string): Promise<MetadataView[]> {
    const all = await getStorage().findAll<MetadataView>(VIEWS_COL);
    return entityId ? all.filter((v) => v.entityId === entityId) : all;
  },
  async get(id: string): Promise<MetadataView | null> { return getStorage().find<MetadataView>(VIEWS_COL, id); },
  async count(): Promise<number> { return getStorage().count(VIEWS_COL); },
  async create(data: Omit<MetadataView, "id">): Promise<MetadataView> {
    const created = await getStorage().create<MetadataView>(VIEWS_COL, data);
    eventBus.publish(EVENT_NAMES.METADATA_VIEW_CREATED, "system", "metadata", { id: created.id, name: created.name, entityId: created.entityId }).catch(() => {});
    return created;
  },
  async update(id: string, patch: Partial<MetadataView>): Promise<MetadataView> {
    const updated = await getStorage().update<MetadataView>(VIEWS_COL, id, patch);
    eventBus.publish(EVENT_NAMES.METADATA_VIEW_UPDATED, "system", "metadata", { id, ...patch }).catch(() => {});
    return updated;
  },
  async remove(id: string): Promise<void> {
    await getStorage().delete(VIEWS_COL, id);
    eventBus.publish(EVENT_NAMES.METADATA_VIEW_DELETED, "system", "metadata", { id }).catch(() => {});
  },
};

export const metadataDashboardService = {
  async list(): Promise<MetadataDashboard[]> { return getStorage().findAll<MetadataDashboard>(DASHBOARDS_COL); },
  async get(id: string): Promise<MetadataDashboard | null> { return getStorage().find<MetadataDashboard>(DASHBOARDS_COL, id); },
  async count(): Promise<number> { return getStorage().count(DASHBOARDS_COL); },
  async create(data: Omit<MetadataDashboard, "id">): Promise<MetadataDashboard> {
    const created = await getStorage().create<MetadataDashboard>(DASHBOARDS_COL, data);
    eventBus.publish(EVENT_NAMES.METADATA_DASHBOARD_CREATED, "system", "metadata", { id: created.id, name: created.name }).catch(() => {});
    return created;
  },
  async update(id: string, patch: Partial<MetadataDashboard>): Promise<MetadataDashboard> {
    const updated = await getStorage().update<MetadataDashboard>(DASHBOARDS_COL, id, patch);
    eventBus.publish(EVENT_NAMES.METADATA_DASHBOARD_UPDATED, "system", "metadata", { id, ...patch }).catch(() => {});
    return updated;
  },
  async remove(id: string): Promise<void> {
    await getStorage().delete(DASHBOARDS_COL, id);
    eventBus.publish(EVENT_NAMES.METADATA_DASHBOARD_DELETED, "system", "metadata", { id }).catch(() => {});
  },
};

export const metadataTemplateService = {
  async list(type?: string): Promise<MetadataTemplate[]> {
    const all = await getStorage().findAll<MetadataTemplate>(TEMPLATES_COL);
    return type ? all.filter((t) => t.type === type) : all;
  },
  async get(id: string): Promise<MetadataTemplate | null> { return getStorage().find<MetadataTemplate>(TEMPLATES_COL, id); },
  async count(): Promise<number> { return getStorage().count(TEMPLATES_COL); },
  async create(data: Omit<MetadataTemplate, "id">): Promise<MetadataTemplate> {
    const created = await getStorage().create<MetadataTemplate>(TEMPLATES_COL, data);
    eventBus.publish(EVENT_NAMES.METADATA_TEMPLATE_CREATED, "system", "metadata", { id: created.id, name: created.name, type: created.type }).catch(() => {});
    return created;
  },
  async update(id: string, patch: Partial<MetadataTemplate>): Promise<MetadataTemplate> {
    const updated = await getStorage().update<MetadataTemplate>(TEMPLATES_COL, id, patch);
    eventBus.publish(EVENT_NAMES.METADATA_TEMPLATE_UPDATED, "system", "metadata", { id, ...patch }).catch(() => {});
    return updated;
  },
  async remove(id: string): Promise<void> {
    await getStorage().delete(TEMPLATES_COL, id);
    eventBus.publish(EVENT_NAMES.METADATA_TEMPLATE_DELETED, "system", "metadata", { id }).catch(() => {});
  },
};

export const metadataVersionService = {
  async list(entityType?: string, entityId?: string): Promise<MetadataVersion[]> {
    let all = await getStorage().findAll<MetadataVersion>(VERSIONS_COL);
    if (entityType) all = all.filter((v) => v.entityType === entityType);
    if (entityId) all = all.filter((v) => v.entityId === entityId);
    return all.sort((a, b) => b.version - a.version);
  },
  async create(data: Omit<MetadataVersion, "id">): Promise<MetadataVersion> { return getStorage().create<MetadataVersion>(VERSIONS_COL, data); },
  async count(): Promise<number> { return getStorage().count(VERSIONS_COL); },
};

export const metadataConfigService = {
  async get(): Promise<MetadataConfig> {
    const found = await getStorage().find<MetadataConfig>(CONFIG_COL, "metadata");
    if (found) return { ...DEFAULT_METADATA_CONFIG, ...found };
    await getStorage().create<MetadataConfig>(CONFIG_COL, DEFAULT_METADATA_CONFIG);
    return DEFAULT_METADATA_CONFIG;
  },
  async update(patch: Partial<MetadataConfig>): Promise<MetadataConfig> {
    const current = await this.get();
    const updated = await getStorage().update<MetadataConfig>(CONFIG_COL, "metadata", { ...current, ...patch });
    eventBus.publish(EVENT_NAMES.METADATA_CONFIG_UPDATED, "system", "metadata", { ...patch }).catch(() => {});
    return updated;
  },
};

export const inheritanceResolve = {
  resolve<T extends { level: Level; companyId: string | null }>(items: T[], targetLevel: Level, companyId?: string): T[] {
    const filtered = items.filter((i) => {
      if (i.level === "global") return true;
      if (i.level === "company" && companyId) return i.companyId === companyId;
      if (i.level === "company" && !companyId) return false;
      if (i.level === "user") return false;
      return false;
    });
    if (targetLevel === "global") return filtered.filter((i) => i.level === "global");
    if (targetLevel === "company") return filtered.filter((i) => i.level === "global" || i.level === "company");
    return filtered;
  },
  getEffective<T extends { level: Level; companyId: string | null }>(items: T[], targetLevel: Level, companyId?: string): T | null {
    const resolved = this.resolve(items, targetLevel, companyId);
    return resolved[resolved.length - 1] ?? null;
  },
};

export const metadataSearchService = {
  async search(query: string) {
    const q = query.toLowerCase();
    const [entities, fields, forms, views, dashboards, templates] = await Promise.all([
      metadataEntityService.list(), metadataFieldService.list(),
      metadataFormService.list(), metadataViewService.list(),
      metadataDashboardService.list(), metadataTemplateService.list(),
    ]);
    return {
      entities: entities.filter((e) => e.name.toLowerCase().includes(q) || e.pluralName.toLowerCase().includes(q) || e.description.toLowerCase().includes(q)),
      fields: fields.filter((f) => f.name.toLowerCase().includes(q) || f.label.toLowerCase().includes(q)),
      forms: forms.filter((f) => f.name.toLowerCase().includes(q) || f.description.toLowerCase().includes(q)),
      views: views.filter((v) => v.name.toLowerCase().includes(q) || v.description.toLowerCase().includes(q)),
      dashboards: dashboards.filter((d) => d.name.toLowerCase().includes(q) || d.description.toLowerCase().includes(q)),
      templates: templates.filter((t) => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)),
    };
  },
};

export async function publishConfig(
  type: "form" | "view" | "dashboard" | "template",
  id: string,
  userId: string,
): Promise<void> {
  const now = new Date().toISOString();
  const version = Date.now();

  if (type === "form") {
    const form = await metadataFormService.get(id);
    if (!form) throw new Error("Form not found");
    await metadataVersionService.create({
      entityType: "form", entityId: id, version: form.version, status: form.status,
      data: form as unknown as Record<string, unknown>, comparison: "", createdBy: userId, createdAt: now, description: `Published v${form.version}`,
    });
    await metadataFormService.update(id, { status: "published", publishedVersion: version, version: form.version + 1 });
    eventBus.publish(EVENT_NAMES.METADATA_PUBLISHED, "system", "metadata", { type, id, name: form.name, version: form.version + 1 }, { userId }).catch(() => {});
  } else if (type === "view") {
    const view = await metadataViewService.get(id);
    if (!view) throw new Error("View not found");
    await metadataVersionService.create({
      entityType: "view", entityId: id, version: view.version, status: view.status,
      data: view as unknown as Record<string, unknown>, comparison: "", createdBy: userId, createdAt: now, description: `Published v${view.version}`,
    });
    await metadataViewService.update(id, { status: "published", publishedVersion: version, version: view.version + 1 });
    eventBus.publish(EVENT_NAMES.METADATA_PUBLISHED, "system", "metadata", { type, id, name: view.name, version: view.version + 1 }, { userId }).catch(() => {});
  } else if (type === "dashboard") {
    const dash = await metadataDashboardService.get(id);
    if (!dash) throw new Error("Dashboard not found");
    await metadataVersionService.create({
      entityType: "dashboard", entityId: id, version: dash.version, status: dash.status,
      data: dash as unknown as Record<string, unknown>, comparison: "", createdBy: userId, createdAt: now, description: `Published v${dash.version}`,
    });
    await metadataDashboardService.update(id, { status: "published", publishedVersion: version, version: dash.version + 1 });
    eventBus.publish(EVENT_NAMES.METADATA_PUBLISHED, "system", "metadata", { type, id, name: dash.name, version: dash.version + 1 }, { userId }).catch(() => {});
  } else if (type === "template") {
    const tmpl = await metadataTemplateService.get(id);
    if (!tmpl) throw new Error("Template not found");
    await metadataVersionService.create({
      entityType: "template", entityId: id, version: tmpl.version, status: tmpl.status,
      data: tmpl as unknown as Record<string, unknown>, comparison: "", createdBy: userId, createdAt: now, description: `Published v${tmpl.version}`,
    });
    await metadataTemplateService.update(id, { status: "published", publishedVersion: version, version: tmpl.version + 1 });
    eventBus.publish(EVENT_NAMES.METADATA_PUBLISHED, "system", "metadata", { type, id, name: tmpl.name, version: tmpl.version + 1 }, { userId }).catch(() => {});
  }
}
