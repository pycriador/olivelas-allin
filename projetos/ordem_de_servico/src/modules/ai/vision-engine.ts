import { getStorage } from "@/core/providers/storage";
import { eventBus, EVENT_NAMES } from "@/modules/events/service";
import { mockProvider } from "./providers";
import type { VisionRequest, VisionResult, VisionType } from "./types";

const COLLECTION = "ai_vision_requests";

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export const visionEngine = {
  async list(): Promise<VisionRequest[]> {
    return getStorage().findAll<VisionRequest>(COLLECTION);
  },

  async get(id: string): Promise<VisionRequest | null> {
    return getStorage().find<VisionRequest>(COLLECTION, id);
  },

  async process(data: {
    type: VisionType;
    sourceId: string;
    imageData?: string;
  }): Promise<VisionRequest> {
    const request: VisionRequest = {
      id: uid(),
      type: data.type,
      sourceId: data.sourceId,
      imageData: data.imageData,
      status: "processing",
      createdAt: new Date().toISOString(),
    };

    const created = await getStorage().create<VisionRequest>(COLLECTION, request);

    eventBus.publish(EVENT_NAMES.VISION_PROCESSING_STARTED, "ai", "ai-vision", {
      id: created.id,
      type: data.type,
      sourceId: data.sourceId,
    }).catch(() => {});

    try {
      const result = await mockProvider.vision(data.imageData || "", `Analyze for ${data.type}`);

      const visionResult: VisionResult = {
        id: uid(),
        type: data.type,
        sourceId: data.sourceId,
        detections: result.detections,
        confidence: result.confidence,
        processingTime: 600,
        status: "completed",
        createdAt: new Date().toISOString(),
      };

      const updated = await getStorage().update<VisionRequest>(COLLECTION, created.id, {
        status: "completed",
        result: visionResult,
        updatedAt: new Date().toISOString(),
      });

      eventBus.publish(EVENT_NAMES.VISION_PROCESSING_COMPLETED, "ai", "ai-vision", {
        id: updated.id,
        detections: result.detections.length,
        confidence: result.confidence,
      }).catch(() => {});

      return updated;
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : "Vision processing failed";
      await getStorage().update<VisionRequest>(COLLECTION, created.id, {
        status: "error",
        updatedAt: new Date().toISOString(),
      });

      eventBus.publish(EVENT_NAMES.VISION_PROCESSING_FAILED, "ai", "ai-vision", {
        id: created.id,
        error: errMsg,
      }).catch(() => {});

      throw error;
    }
  },

  async remove(id: string): Promise<void> {
    await getStorage().delete(COLLECTION, id);
  },
};
