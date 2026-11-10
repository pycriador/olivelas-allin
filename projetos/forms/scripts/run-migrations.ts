import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

async function runMigrations() {
  const connectionConfig = {
    host: process.env.host || 'db.pkbjoxzqllextmtmjoia.supabase.co',
    port: parseInt(process.env.port || '5432', 10),
    database: process.env.database || 'postgres',
    user: process.env.user || 'postgres',
    password: process.env.password || 'viDXv2XHa8cdU6Sz',
    ssl: { rejectUnauthorized: false },
  };

  console.log(`[Migration] Connecting to PostgreSQL at ${connectionConfig.host}:${connectionConfig.port}...`);
  const pool = new Pool(connectionConfig);

  try {
    const client = await pool.connect();
    console.log('[Migration] Connected successfully!');

    const migrationsDir = path.resolve(process.cwd(), 'supabase/migrations');
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

    for (const file of files) {
      console.log(`[Migration] Executing: ${file}...`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
      await client.query(sql);
      console.log(`[Migration] Completed: ${file}`);
    }

    client.release();
    console.log('[Migration] All migrations executed successfully!');
  } catch (err) {
    console.error('[Migration Error]:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
