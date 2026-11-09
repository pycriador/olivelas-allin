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

async function checkPolicies() {
  await client.connect();

  const cUsersPol = await client.query(`
    SELECT polname, pg_get_expr(polqual, polrelid) as qual, pg_get_expr(polwithcheck, polrelid) as withcheck
    FROM pg_policy
    WHERE polrelid = 'public.company_users'::regclass;
  `);
  console.log('company_users policies:');
  for (const p of cUsersPol.rows) {
    console.log(`- ${p.polname}: ${p.qual}`);
  }

  const compPol = await client.query(`
    SELECT polname, pg_get_expr(polqual, polrelid) as qual, pg_get_expr(polwithcheck, polrelid) as withcheck
    FROM pg_policy
    WHERE polrelid = 'public.companies'::regclass;
  `);
  console.log('companies policies:');
  for (const p of compPol.rows) {
    console.log(`- ${p.polname}: ${p.qual}`);
  }

  await client.end();
}

checkPolicies().catch(console.error);
