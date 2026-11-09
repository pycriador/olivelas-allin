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

const fixSql = `
-- 1. Recrear todas as views com (security_invoker = on)

CREATE OR REPLACE VIEW public.serviceforge_customers WITH (security_invoker = on) AS
SELECT * FROM public.customers;

CREATE OR REPLACE VIEW public.serviceforge_devices WITH (security_invoker = on) AS
SELECT * FROM public.devices;

CREATE OR REPLACE VIEW public.serviceforge_service_orders WITH (security_invoker = on) AS
SELECT * FROM public.service_orders;

CREATE OR REPLACE VIEW public.serviceforge_equipment_types WITH (security_invoker = on) AS
SELECT * FROM public.equipment_types;

CREATE OR REPLACE VIEW public.serviceforge_models WITH (security_invoker = on) AS
SELECT * FROM public.models;

CREATE OR REPLACE VIEW public.serviceforge_fin_accounts WITH (security_invoker = on) AS
SELECT * FROM public.fin_accounts;

CREATE OR REPLACE VIEW public.serviceforge_inv_products WITH (security_invoker = on) AS
SELECT * FROM public.inv_products;

CREATE OR REPLACE VIEW public.serviceforge_hr_employees WITH (security_invoker = on) AS
SELECT
  id,
  company_id,
  name,
  email,
  phone,
  role_title,
  salary,
  commission_rate,
  active,
  created_at,
  updated_at
FROM public.hr_employees;

-- Garantir concessão de SELECT em todas as views para anon e authenticated
GRANT SELECT ON public.serviceforge_customers TO anon, authenticated, service_role;
GRANT SELECT ON public.serviceforge_devices TO anon, authenticated, service_role;
GRANT SELECT ON public.serviceforge_service_orders TO anon, authenticated, service_role;
GRANT SELECT ON public.serviceforge_equipment_types TO anon, authenticated, service_role;
GRANT SELECT ON public.serviceforge_models TO anon, authenticated, service_role;
GRANT SELECT ON public.serviceforge_fin_accounts TO anon, authenticated, service_role;
GRANT SELECT ON public.serviceforge_inv_products TO anon, authenticated, service_role;
GRANT SELECT ON public.serviceforge_hr_employees TO anon, authenticated, service_role;
`;

async function run() {
  await client.connect();
  console.log('Aplicando WITH (security_invoker = on) em todas as views...');
  await client.query(fixSql);
  console.log('✔ Todas as views atualizadas com security_invoker = on!');

  // Verificar as views no banco e suas opções
  const res = await client.query(`
    SELECT
      c.relname as view_name,
      c.reloptions
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'v'
    ORDER BY c.relname;
  `);

  console.log('\nViews no schema public e suas opções de segurança:');
  for (const row of res.rows) {
    console.log(`- ${row.view_name}: reloptions = ${JSON.stringify(row.reloptions)}`);
  }

  await client.end();
}

run().catch(console.error);
