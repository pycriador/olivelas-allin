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

async function main() {
  await client.connect();
  console.log('Connected to PostgreSQL');

  const tables = [
    `CREATE TABLE IF NOT EXISTS public.evt_events (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      name TEXT,
      category TEXT,
      source TEXT,
      company_id TEXT DEFAULT '00000000-0000-0000-0000-000000000001',
      user_id TEXT,
      correlation_id TEXT,
      causation_id TEXT,
      status TEXT,
      priority INTEGER DEFAULT 0,
      payload JSONB DEFAULT '{}'::jsonb,
      metadata JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );`,
    `CREATE TABLE IF NOT EXISTS public.evt_store (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      event_id TEXT,
      name TEXT,
      category TEXT,
      source TEXT,
      company_id TEXT DEFAULT '00000000-0000-0000-0000-000000000001',
      payload JSONB DEFAULT '{}'::jsonb,
      metadata JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );`,
    `CREATE TABLE IF NOT EXISTS public.evt_subscribers (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      name TEXT,
      event_pattern TEXT,
      endpoint TEXT,
      active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );`,
    `CREATE TABLE IF NOT EXISTS public.evt_workflows (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      name TEXT,
      description TEXT,
      trigger_config JSONB DEFAULT '{}'::jsonb,
      actions JSONB DEFAULT '[]'::jsonb,
      active BOOLEAN DEFAULT true,
      company_id TEXT DEFAULT '00000000-0000-0000-0000-000000000001',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );`,
    `CREATE TABLE IF NOT EXISTS public.evt_executions (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      workflow_id TEXT,
      status TEXT,
      results JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );`,
    `CREATE TABLE IF NOT EXISTS public.evt_history (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      workflow_id TEXT,
      event_id TEXT,
      status TEXT,
      details JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );`
  ];

  for (const q of tables) {
    await client.query(q);
  }

  const rlsTables = ['evt_events', 'evt_store', 'evt_subscribers', 'evt_workflows', 'evt_executions', 'evt_history'];
  for (const t of rlsTables) {
    await client.query(`ALTER TABLE public.${t} ENABLE ROW LEVEL SECURITY;`);
    await client.query(`DROP POLICY IF EXISTS "permit_all_anon_auth" ON public.${t};`);
    await client.query(`CREATE POLICY "permit_all_anon_auth" ON public.${t} FOR ALL TO public USING (true) WITH CHECK (true);`);
  }

  await client.query(`NOTIFY pgrst, 'reload schema';`);
  console.log('✅ Event tables created and schema reloaded!');
  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
