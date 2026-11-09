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

async function run() {
  await client.connect();
  const tables = ['categories', 'models', 'equipment_types', 'manufacturers', 'suppliers', 'products', 'inv_products', 'hr_employees', 'fin_accounts'];
  for (const t of tables) {
    const res = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position;
    `, [t]);
    console.log(`\n=== Table: ${t} ===`);
    console.log(res.rows.map(r => r.column_name).join(', '));
  }
  await client.end();
}

run().catch(console.error);
