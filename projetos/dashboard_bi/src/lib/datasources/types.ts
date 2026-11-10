// Browser-safe shared types for the Data Sources module.
// No server-only imports may ever appear in this file.

import type { Database } from "@/integrations/supabase/types";

export type DsType = Database["public"]["Enums"]["ds_type"];
export type DsEnvironment = Database["public"]["Enums"]["ds_environment"];
export type DsHealth = Database["public"]["Enums"]["ds_health"];
export type DsSyncMode = Database["public"]["Enums"]["ds_sync_mode"];
export type DsSyncFrequency = Database["public"]["Enums"]["ds_sync_frequency"];
export type DsObjectType = Database["public"]["Enums"]["ds_object_type"];
export type DsAccessLevel = Database["public"]["Enums"]["ds_access_level"];

/** Resolved connection parameters handed to a driver. Server-side only value. */
export type ConnectionConfig = {
  type: DsType;
  host: string;
  port: number | null;
  database: string;
  defaultSchema: string | null;
  username: string;
  password: string;
  sslEnabled: boolean;
  sslCaCertificate: string | null;
  timeoutMs: number;
  extra: Record<string, unknown>;
};

export type ProbeResult = {
  ok: true;
  serverVersion: string;
  databaseName: string;
  schemaCount: number;
  tableCount: number;
  latencyMs: number;
};

export type ProbeFailure = {
  ok: false;
  health: DsHealth;
  message: string;
  latencyMs: number;
};

export type TestConnectionResult = ProbeResult | ProbeFailure;

export type DiscoveredColumn = {
  name: string;
  ordinalPosition: number;
  dataType: string;
  isNullable: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  isUnique: boolean;
  referencesSchema: string | null;
  referencesTable: string | null;
  referencesColumn: string | null;
  defaultValue: string | null;
  numericPrecision: number | null;
  numericScale: number | null;
  characterMaxLength: number | null;
  comment: string | null;
};

export type DiscoveredIndex = {
  name: string;
  isUnique: boolean;
  isPrimary: boolean;
  method: string | null;
  columns: string[];
  definition: string | null;
};

export type DiscoveredConstraint = {
  name: string;
  constraintType: string;
  columns: string[];
  referencedSchema: string | null;
  referencedTable: string | null;
  referencedColumns: string[];
  definition: string | null;
};

export type DiscoveredObject = {
  name: string;
  objectType: DsObjectType;
  estimatedRows: number | null;
  sizeBytes: number | null;
  comment: string | null;
  definition: string | null;
  columns: DiscoveredColumn[];
  indexes: DiscoveredIndex[];
  constraints: DiscoveredConstraint[];
};

export type DiscoveredSchema = {
  name: string;
  comment: string | null;
  objects: DiscoveredObject[];
};

export type DiscoveryResult = {
  serverVersion: string;
  databaseName: string;
  schemas: DiscoveredSchema[];
};

export type DriverColumn = { name: string; dataType: string | null };

/** Raw driver-level result of a read-only statement. */
export type DriverQueryResult = {
  columns: DriverColumn[];
  rows: Record<string, unknown>[];
  rowCount: number;
};

export type DriverExplainResult =
  | { supported: true; text: string; rows: Record<string, unknown>[] }
  | { supported: false; message: string };

/**
 * Contract every database adapter implements. Adding a new engine means adding
 * one file that satisfies this interface plus a registry entry — no changes to
 * server functions, routes, or UI.
 *
 * Adapter surface (Phase 1.3): connect/disconnect are handled internally by
 * each adapter (per-request connections, required by the serverless runtime),
 * while the capability methods below are the public contract used by the
 * Query Service.
 */
export type DatabaseDriver = {
  type: DsType;
  probe(config: ConnectionConfig): Promise<ProbeResult>;
  discover(config: ConnectionConfig): Promise<DiscoveryResult>;
  /**
   * Executes a single already-validated read-only statement. `params` are bound
   * by the engine (never interpolated) so filter values can never be injected.
   */
  executeReadQuery(
    config: ConnectionConfig,
    sql: string,
    params?: unknown[],
  ): Promise<DriverQueryResult>;
  /** Returns an execution plan, or an explicit "not supported" answer. */
  explainQuery(config: ConnectionConfig, sql: string): Promise<DriverExplainResult>;
  /** Engine version string. */
  getVersion(config: ConnectionConfig): Promise<string>;
};

/** Thrown by drivers so the UI can render an accurate health status. */
export class DriverError extends Error {
  health: DsHealth;
  constructor(message: string, health: DsHealth = "offline") {
    super(message);
    this.name = "DriverError";
    this.health = health;
  }
}
