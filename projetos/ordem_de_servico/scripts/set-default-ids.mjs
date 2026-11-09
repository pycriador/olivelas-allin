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
  'models',
  'equipment_types',
  'manufacturers',
  'suppliers',
  'products',
  'lots',
  'inv_products',
  'inv_warehouses',
  'fin_accounts'
];

async function setDefaultIds() {
  await client.connect();
  console.log('Setting DEFAULT gen_random_uuid()::text for IDs...');
  for (const table of tables) {
    try {
      await client.query(`ALTER TABLE "${table}" ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;`);
      console.log(`✅ Set default ID for: ${table}`);
    } catch (err) {
      console.error(`❌ Error on ${table}:`, err.message);
    }
  }
  await client.query(`NOTIFY pgrst, 'reload schema';`);
  await client.end();
}

setDefaultIds().catch(console.error);
