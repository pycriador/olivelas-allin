import { getStorage } from "@/core/providers/storage";
import { eventBus, EVENT_NAMES } from "@/modules/events/service";
import { promptManager } from "./prompt-manager";
import { ocrEngine } from "./ocr-engine";
import { visionEngine } from "./vision-engine";
import { aiQueue } from "./ai-queue";
import { aiHistoryService } from "./ai-history";
import { aiAuditService } from "./ai-audit";
import { aiConfigService } from "./ai-config";
import { aiPlayground } from "./ai-playground";
import { conferenceService } from "./conference";
import { mockProvider, getAIProvider, AI_PROVIDER_CONFIGS, allAIModels } from "./providers";
import { PROMPT_LIBRARY } from "./prompt-library";

import type {
  AIProvider, AIProviderType, AIProviderStatus, AIModelType,
  Prompt, PromptCategory, PromptStatus,
  OCRRequest, OCRStatus, OCRSource,
  VisionRequest, VisionType,
  AIQueueItem, AIQueueStatus,
  AIHistoryEntry, AIAuditEntry,
  AIConfig, PlaygroundSession,
  ConferenceSession, ConferenceMapping,
} from "./types";

const PROVIDER_COLLECTION = "ai_providers";

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export const aiService = {
  // Provider management
  async listProviders(): Promise<AIProvider[]> {
    return getStorage().findAll<AIProvider>(PROVIDER_COLLECTION);
  },

  async getProvider(id: string): Promise<AIProvider | null> {
    return getStorage().find<AIProvider>(PROVIDER_COLLECTION, id);
  },

  async createProvider(data: {
    name: string;
    type: AIProviderType;
    models?: AIModelType[];
    defaultModel?: AIModelType;
    status?: AIProviderStatus;
    isDefault?: boolean;
  }): Promise<AIProvider> {
    const config = AI_PROVIDER_CONFIGS[data.type];
    const provider: AIProvider = {
      id: uid(),
      name: data.name,
      type: data.type,
      models: data.models || config.models,
      defaultModel: data.defaultModel || config.defaultModel,
      status: data.status ?? "active",
      temperature: 0.7,
      maxTokens: 4096,
      timeout: 30000,
      retryCount: 3,
      config: {},
      isDefault: data.isDefault ?? false,
      createdAt: new Date().toISOString(),
    };

    const created = await getStorage().create<AIProvider>(PROVIDER_COLLECTION, provider);

    eventBus.publish(EVENT_NAMES.AI_PROVIDER_CREATED, "ai", "ai-providers", {
      id: created.id,
      name: created.name,
      type: created.type,
    }).catch(() => {});

    return created;
  },

  async updateProvider(id: string, patch: Partial<AIProvider>): Promise<AIProvider> {
    const updated = await getStorage().update<AIProvider>(PROVIDER_COLLECTION, id, {
      ...patch,
      updatedAt: new Date().toISOString(),
    });

    eventBus.publish(EVENT_NAMES.AI_PROVIDER_UPDATED, "ai", "ai-providers", {
      id, name: updated.name,
    }).catch(() => {});

    return updated;
  },

  async removeProvider(id: string): Promise<void> {
    await getStorage().delete(PROVIDER_COLLECTION, id);
    eventBus.publish(EVENT_NAMES.AI_PROVIDER_DELETED, "ai", "ai-providers", { id }).catch(() => {});
  },

  async testProvider(id: string): Promise<{ success: boolean; time: number; error?: string }> {
    const provider = await this.getProvider(id);
    if (!provider) throw new Error(`Provider ${id} not found`);

    const start = Date.now();
    try {
      const instance = getAIProvider(provider.type);
      await instance.analyze("Test connection");
      const time = Date.now() - start;

      eventBus.publish(EVENT_NAMES.AI_PROVIDER_TESTED, "ai", "ai-providers", {
        id, success: true, time,
      }).catch(() => {});

      return { success: true, time };
    } catch (error) {
      const time = Date.now() - start;
      const errMsg = error instanceof Error ? error.message : "Connection failed";

      eventBus.publish(EVENT_NAMES.AI_PROVIDER_TESTED, "ai", "ai-providers", {
        id, success: false, error: errMsg, time,
      }).catch(() => {});

      return { success: false, time, error: errMsg };
    }
  },

  // Re-exports for convenience
  prompts: promptManager,
  ocr: ocrEngine,
  vision: visionEngine,
  queue: aiQueue,
  history: aiHistoryService,
  audit: aiAuditService,
  config: aiConfigService,
  playground: aiPlayground,
  conference: conferenceService,
  providersList: AI_PROVIDER_CONFIGS,
  allModels: allAIModels,
};

export type {
  AIProvider, AIProviderType, AIModelType,
  Prompt, PromptCategory, PromptStatus,
  OCRRequest, OCRStatus, OCRSource,
  VisionRequest, VisionType,
  AIQueueItem, AIQueueStatus,
  AIHistoryEntry, AIAuditEntry,
  AIConfig, PlaygroundSession,
  ConferenceSession, ConferenceMapping,
};
