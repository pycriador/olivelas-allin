import { getStorage } from "@/core/providers/storage";
import { eventBus, EVENT_NAMES } from "@/modules/events/service";
import type { Brand } from "./types";

const COLLECTION = "brands";

export const brandService = {
  async list(): Promise<Brand[]> { return getStorage().findAll<Brand>(COLLECTION); },
  async get(id: string): Promise<Brand | null> { return getStorage().find<Brand>(COLLECTION, id); },
  async create(data: Omit<Brand, "id">): Promise<Brand> {
    const created = await getStorage().create<Brand>(COLLECTION, data);
    eventBus.publish(EVENT_NAMES.BRAND_CREATED, "entity", "brands", { id: created.id, name: created.name }).catch(() => {});
    return created;
  },
  async update(id: string, patch: Partial<Brand>): Promise<Brand> {
    const updated = await getStorage().update<Brand>(COLLECTION, id, patch);
    eventBus.publish(EVENT_NAMES.BRAND_UPDATED, "entity", "brands", { id, ...patch }).catch(() => {});
    return updated;
  },
  async remove(id: string): Promise<void> {
    await getStorage().delete(COLLECTION, id);
    eventBus.publish(EVENT_NAMES.BRAND_DELETED, "entity", "brands", { id }).catch(() => {});
  },
};
