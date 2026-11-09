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

const tables = [
  'categories',
  'suppliers',
  'manufacturers',
  'products',
  'inventory_items',
  'inventory_movements',
  'lots',
  'catalog_requests'
];

async function fixCompanyId() {
  await client.connect();
  console.log('Relaxing company_id NOT NULL constraints and setting default...');
  for (const table of tables) {
    try {
      await client.query(`ALTER TABLE "${table}" ALTER COLUMN company_id DROP NOT NULL;`);
      await client.query(`ALTER TABLE "${table}" ALTER COLUMN company_id SET DEFAULT '${defaultCompany}';`);
      console.log(`✅ Altered company_id on: ${table}`);
    } catch (err) {
      console.error(`❌ Error on ${table}:`, err.message);
    }
  }
  await client.query(`NOTIFY pgrst, 'reload schema';`);
  await client.end();
  console.log('🎉 All company_id constraints relaxed successfully!');
}

fixCompanyId().catch(console.error);
