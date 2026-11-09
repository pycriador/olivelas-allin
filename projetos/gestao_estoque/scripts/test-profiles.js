import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mffrafqyjbjitlhjnlai.supabase.co';
const supabaseKey = 'sb_publishable_placeholder_key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testProfiles() {
  const { data, error } = await supabase.from('profiles').select('id, email, full_name, is_global_admin');
  console.log('Profiles query:', data, error);
}

testProfiles();
