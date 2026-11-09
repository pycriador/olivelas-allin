import { getStorage } from "@/core/providers/storage";
import type { MonitoringStats, ConnectorInstance, IntegrationLog, SyncJob } from "./types";

export const monitoring = {
  async getStats(): Promise<MonitoringStats> {
    const connectors = await getStorage().findAll<ConnectorInstance>("int_connector_instances");
    const logs = await getStorage().findAll<IntegrationLog>("int_logs");
    const syncs = await getStorage().findAll<SyncJob>("int_sync_jobs");

    const recentLogs = logs.filter((l) => l.createdAt && new Date(l.createdAt) > new Date(Date.now() - 86400000));
    const successLogs = recentLogs.filter((l) => l.status === "success");

    return {
      activeConnectors: connectors.filter((c) => c.status === "active").length,
      errorConnectors: connectors.filter((c) => c.status === "error").length,
      totalSyncs: syncs.length,
      completedSyncs: syncs.filter((s) => s.status === "completed").length,
      failedSyncs: syncs.filter((s) => s.status === "error").length,
      avgProcessingTime: successLogs.length > 0
        ? successLogs.reduce((s, l) => s + l.processingTime, 0) / successLogs.length
        : 0,
      totalVolume: recentLogs.length,
      totalRetries: recentLogs.reduce((s, l) => s + l.retryCount, 0),
      avgLatency: successLogs.length > 0
        ? successLogs.reduce((s, l) => s + l.processingTime, 0) / successLogs.length
        : 0,
      availability: recentLogs.length > 0 ? (successLogs.length / recentLogs.length) * 100 : 100,
      lastUpdated: new Date().toISOString(),
    };
  },
};
