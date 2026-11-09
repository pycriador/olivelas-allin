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

const ddl = `
-- 1. Create dedicated schema
CREATE SCHEMA IF NOT EXISTS serviceforge;

-- 2. Grant permissions
GRANT USAGE ON SCHEMA serviceforge TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA serviceforge TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA serviceforge TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA serviceforge TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA serviceforge GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA serviceforge GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA serviceforge GRANT ALL ON ROUTINES TO postgres, anon, authenticated, service_role;

-- 3. Expose serviceforge schema in PostgREST
DO $$
BEGIN
  EXECUTE 'ALTER ROLE authenticator SET pgrst.db_schemas = ''public, serviceforge''';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not alter authenticator: %', SQLERRM;
END $$;

-- 4. Create Tables in serviceforge schema

-- Companies
CREATE TABLE IF NOT EXISTS serviceforge.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  legal_name text,
  trade_name text,
  cnpj text,
  phone text,
  email text,
  logo_url text,
  active boolean DEFAULT true,
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- User Companies
CREATE TABLE IF NOT EXISTS serviceforge.user_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_id uuid NOT NULL REFERENCES serviceforge.companies(id) ON DELETE CASCADE,
  role text DEFAULT 'admin',
  is_default boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Profiles
CREATE TABLE IF NOT EXISTS serviceforge.profiles (
  id uuid PRIMARY KEY,
  company_id uuid,
  name text,
  email text,
  avatar_url text,
  role text DEFAULT 'admin',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Configuration
CREATE TABLE IF NOT EXISTS serviceforge.configuration (
  id text PRIMARY KEY,
  value jsonb DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Database Connections
CREATE TABLE IF NOT EXISTS serviceforge.database_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid,
  name text NOT NULL,
  type text DEFAULT 'postgres',
  status text DEFAULT 'connected',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Audit Log
CREATE TABLE IF NOT EXISTS serviceforge.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid,
  user_id uuid,
  action text NOT NULL,
  entity text,
  entity_id text,
  details jsonb DEFAULT '{}'::jsonb,
  timestamp timestamptz NOT NULL DEFAULT now()
);

-- Customers
CREATE TABLE IF NOT EXISTS serviceforge.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid,
  name text NOT NULL,
  trade_name text,
  type text DEFAULT 'individual',
  document text,
  cpf text,
  cnpj text,
  rg text,
  birth_date text,
  company_name text,
  fantasy_name text,
  state_registration text,
  municipal_registration text,
  email text,
  secondary_email text,
  phone text,
  cellphone text,
  whatsapp text,
  website text,
  profession text,
  status text DEFAULT 'active',
  credit_limit numeric(15,2) DEFAULT 0,
  rating integer DEFAULT 5,
  classification text,
  notes text,
  tags jsonb DEFAULT '[]'::jsonb,
  addresses jsonb DEFAULT '[]'::jsonb,
  contacts jsonb DEFAULT '[]'::jsonb,
  timeline jsonb DEFAULT '[]'::jsonb,
  versions jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

-- Equipment / Devices
CREATE TABLE IF NOT EXISTS serviceforge.devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid,
  customer_id uuid,
  brand_id uuid,
  model_id uuid,
  equipment_type_id uuid,
  type text,
  brand text,
  model text,
  serial_number text,
  asset_number text,
  imei text,
  color text,
  status text DEFAULT 'active',
  notes text,
  accessories jsonb DEFAULT '[]'::jsonb,
  photos jsonb DEFAULT '[]'::jsonb,
  documents jsonb DEFAULT '[]'::jsonb,
  timeline jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

-- Brands
CREATE TABLE IF NOT EXISTS serviceforge.brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid,
  manufacturer_id text,
  name text NOT NULL,
  notes text,
  status text DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Models
CREATE TABLE IF NOT EXISTS serviceforge.models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid,
  brand_id uuid,
  equipment_type_id uuid,
  name text NOT NULL,
  code text,
  active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Categories
CREATE TABLE IF NOT EXISTS serviceforge.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid,
  name text NOT NULL,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Equipment Types
CREATE TABLE IF NOT EXISTS serviceforge.equipment_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid,
  name text NOT NULL,
  description text,
  icon text,
  active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Manufacturers
CREATE TABLE IF NOT EXISTS serviceforge.manufacturers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid,
  name text NOT NULL,
  notes text,
  status text DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Technicians
CREATE TABLE IF NOT EXISTS serviceforge.technicians (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid,
  name text NOT NULL,
  email text,
  phone text,
  specialty text,
  active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Services
CREATE TABLE IF NOT EXISTS serviceforge.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid,
  name text NOT NULL,
  description text,
  default_price numeric(15,2) DEFAULT 0,
  estimated_hours numeric(5,2) DEFAULT 1,
  active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Service Orders (OS)
CREATE TABLE IF NOT EXISTS serviceforge.service_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid,
  number text,
  customer_id uuid,
  equipment_id uuid,
  device_id uuid,
  customer_name text,
  description text,
  reported_defect text,
  technical_report text,
  status text DEFAULT 'open',
  priority text DEFAULT 'normal',
  technician_id uuid,
  entry_date timestamptz DEFAULT now(),
  delivery_date timestamptz,
  labor_total numeric(15,2) DEFAULT 0,
  parts_total numeric(15,2) DEFAULT 0,
  discount numeric(15,2) DEFAULT 0,
  total numeric(15,2) DEFAULT 0,
  payment_method text,
  warranty_days integer DEFAULT 90,
  accessories jsonb DEFAULT '[]'::jsonb,
  custom_fields jsonb DEFAULT '{}'::jsonb,
  tags jsonb DEFAULT '[]'::jsonb,
  timeline jsonb DEFAULT '[]'::jsonb,
  photos jsonb DEFAULT '[]'::jsonb,
  history jsonb DEFAULT '[]'::jsonb,
  comments jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

-- SO Statuses
CREATE TABLE IF NOT EXISTS serviceforge.so_statuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid,
  code text NOT NULL,
  label text NOT NULL,
  color text DEFAULT '#64748b',
  "order" integer DEFAULT 0,
  is_final boolean DEFAULT false,
  active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- SO Checklists
CREATE TABLE IF NOT EXISTS serviceforge.so_checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid,
  name text NOT NULL,
  items jsonb DEFAULT '[]'::jsonb,
  active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- SO Numbering
CREATE TABLE IF NOT EXISTS serviceforge.so_numbering (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid,
  prefix text DEFAULT 'OS-',
  next_number integer DEFAULT 1,
  padding integer DEFAULT 6,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Financial: Accounts
CREATE TABLE IF NOT EXISTS serviceforge.fin_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid,
  name text NOT NULL,
  bank text,
  agency text,
  account_number text,
  type text DEFAULT 'checking',
  balance numeric(15,2) DEFAULT 0,
  status text DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Financial: Transactions
CREATE TABLE IF NOT EXISTS serviceforge.fin_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid,
  account_id uuid,
  type text NOT NULL,
  category text,
  description text NOT NULL,
  amount numeric(15,2) NOT NULL,
  date date DEFAULT current_date,
  status text DEFAULT 'completed',
  reference_type text,
  reference_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Financial: Payables
CREATE TABLE IF NOT EXISTS serviceforge.fin_payables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid,
  description text NOT NULL,
  supplier_id uuid,
  amount numeric(15,2) NOT NULL,
  due_date date NOT NULL,
  payment_date date,
  status text DEFAULT 'pending',
  category text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Financial: Receivables
CREATE TABLE IF NOT EXISTS serviceforge.fin_receivables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid,
  service_order_id uuid,
  customer_id uuid,
  description text NOT NULL,
  amount numeric(15,2) NOT NULL,
  due_date date NOT NULL,
  received_date date,
  status text DEFAULT 'pending',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Payment Methods
CREATE TABLE IF NOT EXISTS serviceforge.payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid,
  name text NOT NULL,
  code text,
  type text DEFAULT 'other',
  active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Payment Terms
CREATE TABLE IF NOT EXISTS serviceforge.payment_terms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid,
  name text NOT NULL,
  installments integer DEFAULT 1,
  interval_days integer DEFAULT 30,
  active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Inventory: Products & Parts
CREATE TABLE IF NOT EXISTS serviceforge.inv_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid,
  code text,
  barcode text,
  name text NOT NULL,
  description text,
  category_id uuid,
  brand_id uuid,
  cost_price numeric(15,2) DEFAULT 0,
  sale_price numeric(15,2) DEFAULT 0,
  stock_quantity numeric(15,3) DEFAULT 0,
  min_stock numeric(15,3) DEFAULT 0,
  unit text DEFAULT 'UN',
  status text DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Inventory: Warehouses
CREATE TABLE IF NOT EXISTS serviceforge.inv_warehouses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid,
  name text NOT NULL,
  code text,
  address text,
  active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Inventory: Movements
CREATE TABLE IF NOT EXISTS serviceforge.inventory_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid,
  product_id uuid,
  warehouse_id uuid,
  type text NOT NULL,
  quantity numeric(15,3) NOT NULL,
  reference_type text,
  reference_id text,
  notes text,
  date timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Suppliers
CREATE TABLE IF NOT EXISTS serviceforge.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid,
  name text NOT NULL,
  cnpj text,
  email text,
  phone text,
  contact_name text,
  status text DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- HR: Employees
CREATE TABLE IF NOT EXISTS serviceforge.hr_employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid,
  name text NOT NULL,
  email text,
  phone text,
  role_title text,
  salary numeric(15,2) DEFAULT 0,
  commission_rate numeric(5,2) DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Warranties
CREATE TABLE IF NOT EXISTS serviceforge.warranties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid,
  name text NOT NULL,
  days integer DEFAULT 90,
  terms text,
  active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Defects
CREATE TABLE IF NOT EXISTS serviceforge.defects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid,
  name text NOT NULL,
  description text,
  category text,
  active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Parts
CREATE TABLE IF NOT EXISTS serviceforge.parts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid,
  name text NOT NULL,
  code text,
  cost_price numeric(15,2) DEFAULT 0,
  sale_price numeric(15,2) DEFAULT 0,
  stock_quantity numeric(15,2) DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Events: Bus Tables
CREATE TABLE IF NOT EXISTS serviceforge.evt_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid,
  event_name text NOT NULL,
  payload jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS serviceforge.evt_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid,
  workflow_id uuid,
  event_id uuid,
  status text DEFAULT 'success',
  result jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS serviceforge.evt_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  action text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS serviceforge.evt_store (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid,
  stream_id text NOT NULL,
  event_type text NOT NULL,
  data jsonb NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  version integer DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS serviceforge.evt_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid,
  name text NOT NULL,
  event_name text NOT NULL,
  endpoint text,
  active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS serviceforge.evt_workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid,
  name text NOT NULL,
  trigger_event text NOT NULL,
  actions jsonb DEFAULT '[]'::jsonb,
  active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Enable RLS on all tables and add permissive policies
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'serviceforge' AND table_type = 'BASE TABLE'
  LOOP
    EXECUTE format('ALTER TABLE serviceforge.%I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('DROP POLICY IF EXISTS "serviceforge_all_%I" ON serviceforge.%I;', t, t);
    EXECUTE format('CREATE POLICY "serviceforge_all_%I" ON serviceforge.%I FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);', t, t);
  END LOOP;
END $$;
`;

