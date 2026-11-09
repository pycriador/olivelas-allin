import type { Entity, Query, StorageProvider } from "./types";
import { getSupabase } from "@/lib/supabase";
import { LocalStorageProvider } from "./LocalStorageProvider";

const TABLE_MAP: Record<string, string> = {
  financial_accounts: "fin_accounts",
  financial_transactions: "fin_transactions",
  financial_invoices: "fin_invoices",
  financial_payables: "fin_payables",
  financial_receivables: "fin_receivables",
  financial_cost_centers: "fin_cost_centers",
  inventory_products: "inv_products",
  inventory_warehouses: "inv_warehouses",
  inventory_movements: "inv_movements",
  inventory_bins: "inv_bins",
  purchase_orders: "pur_purchase_orders",
  pur_orders: "pur_purchase_orders",
  pur_receivings: "pur_receivings",
  employees: "hr_employees",
  hr_employees: "hr_employees",
};

function resolveTable(collection: string): string {
  return TABLE_MAP[collection] ?? collection;
}

function toSnakeKey(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function toCamelKey(str: string): string {
  return str.replace(/_([a-z0-9])/g, (_, letter) => letter.toUpperCase());
}

function toSnake(obj: any): any {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return obj;
  const res: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    res[toSnakeKey(k)] = v;
  }
  return res;
}

function toCamel(obj: any): any {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return obj;
  const res: Record<string, any> = { ...obj };
  for (const [k, v] of Object.entries(obj)) {
    const c = toCamelKey(k);
    if (c !== k) {
      res[c] = v;
    }
  }
  return res;
}

function buildFilter<T>(query?: Query<T>) {
  if (!query) return null;
  if (typeof query === "function") return null;
  return query as Record<string, unknown>;
}

function applyFunctionFilter<T>(items: T[], query?: Query<T>): T[] {
  if (!query || typeof query !== "function") return items;
  return items.filter((i) => (query as (i: T) => boolean)(i));
}

export class SupabaseProvider implements StorageProvider {
  readonly name = "Supabase";
  private localFallback = new LocalStorageProvider();

  private async getClient() {
    return getSupabase();
  }

