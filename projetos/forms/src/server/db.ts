import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  host: process.env.host || 'aws-0-ca-central-1.pooler.supabase.com',
  port: parseInt(process.env.port || '5432', 10),
  database: process.env.database || 'postgres',
  user: process.env.user || 'postgres.pkbjoxzqllextmtmjoia',
  password: process.env.password || 'viDXv2XHa8cdU6Sz',
  ssl: { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('[DB Pool Unexpected Error]:', err.message);
});

export async function query<T = any>(text: string, params?: any[]): Promise<pg.QueryResult<T>> {
  // Automatically normalize any legacy olivelas_iam_forms_TABELA to olivelas_iam_forms.TABELA
  const normalizedText = text.replace(/\bolivelas_iam_forms_([a-zA-Z0-9_]+)\b/g, 'olivelas_iam_forms.$1');
  const start = Date.now();
  const res = await pool.query<T>(normalizedText, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV === 'development') {
    // console.log(`[SQL] ${duration}ms - ${normalizedText.substring(0, 80)}`);
  }
  return res;
}
