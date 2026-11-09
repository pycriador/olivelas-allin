import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mfyyezvpfpflpekosjif.supabase.co';
const SUPABASE_KEY = 'sb_publishable_placeholder_key';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  db: { schema: 'serviceforge' }
});

async function run() {
  console.log('Testing CRUD on dedicated schema "serviceforge"...');

  // 1. Companies
  const { data: companies, error: errComp } = await supabase.from('companies').select('*');
  console.log('Companies:', { count: companies?.length, error: errComp });

  // 2. Customers
  const { data: customers, error: errCust } = await supabase.from('customers').select('*');
  console.log('Customers:', { count: customers?.length, first: customers?.[0]?.name, error: errCust });

  // 3. Service Orders
  const { data: orders, error: errOrders } = await supabase.from('service_orders').select('*');
  console.log('Service Orders:', { count: orders?.length, first: orders?.[0]?.number, error: errOrders });

  // 4. Test Customer Insert
  const testCustomer = {
    company_id: '00000000-0000-0000-0000-000000000001',
    name: 'Cliente Teste Schema ServiceForge',
    type: 'individual',
    cpf: '999.888.777-66',
    email: 'teste.schema@serviceforge.com',
    phone: '(11) 98888-7777',
    status: 'active'
  };

  const { data: createdCust, error: errCreateCust } = await supabase
    .from('customers')
    .insert(testCustomer)
    .select()
    .single();

  console.log('Created Customer in serviceforge schema:', { id: createdCust?.id, name: createdCust?.name, error: errCreateCust });

  // 5. Test Brands
  const { data: brands, error: errBrands } = await supabase.from('brands').select('*');
  console.log('Brands:', { count: brands?.length, error: errBrands });

  // 6. Test Financial Accounts
  const { data: accounts, error: errAcc } = await supabase.from('fin_accounts').select('*');
  console.log('Fin Accounts:', { count: accounts?.length, error: errAcc });

  // 7. Test Inventory
  const { data: products, error: errProd } = await supabase.from('inv_products').select('*');
  console.log('Products:', { count: products?.length, error: errProd });

  if (errComp || errCust || errOrders || errCreateCust || errBrands || errAcc || errProd) {
    console.error('❌ One or more queries failed!');
    process.exit(1);
  } else {
    console.log('🎉 ALL QUERIES SUCCEEDED ON DEDICATED SCHEMA "serviceforge"!');
  }
}

run().catch(console.error);
