import { getStorage } from "@/core/providers/storage";
import { eventBus, EVENT_NAMES } from "@/modules/events/service";
import type { Service } from "./types";

const COLLECTION = "services";

export const serviceService = {
  async list(): Promise<Service[]> { return getStorage().findAll<Service>(COLLECTION); },
  async get(id: string): Promise<Service | null> { return getStorage().find<Service>(COLLECTION, id); },
  async create(data: Omit<Service, "id">): Promise<Service> {
    const created = await getStorage().create<Service>(COLLECTION, data);
    eventBus.publish(EVENT_NAMES.SERVICE_CREATED, "entity", "services", { id: created.id, name: created.name }).catch(() => {});
    return created;
  },
  async update(id: string, patch: Partial<Service>): Promise<Service> {
    const updated = await getStorage().update<Service>(COLLECTION, id, patch);
    eventBus.publish(EVENT_NAMES.SERVICE_UPDATED, "entity", "services", { id, ...patch }).catch(() => {});
    return updated;
  },
  async remove(id: string): Promise<void> {
    await getStorage().delete(COLLECTION, id);
    eventBus.publish(EVENT_NAMES.SERVICE_DELETED, "entity", "services", { id }).catch(() => {});
  },
};
