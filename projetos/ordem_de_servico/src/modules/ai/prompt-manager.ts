import { getStorage } from "@/core/providers/storage";
import { eventBus, EVENT_NAMES } from "@/modules/events/service";
import type { Prompt, PromptCategory, PromptStatus, PromptVariable, PromptVersion, AIModelType } from "./types";

const COLLECTION = "ai_prompts";

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export const promptManager = {
  async list(category?: PromptCategory, status?: PromptStatus): Promise<Prompt[]> {
    const all = await getStorage().findAll<Prompt>(COLLECTION);
    let filtered = all;
    if (category) filtered = filtered.filter((p) => p.category === category);
    if (status) filtered = filtered.filter((p) => p.status === status);
    return filtered.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  },

  async get(id: string): Promise<Prompt | null> {
    return getStorage().find<Prompt>(COLLECTION, id);
  },

  async create(data: {
    name: string;
    category: PromptCategory;
    description: string;
    template: string;
    variables?: PromptVariable[];
    temperature?: number;
    suggestedModel?: AIModelType;
    tags?: string[];
    isGlobal?: boolean;
  }): Promise<Prompt> {
    const prompt: Prompt = {
      id: uid(),
      name: data.name,
      category: data.category,
      description: data.description,
      template: data.template,
      version: 1,
      isGlobal: data.isGlobal ?? false,
      status: "draft",
      variables: data.variables || [],
      temperature: data.temperature ?? 0.7,
      suggestedModel: data.suggestedModel || "mock-model",
      tags: data.tags || [],
      history: [],
      createdAt: new Date().toISOString(),
    };

    const created = await getStorage().create<Prompt>(COLLECTION, prompt);

    eventBus.publish(EVENT_NAMES.PROMPT_CREATED, "ai", "ai-prompts", {
      id: created.id,
      name: created.name,
      category: created.category,
    }).catch(() => {});

    return created;
  },

  async update(id: string, patch: Partial<Prompt>): Promise<Prompt> {
    const existing = await this.get(id);
    if (!existing) throw new Error(`Prompt ${id} not found`);

    const updated = await getStorage().update<Prompt>(COLLECTION, id, {
      ...patch,
      updatedAt: new Date().toISOString(),
    });

    eventBus.publish(EVENT_NAMES.PROMPT_UPDATED, "ai", "ai-prompts", { id, name: updated.name }).catch(() => {});
    return updated;
  },

  async duplicate(id: string, newName?: string): Promise<Prompt> {
    const existing = await this.get(id);
    if (!existing) throw new Error(`Prompt ${id} not found`);

    const duplicated = await this.create({
      name: newName || `${existing.name} (Cópia)`,
      category: existing.category,
      description: existing.description,
      template: existing.template,
      variables: existing.variables,
      temperature: existing.temperature,
      suggestedModel: existing.suggestedModel,
      tags: existing.tags,
      isGlobal: existing.isGlobal,
    });

    eventBus.publish(EVENT_NAMES.PROMPT_DUPLICATED, "ai", "ai-prompts", {
      id: duplicated.id,
      originalId: id,
      name: duplicated.name,
    }).catch(() => {});

    return duplicated;
  },

  async publish(id: string, changelog?: string): Promise<Prompt> {
    const existing = await this.get(id);
    if (!existing) throw new Error(`Prompt ${id} not found`);

    const newVersion: PromptVersion = {
      version: existing.version + 1,
      template: existing.template,
      variables: existing.variables,
      temperature: existing.temperature,
      updatedAt: new Date().toISOString(),
      changelog: changelog || `Published version ${existing.version + 1}`,
    };

    const updated = await getStorage().update<Prompt>(COLLECTION, id, {
      status: "published",
      version: existing.version + 1,
      history: [...existing.history, newVersion],
      updatedAt: new Date().toISOString(),
    });

    eventBus.publish(EVENT_NAMES.PROMPT_PUBLISHED, "ai", "ai-prompts", {
      id, version: updated.version, name: updated.name,
    }).catch(() => {});

    return updated;
  },

  async archive(id: string): Promise<Prompt> {
    const updated = await this.update(id, { status: "archived" });
    eventBus.publish(EVENT_NAMES.PROMPT_ARCHIVED, "ai", "ai-prompts", { id, name: updated.name }).catch(() => {});
    return updated;
  },

  async restore(id: string): Promise<Prompt> {
    const updated = await this.update(id, { status: "draft" });
    eventBus.publish(EVENT_NAMES.PROMPT_RESTORED, "ai", "ai-prompts", { id, name: updated.name }).catch(() => {});
    return updated;
  },

  async compareVersions(id: string, v1: number, v2: number): Promise<{ version1: PromptVersion | null; version2: PromptVersion | null }> {
    const existing = await this.get(id);
    if (!existing) throw new Error(`Prompt ${id} not found`);
    const ver1 = existing.history.find((h) => h.version === v1) || null;
    const ver2 = existing.history.find((h) => h.version === v2) || null;
    return { version1: ver1, version2: ver2 };
  },

  async remove(id: string): Promise<void> {
    await getStorage().delete(COLLECTION, id);
    eventBus.publish(EVENT_NAMES.PROMPT_DELETED, "ai", "ai-prompts", { id }).catch(() => {});
  },
};
