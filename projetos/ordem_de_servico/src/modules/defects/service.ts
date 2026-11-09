import { getStorage } from "@/core/providers/storage";
import { eventBus, EVENT_NAMES } from "@/modules/events/service";
import type { Defect } from "./types";

const COLLECTION = "defects";

export const defectService = {
  async list(): Promise<Defect[]> { return getStorage().findAll<Defect>(COLLECTION); },
  async get(id: string): Promise<Defect | null> { return getStorage().find<Defect>(COLLECTION, id); },
  async create(data: Omit<Defect, "id">): Promise<Defect> {
    const created = await getStorage().create<Defect>(COLLECTION, data);
    eventBus.publish(EVENT_NAMES.DEFECT_CREATED, "entity", "defects", { id: created.id, name: created.name }).catch(() => {});
    return created;
  },
  async update(id: string, patch: Partial<Defect>): Promise<Defect> {
    const updated = await getStorage().update<Defect>(COLLECTION, id, patch);
    eventBus.publish(EVENT_NAMES.DEFECT_UPDATED, "entity", "defects", { id, ...patch }).catch(() => {});
    return updated;
  },
  async remove(id: string): Promise<void> {
    await getStorage().delete(COLLECTION, id);
    eventBus.publish(EVENT_NAMES.DEFECT_DELETED, "entity", "defects", { id }).catch(() => {});
  },
};
