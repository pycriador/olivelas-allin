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
  const res = await client.query(`
    SELECT table_name, column_name, is_nullable, column_default 
    FROM information_schema.columns 
    WHERE table_schema = 'public' AND column_name = 'company_id'
    ORDER BY table_name;
  `);
  console.log('company_id column in tables:');
  for (const r of res.rows) {
    console.log(` - ${r.table_name}: nullable=${r.is_nullable}, default=${r.column_default}`);
  }
  await client.end();
}

run().catch(console.error);
