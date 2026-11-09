import { getStorage } from "@/core/providers/storage";
import { eventBus, EVENT_NAMES } from "@/modules/events/service";
import type { Webhook, WebhookMethod, WebhookFormat, WebhookStatus, WebhookLog } from "./types";

const COLLECTION = "int_webhooks";

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export const webhookManager = {
  async list(): Promise<Webhook[]> {
    return getStorage().findAll<Webhook>(COLLECTION);
  },

  async get(id: string): Promise<Webhook | null> {
    return getStorage().find<Webhook>(COLLECTION, id);
  },

  async create(data: Omit<Webhook, "id" | "version" | "history" | "createdAt" | "updatedAt">): Promise<Webhook> {
    const wh: Webhook = { id: uid(), version: 1, history: [], ...data, createdAt: new Date().toISOString() };
    const created = await getStorage().create<Webhook>(COLLECTION, wh);
    eventBus.publish(EVENT_NAMES.WEBHOOK_CREATED, "integration", "webhooks", { id: created.id, name: created.name, url: created.url }).catch(() => {});
    return created;
  },

  async update(id: string, patch: Partial<Webhook>): Promise<Webhook> {
    const updated = await getStorage().update<Webhook>(COLLECTION, id, { ...patch, updatedAt: new Date().toISOString() });
    return updated;
  },

  async duplicate(id: string): Promise<Webhook> {
    const existing = await this.get(id);
    if (!existing) throw new Error(`Webhook ${id} not found`);
    return this.create({ name: `${existing.name} (Cópia)`, url: existing.url, method: existing.method, format: existing.format, headers: existing.headers, secret: existing.secret, status: "inactive", companyId: existing.companyId, connectorId: existing.connectorId, eventType: existing.eventType, retryCount: existing.retryCount, timeout: existing.timeout });
  },

  async addLog(webhookId: string, log: Omit<WebhookLog, "id" | "createdAt">): Promise<Webhook> {
    const wh = await this.get(webhookId);
    if (!wh) throw new Error(`Webhook ${webhookId} not found`);
    const entry: WebhookLog = { id: uid(), ...log, createdAt: new Date().toISOString() };
    const updated = await this.update(webhookId, { history: [...wh.history, entry] });
    eventBus.publish(EVENT_NAMES.WEBHOOK_PROCESSED, "integration", "webhooks", { id: webhookId, status: log.status }).catch(() => {});
    return updated;
  },

  async remove(id: string): Promise<void> {
    await getStorage().delete(COLLECTION, id);
    eventBus.publish(EVENT_NAMES.WEBHOOK_DELETED, "integration", "webhooks", { id }).catch(() => {});
  },
};
