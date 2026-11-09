import { getStorage } from "@/core/providers/storage";
import { eventBus, EVENT_NAMES } from "@/modules/events/service";
import type { PaymentTerm } from "./types";

const COLLECTION = "payment_terms";

export const paymentTermService = {
  async list(): Promise<PaymentTerm[]> { return getStorage().findAll<PaymentTerm>(COLLECTION); },
  async get(id: string): Promise<PaymentTerm | null> { return getStorage().find<PaymentTerm>(COLLECTION, id); },
  async create(data: Omit<PaymentTerm, "id">): Promise<PaymentTerm> {
    const created = await getStorage().create<PaymentTerm>(COLLECTION, data);
    eventBus.publish(EVENT_NAMES.PAYMENT_TERM_CREATED, "entity", "payment-terms", { id: created.id, name: created.name }).catch(() => {});
    return created;
  },
  async update(id: string, patch: Partial<PaymentTerm>): Promise<PaymentTerm> {
    const updated = await getStorage().update<PaymentTerm>(COLLECTION, id, patch);
    eventBus.publish(EVENT_NAMES.PAYMENT_TERM_UPDATED, "entity", "payment-terms", { id, ...patch }).catch(() => {});
    return updated;
  },
  async remove(id: string): Promise<void> {
    await getStorage().delete(COLLECTION, id);
    eventBus.publish(EVENT_NAMES.PAYMENT_TERM_DELETED, "entity", "payment-terms", { id }).catch(() => {});
  },
};
