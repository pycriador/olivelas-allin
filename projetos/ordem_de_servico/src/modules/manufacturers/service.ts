import { getStorage } from "@/core/providers/storage";
import { eventBus, EVENT_NAMES } from "@/modules/events/service";
import type { Manufacturer } from "./types";

const COLLECTION = "manufacturers";

export const manufacturerService = {
  async list(): Promise<Manufacturer[]> { return getStorage().findAll<Manufacturer>(COLLECTION); },
  async get(id: string): Promise<Manufacturer | null> { return getStorage().find<Manufacturer>(COLLECTION, id); },
  async create(data: Omit<Manufacturer, "id">): Promise<Manufacturer> {
    const created = await getStorage().create<Manufacturer>(COLLECTION, data);
    eventBus.publish(EVENT_NAMES.MANUFACTURER_CREATED, "entity", "manufacturers", { id: created.id, name: created.name }).catch(() => {});
    return created;
  },
  async update(id: string, patch: Partial<Manufacturer>): Promise<Manufacturer> {
    const updated = await getStorage().update<Manufacturer>(COLLECTION, id, patch);
    eventBus.publish(EVENT_NAMES.MANUFACTURER_UPDATED, "entity", "manufacturers", { id, ...patch }).catch(() => {});
    return updated;
  },
  async remove(id: string): Promise<void> {
    await getStorage().delete(COLLECTION, id);
    eventBus.publish(EVENT_NAMES.MANUFACTURER_DELETED, "entity", "manufacturers", { id }).catch(() => {});
  },
};
