import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mfyyezvpfpflpekosjif.supabase.co';
const supabaseKey = 'sb_publishable_placeholder_key';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testSO() {
  console.log('Testing service_orders insert...');
  const soPayload = {
    number: 'SF-' + Date.now(),
    customer_id: 'test-cust',
    customer_name: 'Cliente Teste',
    description: 'Teste de OS',
    status: 'Em Aberto',
    priority: 'medium',
    total_value: 150.00
  };

  const { data, error } = await supabase
    .from('service_orders')
    .insert(soPayload)
    .select()
    .single();

  if (error) {
    console.error('❌ Insert service_orders failed:', error);
  } else {
    console.log('✅ Insert service_orders succeeded:', data.id, data.number);
  }
}

testSO().catch(console.error);
