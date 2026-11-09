// Supabase table adapter. Maps camelCase domain objects <-> snake_case rows.
// Only repositories should import this module.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from "@/integrations/supabase/client";

const snake = (s: string) => s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
const camel = (s: string) => s.replace(/_([a-z0-9])/g, (_m, c: string) => c.toUpperCase());

/** Row -> domain object (top-level keys only; jsonb payloads stay untouched). */
export function fromRow<T>(row: Record<string, unknown> | null): T | undefined {
  if (!row) return undefined;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    if (v === null) continue;
    out[camel(k)] = v;
  }
  return out as T;
}

/** Domain object -> row. */
export function toRow(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    out[snake(k)] = v;
  }
  return out;
}

export class CloudError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = "CloudError";
  }
}

function unwrap<T>(res: { data: T | null; error: { message: string; code?: string } | null }): T {
  if (res.error) throw new CloudError(res.error.message, res.error.code);
  return res.data as T;
}

const client = () => supabase as any;

export interface CloudTable<T extends { id: string }> {
  all: () => Promise<T[]>;
  byId: (id: string) => Promise<T | undefined>;
  put: (row: T) => Promise<void>;
  bulkPut: (rows: T[]) => Promise<void>;
  remove: (id: string) => Promise<void>;
  bulkRemove: (ids: string[]) => Promise<void>;
  count: () => Promise<number>;
  where: <K extends keyof T & string>(field: K, value: T[K]) => Promise<T[]>;
  query: (build: (q: any) => any) => Promise<T[]>;
}

export function cloudTable<T extends { id: string }>(name: string): CloudTable<T> {
  const rows = async (q: any): Promise<T[]> => {
    const data = unwrap<Record<string, unknown>[]>(await q);
    return (data ?? []).map((r) => fromRow<T>(r) as T);
  };

  return {
    all: () => rows(client().from(name).select("*")),
    byId: async (id) => {
      const data = unwrap<Record<string, unknown>>(
        await client().from(name).select("*").eq("id", id).maybeSingle(),
      );
      return fromRow<T>(data);
    },
    put: async (row) => {
      unwrap(await client().from(name).upsert(toRow(row as Record<string, unknown>)).select("id"));
    },
    bulkPut: async (list) => {
      if (list.length === 0) return;
      unwrap(
        await client()
          .from(name)
          .upsert(list.map((r) => toRow(r as Record<string, unknown>)))
          .select("id"),
      );
    },
    remove: async (id) => {
      unwrap(await client().from(name).delete().eq("id", id).select("id"));
    },
    bulkRemove: async (ids) => {
      if (ids.length === 0) return;
      unwrap(await client().from(name).delete().in("id", ids).select("id"));
    },
    count: async () => {
      const res = await client().from(name).select("id", { count: "exact", head: true });
      if (res.error) throw new CloudError(res.error.message, res.error.code);
      return res.count ?? 0;
    },
    where: (field, value) => rows(client().from(name).select("*").eq(snake(field), value)),
    query: (build) => rows(build(client().from(name).select("*"))),
  };
}
