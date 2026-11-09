import { getStorage } from "@/core/providers/storage";
import { eventBus, EVENT_NAMES } from "@/modules/events/service";
import type { Warranty } from "./types";

const COLLECTION = "warranties";

export const warrantyService = {
  async list(): Promise<Warranty[]> { return getStorage().findAll<Warranty>(COLLECTION); },
  async get(id: string): Promise<Warranty | null> { return getStorage().find<Warranty>(COLLECTION, id); },
  async create(data: Omit<Warranty, "id">): Promise<Warranty> {
    const created = await getStorage().create<Warranty>(COLLECTION, data);
    eventBus.publish(EVENT_NAMES.WARRANTY_CREATED, "entity", "warranties", { id: created.id, name: created.name }).catch(() => {});
    return created;
  },
  async update(id: string, patch: Partial<Warranty>): Promise<Warranty> {
    const updated = await getStorage().update<Warranty>(COLLECTION, id, patch);
    eventBus.publish(EVENT_NAMES.WARRANTY_UPDATED, "entity", "warranties", { id, ...patch }).catch(() => {});
    return updated;
  },
  async remove(id: string): Promise<void> {
    await getStorage().delete(COLLECTION, id);
    eventBus.publish(EVENT_NAMES.WARRANTY_DELETED, "entity", "warranties", { id }).catch(() => {});
  },
};
