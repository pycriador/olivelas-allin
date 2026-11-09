#!/usr/bin/env node
/**
 * Run pending Supabase SQL migrations.
 *
 * Usage:
 *   npx tsx scripts/run-migrations.ts            # run all pending
 *   npx tsx scripts/run-migrations.ts 20260719   # run migrations matching prefix
 *
 * Requires SUPABASE_DB_URL in .env (transaction-mode pooler):
 *   postgresql://postgres:placeholder_password@db.placeholder.supabase.co:5432/postgres
 *
 * Get it from: Supabase Dashboard → Project Settings → Database → Connection string → URI
 */

import { readFileSync, readdirSync } from "node:fs";
import { resolve, basename } from "node:path";
import { Client } from "pg";
import { config } from "dotenv";

config({ path: resolve(import.meta.dirname, "..", ".env") });

const DATABASE_URL = process.env.SUPABASE_DB_URL;
if (!DATABASE_URL) {
  console.error("Missing SUPABASE_DB_URL in .env");
  console.error(
    "\nGet it from: Supabase Dashboard → Project Settings → Database → Connection string → URI (Transaction mode)",
  );
  process.exit(1);
}

const MIGRATIONS_DIR = resolve(import.meta.dirname, "..", "supabase", "migrations");
const prefixFilter = process.argv[2]; // optional: e.g. "20260719"

async function main() {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  try {
    // Ensure tracking table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migration_log (
        id SERIAL PRIMARY KEY,
        filename TEXT NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    // Get already-applied migrations
    const { rows: applied } = await client.query("SELECT filename FROM _migration_log");
    const appliedSet = new Set(applied.map((r: { filename: string }) => r.filename));

    // List migration files sorted
    let files = readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    if (prefixFilter) {
      files = files.filter((f) => f.startsWith(prefixFilter));
    }

    const pending = files.filter((f) => !appliedSet.has(basename(f)));

    if (pending.length === 0) {
      console.log("No pending migrations.");
      return;
    }

    console.log(`Running ${pending.length} migration(s)...\n`);

    for (const file of pending) {
      const filePath = resolve(MIGRATIONS_DIR, file);
      const sql = readFileSync(filePath, "utf-8");

      console.log(`▸ ${file}`);
      try {
        await client.query(sql);
        await client.query("INSERT INTO _migration_log (filename) VALUES ($1)", [basename(file)]);
        console.log(`  ✓ applied\n`);
      } catch (err) {
        console.error(`  ✗ FAILED: ${err.message}`);
        console.error("\nStopping. Fix the error and re-run.");
        process.exit(1);
      }
    }

    console.log("All migrations applied.");
  } finally {
    await client.end();
  }
}

main();
