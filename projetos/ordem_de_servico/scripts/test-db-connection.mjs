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

try {
  await client.connect();
  const userId = '72d7e554-a19e-4c5d-b59b-4bb0b394417f';
  const profiles = await client.query('SELECT * FROM profiles WHERE id = $1', [userId]);
  console.log('Profile:', profiles.rows);

  const uComp = await client.query('SELECT * FROM user_companies WHERE user_id = $1', [userId]);
  console.log('user_companies:', uComp.rows);

  const cUsers = await client.query('SELECT * FROM company_users WHERE user_id = $1', [userId]);
  console.log('company_users:', cUsers.rows);

  // Check user_roles table if it exists
  const hasUserRoles = await client.query("SELECT to_regclass('public.user_roles') as reg;");
  console.log('has user_roles table:', hasUserRoles.rows[0].reg);
  if (hasUserRoles.rows[0].reg) {
    const roles = await client.query('SELECT * FROM user_roles WHERE user_id = $1', [userId]);
    console.log('user_roles:', roles.rows);
  }

  await client.end();
} catch (err) {
  console.error('Error:', err);
}
