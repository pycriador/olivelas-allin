import { getStorage } from "@/core/providers/storage";
import { eventBus, EVENT_NAMES } from "@/modules/events/service";
import type { PaymentMethod } from "./types";

const COLLECTION = "payment_methods";

export const paymentMethodService = {
  async list(): Promise<PaymentMethod[]> { return getStorage().findAll<PaymentMethod>(COLLECTION); },
  async get(id: string): Promise<PaymentMethod | null> { return getStorage().find<PaymentMethod>(COLLECTION, id); },
  async create(data: Omit<PaymentMethod, "id">): Promise<PaymentMethod> {
    const created = await getStorage().create<PaymentMethod>(COLLECTION, data);
    eventBus.publish(EVENT_NAMES.PAYMENT_METHOD_CREATED, "entity", "payment-methods", { id: created.id, name: created.name }).catch(() => {});
    return created;
  },
  async update(id: string, patch: Partial<PaymentMethod>): Promise<PaymentMethod> {
    const updated = await getStorage().update<PaymentMethod>(COLLECTION, id, patch);
    eventBus.publish(EVENT_NAMES.PAYMENT_METHOD_UPDATED, "entity", "payment-methods", { id, ...patch }).catch(() => {});
    return updated;
  },
  async remove(id: string): Promise<void> {
    await getStorage().delete(COLLECTION, id);
    eventBus.publish(EVENT_NAMES.PAYMENT_METHOD_DELETED, "entity", "payment-methods", { id }).catch(() => {});
  },
};
