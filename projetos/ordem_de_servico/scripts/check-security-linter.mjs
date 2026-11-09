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

async function checkLinter() {
  await client.connect();

  // 1. Tabelas sem RLS habilitado
  const noRls = await client.query(`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND rowsecurity = false;
  `);
  console.log('Tabelas sem RLS em public:', noRls.rows.map(r => r.tablename));

  // 2. Views sem security_invoker
  const viewsNoInvoker = await client.query(`
    SELECT
      c.relname as view_name,
      c.reloptions
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'v'
      AND (c.reloptions IS NULL OR NOT ('security_invoker=on' = ANY(c.reloptions) OR 'security_invoker=true' = ANY(c.reloptions)));
  `);
  console.log('Views sem security_invoker:', viewsNoInvoker.rows.map(r => r.view_name));

  await client.end();
}

checkLinter().catch(console.error);
