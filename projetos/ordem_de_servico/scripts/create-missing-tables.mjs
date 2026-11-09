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

const defaultCompany = '00000000-0000-0000-0000-000000000001';

const queries = [
  // 1. parts
  `CREATE TABLE IF NOT EXISTS parts (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    company_id text DEFAULT '${defaultCompany}',
    code text,
    sku text,
    name text NOT NULL,
    manufacturer_id text,
    supplier_id text,
    category_id text,
    cost_price numeric DEFAULT 0,
    suggested_price numeric DEFAULT 0,
    quantity numeric DEFAULT 0,
    unit_id text,
    min_stock numeric DEFAULT 0,
    status text DEFAULT 'active',
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );`,

  // 2. services
  `CREATE TABLE IF NOT EXISTS services (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    company_id text DEFAULT '${defaultCompany}',
    name text NOT NULL,
    description text,
    suggested_value numeric DEFAULT 0,
    avg_time numeric DEFAULT 0,
    default_warranty text,
    status text DEFAULT 'active',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );`,

  // 3. technicians
  `CREATE TABLE IF NOT EXISTS technicians (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    company_id text DEFAULT '${defaultCompany}',
    name text NOT NULL,
    cpf text,
    phone text,
    whatsapp text,
    email text,
    position text,
    specialties jsonb DEFAULT '[]'::jsonb,
    certifications jsonb DEFAULT '[]'::jsonb,
    work_hours text,
    status text DEFAULT 'active',
    photo text,
    notes text,
    schedule jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );`,

  // 4. warranties
  `CREATE TABLE IF NOT EXISTS warranties (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    company_id text DEFAULT '${defaultCompany}',
    name text NOT NULL,
    days integer DEFAULT 90,
    coverage text,
    notes text,
    status text DEFAULT 'active',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );`,

  // 5. defects
  `CREATE TABLE IF NOT EXISTS defects (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    company_id text DEFAULT '${defaultCompany}',
    name text NOT NULL,
    category_id text,
    tags jsonb DEFAULT '[]'::jsonb,
    priority text DEFAULT 'medium',
    description text,
    suggested_solution text,
    status text DEFAULT 'active',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );`,

  // 6. payment_methods
  `CREATE TABLE IF NOT EXISTS payment_methods (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    company_id text DEFAULT '${defaultCompany}',
    name text NOT NULL,
    type text DEFAULT 'cash',
    active boolean DEFAULT true,
    status text DEFAULT 'active',
    fee_percentage numeric DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );`,

  // 7. payment_terms
  `CREATE TABLE IF NOT EXISTS payment_terms (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    company_id text DEFAULT '${defaultCompany}',
    name text NOT NULL,
    installments integer DEFAULT 1,
    interval_days integer DEFAULT 30,
    active boolean DEFAULT true,
    status text DEFAULT 'active',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );`,

  // 8. measurement_units
  `CREATE TABLE IF NOT EXISTS measurement_units (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    company_id text DEFAULT '${defaultCompany}',
    name text NOT NULL,
    symbol text NOT NULL,
    status text DEFAULT 'active',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );`
];

const newTables = [
  'parts',
  'services',
  'technicians',
  'warranties',
  'defects',
  'payment_methods',
  'payment_terms',
  'measurement_units'
];

async function createTables() {
  await client.connect();
  console.log('Creating missing entity tables in PostgreSQL...');
  for (const q of queries) {
    await client.query(q);
  }

  for (const t of newTables) {
    await client.query(`ALTER TABLE "${t}" ENABLE ROW LEVEL SECURITY;`);
    await client.query(`DROP POLICY IF EXISTS "permit_all_anon_auth" ON "${t}";`);
    await client.query(`
      CREATE POLICY "permit_all_anon_auth" 
      ON "${t}" 
      FOR ALL 
      TO public 
      USING (true) 
      WITH CHECK (true);
    `);
    console.log(`✅ Table created and RLS policy set for: ${t}`);
  }

  await client.query(`NOTIFY pgrst, 'reload schema';`);
  await client.end();
  console.log('🎉 All tables created and ready for Supabase operations!');
}

createTables().catch(console.error);
