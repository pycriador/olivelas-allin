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

const tables = [
  'brands',
  'categories',
  'suppliers',
  'manufacturers',
  'products',
  'inventory_items',
  'inventory_movements',
  'lots',
  'catalog_requests'
];

async function fixRLS() {
  await client.connect();
  console.log('Connected to PostgreSQL to unify RLS policies...');

  for (const table of tables) {
    try {
      // Drop existing conflicting policy if exists
      await client.query(`DROP POLICY IF EXISTS "permit_all_anon_auth" ON "${table}";`);
      await client.query(`
        CREATE POLICY "permit_all_anon_auth" 
        ON "${table}" 
        FOR ALL 
        TO public 
        USING (true) 
        WITH CHECK (true);
      `);
      console.log(`✅ Set permit_all_anon_auth for table: ${table}`);
    } catch (err) {
      console.error(`❌ Error on ${table}:`, err.message);
    }
  }

  // Reload PostgREST schema cache
  await client.query(`NOTIFY pgrst, 'reload schema';`);
  await client.end();
  console.log('🎉 RLS policies successfully unified for all tables!');
}

fixRLS().catch(console.error);
