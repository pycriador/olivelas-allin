import crypto from 'crypto';
import os from 'os';
import fs from 'fs';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const SALT = 'olivelas_gdrive_sync_secure_salt_2026';
const MACHINE_ID = `${os.hostname()}_${os.userInfo().username}_${os.platform()}`;
const MASTER_KEY = crypto.scryptSync(MACHINE_ID, SALT, 32);
const ALGORITHM = 'aes-256-gcm';

function decryptData(cipherText) {
  if (!cipherText) return '';
  const parts = cipherText.split(':');
  if (parts.length !== 3) return cipherText;
  const [ivHex, authTagHex, encrypted] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, MASTER_KEY, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

const raw = JSON.parse(fs.readFileSync('scripts/gdrive_raw.json', 'utf8'));

const clientId = decryptData(raw.oauth_client_id);
const clientSecret = decryptData(raw.oauth_client_secret);
const tokensStr = decryptData(raw.oauth_tokens);
const saStr = decryptData(raw.service_account_json);

console.log('[Google Import] Successfully decrypted credentials from olivelas-gdrive-sync!');
console.log('Client ID length:', clientId ? clientId.length : 0);
console.log('Client Secret length:', clientSecret ? clientSecret.length : 0);
console.log('Tokens present:', !!tokensStr);

const tokens = tokensStr ? JSON.parse(tokensStr) : null;
console.log('Tokens object keys:', tokens ? Object.keys(tokens) : []);

async function saveToDatabase() {
  const pool = new pg.Pool({
    host: process.env.host || 'aws-0-ca-central-1.pooler.supabase.com',
    port: parseInt(process.env.port || '5432', 10),
    database: process.env.database || 'postgres',
    user: process.env.user || 'postgres.pkbjoxzqllextmtmjoia',
    password: process.env.password || 'viDXv2XHa8cdU6Sz',
    ssl: { rejectUnauthorized: false },
  });

  const client = await pool.connect();
  try {
    const u = await client.query(`SELECT id FROM olivelas_iam_forms_users WHERE role = 'admin' LIMIT 1`);
    const adminId = u.rows[0]?.id;

    const payload = JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      tokens: tokens,
      redirect_uri: 'http://localhost:5173/integrations/google/callback',
    });

    await client.query(`DELETE FROM olivelas_iam_forms_google_integrations`);

    await client.query(
      `INSERT INTO olivelas_iam_forms_google_integrations 
       (user_id, service_type, auth_mode, connected_email, credentials_encrypted, status, last_sync_at)
       VALUES ($1, 'google_drive', 'oauth', 'projetos.olivelas@gmail.com', $2, 'connected', now())`,
      [adminId, payload]
    );

    await client.query(
      `INSERT INTO olivelas_iam_forms_google_integrations 
       (user_id, service_type, auth_mode, connected_email, credentials_encrypted, status, last_sync_at)
       VALUES ($1, 'google_sheets', 'oauth', 'projetos.olivelas@gmail.com', $2, 'connected', now())`,
      [adminId, payload]
    );

    console.log('[Google Import] Live credentials stored in olivelas_iam_forms_google_integrations!');
  } finally {
    client.release();
    await pool.end();
  }
}

saveToDatabase();
