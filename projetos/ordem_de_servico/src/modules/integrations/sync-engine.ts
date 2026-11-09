import { getStorage } from "@/core/providers/storage";
import { eventBus, EVENT_NAMES } from "@/modules/events/service";
import { getConnector } from "./connector-sdk";
import type { SyncJob, SyncType, SyncStatus, ConflictResolution, SyncMapping } from "./types";

const COLLECTION = "int_sync_jobs";

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export const syncEngine = {
  async list(): Promise<SyncJob[]> {
    return getStorage().findAll<SyncJob>(COLLECTION);
  },

  async get(id: string): Promise<SyncJob | null> {
    return getStorage().find<SyncJob>(COLLECTION, id);
  },

  async create(data: Omit<SyncJob, "id" | "status" | "progress" | "totalRecords" | "processedRecords" | "errorRecords" | "createdAt" | "updatedAt">): Promise<SyncJob> {
    const job: SyncJob = { id: uid(), ...data, status: "idle", progress: 0, totalRecords: 0, processedRecords: 0, errorRecords: 0, createdAt: new Date().toISOString() };
    return getStorage().create<SyncJob>(COLLECTION, job);
  },

  async update(id: string, patch: Partial<SyncJob>): Promise<SyncJob> {
    return getStorage().update<SyncJob>(COLLECTION, id, { ...patch, updatedAt: new Date().toISOString() });
  },

  async remove(id: string): Promise<void> {
    await getStorage().delete(COLLECTION, id);
  },

  async execute(id: string): Promise<SyncJob> {
    const job = await this.get(id);
    if (!job) throw new Error(`Sync job ${id} not found`);

    const running = await this.update(id, { status: "running", lastRunAt: new Date().toISOString() });
    eventBus.publish(EVENT_NAMES.SYNC_STARTED, "integration", "sync-engine", { id, name: job.name, type: job.type }).catch(() => {});

    try {
      const connector = getConnector("mock");
      const mockData = Array.from({ length: 10 }, (_, i) => ({ id: i, name: `Record ${i}`, value: Math.random() }));
      const result = await connector.sync(job.mapping || [], mockData);

      const completed = await this.update(id, {
        status: result.conflicts > 0 ? "conflict" : "completed",
        progress: 100,
        totalRecords: mockData.length,
        processedRecords: mockData.length - result.errors,
        errorRecords: result.errors,
        lastRunAt: new Date().toISOString(),
      });

      eventBus.publish(EVENT_NAMES.SYNC_COMPLETED, "integration", "sync-engine", {
        id, processed: result.processed, errors: result.errors, conflicts: result.conflicts,
      }).catch(() => {});

      return completed;
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : "Sync failed";
      const failed = await this.update(id, { status: "error", lastRunAt: new Date().toISOString() });
      eventBus.publish(EVENT_NAMES.SYNC_FAILED, "integration", "sync-engine", { id, error: errMsg }).catch(() => {});
      return failed;
    }
  },

  async cancel(id: string): Promise<SyncJob> {
    return this.update(id, { status: "cancelled" });
  },
};
