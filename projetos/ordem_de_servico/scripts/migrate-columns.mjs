import pg from 'pg';

const { Client } = pg;
const client = new Client({
  host: 'aws-0-us-east-1.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres.mfyyezvpfpflpekosjif',
  password: 'placeholder_password',
  ssl: { rejectUnauthorized: false }
});

const statements = [
  // customers
  `ALTER TABLE customers ADD COLUMN IF NOT EXISTS birth_date text;`,
  `ALTER TABLE customers ADD COLUMN IF NOT EXISTS cellphone text;`,
  `ALTER TABLE customers ADD COLUMN IF NOT EXISTS company_name text;`,
  `ALTER TABLE customers ADD COLUMN IF NOT EXISTS fantasy_name text;`,
  `ALTER TABLE customers ADD COLUMN IF NOT EXISTS secondary_email text;`,
  `ALTER TABLE customers ADD COLUMN IF NOT EXISTS municipal_registration text;`,
  `ALTER TABLE customers ADD COLUMN IF NOT EXISTS profession text;`,
  `ALTER TABLE customers ADD COLUMN IF NOT EXISTS classification text;`,
  `ALTER TABLE customers ADD COLUMN IF NOT EXISTS website text;`,
  `ALTER TABLE customers ADD COLUMN IF NOT EXISTS photo text;`,

  // service_orders
  `ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS status_label text;`,
  `ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS entry_date text;`,
  `ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS deadline text;`,
  `ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS delivery_date text;`,
  `ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS estimated_value numeric DEFAULT 0;`,
  `ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS final_value numeric DEFAULT 0;`,
  `ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS pinned boolean DEFAULT false;`,
  `ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS created_by text;`,
  `ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS updated_by text;`,
  `ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS documents jsonb DEFAULT '[]'::jsonb;`,
  `ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS communications jsonb DEFAULT '[]'::jsonb;`,
  `ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS tags jsonb DEFAULT '[]'::jsonb;`,
  `ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS category_id text;`,
  `ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS defect_id text;`,
  `ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS defect_name text;`,
  `ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS warranty_id text;`,

  // brands
  `ALTER TABLE brands ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';`,

  // categories
  `ALTER TABLE categories ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';`,

  // models
  `ALTER TABLE models ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';`,
  `ALTER TABLE models ADD COLUMN IF NOT EXISTS notes text;`,

  // equipment_types
  `ALTER TABLE equipment_types ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';`,
  `ALTER TABLE equipment_types ADD COLUMN IF NOT EXISTS notes text;`,

  // devices
  `ALTER TABLE devices ADD COLUMN IF NOT EXISTS warranty_id text;`,

  // suppliers
  `ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';`,

  // manufacturers
  `ALTER TABLE manufacturers ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';`,

  // ensure so_numbering table exists
  `CREATE TABLE IF NOT EXISTS so_numbering (
    id text PRIMARY KEY,
    company_id text,
    prefix text DEFAULT 'SF-',
    suffix text DEFAULT '',
    digits integer DEFAULT 6,
    reset_yearly boolean DEFAULT false,
    reset_monthly boolean DEFAULT false,
    current_sequence integer DEFAULT 0,
    last_reset text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );`,

  // ensure so_statuses table exists
  `CREATE TABLE IF NOT EXISTS so_statuses (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    company_id text,
    name text NOT NULL,
    color text DEFAULT '#6b7280',
    "order" integer DEFAULT 1,
    is_default boolean DEFAULT false,
    is_final boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );`,

  // Reload PostgREST schema cache so Supabase immediately recognizes the new columns!
  `NOTIFY pgrst, 'reload schema';`
];

async function migrate() {
  await client.connect();
  console.log('Connected to PostgreSQL for column migration...');
  for (const sql of statements) {
    try {
      await client.query(sql);
      console.log('✅ Executed:', sql.slice(0, 60));
    } catch (err) {
      console.error('❌ Error executing:', sql, err.message);
    }
  }
  await client.end();
  console.log('🎉 Migração de colunas concluída com sucesso!');
}

migrate().catch(console.error);
