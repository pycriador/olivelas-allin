import { getStorage } from "@/core/providers/storage";

const COLLECTION = "int_retry_queue";

interface RetryItem {
  id: string;
  operation: string;
  payload: string;
  attempts: number;
  maxRetries: number;
  lastError?: string;
  nextRetryAt?: string;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  createdAt?: string;
}

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function calculateBackoff(attempt: number): number {
  return Math.min(100 * Math.pow(2, attempt), 30000);
}

export const retryEngine = {
  async enqueue(operation: string, payload: string, maxRetries = 3): Promise<RetryItem> {
    const item: RetryItem = {
      id: uid(), operation, payload, attempts: 0, maxRetries,
      status: "pending", nextRetryAt: new Date().toISOString(), createdAt: new Date().toISOString(),
    };
    return getStorage().create<RetryItem>(COLLECTION, item);
  },

  async list(): Promise<RetryItem[]> {
    return getStorage().findAll<RetryItem>(COLLECTION);
  },

  async get(id: string): Promise<RetryItem | null> {
    return getStorage().find<RetryItem>(COLLECTION, id);
  },

  async recordFailure(id: string, error: string): Promise<RetryItem> {
    const item = await this.get(id);
    if (!item) throw new Error(`Retry item ${id} not found`);
    const attempts = item.attempts + 1;
    const backoffMs = calculateBackoff(attempts);
    if (attempts >= item.maxRetries) {
      return getStorage().update<RetryItem>(COLLECTION, id, {
        status: "failed", attempts, lastError: error, nextRetryAt: undefined,
      });
    }
    return getStorage().update<RetryItem>(COLLECTION, id, {
      status: "pending", attempts, lastError: error,
      nextRetryAt: new Date(Date.now() + backoffMs).toISOString(),
    });
  },

  async recordSuccess(id: string): Promise<RetryItem> {
    return getStorage().update<RetryItem>(COLLECTION, id, { status: "completed" });
  },

  async cancel(id: string): Promise<RetryItem> {
    return getStorage().update<RetryItem>(COLLECTION, id, { status: "cancelled" });
  },
};
