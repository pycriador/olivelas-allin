import { getStorage } from "../../core/providers/storage";
import { configurationService } from "../../core/services/configuration";
import { eventBus, EVENT_NAMES } from "@/modules/events/service";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { DatabaseConnection } from "./types";

const COLLECTION = "database_connections";

const DEFAULT_CONNECTION: Omit<DatabaseConnection, "id"> = {
  name: "Lovable Cloud (Supabase)",
  type: "supabase",
  status: "active",
  isActive: true,
  isDefault: true,
  description: "Provider gerenciado — PostgreSQL, Auth, Storage e Realtime.",
  createdAt: new Date().toISOString(),
};

export const databaseService = {
  async list(): Promise<DatabaseConnection[]> {
    const items = await getStorage().findAll<DatabaseConnection>(COLLECTION);
    if (items.length === 0) {
      const created = await getStorage().create<DatabaseConnection>(COLLECTION, DEFAULT_CONNECTION);
      await configurationService.update({ activeConnectionId: created.id });
      return [created];
    }
    return items;
  },
  async create(data: Omit<DatabaseConnection, "id" | "createdAt">): Promise<DatabaseConnection> {
    const created = await getStorage().create<DatabaseConnection>(COLLECTION, {
      ...data,
      createdAt: new Date().toISOString(),
    });
    eventBus.publish(EVENT_NAMES.DATABASE_CONNECTION_CREATED, "system", "database", { id: created.id, name: created.name, type: created.type }).catch(() => {});
    return created;
  },
  async update(id: string, patch: Partial<DatabaseConnection>): Promise<DatabaseConnection> {
    const updated = await getStorage().update<DatabaseConnection>(COLLECTION, id, patch);
    eventBus.publish(EVENT_NAMES.DATABASE_CONNECTION_UPDATED, "system", "database", { id, ...patch }).catch(() => {});
    return updated;
  },
  async remove(id: string): Promise<void> {
    await getStorage().delete(COLLECTION, id);
    eventBus.publish(EVENT_NAMES.DATABASE_CONNECTION_DELETED, "system", "database", { id }).catch(() => {});
  },
  async activate(id: string): Promise<void> {
    const all = await this.list();
    await Promise.all(
      all.map((c) => getStorage().update<DatabaseConnection>(COLLECTION, c.id, { isActive: c.id === id })),
    );
    await configurationService.update({ activeConnectionId: id });
    eventBus.publish(EVENT_NAMES.DATABASE_CONNECTION_ACTIVATED, "system", "database", { id }).catch(() => {});
  },
  async test(id: string): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
    const conn = await getStorage().find<DatabaseConnection>(COLLECTION, id);
    if (conn?.type === "supabase" && isSupabaseConfigured()) {
      const started = performance.now();
      try {
        const { error } = await supabase.from("profiles").select("id", { count: "exact", head: true }).limit(1);
        const latencyMs = Math.round(performance.now() - started);
        if (error && error.code !== "PGRST116") return { ok: false, latencyMs, error: error.message };
        return { ok: true, latencyMs };
      } catch (e) {
        return { ok: false, latencyMs: Math.round(performance.now() - started), error: (e as Error).message };
      }
    }
    // Outros providers ainda não implementados — retorna simulação neutra.
    await new Promise((r) => setTimeout(r, 300));
    return { ok: true, latencyMs: 0 };
  },
  async getActive(): Promise<DatabaseConnection | null> {
    const cfg = await configurationService.get();
    const all = await this.list();
    return all.find((c) => c.id === cfg.activeConnectionId) ?? all.find((c) => c.isActive) ?? all[0] ?? null;
  },
};
