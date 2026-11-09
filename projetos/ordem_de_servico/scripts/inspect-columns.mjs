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

async function inspectTable(tableName) {
  const res = await client.query(`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = $1
    ORDER BY ordinal_position;
  `, [tableName]);
  console.log(`\n=== Columns for table: ${tableName} ===`);
  for (const c of res.rows) {
    console.log(` - ${c.column_name}: ${c.data_type} (nullable: ${c.is_nullable}, default: ${c.column_default})`);
  }
}

async function run() {
  await client.connect();
  await inspectTable('customers');
  await inspectTable('devices');
  await inspectTable('service_orders');
  await inspectTable('brands');
  await client.end();
}

run().catch(console.error);
