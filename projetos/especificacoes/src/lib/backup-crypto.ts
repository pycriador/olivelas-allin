// Password-based envelope encryption for .specforge backup files.
import { derive, bytesToB64, b64ToBytes, toArrayBuffer } from "./kdf";

const MAGIC = "SPECFORGE1";
const ITERATIONS = 250_000;

export interface BackupEnvelope {
  magic: string;
  version: 1;
  createdAt: number;
  incremental: boolean;
  since?: number;
  kdf: { name: "PBKDF2-SHA256"; iterations: number; salt: string };
  iv: string;
  payload: string;
  checksum: string;
}

async function sha256(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", toArrayBuffer(bytes));
  return bytesToB64(new Uint8Array(digest));
}

async function keyFrom(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const bits = await derive(password, salt, ITERATIONS, 256);
  return crypto.subtle.importKey("raw", toArrayBuffer(bits), { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}

export async function encryptBackup(
  data: unknown,
  password: string,
  meta: { incremental: boolean; since?: number },
): Promise<BackupEnvelope> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await keyFrom(password, salt);
  const plain = new TextEncoder().encode(JSON.stringify(data));
  const ct = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: toArrayBuffer(iv) },
      key,
      toArrayBuffer(plain),
    ),
  );
  return {
    magic: MAGIC,
    version: 1,
    createdAt: Date.now(),
    incremental: meta.incremental,
    ...(meta.since !== undefined ? { since: meta.since } : {}),
    kdf: { name: "PBKDF2-SHA256", iterations: ITERATIONS, salt: bytesToB64(salt) },
    iv: bytesToB64(iv),
    payload: bytesToB64(ct),
    checksum: await sha256(plain),
  };
}

export function isValidEnvelope(v: unknown): v is BackupEnvelope {
  if (!v || typeof v !== "object") return false;
  const e = v as Partial<BackupEnvelope>;
  return (
    e.magic === MAGIC &&
    e.version === 1 &&
    typeof e.payload === "string" &&
    typeof e.iv === "string" &&
    typeof e.checksum === "string" &&
    !!e.kdf &&
    typeof e.kdf.salt === "string"
  );
}

export async function decryptBackup<T>(envelope: unknown, password: string): Promise<T> {
  if (!isValidEnvelope(envelope)) throw new Error("Invalid .specforge file structure");
  const key = await keyFrom(password, b64ToBytes(envelope.kdf.salt));
  let plain: Uint8Array;
  try {
    plain = new Uint8Array(
      await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: toArrayBuffer(b64ToBytes(envelope.iv)) },
        key,
        toArrayBuffer(b64ToBytes(envelope.payload)),
      ),
    );
  } catch {
    throw new Error("Wrong master password or corrupted file");
  }
  if ((await sha256(plain)) !== envelope.checksum) throw new Error("Integrity check failed");
  return JSON.parse(new TextDecoder().decode(plain)) as T;
}
