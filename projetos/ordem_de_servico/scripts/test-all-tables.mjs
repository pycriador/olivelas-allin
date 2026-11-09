import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mfyyezvpfpflpekosjif.supabase.co';
const supabaseKey = 'sb_publishable_placeholder_key';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testAllTables() {
  const ts = Date.now();
  console.log('Testing newly created tables on Supabase REST API...');

  // 1. parts
  const { data: part, error: errPart } = await supabase.from('parts').insert({ name: 'Tela LCD ' + ts, code: 'P-' + ts, quantity: 5 }).select().single();
  console.log('parts:', errPart ? '❌ ' + errPart.message : '✅ ' + part.id);

  // 2. services
  const { data: srv, error: errSrv } = await supabase.from('services').insert({ name: 'Troca de Tela ' + ts, suggested_value: 120 }).select().single();
  console.log('services:', errSrv ? '❌ ' + errSrv.message : '✅ ' + srv.id);

  // 3. technicians
  const { data: tec, error: errTec } = await supabase.from('technicians').insert({ name: 'Técnico Carlos ' + ts, status: 'active' }).select().single();
  console.log('technicians:', errTec ? '❌ ' + errTec.message : '✅ ' + tec.id);

  // 4. warranties
  const { data: war, error: errWar } = await supabase.from('warranties').insert({ name: 'Garantia Padrão ' + ts, days: 90 }).select().single();
  console.log('warranties:', errWar ? '❌ ' + errWar.message : '✅ ' + war.id);

  // 5. defects
  const { data: def, error: errDef } = await supabase.from('defects').insert({ name: 'Não liga ' + ts, priority: 'high' }).select().single();
  console.log('defects:', errDef ? '❌ ' + errDef.message : '✅ ' + def.id);
}

testAllTables().catch(console.error);
