import { getStorage } from "@/core/providers/storage";
import { eventBus, EVENT_NAMES } from "@/modules/events/service";
import { mockProvider } from "./providers";
import type { OCRRequest, OCRResult, OCRField, OCRSource } from "./types";

const COLLECTION = "ai_ocr_requests";

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export const ocrEngine = {
  async list(): Promise<OCRRequest[]> {
    return getStorage().findAll<OCRRequest>(COLLECTION);
  },

  async get(id: string): Promise<OCRRequest | null> {
    return getStorage().find<OCRRequest>(COLLECTION, id);
  },

  async process(data: {
    sourceId: string;
    sourceType: OCRSource;
    sourceName: string;
    imageData?: string;
    documentId?: string;
  }): Promise<OCRRequest> {
    const request: OCRRequest = {
      id: uid(),
      sourceId: data.sourceId,
      sourceType: data.sourceType,
      sourceName: data.sourceName,
      imageData: data.imageData,
      documentId: data.documentId,
      status: "processing",
      createdAt: new Date().toISOString(),
    };

    const created = await getStorage().create<OCRRequest>(COLLECTION, request);

    eventBus.publish(EVENT_NAMES.OCR_PROCESSING_STARTED, "ai", "ai-ocr", {
      id: created.id,
      sourceId: data.sourceId,
      sourceType: data.sourceType,
    }).catch(() => {});

    try {
      const result = await mockProvider.ocr(data.imageData || "", {
        language: "pt-BR",
        autoRotate: true,
      });

      const updated = await getStorage().update<OCRRequest>(COLLECTION, created.id, {
        status: "completed",
        result,
        updatedAt: new Date().toISOString(),
      });

      eventBus.publish(EVENT_NAMES.OCR_PROCESSING_COMPLETED, "ai", "ai-ocr", {
        id: updated.id,
        fields: result.fields.length,
        confidence: result.confidence,
      }).catch(() => {});

      return updated;
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : "OCR processing failed";
      await getStorage().update<OCRRequest>(COLLECTION, created.id, {
        status: "error",
        updatedAt: new Date().toISOString(),
      });

      eventBus.publish(EVENT_NAMES.OCR_PROCESSING_FAILED, "ai", "ai-ocr", {
        id: created.id,
        error: errMsg,
      }).catch(() => {});

      throw error;
    }
  },

  async simulate(sourceId: string, sourceType: OCRSource): Promise<OCRRequest> {
    return this.process({ sourceId, sourceType, sourceName: `Simulated ${sourceType} - ${sourceId}` });
  },

  async remove(id: string): Promise<void> {
    await getStorage().delete(COLLECTION, id);
    eventBus.publish(EVENT_NAMES.OCR_PROCESSING_COMPLETED, "ai", "ai-ocr", { id }).catch(() => {});
  },
};
