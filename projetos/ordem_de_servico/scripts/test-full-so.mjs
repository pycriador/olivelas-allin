import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mfyyezvpfpflpekosjif.supabase.co';
const supabaseKey = 'sb_publishable_placeholder_key';
const supabase = createClient(supabaseUrl, supabaseKey);

function toSnakeKey(str) {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function toSnake(obj) {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return obj;
  const res = {};
  for (const [k, v] of Object.entries(obj)) {
    res[toSnakeKey(k)] = v;
  }
  return res;
}

async function testFullSO() {
  const now = new Date().toISOString();
  const entry = {
    number: 'SF-' + Date.now(),
    customerId: 'test-cust',
    customerName: 'Cliente Teste',
    description: 'Teste de OS completa',
    diagnosis: 'Sintomas',
    notes: 'Obs',
    priority: 'medium',
    status: 'Em Aberto',
    statusLabel: 'Em Aberto',
    entryDate: now.split("T")[0],
    services: [],
    parts: [],
    timeline: [],
    comments: [],
    attachments: [],
    documents: [],
    communications: [],
    tags: [],
    pinned: false,
    createdAt: now,
    updatedAt: now,
    createdBy: 'Admin',
    updatedBy: 'Admin'
  };

  const payload = toSnake(entry);
  console.log('Sending payload keys:', Object.keys(payload));

  const { data, error } = await supabase
    .from('service_orders')
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error('❌ Insert full service_orders failed as expected:', error);
  } else {
    console.log('✅ Insert full service_orders succeeded:', data.id);
  }
}

testFullSO().catch(console.error);
