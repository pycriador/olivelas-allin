import { createClient } from '@supabase/supabase-js';

const url = 'https://mfyyezvpfpflpekosjif.supabase.co';
const anonKey = 'sb_publishable_placeholder_key';
const client = createClient(url, anonKey);

async function testAuthCompanies() {
  const { data: auth, error: authErr } = await client.auth.signInWithPassword({
    email: 'willian.o.jesus@gmail.com',
    password: 'ServiceForge@2026'
  });
  if (authErr) {
    console.error('Auth error:', authErr);
    return;
  }
  console.log('Signed in. Querying companies...');
  const { data, error } = await client.from('companies').select('*');
  console.log('Companies query result:', { dataCount: data?.length, error });
}

testAuthCompanies().catch(console.error);
