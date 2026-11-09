import { getStorage } from "@/core/providers/storage";
import type { SecretEntry } from "./types";

const COLLECTION = "int_secrets";

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function simpleEncrypt(value: string): string {
  return btoa(value.split("").map((c) => String.fromCharCode(c.charCodeAt(0) ^ 0x2A)).join(""));
}

function simpleDecrypt(encrypted: string): string {
  try {
    const decoded = atob(encrypted);
    return decoded.split("").map((c) => String.fromCharCode(c.charCodeAt(0) ^ 0x2A)).join("");
  } catch {
    return encrypted;
  }
}

export const secretManager = {
  async list(): Promise<SecretEntry[]> {
    return getStorage().findAll<SecretEntry>(COLLECTION);
  },

  async get(id: string): Promise<SecretEntry | null> {
    return getStorage().find<SecretEntry>(COLLECTION, id);
  },

  async store(name: string, value: string, context?: { connectorId?: string; connectionId?: string; companyId?: string }): Promise<SecretEntry> {
    const entry: SecretEntry = {
      id: uid(), name, encryptedValue: simpleEncrypt(value), ...context, createdAt: new Date().toISOString(),
    };
    return getStorage().create<SecretEntry>(COLLECTION, entry);
  },

  async retrieve(id: string): Promise<string | null> {
    const entry = await this.get(id);
    if (!entry) return null;
    return simpleDecrypt(entry.encryptedValue);
  },

  async remove(id: string): Promise<void> {
    await getStorage().delete(COLLECTION, id);
  },
};
