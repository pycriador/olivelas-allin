// Local encryption envelope for IndexedDB payloads.
// Phase 1: key stored in localStorage. Later phase will derive from user secret.

const KEY_STORAGE = "specforge:enc-key:v2";
const KEY_VERSION_STORAGE = "specforge:enc-key-version";

function toBuf(u8: Uint8Array): ArrayBuffer {
  const out = new ArrayBuffer(u8.byteLength);
  new Uint8Array(out).set(u8);
  return out;
}

function bytesToBase64(bytes: Uint8Array): string {
  const CHUNK_SIZE = 8192;
  let binary = "";
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    const chunk = bytes.subarray(i, i + CHUNK_SIZE);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function getKeyVersion(): number {
  if (typeof window === "undefined") return 1;
  const v = window.localStorage.getItem(KEY_VERSION_STORAGE);
  return v ? Number.parseInt(v, 10) || 1 : 1;
}

function incrementKeyVersion(): number {
  const v = getKeyVersion() + 1;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(KEY_VERSION_STORAGE, String(v));
  }
  return v;
}

async function generateKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    toBuf(crypto.getRandomValues(new Uint8Array(32))),
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"],
  );
}

async function getKey(): Promise<CryptoKey> {
  const existing = typeof window !== "undefined" ? window.localStorage.getItem(KEY_STORAGE) : null;
  let raw: Uint8Array;
  if (existing) {
    raw = base64ToBytes(existing);
    if (raw.byteLength !== 32) {
      raw = crypto.getRandomValues(new Uint8Array(32));
      if (typeof window !== "undefined") {
        window.localStorage.setItem(KEY_STORAGE, bytesToBase64(raw));
        incrementKeyVersion();
      }
    }
  } else {
    raw = crypto.getRandomValues(new Uint8Array(32));
    if (typeof window !== "undefined") {
      window.localStorage.setItem(KEY_STORAGE, bytesToBase64(raw));
      incrementKeyVersion();
    }
  }
  return crypto.subtle.importKey("raw", toBuf(raw), { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}

export async function rotateKey(): Promise<void> {
  const newKey = await generateKey();
  const exported = await crypto.subtle.exportKey("raw", newKey);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(KEY_STORAGE, bytesToBase64(new Uint8Array(exported)));
    incrementKeyVersion();
  }
}

export function getKeyVersionNumber(): number {
  return getKeyVersion();
}

export async function encryptJSON<T>(value: T): Promise<string> {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new TextEncoder().encode(JSON.stringify(value));
  const ct = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv: toBuf(iv) }, key, toBuf(data)),
  );
  const out = new Uint8Array(1 + iv.length + ct.length);
  out[0] = getKeyVersion();
  out.set(iv, 1);
  out.set(ct, 1 + iv.length);
  return bytesToBase64(out);
}

export async function decryptJSON<T>(payload: string): Promise<T> {
  const key = await getKey();
  const buf = base64ToBytes(payload);

  let iv: Uint8Array;
  let ct: Uint8Array;

  const firstByte = buf[0];
  if (firstByte >= 1 && buf.length > 13 && buf[1] !== undefined) {
    iv = buf.slice(1, 13);
    ct = buf.slice(13);
  } else {
    iv = buf.slice(0, 12);
    ct = buf.slice(12);
  }

  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: toBuf(iv) }, key, toBuf(ct));
  return JSON.parse(new TextDecoder().decode(pt)) as T;
}
