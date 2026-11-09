import { getStorage } from "@/core/providers/storage";
import { eventBus, EVENT_NAMES } from "@/modules/events/service";
import type { AIHistoryEntry, AIProviderType, AIModelType } from "./types";

const COLLECTION = "ai_history";

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export const aiHistoryService = {
  async list(limit = 100): Promise<AIHistoryEntry[]> {
    const all = await getStorage().findAll<AIHistoryEntry>(COLLECTION);
    return all
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
      .slice(0, limit);
  },

  async get(id: string): Promise<AIHistoryEntry | null> {
    return getStorage().find<AIHistoryEntry>(COLLECTION, id);
  },

  async create(data: {
    type: AIHistoryEntry["type"];
    provider: AIProviderType;
    model: AIModelType;
    promptId?: string;
    prompt: string;
    response: string;
    processingTime: number;
    tokensUsed: number;
    confidence: number;
    userId?: string;
    companyId?: string;
    status: "success" | "error";
    error?: string;
  }): Promise<AIHistoryEntry> {
    const entry: AIHistoryEntry = {
      id: uid(),
      ...data,
      createdAt: new Date().toISOString(),
    };

    const created = await getStorage().create<AIHistoryEntry>(COLLECTION, entry);

    eventBus.publish(EVENT_NAMES.AI_HISTORY_CREATED, "ai", "ai-history", {
      id: created.id,
      type: created.type,
      provider: created.provider,
      status: created.status,
    }).catch(() => {});

    return created;
  },

  async remove(id: string): Promise<void> {
    await getStorage().delete(COLLECTION, id);
  },

  async clear(): Promise<void> {
    const all = await this.list(10000);
    for (const item of all) {
      await this.remove(item.id);
    }
  },
};
