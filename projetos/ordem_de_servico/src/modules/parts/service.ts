import { getStorage } from "@/core/providers/storage";
import { eventBus, EVENT_NAMES } from "@/modules/events/service";
import type { Part } from "./types";

const COLLECTION = "parts";

export const partService = {
  async list(): Promise<Part[]> { return getStorage().findAll<Part>(COLLECTION); },
  async get(id: string): Promise<Part | null> { return getStorage().find<Part>(COLLECTION, id); },
  async create(data: Omit<Part, "id">): Promise<Part> {
    const created = await getStorage().create<Part>(COLLECTION, data);
    eventBus.publish(EVENT_NAMES.PART_CREATED, "entity", "parts", { id: created.id, name: created.name, code: created.code }).catch(() => {});
    return created;
  },
  async update(id: string, patch: Partial<Part>): Promise<Part> {
    const updated = await getStorage().update<Part>(COLLECTION, id, patch);
    eventBus.publish(EVENT_NAMES.PART_UPDATED, "entity", "parts", { id, ...patch }).catch(() => {});
    return updated;
  },
  async remove(id: string): Promise<void> {
    await getStorage().delete(COLLECTION, id);
    eventBus.publish(EVENT_NAMES.PART_DELETED, "entity", "parts", { id }).catch(() => {});
  },
};
