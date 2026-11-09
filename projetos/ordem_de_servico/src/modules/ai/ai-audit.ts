import { getStorage } from "@/core/providers/storage";
import type { AIAuditEntry, AIProviderType, AIModelType } from "./types";

const COLLECTION = "ai_audit";

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export const aiAuditService = {
  async list(limit = 200): Promise<AIAuditEntry[]> {
    const all = await getStorage().findAll<AIAuditEntry>(COLLECTION);
    return all
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
      .slice(0, limit);
  },

  async get(id: string): Promise<AIAuditEntry | null> {
    return getStorage().find<AIAuditEntry>(COLLECTION, id);
  },

  async create(data: {
    type: AIAuditEntry["type"];
    provider: AIProviderType;
    model: AIModelType;
    promptId?: string;
    promptName?: string;
    processingTime: number;
    userId?: string;
    companyId?: string;
    result: string;
    confidence: number;
    status: "success" | "error" | "warning";
    metadata?: Record<string, string>;
  }): Promise<AIAuditEntry> {
    const entry: AIAuditEntry = {
      id: uid(),
      ...data,
      createdAt: new Date().toISOString(),
    };
    return getStorage().create<AIAuditEntry>(COLLECTION, entry);
  },

  async remove(id: string): Promise<void> {
    await getStorage().delete(COLLECTION, id);
  },
};
