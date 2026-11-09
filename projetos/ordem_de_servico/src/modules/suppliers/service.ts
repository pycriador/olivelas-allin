import { getStorage } from "@/core/providers/storage";
import { eventBus, EVENT_NAMES } from "@/modules/events/service";
import type { Supplier } from "./types";

const COLLECTION = "suppliers";

export const supplierService = {
  async list(): Promise<Supplier[]> { return getStorage().findAll<Supplier>(COLLECTION); },
  async get(id: string): Promise<Supplier | null> { return getStorage().find<Supplier>(COLLECTION, id); },
  async create(data: Omit<Supplier, "id">): Promise<Supplier> {
    const created = await getStorage().create<Supplier>(COLLECTION, data);
    eventBus.publish(EVENT_NAMES.SUPPLIER_CREATED, "entity", "suppliers", { id: created.id, company: created.company }).catch(() => {});
    return created;
  },
  async update(id: string, patch: Partial<Supplier>): Promise<Supplier> {
    const updated = await getStorage().update<Supplier>(COLLECTION, id, patch);
    eventBus.publish(EVENT_NAMES.SUPPLIER_UPDATED, "entity", "suppliers", { id, ...patch }).catch(() => {});
    return updated;
  },
  async remove(id: string): Promise<void> {
    await getStorage().delete(COLLECTION, id);
    eventBus.publish(EVENT_NAMES.SUPPLIER_DELETED, "entity", "suppliers", { id }).catch(() => {});
  },
};
