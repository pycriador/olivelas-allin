import { getStorage } from "@/core/providers/storage";
import { eventBus, EVENT_NAMES } from "@/modules/events/service";
import type { EquipmentType } from "./types";

const COLLECTION = "equipment_types";

export const equipmentTypeService = {
  async list(): Promise<EquipmentType[]> { return getStorage().findAll<EquipmentType>(COLLECTION); },
  async get(id: string): Promise<EquipmentType | null> { return getStorage().find<EquipmentType>(COLLECTION, id); },
  async create(data: Omit<EquipmentType, "id">): Promise<EquipmentType> {
    const created = await getStorage().create<EquipmentType>(COLLECTION, data);
    eventBus.publish(EVENT_NAMES.EQUIPMENT_TYPE_CREATED, "entity", "equipment_types", { id: created.id, name: created.name }).catch(() => {});
    return created;
  },
  async update(id: string, patch: Partial<EquipmentType>): Promise<EquipmentType> {
    const updated = await getStorage().update<EquipmentType>(COLLECTION, id, patch);
    eventBus.publish(EVENT_NAMES.EQUIPMENT_TYPE_UPDATED, "entity", "equipment_types", { id, ...patch }).catch(() => {});
    return updated;
  },
  async remove(id: string): Promise<void> {
    await getStorage().delete(COLLECTION, id);
    eventBus.publish(EVENT_NAMES.EQUIPMENT_TYPE_DELETED, "entity", "equipment_types", { id }).catch(() => {});
  },
};
