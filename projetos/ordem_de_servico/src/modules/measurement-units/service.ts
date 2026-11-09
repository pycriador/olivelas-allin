import { getStorage } from "@/core/providers/storage";
import { eventBus, EVENT_NAMES } from "@/modules/events/service";
import type { MeasurementUnit } from "./types";

const COLLECTION = "measurement_units";

export const measurementUnitService = {
  async list(): Promise<MeasurementUnit[]> { return getStorage().findAll<MeasurementUnit>(COLLECTION); },
  async get(id: string): Promise<MeasurementUnit | null> { return getStorage().find<MeasurementUnit>(COLLECTION, id); },
  async create(data: Omit<MeasurementUnit, "id">): Promise<MeasurementUnit> {
    const created = await getStorage().create<MeasurementUnit>(COLLECTION, data);
    eventBus.publish(EVENT_NAMES.MEASUREMENT_UNIT_CREATED, "entity", "measurement-units", { id: created.id, name: created.name }).catch(() => {});
    return created;
  },
  async update(id: string, patch: Partial<MeasurementUnit>): Promise<MeasurementUnit> {
    const updated = await getStorage().update<MeasurementUnit>(COLLECTION, id, patch);
    eventBus.publish(EVENT_NAMES.MEASUREMENT_UNIT_UPDATED, "entity", "measurement-units", { id, ...patch }).catch(() => {});
    return updated;
  },
  async remove(id: string): Promise<void> {
    await getStorage().delete(COLLECTION, id);
    eventBus.publish(EVENT_NAMES.MEASUREMENT_UNIT_DELETED, "entity", "measurement-units", { id }).catch(() => {});
  },
};
