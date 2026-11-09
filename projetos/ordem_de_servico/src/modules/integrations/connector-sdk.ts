import type { Connection, AuthConfig, SyncMapping } from "./types";

export interface IConnector {
  connect(connection: Connection): Promise<boolean>;
  disconnect(): Promise<void>;
  authenticate(auth: AuthConfig): Promise<{ success: boolean; token?: string; expiresAt?: string }>;
  refreshToken(auth: AuthConfig): Promise<{ success: boolean; token?: string; expiresAt?: string }>;
  testConnection(connection: Connection): Promise<{ success: boolean; latency: number; error?: string }>;
  health(): Promise<{ status: "healthy" | "degraded" | "unhealthy"; latency: number; details: Record<string, boolean> }>;
  send(endpoint: string, data: unknown, options?: Record<string, unknown>): Promise<{ success: boolean; data?: unknown; statusCode?: number }>;
  receive(endpoint: string, options?: Record<string, unknown>): Promise<{ success: boolean; data?: unknown; statusCode?: number }>;
  sync(mappings: SyncMapping[], data: Record<string, unknown>[]): Promise<{ processed: number; errors: number; conflicts: number }>;
  validate(config: Record<string, unknown>): Promise<{ valid: boolean; errors: string[] }>;
  map(data: Record<string, unknown>, mappings: SyncMapping[]): Promise<Record<string, unknown>>;
  transform(data: Record<string, unknown>, transform: string): Promise<Record<string, unknown>>;
  retry(operation: () => Promise<unknown>, maxRetries: number): Promise<{ success: boolean; result?: unknown; attempts: number }>;
  dispose(): void;
}

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const mockConnector: IConnector = {
  async connect() {
    await delay(200 + Math.random() * 300);
    return true;
  },
  async disconnect() {},
  async authenticate() {
    await delay(150 + Math.random() * 200);
    return { success: true, token: `mock-token-${Date.now()}`, expiresAt: new Date(Date.now() + 3600000).toISOString() };
  },
  async refreshToken() {
    await delay(100);
    return { success: true, token: `refreshed-token-${Date.now()}`, expiresAt: new Date(Date.now() + 3600000).toISOString() };
  },
  async testConnection() {
    await delay(300 + Math.random() * 400);
    return { success: true, latency: Math.floor(50 + Math.random() * 200) };
  },
  async health() {
    await delay(100);
    return { status: "healthy", latency: 30, details: { auth: true, connectivity: true, permissions: true } };
  },
  async send(endpoint, data) {
    await delay(200 + Math.random() * 500);
    return { success: true, data: { received: true, echo: data }, statusCode: 200 };
  },
  async receive() {
    await delay(150 + Math.random() * 400);
    return { success: true, data: { mock: true, timestamp: Date.now() }, statusCode: 200 };
  },
  async sync(mappings, data) {
    await delay(500 + Math.random() * 1500);
    return { processed: data.length, errors: 0, conflicts: 0 };
  },
  async validate() {
    await delay(100);
    return { valid: true, errors: [] };
  },
  async map(data, mappings) {
    await delay(100);
    const result: Record<string, unknown> = {};
    for (const m of mappings) {
      result[m.destinationField] = data[m.sourceField];
    }
    return result;
  },
  async transform(data) {
    await delay(100);
    return { ...data, transformed: true, transformedAt: new Date().toISOString() };
  },
  async retry(operation, maxRetries) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const result = await operation();
        return { success: true, result, attempts: i + 1 };
      } catch (e) {
        if (i === maxRetries - 1) throw e;
        await delay(100 * Math.pow(2, i));
      }
    }
    return { success: false, attempts: maxRetries };
  },
  dispose() {},
};

const connectorInstances = new Map<string, IConnector>();
connectorInstances.set("mock", mockConnector);

export function getConnector(type: string): IConnector {
  return connectorInstances.get(type) || mockConnector;
}

export function registerConnector(type: string, instance: IConnector): void {
  connectorInstances.set(type, instance);
}


