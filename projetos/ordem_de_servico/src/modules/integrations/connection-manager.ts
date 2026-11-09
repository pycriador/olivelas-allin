import { getStorage } from "@/core/providers/storage";
import { eventBus, EVENT_NAMES } from "@/modules/events/service";
import { getConnector } from "./connector-sdk";
import type { Connection, AuthConfig, EnvironmentType } from "./types";

const COLLECTION = "int_connections";

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export const connectionManager = {
  async list(): Promise<Connection[]> {
    return getStorage().findAll<Connection>(COLLECTION);
  },

  async get(id: string): Promise<Connection | null> {
    return getStorage().find<Connection>(COLLECTION, id);
  },

  async create(data: Omit<Connection, "id" | "createdAt" | "updatedAt">): Promise<Connection> {
    const conn: Connection = { id: uid(), ...data, createdAt: new Date().toISOString() };
    return getStorage().create<Connection>(COLLECTION, conn);
  },

  async update(id: string, patch: Partial<Connection>): Promise<Connection> {
    return getStorage().update<Connection>(COLLECTION, id, { ...patch, updatedAt: new Date().toISOString() });
  },

  async remove(id: string): Promise<void> {
    await getStorage().delete(COLLECTION, id);
  },

  async test(id: string): Promise<{ success: boolean; latency: number; error?: string }> {
    const conn = await this.get(id);
    if (!conn) throw new Error(`Connection ${id} not found`);
    const updated = await this.update(id, { status: "testing", lastTestedAt: new Date().toISOString() });
    try {
      const connector = getConnector("mock");
      const result = await connector.testConnection(updated);
      await this.update(id, { status: result.success ? "active" : "error" });
      eventBus.publish(EVENT_NAMES.CONNECTION_TESTED, "integration", "connections", { id, success: result.success, latency: result.latency }).catch(() => {});
      return result;
    } catch (error) {
      await this.update(id, { status: "error" });
      const errMsg = error instanceof Error ? error.message : "Connection test failed";
      eventBus.publish(EVENT_NAMES.CONNECTION_TESTED, "integration", "connections", { id, success: false, error: errMsg }).catch(() => {});
      return { success: false, latency: 0, error: errMsg };
    }
  },

  async toggleFavorite(id: string): Promise<Connection> {
    const conn = await this.get(id);
    if (!conn) throw new Error(`Connection ${id} not found`);
    return this.update(id, { isFavorite: !conn.isFavorite });
  },
};
