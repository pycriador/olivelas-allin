import { createClient } from '@supabase/supabase-js';
import pg from 'pg';

const url = 'https://mfyyezvpfpflpekosjif.supabase.co';
const anonKey = 'sb_publishable_placeholder_key';
const supabase = createClient(url, anonKey);

const { Client } = pg;
const pgClient = new Client({
  host: 'aws-0-us-east-1.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres.mfyyezvpfpflpekosjif',
  password: 'placeholder_password',
  ssl: { rejectUnauthorized: false }
});

async function testErrors() {
  await pgClient.connect();

  console.log('--- TESTANDO QUERIES QUE DERAM ERRO ---');

  // 1. configuration
  const { data: dConf, error: eConf } = await supabase.from('configuration').select('*').eq('id', 'app');
  console.log('1. configuration error:', eConf?.message || 'OK', eConf?.code);

  // 2. audit_log
  const { data: dAudit, error: eAudit } = await supabase.from('audit_log').select('*').limit(1);
  console.log('2. audit_log error:', eAudit?.message || 'OK', eAudit?.code);

  // 3. database_connections
  const { data: dConn, error: eConn } = await supabase.from('database_connections').select('*').limit(1);
  console.log('3. database_connections error:', eConn?.message || 'OK', eConn?.code);

  // 4. user_companies
  const { data: dUserComp, error: eUserComp } = await supabase
    .from('user_companies')
    .select('role, is_default, companies:company_id(id, name, logo_url, active)')
    .order('is_default', { ascending: false });
  console.log('4. user_companies error:', eUserComp?.message || 'OK', eUserComp?.code);

  // 5. companies
  const { data: dComp, error: eComp } = await supabase.from('companies').select('*');
  console.log('5. companies error:', eComp?.message || 'OK', eComp?.code, eComp?.details);

  // Check policies on companies in PostgreSQL
  const pol = await pgClient.query(`
    SELECT polname, polcmd, polroles, polqual, polwithcheck
    FROM pg_policy
    WHERE polrelid = 'public.companies'::regclass;
  `);
  console.log('Policies on companies:', pol.rows);

  await pgClient.end();
}

testErrors().catch(console.error);
