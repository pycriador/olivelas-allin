import { connectorManager } from "./connector-manager";
import { connectionManager } from "./connection-manager";
import { webhookManager } from "./webhook-manager";
import { apiGateway } from "./api-gateway";
import { authManager } from "./auth-manager";
import { secretManager } from "./secret-manager";
import { syncEngine } from "./sync-engine";
import { retryEngine } from "./retry-engine";
import { monitoring } from "./monitoring";
import { integrationLogs } from "./logs";
import { healthCheckService } from "./health-check";
import { getConnector, registerConnector, mockConnector } from "./connector-sdk";
import { REGISTRY_CONNECTORS, seedRegistry } from "./connector-registry";

export const integrationService = {
  connectors: connectorManager,
  connections: connectionManager,
  webhooks: webhookManager,
  api: apiGateway,
  auth: authManager,
  secrets: secretManager,
  sync: syncEngine,
  retry: retryEngine,
  monitoring,
  logs: integrationLogs,
  health: healthCheckService,
  sdk: { getConnector, registerConnector, mockConnector },
  registry: { list: REGISTRY_CONNECTORS, seedRegistry },
};
