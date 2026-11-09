import { getStorage } from "@/core/providers/storage";
import { eventBus, EVENT_NAMES } from "@/modules/events/service";
import type { AIQueueItem, AIQueueStatus, AIProviderType, AIModelType } from "./types";

const COLLECTION = "ai_queue";

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export const aiQueue = {
  async list(status?: AIQueueStatus): Promise<AIQueueItem[]> {
    const all = await getStorage().findAll<AIQueueItem>(COLLECTION);
    if (status) return all.filter((item) => item.status === status);
    return all.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  },

  async get(id: string): Promise<AIQueueItem | null> {
    return getStorage().find<AIQueueItem>(COLLECTION, id);
  },

  async enqueue(data: {
    type: AIQueueItem["type"];
    provider: AIProviderType;
    model: AIModelType;
    promptId?: string;
    payload: Record<string, unknown>;
    priority?: number;
    maxRetries?: number;
  }): Promise<AIQueueItem> {
    const item: AIQueueItem = {
      id: uid(),
      type: data.type,
      provider: data.provider,
      model: data.model,
      promptId: data.promptId,
      payload: data.payload,
      status: "pending",
      priority: data.priority ?? 5,
      retryCount: 0,
      maxRetries: data.maxRetries ?? 3,
      scheduledAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    const created = await getStorage().create<AIQueueItem>(COLLECTION, item);

    eventBus.publish(EVENT_NAMES.AI_QUEUE_ITEM_CREATED, "ai", "ai-queue", {
      id: created.id,
      type: created.type,
      priority: created.priority,
    }).catch(() => {});

    return created;
  },

  async updateStatus(id: string, status: AIQueueStatus, extra?: Partial<AIQueueItem>): Promise<AIQueueItem> {
    const patch: Partial<AIQueueItem> = { status, ...extra, updatedAt: new Date().toISOString() };
    if (status === "processing") patch.startedAt = new Date().toISOString();
    if (status === "completed") patch.completedAt = new Date().toISOString();

    const updated = await getStorage().update<AIQueueItem>(COLLECTION, id, patch);

    eventBus.publish(EVENT_NAMES.AI_QUEUE_ITEM_UPDATED, "ai", "ai-queue", {
      id, status, type: updated.type,
    }).catch(() => {});

    return updated;
  },

  async cancel(id: string): Promise<AIQueueItem> {
    return this.updateStatus(id, "cancelled");
  },

  async retry(id: string): Promise<AIQueueItem> {
    const item = await this.get(id);
    if (!item) throw new Error(`Queue item ${id} not found`);
    return this.updateStatus(id, "pending", {
      retryCount: item.retryCount + 1,
      error: undefined,
      result: undefined,
    });
  },

  async processNext(): Promise<AIQueueItem | null> {
    const pending = (await getStorage().findAll<AIQueueItem>(COLLECTION))
      .filter((item) => item.status === "pending")
      .sort((a, b) => (a.priority || 5) - (b.priority || 5));

    if (pending.length === 0) return null;

    const next = pending[0];
    return this.updateStatus(next.id, "processing");
  },

  async remove(id: string): Promise<void> {
    await getStorage().delete(COLLECTION, id);
  },
};