const seedSql = `
-- 6. Insert Default Company if not exists
INSERT INTO serviceforge.companies (id, name, legal_name, trade_name, cnpj, phone, email, active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'ServiceForge Matriz',
  'ServiceForge Tecnologia LTDA',
  'ServiceForge Matriz',
  '12.345.678/0001-90',
  '(11) 4002-8922',
  'contato@serviceforge.com.br',
  true
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  trade_name = EXCLUDED.trade_name;

-- Link user willian to company
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'willian.o.jesus@gmail.com' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    INSERT INTO serviceforge.user_companies (user_id, company_id, role, is_default)
    VALUES (v_user_id, '00000000-0000-0000-0000-000000000001', 'admin', true)
    ON CONFLICT DO NOTHING;

    INSERT INTO serviceforge.profiles (id, company_id, name, email, role)
    VALUES (v_user_id, '00000000-0000-0000-0000-000000000001', 'Willian Jesus', 'willian.o.jesus@gmail.com', 'admin')
    ON CONFLICT (id) DO UPDATE SET company_id = EXCLUDED.company_id;
  END IF;
END $$;

-- SO Statuses Seed
INSERT INTO serviceforge.so_statuses (company_id, code, label, color, "order", is_final, active)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'open', 'Aberta', '#3b82f6', 1, false, true),
  ('00000000-0000-0000-0000-000000000001', 'in_diagnosis', 'Em Diagnóstico', '#f59e0b', 2, false, true),
  ('00000000-0000-0000-0000-000000000001', 'awaiting_approval', 'Aguardando Aprovação', '#8b5cf6', 3, false, true),
  ('00000000-0000-0000-0000-000000000001', 'approved', 'Aprovada', '#10b981', 4, false, true),
  ('00000000-0000-0000-0000-000000000001', 'in_progress', 'Em Execução', '#06b6d4', 5, false, true),
  ('00000000-0000-0000-0000-000000000001', 'completed', 'Concluída', '#10b981', 6, true, true),
  ('00000000-0000-0000-0000-000000000001', 'delivered', 'Entregue', '#64748b', 7, true, true),
  ('00000000-0000-0000-0000-000000000001', 'cancelled', 'Cancelada', '#ef4444', 8, true, true)
ON CONFLICT DO NOTHING;

-- Seed Brands
INSERT INTO serviceforge.brands (company_id, name, status)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Apple', 'active'),
  ('00000000-0000-0000-0000-000000000001', 'Samsung', 'active'),
  ('00000000-0000-0000-0000-000000000001', 'Dell', 'active'),
  ('00000000-0000-0000-0000-000000000001', 'Lenovo', 'active'),
  ('00000000-0000-0000-0000-000000000001', 'Motorola', 'active')
ON CONFLICT DO NOTHING;

-- Seed Categories
INSERT INTO serviceforge.categories (company_id, name, description, status)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Smartphones', 'Celulares e smartphones de todas as marcas', 'active'),
  ('00000000-0000-0000-0000-000000000001', 'Notebooks', 'Laptops, macbooks e ultrabooks', 'active'),
  ('00000000-0000-0000-0000-000000000001', 'Desktops', 'Computadores de mesa e servidores', 'active'),
  ('00000000-0000-0000-0000-000000000001', 'Tablets', 'iPads e tablets Android', 'active')
ON CONFLICT DO NOTHING;

-- Seed a Customer
INSERT INTO serviceforge.customers (
  id,
  company_id,
  name,
  type,
  cpf,
  email,
  phone,
  cellphone,
  whatsapp,
  status,
  addresses
)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000001',
  'Willian Oliveira Jesus',
  'individual',
  '123.456.789-00',
  'willian.o.jesus@gmail.com',
  '(11) 98765-4321',
  '(11) 98765-4321',
  '(11) 98765-4321',
  'active',
  '[{"street": "Av. Paulista", "number": "1000", "neighborhood": "Bela Vista", "city": "São Paulo", "state": "SP", "zipCode": "01310-100", "isDefault": true}]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email;

-- Seed sample equipment
INSERT INTO serviceforge.devices (
  id,
  company_id,
  customer_id,
  brand,
  model,
  serial_number,
  color,
  status,
  notes
)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  '00000000-0000-0000-0000-000000000001',
  '11111111-1111-1111-1111-111111111111',
  'Apple',
  'iPhone 15 Pro Max',
  'DNQZ98765432',
  'Titânio Natural',
  'active',
  'Aparelho em excelente estado'
)
ON CONFLICT (id) DO NOTHING;

-- Seed sample service order
INSERT INTO serviceforge.service_orders (
  id,
  company_id,
  number,
  customer_id,
  customer_name,
  equipment_id,
  device_id,
  description,
  reported_defect,
  status,
  priority,
  entry_date,
  labor_total,
  parts_total,
  total
)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  '00000000-0000-0000-0000-000000000001',
  'OS-000001',
  '11111111-1111-1111-1111-111111111111',
  'Willian Oliveira Jesus',
  '22222222-2222-2222-2222-222222222222',
  '22222222-2222-2222-2222-222222222222',
  'Troca de conector de carga e diagnóstico de bateria',
  'Aparelho não reconhece cabo USB-C',
  'open',
  'normal',
  now(),
  150.00,
  80.00,
  230.00
)
ON CONFLICT (id) DO NOTHING;

-- Seed Bank Account
INSERT INTO serviceforge.fin_accounts (
  id,
  company_id,
  name,
  bank,
  agency,
  account_number,
  type,
  balance,
  status
)
VALUES (
  '44444444-4444-4444-4444-444444444444',
  '00000000-0000-0000-0000-000000000001',
  'Conta Principal Itaú',
  'Itaú Unibanco',
  '0123',
  '45678-9',
  'checking',
  25400.00,
  'active'
)
ON CONFLICT (id) DO NOTHING;

-- Seed Inventory Product
INSERT INTO serviceforge.inv_products (
  id,
  company_id,
  code,
  name,
  description,
  cost_price,
  sale_price,
  stock_quantity,
  min_stock,
  status
)
VALUES (
  '55555555-5555-5555-5555-555555555555',
  '00000000-0000-0000-0000-000000000001',
  'PRD-001',
  'Conector USB-C Apple Original',
  'Módulo de carga original tipo C',
  45.00,
  120.00,
  15.00,
  5.00,
  'active'
)
ON CONFLICT (id) DO NOTHING;
`;

async function run() {
  console.log('Connecting to Supabase PostgreSQL...');
  await client.connect();

  console.log('Creating schema and tables in "serviceforge"...');
  await client.query(ddl);

  console.log('Seeding initial records into "serviceforge" schema...');
  await client.query(seedSql);

  // Notify PostgREST to reload configuration
  await client.query("NOTIFY pgrst, 'reload config';");
  console.log('PostgREST reloaded successfully.');

  // List created tables in serviceforge
  const res = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'serviceforge' 
    ORDER BY table_name;
  `);
  console.log(`✅ Total tables created in "serviceforge" schema: ${res.rows.length}`);
  console.log(res.rows.map(r => r.table_name));

  await client.end();
}

run().catch((err) => {
  console.error('❌ Error creating schema:', err);
  process.exit(1);
});
