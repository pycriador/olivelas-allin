import { getStorage } from "@/core/providers/storage";
import { eventBus, EVENT_NAMES } from "@/modules/events/service";
import type { Model } from "./types";

const COLLECTION = "models";

export const modelService = {
  async list(): Promise<Model[]> { return getStorage().findAll<Model>(COLLECTION); },
  async get(id: string): Promise<Model | null> { return getStorage().find<Model>(COLLECTION, id); },
  async create(data: Omit<Model, "id">): Promise<Model> {
    const created = await getStorage().create<Model>(COLLECTION, data);
    eventBus.publish(EVENT_NAMES.MODEL_CREATED, "entity", "models", { id: created.id, name: created.name }).catch(() => {});
    return created;
  },
  async update(id: string, patch: Partial<Model>): Promise<Model> {
    const updated = await getStorage().update<Model>(COLLECTION, id, patch);
    eventBus.publish(EVENT_NAMES.MODEL_UPDATED, "entity", "models", { id, ...patch }).catch(() => {});
    return updated;
  },
  async remove(id: string): Promise<void> {
    await getStorage().delete(COLLECTION, id);
    eventBus.publish(EVENT_NAMES.MODEL_DELETED, "entity", "models", { id }).catch(() => {});
  },
  async search(query: string): Promise<Model[]> {
    const all = await this.list();
    const q = query.toLowerCase();
    return all.filter((m) =>
      (m.name && m.name.toLowerCase().includes(q)) ||
      (m.internalCode && m.internalCode.toLowerCase().includes(q)) ||
      (m.manufacturerCode && m.manufacturerCode.toLowerCase().includes(q))
    );
  },
  async getByBrand(brandId: string): Promise<Model[]> {
    const all = await this.list();
    return all.filter((m) => m.brandId === brandId);
  },
  async getByCategory(categoryId: string): Promise<Model[]> {
    const all = await this.list();
    return all.filter((m) => m.categoryId === categoryId);
  },
};
