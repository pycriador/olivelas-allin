import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const SECRET = process.env["AI_ENCRYPTION_KEY"] ?? "clauseforge-ai-dev-secret-change-me";
const KEY = createHash("sha256").update(SECRET).digest();

export interface EncryptedPayload {
  iv: string;
  data: string;
  algorithm: "aes-256-gcm";
}

/** Criptografa texto (ex.: API key) antes de persistir. */
export function encryptSecret(plaintext: string): EncryptedPayload {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", KEY, iv);
  const data = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    iv: iv.toString("base64"),
    data: Buffer.concat([data, tag]).toString("base64"),
    algorithm: "aes-256-gcm",
  };
}

/** Descriptografa texto persistido. */
export function decryptSecret(payload: EncryptedPayload): string {
  const iv = Buffer.from(payload.iv, "base64");
  const raw = Buffer.from(payload.data, "base64");
  const data = raw.subarray(0, raw.length - 16);
  const tag = raw.subarray(raw.length - 16);
  const decipher = createDecipheriv("aes-256-gcm", KEY, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

export function fingerprintSecret(plaintext: string): string {
  return createHash("sha256").update(`${SECRET}:${plaintext}`).digest("hex").slice(0, 32);
}

export function serializeEncrypted(payload: EncryptedPayload): string {
  return JSON.stringify(payload);
}

export function parseEncrypted(raw: string): EncryptedPayload {
  return JSON.parse(raw) as EncryptedPayload;
}

export function maskKey(key?: string | null): string {
  if (!key || key.length < 8) return "••••";
  return `${key.slice(0, 4)}••••••${key.slice(-4)}`;
}
