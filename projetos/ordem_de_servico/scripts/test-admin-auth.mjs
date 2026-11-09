import { createClient } from '@supabase/supabase-js';

const url = 'https://mfyyezvpfpflpekosjif.supabase.co';
const serviceKey = 'sb_secret_placeholder_key';
const adminClient = createClient(url, serviceKey);

async function testLink() {
  const { data, error } = await adminClient.auth.admin.generateLink({
    type: 'magiclink',
    email: 'willian.o.jesus@gmail.com',
  });
  console.log('generateLink result:', { data, error });
}

testLink();
