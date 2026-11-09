import { getStorage } from "@/core/providers/storage";
import { eventBus, EVENT_NAMES } from "@/modules/events/service";
import { getConnector } from "./connector-sdk";
import type { APIEndpoint, AuthConfig, WebhookMethod } from "./types";

const COLLECTION = "int_api_endpoints";

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export const apiGateway = {
  async list(): Promise<APIEndpoint[]> {
    return getStorage().findAll<APIEndpoint>(COLLECTION);
  },

  async get(id: string): Promise<APIEndpoint | null> {
    return getStorage().find<APIEndpoint>(COLLECTION, id);
  },

  async create(data: Omit<APIEndpoint, "id" | "createdAt" | "updatedAt">): Promise<APIEndpoint> {
    const ep: APIEndpoint = { id: uid(), ...data, createdAt: new Date().toISOString() };
    const created = await getStorage().create<APIEndpoint>(COLLECTION, ep);
    eventBus.publish(EVENT_NAMES.API_REQUESTED, "integration", "api-gateway", { id: created.id, name: created.name, method: created.method, path: created.path }).catch(() => {});
    return created;
  },

  async update(id: string, patch: Partial<APIEndpoint>): Promise<APIEndpoint> {
    return getStorage().update<APIEndpoint>(COLLECTION, id, { ...patch, updatedAt: new Date().toISOString() });
  },

  async remove(id: string): Promise<void> {
    await getStorage().delete(COLLECTION, id);
  },

  async execute(id: string, payload?: Record<string, unknown>): Promise<{ success: boolean; data?: unknown; statusCode?: number; processingTime: number }> {
    const ep = await this.get(id);
    if (!ep) throw new Error(`API endpoint ${id} not found`);
    const start = Date.now();
    try {
      const connector = getConnector("mock");
      const result = await connector.send(ep.path, payload || {}, { method: ep.method, headers: ep.headers });
      const time = Date.now() - start;
      eventBus.publish(EVENT_NAMES.API_COMPLETED, "integration", "api-gateway", { id, success: result.success, time }).catch(() => {});
      return { ...result, processingTime: time };
    } catch (error) {
      const time = Date.now() - start;
      const errMsg = error instanceof Error ? error.message : "API execution failed";
      eventBus.publish(EVENT_NAMES.API_COMPLETED, "integration", "api-gateway", { id, success: false, error: errMsg, time }).catch(() => {});
      return { success: false, statusCode: 500, processingTime: time };
    }
  },
};
