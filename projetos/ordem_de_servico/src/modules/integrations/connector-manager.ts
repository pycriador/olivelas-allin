import { getStorage } from "@/core/providers/storage";
import { eventBus, EVENT_NAMES } from "@/modules/events/service";
import type { ConnectorDefinition, ConnectorInstance, ConnectorCategory, ConnectorType, ConnectorStatus, EnvironmentType } from "./types";

const DEF_COLLECTION = "int_connector_definitions";
const INST_COLLECTION = "int_connector_instances";

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export const connectorManager = {
  async listDefinitions(category?: ConnectorCategory): Promise<ConnectorDefinition[]> {
    const all = await getStorage().findAll<ConnectorDefinition>(DEF_COLLECTION);
    if (category) return all.filter((d) => d.category === category);
    return all;
  },

  async getDefinition(id: string): Promise<ConnectorDefinition | null> {
    return getStorage().find<ConnectorDefinition>(DEF_COLLECTION, id);
  },

  async createDefinition(data: Omit<ConnectorDefinition, "id" | "createdAt" | "updatedAt">): Promise<ConnectorDefinition> {
    const def: ConnectorDefinition = { id: uid(), ...data, createdAt: new Date().toISOString() };
    const created = await getStorage().create<ConnectorDefinition>(DEF_COLLECTION, def);
    eventBus.publish(EVENT_NAMES.CONNECTOR_CREATED, "integration", "connectors", { id: created.id, name: created.name, type: created.type }).catch(() => {});
    return created;
  },

  async updateDefinition(id: string, patch: Partial<ConnectorDefinition>): Promise<ConnectorDefinition> {
    const updated = await getStorage().update<ConnectorDefinition>(DEF_COLLECTION, id, { ...patch, updatedAt: new Date().toISOString() });
    eventBus.publish(EVENT_NAMES.CONNECTOR_UPDATED, "integration", "connectors", { id, name: updated.name }).catch(() => {});
    return updated;
  },

  async removeDefinition(id: string): Promise<void> {
    await getStorage().delete(DEF_COLLECTION, id);
    eventBus.publish(EVENT_NAMES.CONNECTOR_DELETED, "integration", "connectors", { id }).catch(() => {});
  },

  async listInstances(status?: ConnectorStatus): Promise<ConnectorInstance[]> {
    const all = await getStorage().findAll<ConnectorInstance>(INST_COLLECTION);
    if (status) return all.filter((i) => i.status === status);
    return all;
  },

  async getInstance(id: string): Promise<ConnectorInstance | null> {
    return getStorage().find<ConnectorInstance>(INST_COLLECTION, id);
  },

  async createInstance(data: Omit<ConnectorInstance, "id" | "createdAt" | "updatedAt">): Promise<ConnectorInstance> {
    const inst: ConnectorInstance = { id: uid(), ...data, createdAt: new Date().toISOString() };
    const created = await getStorage().create<ConnectorInstance>(INST_COLLECTION, inst);
    eventBus.publish(EVENT_NAMES.CONNECTOR_CREATED, "integration", "connectors", { id: created.id, name: created.name, type: created.type }).catch(() => {});
    return created;
  },

  async updateInstance(id: string, patch: Partial<ConnectorInstance>): Promise<ConnectorInstance> {
    const updated = await getStorage().update<ConnectorInstance>(INST_COLLECTION, id, { ...patch, updatedAt: new Date().toISOString() });
    eventBus.publish(EVENT_NAMES.CONNECTOR_UPDATED, "integration", "connectors", { id, name: updated.name }).catch(() => {});
    return updated;
  },

  async removeInstance(id: string): Promise<void> {
    await getStorage().delete(INST_COLLECTION, id);
    eventBus.publish(EVENT_NAMES.CONNECTOR_DELETED, "integration", "connectors", { id }).catch(() => {});
  },

  async toggleFavorite(id: string): Promise<ConnectorInstance> {
    const inst = await this.getInstance(id);
    if (!inst) throw new Error(`Connector instance ${id} not found`);
    return this.updateInstance(id, { isFavorite: !inst.isFavorite });
  },
};
