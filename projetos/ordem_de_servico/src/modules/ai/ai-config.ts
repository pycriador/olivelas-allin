import { getStorage } from "@/core/providers/storage";
import { eventBus, EVENT_NAMES } from "@/modules/events/service";
import type { AIConfig, AIProviderType, AIModelType, VisionType } from "./types";

const COLLECTION = "ai_config";
const DEFAULT_CONFIG_ID = "default";

const DEFAULT_CONFIG: AIConfig = {
  id: DEFAULT_CONFIG_ID,
  defaultProvider: "mock",
  defaultModel: "mock-model",
  defaultTemperature: 0.7,
  ocr: {
    enabled: true,
    defaultProvider: "mock",
    defaultModel: "mock-model",
    language: "pt-BR",
    autoRotate: true,
    perspectiveCorrection: true,
    minConfidence: 0.6,
    supportedFormats: ["png", "jpg", "jpeg", "pdf", "bmp", "tiff"],
  },
  vision: {
    enabled: true,
    defaultProvider: "mock",
    defaultModel: "mock-model",
    minConfidence: 0.6,
    supportedTypes: [
      "document-recognition", "device-recognition", "label-reading",
      "serial-number", "brand-identification", "qr-code", "barcode",
      "image-quality", "auto-rotate", "perspective-correction", "multi-document",
    ],
  },
  maxFileSize: 10 * 1024 * 1024,
  maxPages: 20,
  timeout: 30000,
  retryCount: 3,
};

export const aiConfigService = {
  async get(): Promise<AIConfig> {
    const existing = await getStorage().find<AIConfig>(COLLECTION, DEFAULT_CONFIG_ID);
    if (existing) return existing;

    await getStorage().create<AIConfig>(COLLECTION, DEFAULT_CONFIG);
    return DEFAULT_CONFIG;
  },

  async update(patch: Partial<AIConfig>): Promise<AIConfig> {
    const current = await this.get();
    const updated = await getStorage().update<AIConfig>(COLLECTION, DEFAULT_CONFIG_ID, {
      ...patch,
      updatedAt: new Date().toISOString(),
    });

    eventBus.publish(EVENT_NAMES.AI_CONFIG_UPDATED, "ai", "ai-config", {
      fields: Object.keys(patch),
    }).catch(() => {});

    return updated;
  },

  async reset(): Promise<AIConfig> {
    return this.update(DEFAULT_CONFIG);
  },
};
