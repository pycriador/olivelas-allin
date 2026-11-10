import crypto from 'crypto';
import os from 'os';

// Chave derivada de identificadores estáveis da máquina e salt
const SALT = 'olivelas_gdrive_sync_secure_salt_2026';
const MACHINE_ID = `${os.hostname()}_${os.userInfo().username}_${os.platform()}`;
const MASTER_KEY = crypto.scryptSync(MACHINE_ID, SALT, 32);

const ALGORITHM = 'aes-256-gcm';

export function encryptData(plainText: string): string {
  if (!plainText) return '';
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, MASTER_KEY, iv);
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  // Formato: iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decryptData(cipherText: string): string {
  if (!cipherText) return '';
  try {
    const parts = cipherText.split(':');
    if (parts.length !== 3) return cipherText; // Retorna como está se não for no formato
    const [ivHex, authTagHex, encrypted] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, MASTER_KEY, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('Failed to decrypt data:', err);
    return '';
  }
}
