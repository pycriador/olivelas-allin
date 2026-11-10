#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

async function main() {
  const client = new pg.Client({
    host: 'aws-1-ca-central-1.pooler.supabase.com',
    port: 5432,
    database: 'postgres',
    user: 'postgres.uaxeevcbkgvcctxrfdyh',
    password: 'KZj2ntg7PYHUXU4f',
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log('✅ Connected to Supabase PostgreSQL (uaxeevcbkgvcctxrfdyh)');

  const sqlPath = path.join(
    ROOT_DIR,
    'supabase',
    'migrations',
    '20261110000005_all_37_projects_global_admin_willian.sql'
  );
  const sql = fs.readFileSync(sqlPath, 'utf8');
  await client.query(sql);
  console.log('✅ Applied migration 20261110000005_all_37_projects_global_admin_willian.sql');

  const verifySchemas = [
    'public',
    'album_figurinhas',
    'artes_caneca',
    'casa_organizada_ai',
    'cesta_cafe_manha',
    'collection_vault',
    'dashboard_bi',
    'olivelas_iam_forms',
    'forms_pro',
    'iam_suite',
    'inventario_jogos',
    'link_promo',
  ];

  for (const s of verifySchemas) {
    const res = await client.query(`SELECT * FROM ${s}.profiles`);
    console.log(
      `  [${s}.profiles] rows=${res.rowCount} -> ${res.rows
        .map((r) => `${r.email} (${r.role || r.global_role || 'GLOBAL_ADMIN'})`)
        .join(', ')}`
    );
  }

  await client.end();
}

main().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
