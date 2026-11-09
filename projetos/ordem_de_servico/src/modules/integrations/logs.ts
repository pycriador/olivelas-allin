import { getStorage } from "@/core/providers/storage";
import type { IntegrationLog } from "./types";

const COLLECTION = "int_logs";

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export const integrationLogs = {
  async list(limit = 200): Promise<IntegrationLog[]> {
    const all = await getStorage().findAll<IntegrationLog>(COLLECTION);
    return all.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")).slice(0, limit);
  },

  async create(data: Omit<IntegrationLog, "id" | "createdAt">): Promise<IntegrationLog> {
    const log: IntegrationLog = { id: uid(), ...data, createdAt: new Date().toISOString() };
    return getStorage().create<IntegrationLog>(COLLECTION, log);
  },

  async clear(): Promise<void> {
    const all = await this.list(10000);
    for (const log of all) {
      await getStorage().delete(COLLECTION, log.id);
    }
  },

  async get(id: string): Promise<IntegrationLog | null> {
    return getStorage().find<IntegrationLog>(COLLECTION, id);
  },
};
