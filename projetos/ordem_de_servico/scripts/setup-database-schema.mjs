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

const schemaSql = `
-- =========================================================================
-- ServiceForge Platform - Full Schema Migration for Supabase / PostgreSQL
-- =========================================================================

-- 1. Clientes (customers)
CREATE TABLE IF NOT EXISTS public.customers (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT,
  name TEXT NOT NULL,
  trade_name TEXT,
  type TEXT DEFAULT 'PF',
  document TEXT,
  cpf TEXT,
  cnpj TEXT,
  rg TEXT,
  ie TEXT,
  state_registration TEXT,
  email TEXT,
  phone TEXT,
  mobile_phone TEXT,
  whatsapp TEXT,
  status TEXT DEFAULT 'active',
  credit_limit NUMERIC(15,2) DEFAULT 0,
  rating INTEGER DEFAULT 5,
  notes TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  addresses JSONB DEFAULT '[]'::jsonb,
  contacts JSONB DEFAULT '[]'::jsonb,
  timeline JSONB DEFAULT '[]'::jsonb,
  versions JSONB DEFAULT '[]'::jsonb,
  observations JSONB DEFAULT '[]'::jsonb,
  attachments JSONB DEFAULT '[]'::jsonb,
  linked_company_ids JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  deleted_by TEXT
);

-- 2. Equipamentos / Ativos (devices)
CREATE TABLE IF NOT EXISTS public.devices (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT,
  customer_id TEXT,
  brand_id TEXT,
  model_id TEXT,
  equipment_type_id TEXT,
  type TEXT,
  serial_number TEXT,
  asset_number TEXT,
  imei TEXT,
  color TEXT,
  status TEXT DEFAULT 'active',
  notes TEXT,
  accessories JSONB DEFAULT '[]'::jsonb,
  photos JSONB DEFAULT '[]'::jsonb,
  documents JSONB DEFAULT '[]'::jsonb,
  timeline JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Tipos de Equipamento (equipment_types)
CREATE TABLE IF NOT EXISTS public.equipment_types (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Modelos de Equipamento (models)
CREATE TABLE IF NOT EXISTS public.models (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT,
  brand_id TEXT,
  equipment_type_id TEXT,
  name TEXT NOT NULL,
  code TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Ordens de Serviço (service_orders)
CREATE TABLE IF NOT EXISTS public.service_orders (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT,
  number TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  customer_name TEXT,
  device_id TEXT,
  device_info TEXT,
  description TEXT,
  diagnosis TEXT,
  solution TEXT,
  technical_report TEXT,
  status TEXT DEFAULT 'Em Aberto',
  priority TEXT DEFAULT 'medium',
  origin TEXT DEFAULT 'Presencial',
  channel TEXT DEFAULT 'Presencial',
  total_services NUMERIC(15,2) DEFAULT 0,
  total_parts NUMERIC(15,2) DEFAULT 0,
  total_discount NUMERIC(15,2) DEFAULT 0,
  total_value NUMERIC(15,2) DEFAULT 0,
  technician_id TEXT,
  technician_name TEXT,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expected_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  checklist JSONB DEFAULT '[]'::jsonb,
  services JSONB DEFAULT '[]'::jsonb,
  parts JSONB DEFAULT '[]'::jsonb,
  timeline JSONB DEFAULT '[]'::jsonb,
  comments JSONB DEFAULT '[]'::jsonb,
  attachments JSONB DEFAULT '[]'::jsonb,
  budget JSONB DEFAULT '{}'::jsonb,
  approvals JSONB DEFAULT '[]'::jsonb,
  payments JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Configuração de Numeração de OS (so_numbering)
CREATE TABLE IF NOT EXISTS public.so_numbering (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT,
  prefix TEXT DEFAULT 'SF-',
  suffix TEXT DEFAULT '',
  digits INTEGER DEFAULT 6,
  reset_yearly BOOLEAN DEFAULT false,
  reset_monthly BOOLEAN DEFAULT false,
  current_sequence INTEGER DEFAULT 0,
  last_reset TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Status de OS (so_statuses)
CREATE TABLE IF NOT EXISTS public.so_statuses (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3b82f6',
  "order" INTEGER DEFAULT 1,
  is_default BOOLEAN DEFAULT false,
  is_final BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Checklists de OS (so_checklists)
CREATE TABLE IF NOT EXISTS public.so_checklists (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT,
  service_order_id TEXT,
  template_name TEXT,
  items JSONB DEFAULT '[]'::jsonb,
  completed_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Contas Financeiras (fin_accounts)
CREATE TABLE IF NOT EXISTS public.fin_accounts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT,
  name TEXT NOT NULL,
  code TEXT,
  type TEXT NOT NULL DEFAULT 'checking',
  bank TEXT,
  agency TEXT,
  account_number TEXT,
  initial_balance NUMERIC(15,2) DEFAULT 0,
  current_balance NUMERIC(15,2) DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Movimentações Financeiras (fin_transactions)
CREATE TABLE IF NOT EXISTS public.fin_transactions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT,
  account_id TEXT,
  type TEXT NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  category TEXT,
  description TEXT,
  reference_type TEXT,
  reference_id TEXT,
  date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. Contas a Pagar (fin_payables)
CREATE TABLE IF NOT EXISTS public.fin_payables (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT,
  supplier_id TEXT,
  supplier_name TEXT NOT NULL,
  description TEXT NOT NULL,
  original_value NUMERIC(15,2) NOT NULL,
  final_value NUMERIC(15,2) NOT NULL,
  paid_value NUMERIC(15,2) DEFAULT 0,
  due_date DATE NOT NULL,
  paid_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. Contas a Receber (fin_receivables)
CREATE TABLE IF NOT EXISTS public.fin_receivables (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT,
  customer_id TEXT,
  customer_name TEXT NOT NULL,
  service_order_id TEXT,
  description TEXT NOT NULL,
  original_value NUMERIC(15,2) NOT NULL,
  final_value NUMERIC(15,2) NOT NULL,
  received_value NUMERIC(15,2) DEFAULT 0,
  due_date DATE NOT NULL,
  received_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 13. Almoxarifados & Depósitos (inv_warehouses)
CREATE TABLE IF NOT EXISTS public.inv_warehouses (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  location TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 14. Produtos e Peças de Estoque (inv_products)
CREATE TABLE IF NOT EXISTS public.inv_products (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT,
  name TEXT NOT NULL,
  sku TEXT NOT NULL,
  cost_price NUMERIC(15,2) DEFAULT 0,
  sale_price NUMERIC(15,2) DEFAULT 0,
  current_stock NUMERIC(15,3) DEFAULT 0,
  min_stock NUMERIC(15,3) DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 15. Recursos Humanos & Funcionários (hr_employees)
CREATE TABLE IF NOT EXISTS public.hr_employees (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role_title TEXT NOT NULL,
  salary NUMERIC(15,2) DEFAULT 0,
  commission_rate NUMERIC(5,2) DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 16. user_companies (Tabela de vínculo usuário-empresa)
CREATE TABLE IF NOT EXISTS public.user_companies (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID,
  company_id TEXT,
  role TEXT DEFAULT 'admin',
  is_default BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ajustar brands company_id se necessário
ALTER TABLE public.brands ALTER COLUMN company_id DROP NOT NULL;

-- Inserir empresa padrão se não existir na tabela companies
INSERT INTO public.companies (id, name, legal_name, cnpj, slug, active)
VALUES ('00000000-0000-0000-0000-000000000001', 'ServiceForge Matriz Tecnologia', 'ServiceForge Tecnologia e Serviços Ltda', '12.345.678/0001-90', 'serviceforge-matriz', true)
ON CONFLICT (id) DO UPDATE SET active = true;

-- Inserir marcas base se vazias
INSERT INTO public.brands (id, company_id, name, active)
VALUES 
  ('brand-apple', '00000000-0000-0000-0000-000000000001', 'Apple', true),
  ('brand-samsung', '00000000-0000-0000-0000-000000000001', 'Samsung', true),
  ('brand-dell', '00000000-0000-0000-0000-000000000001', 'Dell', true),
  ('brand-hp', '00000000-0000-0000-0000-000000000001', 'HP', true),
  ('brand-lenovo', '00000000-0000-0000-0000-000000000001', 'Lenovo', true),
  ('brand-lg', '00000000-0000-0000-0000-000000000001', 'LG', true),
  ('brand-sony', '00000000-0000-0000-0000-000000000001', 'Sony', true)
ON CONFLICT (id) DO NOTHING;

-- Inserir tipos de equipamento base
INSERT INTO public.equipment_types (id, name, description, active)
VALUES
  ('type-notebook', 'Notebook / Laptop', 'Computador portátil', true),
  ('type-smartphone', 'Smartphone / Celular', 'Aparelho celular inteligente', true),
  ('type-desktop', 'Desktop / PC', 'Computador de mesa ou workstation', true),
  ('type-tablet', 'Tablet', 'Dispositivo tablet touch', true),
  ('type-impressora', 'Impressora / Multifuncional', 'Impressora jato de tinta ou laser', true)
ON CONFLICT (id) DO NOTHING;

-- Inserir modelos base
INSERT INTO public.models (id, brand_id, equipment_type_id, name, active)
VALUES
  ('model-macbook-pro', 'brand-apple', 'type-notebook', 'MacBook Pro M2 16"', true),
  ('model-iphone-14', 'brand-apple', 'type-smartphone', 'iPhone 14 Pro Max', true),
  ('model-galaxy-s23', 'brand-samsung', 'type-smartphone', 'Galaxy S23 Ultra', true),
  ('model-dell-latitude', 'brand-dell', 'type-notebook', 'Latitude 5430', true)
ON CONFLICT (id) DO NOTHING;

-- Inserir status padrão de OS
INSERT INTO public.so_statuses (id, name, color, "order", is_default, is_final)
VALUES
  ('status-1', 'Em Aberto', '#6b7280', 1, true, false),
  ('status-2', 'Em Diagnóstico', '#3b82f6', 2, false, false),
  ('status-3', 'Aguardando Aprovação', '#f59e0b', 3, false, false),
  ('status-4', 'Aprovada', '#10b981', 4, false, false),
  ('status-5', 'Em Execução', '#8b5cf6', 5, false, false),
  ('status-6', 'Pronta', '#22c55e', 7, false, false),
  ('status-7', 'Entregue', '#059669', 9, false, true),
  ('status-8', 'Cancelada', '#ef4444', 10, false, true)
ON CONFLICT (id) DO NOTHING;

-- Inserir numeração inicial de OS
INSERT INTO public.so_numbering (id, prefix, suffix, digits, current_sequence)
VALUES ('so-num-default', 'SF-', '', 6, 100)
ON CONFLICT (id) DO NOTHING;

-- Views com prefixo serviceforge_ para suporte a ambos os esquemas com RLS security_invoker
CREATE OR REPLACE VIEW public.serviceforge_customers WITH (security_invoker = on) AS SELECT * FROM public.customers;
CREATE OR REPLACE VIEW public.serviceforge_devices WITH (security_invoker = on) AS SELECT * FROM public.devices;
CREATE OR REPLACE VIEW public.serviceforge_service_orders WITH (security_invoker = on) AS SELECT * FROM public.service_orders;
CREATE OR REPLACE VIEW public.serviceforge_equipment_types WITH (security_invoker = on) AS SELECT * FROM public.equipment_types;
CREATE OR REPLACE VIEW public.serviceforge_models WITH (security_invoker = on) AS SELECT * FROM public.models;
CREATE OR REPLACE VIEW public.serviceforge_fin_accounts WITH (security_invoker = on) AS SELECT * FROM public.fin_accounts;
CREATE OR REPLACE VIEW public.serviceforge_inv_products WITH (security_invoker = on) AS SELECT * FROM public.inv_products;
CREATE OR REPLACE VIEW public.serviceforge_hr_employees WITH (security_invoker = on) AS SELECT * FROM public.hr_employees;

-- Habilitar RLS em todas as tabelas criadas
DO $$
DECLARE
  tbl text;
  tbls text[] := ARRAY[
    'customers', 'devices', 'equipment_types', 'models', 'service_orders',
    'so_numbering', 'so_statuses', 'so_checklists', 'fin_accounts',
    'fin_transactions', 'fin_payables', 'fin_receivables', 'inv_warehouses',
    'inv_products', 'hr_employees', 'user_companies'
  ];
BEGIN
  FOREACH tbl IN ARRAY tbls LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "permit_all_anon_auth" ON public.%I;', tbl);
    EXECUTE format('CREATE POLICY "permit_all_anon_auth" ON public.%I FOR ALL USING (true) WITH CHECK (true);', tbl);
    EXECUTE format('GRANT ALL ON public.%I TO anon, authenticated, service_role;', tbl);
  END LOOP;
  -- Também garantir permissões em companies, brands
  GRANT ALL ON public.companies TO anon, authenticated, service_role;
  GRANT ALL ON public.brands TO anon, authenticated, service_role;
END $$;
`;

try {
  console.log('Conectando ao PostgreSQL Supabase...');
  await client.connect();
  console.log('Conexão estabelecida! Executando migração DDL...');
  await client.query(schemaSql);
  console.log('✔ Migração DDL executada com sucesso!');

  const tablesRes = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;");
  console.log('Tabelas agora no schema public:', tablesRes.rows.map(r => r.table_name));

  await client.end();
} catch (err) {
  console.error('Erro na migração:', err);
  process.exit(1);
}
