import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  host: 'aws-0-ca-central-1.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres.pkbjoxzqllextmtmjoia',
  password: 'viDXv2XHa8cdU6Sz',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const cols = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'olivelas_iam_forms' AND table_name = 'api_tokens'");
  console.log('Columns before:', cols.rows.map(r => r.column_name));
  await pool.query('ALTER TABLE olivelas_iam_forms.api_tokens ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES olivelas_iam_forms.groups(id) ON DELETE SET NULL;');
  console.log('Successfully ensured group_id column exists on olivelas_iam_forms.api_tokens');
  
  // Set default group_id for existing tokens if any
  const groups = await pool.query("SELECT id, name FROM olivelas_iam_forms.groups ORDER BY created_at ASC LIMIT 1");
  if (groups.rows.length > 0) {
    const defaultGroup = groups.rows[0];
    await pool.query("UPDATE olivelas_iam_forms.api_tokens SET group_id = $1 WHERE group_id IS NULL", [defaultGroup.id]);
    console.log(`Updated legacy tokens to group: ${defaultGroup.name} (${defaultGroup.id})`);
  }

  const colsAfter = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'olivelas_iam_forms' AND table_name = 'api_tokens'");
  console.log('Columns after:', colsAfter.rows.map(r => r.column_name));
  await pool.end();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
