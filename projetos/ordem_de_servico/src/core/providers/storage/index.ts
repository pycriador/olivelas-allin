import { LocalStorageProvider } from "./LocalStorageProvider";
import type { StorageProvider } from "./types";

let activeProvider: StorageProvider = new LocalStorageProvider();

export function getStorage(): StorageProvider {
  return activeProvider;
}

export function setStorage(provider: StorageProvider): void {
  activeProvider = provider;
}

export type { StorageProvider, Entity, Query } from "./types";
export { LocalStorageProvider };
export { SupabaseProvider } from "./SupabaseProvider";
