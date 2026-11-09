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

async function inspectRLS() {
  await client.connect();
  const res = await client.query(`
    SELECT schemaname, tablename, rowsecurity 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    ORDER BY tablename;
  `);
  console.log('Tables and RLS status:');
  for (const r of res.rows) {
    console.log(` - ${r.tablename}: RLS enabled = ${r.rowsecurity}`);
  }

  const policies = await client.query(`
    SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname;
  `);
  console.log(`\nFound ${policies.rows.length} policies:`);
  for (const p of policies.rows) {
    console.log(` [${p.tablename}] ${p.policyname} (${p.cmd}) -> check: ${p.with_check}`);
  }

  await client.end();
}

inspectRLS().catch(console.error);
