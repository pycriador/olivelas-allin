import { getStorage } from "@/core/providers/storage";
import { eventBus, EVENT_NAMES } from "@/modules/events/service";
import type { Technician } from "./types";

const COLLECTION = "technicians";

export const technicianService = {
  async list(): Promise<Technician[]> { return getStorage().findAll<Technician>(COLLECTION); },
  async get(id: string): Promise<Technician | null> { return getStorage().find<Technician>(COLLECTION, id); },
  async create(data: Omit<Technician, "id">): Promise<Technician> {
    const created = await getStorage().create<Technician>(COLLECTION, data);
    eventBus.publish(EVENT_NAMES.TECHNICIAN_CREATED, "entity", "technicians", { id: created.id, name: created.name }).catch(() => {});
    return created;
  },
  async update(id: string, patch: Partial<Technician>): Promise<Technician> {
    const updated = await getStorage().update<Technician>(COLLECTION, id, patch);
    eventBus.publish(EVENT_NAMES.TECHNICIAN_UPDATED, "entity", "technicians", { id, ...patch }).catch(() => {});
    return updated;
  },
  async remove(id: string): Promise<void> {
    await getStorage().delete(COLLECTION, id);
    eventBus.publish(EVENT_NAMES.TECHNICIAN_DELETED, "entity", "technicians", { id }).catch(() => {});
  },
};
