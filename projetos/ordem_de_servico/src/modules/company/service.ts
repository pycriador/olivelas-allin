import { getStorage } from "../../core/providers/storage";
import { configurationService } from "../../core/services/configuration";
import { eventBus, EVENT_NAMES } from "@/modules/events/service";
import type { Company } from "./types";

const COLLECTION = "companies";

export const companyService = {
  async list(): Promise<Company[]> {
    const items = await getStorage().findAll<Company>(COLLECTION);
    return items;
  },
  async get(id: string): Promise<Company | null> {
    return getStorage().find<Company>(COLLECTION, id);
  },
  async create(data: Omit<Company, "id">): Promise<Company> {
    const created = await getStorage().create<Company>(COLLECTION, data);
    eventBus.publish(EVENT_NAMES.COMPANY_CREATED, "company", "company", { id: created.id, name: created.legalName, document: created.cnpj }).catch(() => {});
    return created;
  },
  async update(id: string, patch: Partial<Company>): Promise<Company> {
    const updated = await getStorage().update<Company>(COLLECTION, id, patch);
    eventBus.publish(EVENT_NAMES.COMPANY_UPDATED, "company", "company", { id, ...patch }).catch(() => {});
    return updated;
  },
  async remove(id: string): Promise<void> {
    await getStorage().delete(COLLECTION, id);
    eventBus.publish(EVENT_NAMES.COMPANY_DELETED, "company", "company", { id }).catch(() => {});
  },
  async setActive(id: string): Promise<void> {
    await configurationService.update({ activeCompanyId: id });
  },
  async getActive(): Promise<Company | null> {
    const cfg = await configurationService.get();
    const all = await this.list();
    return all.find((c) => c.id === cfg.activeCompanyId) ?? all[0] ?? null;
  },
};
