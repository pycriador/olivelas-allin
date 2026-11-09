import type { Entity, Query, StorageProvider } from "./types";

const PREFIX = "serviceforge:";

function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readCollection<T>(collection: string): T[] {
  if (!isBrowser()) return [];
  const raw = window.localStorage.getItem(PREFIX + collection);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

function writeCollection<T>(collection: string, data: T[]): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(PREFIX + collection, JSON.stringify(data));
}

function matches<T>(item: T, query?: Query<T>): boolean {
  if (!query) return true;
  if (typeof query === "function") return (query as (i: T) => boolean)(item);
  return Object.entries(query as Record<string, unknown>).every(
    ([k, v]) => (item as Record<string, unknown>)[k] === v,
  );
}

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export class LocalStorageProvider implements StorageProvider {
  readonly name = "LocalStorage";

  async create<T extends Entity>(collection: string, data: Partial<Omit<T, "id">> & { id?: string }): Promise<T> {
    const items = readCollection<T>(collection);
    const record = { ...(data as object), id: data.id ?? uid() } as T;
    items.push(record);
    writeCollection(collection, items);
    return record;
  }

  async update<T extends Entity>(collection: string, id: string, data: Partial<T>): Promise<T> {
    const items = readCollection<T>(collection);
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) throw new Error(`Record ${id} not found in ${collection}`);
    items[idx] = { ...items[idx], ...data };
    writeCollection(collection, items);
    return items[idx];
  }

  async delete(collection: string, id: string): Promise<void> {
    const items = readCollection<Entity>(collection).filter((i) => i.id !== id);
    writeCollection(collection, items);
  }

  async find<T extends Entity>(collection: string, id: string): Promise<T | null> {
    return (readCollection<T>(collection).find((i) => i.id === id) as T | undefined) ?? null;
  }

  async findAll<T extends Entity>(collection: string, query?: Query<T>): Promise<T[]> {
    return readCollection<T>(collection).filter((i) => matches(i, query));
  }

  async count(collection: string, query?: Query<unknown>): Promise<number> {
    return (await this.findAll(collection, query as Query<Entity>)).length;
  }

  async clear(collection?: string): Promise<void> {
    if (!isBrowser()) return;
    if (collection) {
      window.localStorage.removeItem(PREFIX + collection);
      return;
    }
    Object.keys(window.localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => window.localStorage.removeItem(k));
  }

  async transaction<R>(fn: (tx: StorageProvider) => Promise<R>): Promise<R> {
    // MVP: no isolation. Future providers will implement real transactions.
    return fn(this);
  }
}
