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
  try {
    await client.connect();
    console.log('Connected to PostgreSQL successfully!');
    const res = await client.query(`
      SELECT table_name, table_type 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log(`Found ${res.rows.length} tables/views in public:`);
    for (const r of res.rows) {
      console.log(` - ${r.table_name} (${r.table_type})`);
    }
  } catch (err) {
    console.error('Postgres error:', err);
  } finally {
    await client.end().catch(() => {});
  }
}

run();
