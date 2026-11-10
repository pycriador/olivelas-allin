// Server-only. Encrypts external database credentials before they touch the
// database. Nothing anywhere returns the plaintext to the browser.
//
// The layout of a stored value is: v1:<base64(iv | authTag | ciphertext)>.
// Versioning the prefix keeps a future migration to a real Vault trivial:
// a new prefix can be handled alongside v1 without a data backfill.
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const VERSION = "v1";

function key(): Buffer {
  const raw = process.env["DATA_SOURCE_ENC_KEY"];
  if (!raw) {
    throw new Error(
      "DATA_SOURCE_ENC_KEY is not configured. Credentials cannot be encrypted or read.",
    );
  }
  // Normalise any length of configured secret down to a 32-byte AES key.
  return createHash("sha256").update(raw, "utf8").digest();
}

export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return `${VERSION}:${Buffer.concat([iv, cipher.getAuthTag(), ct]).toString("base64")}`;
}

export function decryptSecret(stored: string): string {
  const [version, payload] = stored.split(":", 2);
  if (version !== VERSION || !payload) {
    throw new Error("Stored credential is in an unrecognised format.");
  }
  const buf = Buffer.from(payload, "base64");
  const decipher = createDecipheriv("aes-256-gcm", key(), buf.subarray(0, 12));
  decipher.setAuthTag(buf.subarray(12, 28));
  return Buffer.concat([decipher.update(buf.subarray(28)), decipher.final()]).toString("utf8");
}

export function hasEncryptionKey(): boolean {
  return Boolean(process.env["DATA_SOURCE_ENC_KEY"]);
}