  async create<T extends Entity>(
    collection: string,
    data: Partial<Omit<T, "id">> & { id?: string }
  ): Promise<T> {
    const table = resolveTable(collection);
    try {
      const client = await this.getClient();
      const generatedId = data.id || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`);
      const payload: Record<string, any> = toSnake({
        ...data,
        id: generatedId,
        companyId: (data as any).companyId || "00000000-0000-0000-0000-000000000001",
      });

      let record: any = null;
      let lastError: any = null;

      for (let attempt = 0; attempt < 8; attempt++) {
        const { data: inserted, error } = await client
          .from(table)
          .insert(payload as any)
          .select()
          .single();

        if (!error && inserted) {
          record = inserted;
          lastError = null;
          break;
        }

        lastError = error;
        // Check for missing column error: "Could not find the 'column_name' column of 'table' in the schema cache"
        const colMatch = error?.message?.match(/Could not find the '([^']+)' column/i);
        if (colMatch && colMatch[1] && colMatch[1] in payload) {
          console.warn(`[SupabaseProvider] Stripping unmapped column '${colMatch[1]}' on insert into ${table}`);
          delete payload[colMatch[1]];
          continue;
        }

        break;
      }

      if (lastError || !record) {
        console.warn(`[SupabaseProvider] insert error on ${table}, falling back to local:`, lastError?.message);
        return this.localFallback.create<T>(collection, data);
      }
      const camel = toCamel(record) as T;
      // Mirror in local fallback
      await this.localFallback.create<T>(collection, { ...data, ...camel }).catch(() => {});
      return { ...data, ...camel } as T;
    } catch (err: any) {
      console.warn(`[SupabaseProvider] create exception on ${table}, using local fallback:`, err?.message);
      return this.localFallback.create<T>(collection, data);
    }
  }

  async update<T extends Entity>(
    collection: string,
    id: string,
    data: Partial<T>
  ): Promise<T> {
    const table = resolveTable(collection);
    try {
      const client = await this.getClient();
      const payload: Record<string, any> = toSnake(data);

      let record: any = null;
      let lastError: any = null;

      for (let attempt = 0; attempt < 8; attempt++) {
        const { data: updated, error } = await client
          .from(table)
          .update(payload as any)
          .eq("id", id)
          .select()
          .single();

        if (!error && updated) {
          record = updated;
          lastError = null;
          break;
        }

        lastError = error;
        const colMatch = error?.message?.match(/Could not find the '([^']+)' column/i);
        if (colMatch && colMatch[1] && colMatch[1] in payload) {
          console.warn(`[SupabaseProvider] Stripping unmapped column '${colMatch[1]}' on update into ${table}`);
          delete payload[colMatch[1]];
          continue;
        }

        break;
      }

      if (lastError || !record) {
        console.warn(`[SupabaseProvider] update error on ${table}, falling back to local:`, lastError?.message);
        return this.localFallback.update<T>(collection, id, data);
      }
      const camel = toCamel(record) as T;
      await this.localFallback.update<T>(collection, id, { ...data, ...camel }).catch(() => {});
      return { ...data, ...camel } as T;
    } catch (err: any) {
      console.warn(`[SupabaseProvider] update exception on ${table}, using local fallback:`, err?.message);
      return this.localFallback.update<T>(collection, id, data);
    }
  }

  async delete(collection: string, id: string): Promise<void> {
    const table = resolveTable(collection);
    try {
      const client = await this.getClient();
      const { error } = await client.from(table).delete().eq("id", id);
      if (error) {
        console.warn(`[SupabaseProvider] delete error on ${table}:`, error.message);
      }
    } catch (err: any) {
      console.warn(`[SupabaseProvider] delete exception on ${table}:`, err?.message);
    }
    await this.localFallback.delete(collection, id).catch(() => {});
  }

  async find<T extends Entity>(
    collection: string,
    id: string
  ): Promise<T | null> {
    const table = resolveTable(collection);
    try {
      const client = await this.getClient();
      const { data, error } = await client
        .from(table)
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        if (error.code === "PGRST116") return null;
        return this.localFallback.find<T>(collection, id);
      }
      return toCamel(data) as T;
    } catch {
      return this.localFallback.find<T>(collection, id);
    }
  }

  async findAll<T extends Entity>(
    collection: string,
    query?: Query<T>
  ): Promise<T[]> {
    const table = resolveTable(collection);
    try {
      const client = await this.getClient();
      const filter = buildFilter(query);
      let req = client.from(table).select("*");

      if (filter) {
        for (const [key, value] of Object.entries(filter)) {
          const snakeK = toSnakeKey(key);
          if (value === null) {
            req = req.is(snakeK, null);
          } else if (typeof value === "boolean") {
            req = req.eq(snakeK, value);
          } else {
            req = req.eq(snakeK, value as string | number);
          }
        }
      }

      const { data, error } = await req;
      if (error) {
        // Table missing or RLS blocked -> return local fallback
        return this.localFallback.findAll<T>(collection, query);
      }

      let results = (data ?? []).map((row) => toCamel(row)) as T[];
      results = applyFunctionFilter(results, query);
      return results;
    } catch {
      return this.localFallback.findAll<T>(collection, query);
    }
  }

  async count(collection: string, query?: Query<unknown>): Promise<number> {
    const table = resolveTable(collection);
    if (typeof query === "function") {
      const items = await this.findAll(collection, query as (item: unknown) => boolean);
      return items.length;
    }
    try {
      const client = await this.getClient();
      let req = client.from(table).select("*", { count: "exact", head: true });
      const filter = buildFilter(query);
      if (filter) {
        for (const [key, value] of Object.entries(filter)) {
          const snakeK = toSnakeKey(key);
          if (value === null) {
            req = req.is(snakeK, null);
          } else {
            req = req.eq(snakeK, value as string | number | boolean);
          }
        }
      }
      const { count, error } = await req;
      if (error) return this.localFallback.count(collection, query);
      return count ?? 0;
    } catch {
      return this.localFallback.count(collection, query);
    }
  }

  async clear(collection?: string): Promise<void> {
    const table = collection ? resolveTable(collection) : undefined;
    try {
      const client = await this.getClient();
      if (table) {
        await client.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");
      }
    } catch {
      // Ignore
    }
    await this.localFallback.clear(collection);
  }

  async transaction<R>(fn: (tx: StorageProvider) => Promise<R>): Promise<R> {
    return fn(this);
  }
}
