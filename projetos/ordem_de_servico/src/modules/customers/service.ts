import { getStorage } from "@/core/providers/storage";
import { eventBus, EVENT_NAMES } from "@/modules/events/service";
import type { Customer, CustomerDuplicity, CustomerVersion, CustomerObservation, CustomerAttachment, CustomerCommunication, CustomerRelationship, ImportResult, CustomerTimelineEntry } from "./types";

const COLLECTION = "customers";
const DUPLICITY_COL = "customer_duplicities";

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export const customerService = {
  async list(): Promise<Customer[]> { return getStorage().findAll<Customer>(COLLECTION); },
  async get(id: string): Promise<Customer | null> { return getStorage().find<Customer>(COLLECTION, id); },
  async create(data: Omit<Customer, "id">): Promise<Customer> {
    const entry: Omit<Customer, "id"> = {
      ...data,
      timeline: [{ id: uid(), type: "created", description: "Cliente criado", createdAt: new Date().toISOString() }],
      versions: [],
      createdAt: new Date().toISOString(),
    };
    const created = await getStorage().create<Customer>(COLLECTION, entry);
    eventBus.publish(EVENT_NAMES.CUSTOMER_CREATED, "entity", "customers", { id: created.id, name: created.name }).catch(() => {});
    return created;
  },
  async update(id: string, patch: Partial<Customer>): Promise<Customer> {
    const existing = await this.get(id);
    const updated = await getStorage().update<Customer>(COLLECTION, id, patch);
    eventBus.publish(EVENT_NAMES.CUSTOMER_UPDATED, "entity", "customers", { id, ...patch }).catch(() => {});
    return updated;
  },
  async remove(id: string): Promise<void> {
    const patch: Partial<Customer> = { deletedAt: new Date().toISOString(), deletedBy: "system", status: "inactive" };
    await getStorage().update<Customer>(COLLECTION, id, patch);
    eventBus.publish(EVENT_NAMES.CUSTOMER_DELETED, "entity", "customers", { id }).catch(() => {});
  },
  async restore(id: string): Promise<Customer> {
    const updated = await getStorage().update<Customer>(COLLECTION, id, { deletedAt: undefined, deletedBy: undefined, status: "active" });
    eventBus.publish(EVENT_NAMES.CUSTOMER_RESTORED, "entity", "customers", { id }).catch(() => {});
    return updated;
  },

  /* Shared Customers */
  async linkCompany(customerId: string, companyId: string): Promise<Customer> {
    const customer = await this.get(customerId);
    if (!customer) throw new Error("Customer not found");
    const linked = [...(customer.linkedCompanyIds ?? []), companyId];
    const updated = await getStorage().update<Customer>(COLLECTION, customerId, { linkedCompanyIds: [...new Set(linked)] });
    eventBus.publish(EVENT_NAMES.CUSTOMER_LINKED, "entity", "customers", { customerId, companyId }).catch(() => {});
    return updated;
  },
  async unlinkCompany(customerId: string, companyId: string): Promise<Customer> {
    const customer = await this.get(customerId);
    if (!customer) throw new Error("Customer not found");
    const linked = (customer.linkedCompanyIds ?? []).filter((id) => id !== companyId);
    const updated = await getStorage().update<Customer>(COLLECTION, customerId, { linkedCompanyIds: linked });
    eventBus.publish(EVENT_NAMES.CUSTOMER_UNLINKED, "entity", "customers", { customerId, companyId }).catch(() => {});
    return updated;
  },
  async migrateBatch(customerIds: string[], targetCompanyId: string): Promise<number> {
    let count = 0;
    for (const id of customerIds) {
      const customer = await this.get(id);
      if (!customer) continue;
      const linked = [...new Set([...(customer.linkedCompanyIds ?? []), targetCompanyId])];
      await getStorage().update<Customer>(COLLECTION, id, { linkedCompanyIds: linked, primaryCompanyId: targetCompanyId });
      count++;
    }
    eventBus.publish(EVENT_NAMES.CUSTOMER_MIGRATED, "entity", "customers", { customerIds, targetCompanyId, count }).catch(() => {});
    return count;
  },
  async copyCustomer(id: string): Promise<Customer> {
    const source = await this.get(id);
    if (!source) throw new Error("Customer not found");
    const { id: _id, createdAt: _c, updatedAt: _u, deletedAt: _d, deletedBy: _db, timeline: _t, versions: _v, ...data } = source;
    return this.create({ ...data, name: `${source.name} (Cópia)`, status: "active" });
  },
  async mergeCustomers(targetId: string, sourceId: string): Promise<Customer> {
    const target = await this.get(targetId);
    const source = await this.get(sourceId);
    if (!target || !source) throw new Error("Customer not found");
    const merged: Partial<Customer> = {
      tags: [...new Set([...(target.tags ?? []), ...(source.tags ?? [])])],
      linkedCompanyIds: [...new Set([...(target.linkedCompanyIds ?? []), ...(source.linkedCompanyIds ?? [])])],
      addresses: [...(target.addresses ?? []), ...(source.addresses ?? [])],
      contacts: [...(target.contacts ?? []), ...(source.contacts ?? [])],
      notes: [target.notes, source.notes].filter(Boolean).join("\n---\n"),
    };
    await getStorage().update<Customer>(COLLECTION, targetId, merged);
    await getStorage().delete(COLLECTION, sourceId);
    eventBus.publish(EVENT_NAMES.CUSTOMER_MERGED, "entity", "customers", { targetId, sourceId }).catch(() => {});
    return (await this.get(targetId))!;
  },
  async detectDuplicities(): Promise<CustomerDuplicity[]> {
    const all = await this.list();
    const results: CustomerDuplicity[] = [];
    const active = all.filter((c) => !c.deletedAt);
    for (let i = 0; i < active.length; i++) {
      for (let j = i + 1; j < active.length; j++) {
        const a = active[i];
        const b = active[j];
        let score = 0;
        const matchedFields: string[] = [];
        if (a.cpf && b.cpf && a.cpf === b.cpf) { score += 0.4; matchedFields.push("cpf"); }
        if (a.cnpj && b.cnpj && a.cnpj === b.cnpj) { score += 0.4; matchedFields.push("cnpj"); }
        if (a.email && b.email && a.email.toLowerCase() === b.email.toLowerCase()) { score += 0.3; matchedFields.push("email"); }
        if (a.name && b.name) {
          const n1 = a.name.toLowerCase().trim();
          const n2 = b.name.toLowerCase().trim();
          if (n1 === n2) { score += 0.3; matchedFields.push("name"); }
          else if (n1.includes(n2) || n2.includes(n1)) { score += 0.15; matchedFields.push("name_similar"); }
        }
        if (score >= 0.3) {
          results.push({
            id: uid(),
            customerId: a.id,
            duplicateCustomerId: b.id,
            score: Math.min(score, 1),
            matchedFields,
            status: "pending",
            createdAt: new Date().toISOString(),
          });
        }
      }
    }
    eventBus.publish(EVENT_NAMES.CUSTOMER_DUPLICITY_DETECTED, "entity", "customers", { count: results.length }).catch(() => {});
    return results;
  },

  /* Import & Export */
  async importCustomers(data: Omit<Customer, "id">[]): Promise<ImportResult> {
    let imported = 0;
    let duplicates = 0;
    const errorsList: string[] = [];
    const existing = await this.list();
    for (const item of data) {
      try {
        const duplicate = existing.some(
          (c) =>
            !c.deletedAt &&
            ((item.cpf && c.cpf === item.cpf) || (item.cnpj && c.cnpj === item.cnpj) || (item.email && c.email === item.email))
        );
        if (duplicate) {
          duplicates++;
          continue;
        }
        await this.create(item);
        imported++;
      } catch (e: any) {
        errorsList.push(e?.message ?? "Unknown error");
      }
    }
    const result: ImportResult = { total: data.length, imported, duplicates, errors: errorsList.length, errorsList };
    eventBus.publish(EVENT_NAMES.CUSTOMER_CREATED, "entity", "customers", { result }).catch(() => {});
    return result;
  },
  async exportCustomers(ids?: string[]): Promise<Customer[]> {
    const all = await this.list();
    const filtered = all.filter((c) => !c.deletedAt);
    if (ids) return filtered.filter((c) => ids.includes(c.id));
    return filtered;
  },
  async searchCustomers(query: string): Promise<Customer[]> {
    const all = await this.list();
    const q = query.toLowerCase().trim();
    return all.filter((c) => {
      if (c.deletedAt) return false;
      if (c.name?.toLowerCase().includes(q)) return true;
      if (c.cpf?.includes(q)) return true;
      if (c.cnpj?.includes(q)) return true;
      if (c.phone?.includes(q)) return true;
      if (c.email?.toLowerCase().includes(q)) return true;
      if (c.addresses?.some((a) => a.city?.toLowerCase().includes(q))) return true;
      if (c.tags?.some((t) => t.toLowerCase().includes(q))) return true;
      if (c.equipments?.some((e) => e.serialNumber?.toLowerCase().includes(q))) return true;
      if (c.serviceOrders?.some((s) => s.number?.toLowerCase().includes(q))) return true;
      return false;
    });
  },

  /* Observations */
  async addObservation(customerId: string, obs: Omit<CustomerObservation, "id">): Promise<Customer> {
    const customer = await this.get(customerId);
    if (!customer) throw new Error("Customer not found");
    const newObs: CustomerObservation = { ...obs, id: uid() };
    const observations = [...(customer.observations ?? []), newObs];
    const timeline = [...(customer.timeline ?? []), { id: uid(), type: "updated" as const, description: "Observação adicionada", createdAt: new Date().toISOString() }];
    const updated = await getStorage().update<Customer>(COLLECTION, customerId, { observations, timeline, updatedAt: new Date().toISOString() });
    eventBus.publish(EVENT_NAMES.CUSTOMER_UPDATED, "entity", "customers", { id: customerId }).catch(() => {});
    return updated;
  },
  async addAttachment(customerId: string, att: Omit<CustomerAttachment, "id">): Promise<Customer> {
    const customer = await this.get(customerId);
    if (!customer) throw new Error("Customer not found");
    const newAtt: CustomerAttachment = { ...att, id: uid() };
    const attachments = [...(customer.attachments ?? []), newAtt];
    const timeline = [...(customer.timeline ?? []), { id: uid(), type: "upload" as const, description: `Arquivo anexado: ${att.name}`, createdAt: new Date().toISOString() }];
    const updated = await getStorage().update<Customer>(COLLECTION, customerId, { attachments, timeline, updatedAt: new Date().toISOString() });
    eventBus.publish(EVENT_NAMES.CUSTOMER_UPDATED, "entity", "customers", { id: customerId }).catch(() => {});
    return updated;
  },

  /* Communications */
  async addCommunication(customerId: string, comm: Omit<CustomerCommunication, "id">): Promise<Customer> {
    const customer = await this.get(customerId);
    if (!customer) throw new Error("Customer not found");
    const newComm: CustomerCommunication = { ...comm, id: uid() };
    const communications = [...(customer.communications ?? []), newComm];
    const timeline = [...(customer.timeline ?? []), { id: uid(), type: "communication" as const, description: `${comm.channel}: ${comm.subject}`, createdAt: new Date().toISOString() }];
    const updated = await getStorage().update<Customer>(COLLECTION, customerId, { communications, timeline, updatedAt: new Date().toISOString() });
    eventBus.publish(EVENT_NAMES.CUSTOMER_UPDATED, "entity", "customers", { id: customerId }).catch(() => {});
    return updated;
  },

  /* Related Customers */
  async linkRelatedCustomer(customerId: string, rel: Omit<CustomerRelationship, "id">): Promise<Customer> {
    const customer = await this.get(customerId);
    if (!customer) throw new Error("Customer not found");
    const newRel: CustomerRelationship = { ...rel, id: uid() };
    const relationships = [...(customer.relationships ?? []), newRel];
    const timeline = [...(customer.timeline ?? []), { id: uid(), type: "link" as const, description: `Cliente relacionado: ${rel.relatedCustomerName}`, createdAt: new Date().toISOString() }];
    const updated = await getStorage().update<Customer>(COLLECTION, customerId, { relationships, timeline, updatedAt: new Date().toISOString() });
    eventBus.publish(EVENT_NAMES.CUSTOMER_UPDATED, "entity", "customers", { id: customerId }).catch(() => {});
    return updated;
  },
  async unlinkRelatedCustomer(customerId: string, relationId: string): Promise<Customer> {
    const customer = await this.get(customerId);
    if (!customer) throw new Error("Customer not found");
    const rel = (customer.relationships ?? []).find((r) => r.id === relationId);
    const relationships = (customer.relationships ?? []).filter((r) => r.id !== relationId);
    const timeline = [...(customer.timeline ?? []), { id: uid(), type: "link" as const, description: `Vínculo removido: ${rel?.relatedCustomerName ?? relationId}`, createdAt: new Date().toISOString() }];
    const updated = await getStorage().update<Customer>(COLLECTION, customerId, { relationships, timeline, updatedAt: new Date().toISOString() });
    eventBus.publish(EVENT_NAMES.CUSTOMER_UPDATED, "entity", "customers", { id: customerId }).catch(() => {});
    return updated;
  },

  /* Stats */
  async getStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    newThisMonth: number;
    byCompany: Record<string, number>;
    shared: number;
    withWarranty: number;
    withReturn: number;
    withOpenOS: number;
    recentRegistrations: number;
    recentChanges: number;
  }> {
    const all = await this.list();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const nonDeleted = all.filter((c) => !c.deletedAt);
    const total = all.length;
    const active = nonDeleted.filter((c) => c.status === "active").length;
    const inactive = nonDeleted.filter((c) => c.status === "inactive").length;
    const newThisMonth = nonDeleted.filter((c) => c.createdAt && c.createdAt >= startOfMonth).length;
    const byCompany: Record<string, number> = {};
    for (const c of nonDeleted) {
      if (c.primaryCompanyId) byCompany[c.primaryCompanyId] = (byCompany[c.primaryCompanyId] ?? 0) + 1;
    }
    const shared = nonDeleted.filter((c) => (c.linkedCompanyIds?.length ?? 0) > 0).length;
    const withWarranty = nonDeleted.filter((c) => (c.warranties?.length ?? 0) > 0).length;
    const withReturn = nonDeleted.filter((c) => c.timeline?.some((t) => t.type === "service_order")).length;
    const withOpenOS = nonDeleted.filter((c) => c.serviceOrders?.some((s) => s.status !== "closed" && s.status !== "finished")).length;
    const recentRegistrations = nonDeleted.filter((c) => c.createdAt && c.createdAt >= thirtyDaysAgo).length;
    const recentChanges = nonDeleted.filter((c) => c.updatedAt && c.updatedAt >= thirtyDaysAgo).length;
    return { total, active, inactive, newThisMonth, byCompany, shared, withWarranty, withReturn, withOpenOS, recentRegistrations, recentChanges };
  },

  /* Timeline */
  async addToTimeline(customerId: string, entry: Omit<CustomerTimelineEntry, "id" | "createdAt">): Promise<Customer> {
    const customer = await this.get(customerId);
    if (!customer) throw new Error("Customer not found");
    const newEntry: CustomerTimelineEntry = { ...entry, id: uid(), createdAt: new Date().toISOString() };
    const timeline = [...(customer.timeline ?? []), newEntry];
    const updated = await getStorage().update<Customer>(COLLECTION, customerId, { timeline, updatedAt: new Date().toISOString() });
    eventBus.publish(EVENT_NAMES.CUSTOMER_UPDATED, "entity", "customers", { id: customerId }).catch(() => {});
    return updated;
  },
};
