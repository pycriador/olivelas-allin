import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mfyyezvpfpflpekosjif.supabase.co';
const supabaseKey = 'sb_publishable_placeholder_key';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testAll() {
  const ts = Date.now();
  console.log('Testing full suite of inserts across Supabase...');

  // 1. categories
  const { data: cat, error: errCat } = await supabase.from('categories').insert({ name: 'Cat ' + ts, status: 'active' }).select().single();
  console.log('categories:', errCat ? '❌ ' + errCat.message : '✅ ' + cat.id);

  // 2. models
  const { data: mod, error: errMod } = await supabase.from('models').insert({ name: 'Model ' + ts, status: 'active' }).select().single();
  console.log('models:', errMod ? '❌ ' + errMod.message : '✅ ' + mod.id);

  // 3. equipment_types
  const { data: eqt, error: errEqt } = await supabase.from('equipment_types').insert({ name: 'Type ' + ts, status: 'active' }).select().single();
  console.log('equipment_types:', errEqt ? '❌ ' + errEqt.message : '✅ ' + eqt.id);

  // 4. suppliers
  const { data: sup, error: errSup } = await supabase.from('suppliers').insert({ name: 'Supplier ' + ts, status: 'active' }).select().single();
  console.log('suppliers:', errSup ? '❌ ' + errSup.message : '✅ ' + sup.id);

  // 5. inv_products
  const { data: inv, error: errInv } = await supabase.from('inv_products').insert({ name: 'Product ' + ts, sku: 'SKU-' + ts, cost_price: 10, sale_price: 20 }).select().single();
  console.log('inv_products:', errInv ? '❌ ' + errInv.message : '✅ ' + inv.id);

  // 6. fin_accounts
  const { data: fin, error: errFin } = await supabase.from('fin_accounts').insert({ name: 'Account ' + ts, type: 'checking', initial_balance: 1000 }).select().single();
  console.log('fin_accounts:', errFin ? '❌ ' + errFin.message : '✅ ' + fin.id);
}

testAll().catch(console.error);
