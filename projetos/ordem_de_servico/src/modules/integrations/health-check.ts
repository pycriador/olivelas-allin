import { getStorage } from "@/core/providers/storage";
import { getConnector } from "./connector-sdk";
import type { HealthCheckResult, ConnectorInstance, Connection } from "./types";

const COLLECTION = "int_health_checks";

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export const healthCheckService = {
  async list(): Promise<HealthCheckResult[]> {
    const all = await getStorage().findAll<HealthCheckResult>(COLLECTION);
    return all.sort((a, b) => (b.checkedAt || "").localeCompare(a.checkedAt || ""));
  },

  async runForConnector(connectorId: string): Promise<HealthCheckResult> {
    const connector = await getStorage().find<ConnectorInstance>("int_connector_instances", connectorId);
    if (!connector) throw new Error(`Connector ${connectorId} not found`);

    const instance = getConnector("mock");
    const health = await instance.health();

    const result: HealthCheckResult = {
      id: uid(), connectorId,
      status: health.status,
      auth: health.details.auth || false,
      connectivity: health.details.connectivity || false,
      latency: health.latency,
      availability: health.status === "healthy" ? 100 : 50,
      permissions: health.details.permissions || false,
      version: connector.version,
      rateLimit: true,
      checkedAt: new Date().toISOString(),
    };

    return getStorage().create<HealthCheckResult>(COLLECTION, result);
  },

  async runForConnection(connectionId: string): Promise<HealthCheckResult> {
    const conn = await getStorage().find<Connection>("int_connections", connectionId);
    if (!conn) throw new Error(`Connection ${connectionId} not found`);

    const instance = getConnector("mock");
    const test = await instance.testConnection(conn);

    const result: HealthCheckResult = {
      id: uid(), connectionId,
      status: test.success ? "healthy" : "unhealthy",
      auth: test.success,
      connectivity: test.success,
      latency: test.latency,
      availability: test.success ? 100 : 0,
      permissions: test.success,
      version: "1.0.0",
      rateLimit: true,
      error: test.error,
      checkedAt: new Date().toISOString(),
    };

    return getStorage().create<HealthCheckResult>(COLLECTION, result);
  },
};
