import { getStorage } from "@/core/providers/storage";
import { eventBus, EVENT_NAMES } from "@/modules/events/service";
import type { Category } from "./types";

const COLLECTION = "categories";

export const categoryService = {
  async list(): Promise<Category[]> { return getStorage().findAll<Category>(COLLECTION); },
  async get(id: string): Promise<Category | null> { return getStorage().find<Category>(COLLECTION, id); },
  async create(data: Omit<Category, "id">): Promise<Category> {
    const created = await getStorage().create<Category>(COLLECTION, data);
    eventBus.publish(EVENT_NAMES.CATEGORY_CREATED, "entity", "categories", { id: created.id, name: created.name }).catch(() => {});
    return created;
  },
  async update(id: string, patch: Partial<Category>): Promise<Category> {
    const updated = await getStorage().update<Category>(COLLECTION, id, patch);
    eventBus.publish(EVENT_NAMES.CATEGORY_UPDATED, "entity", "categories", { id, ...patch }).catch(() => {});
    return updated;
  },
  async remove(id: string): Promise<void> {
    await getStorage().delete(COLLECTION, id);
    eventBus.publish(EVENT_NAMES.CATEGORY_DELETED, "entity", "categories", { id }).catch(() => {});
  },
};
