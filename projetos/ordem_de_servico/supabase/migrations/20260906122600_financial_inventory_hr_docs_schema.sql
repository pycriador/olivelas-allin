-- ==============================================================================
-- SERVICEFORGE PLATFORM — SCHEMA COMPLEMENTAR (FINANCEIRO, ESTOQUE, COMPRAS, RH, DOCS)
-- Compatível com Lovable Cloud (UUIDs + RLS + Grants)
-- ==============================================================================

-- 1. MÓDULO FINANCEIRO
CREATE TABLE IF NOT EXISTS public.fin_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text NOT NULL,
  type text NOT NULL DEFAULT 'checking',
  bank text,
  agency text,
  account_number text,
  initial_balance numeric(14,2) DEFAULT 0,
  current_balance numeric(14,2) DEFAULT 0,
  active boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.fin_cost_centers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text NOT NULL,
  description text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.fin_payables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  supplier_name text,
  description text NOT NULL,
  document text,
  category text DEFAULT 'supplier',
  original_value numeric(12,2) NOT NULL DEFAULT 0,
  discount numeric(12,2) DEFAULT 0,
  fines numeric(12,2) DEFAULT 0,
  interest numeric(12,2) DEFAULT 0,
  final_value numeric(12,2) NOT NULL DEFAULT 0,
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date NOT NULL,
  paid_at timestamptz,
  paid_value numeric(12,2),
  payment_method text,
  financial_account_id uuid REFERENCES public.fin_accounts(id) ON DELETE SET NULL,
  cost_center_id uuid REFERENCES public.fin_cost_centers(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending',
  purchase_order_id uuid,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.fin_receivables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_name text,
  description text NOT NULL,
  document text,
  category text DEFAULT 'service',
  original_value numeric(12,2) NOT NULL DEFAULT 0,
  discount numeric(12,2) DEFAULT 0,
  fines numeric(12,2) DEFAULT 0,
  interest numeric(12,2) DEFAULT 0,
  final_value numeric(12,2) NOT NULL DEFAULT 0,
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date NOT NULL,
  received_at timestamptz,
  received_value numeric(12,2),
  payment_method text,
  financial_account_id uuid REFERENCES public.fin_accounts(id) ON DELETE SET NULL,
  cost_center_id uuid REFERENCES public.fin_cost_centers(id) ON DELETE SET NULL,
  service_order_id uuid REFERENCES public.service_orders(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.fin_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  financial_account_id uuid NOT NULL REFERENCES public.fin_accounts(id) ON DELETE CASCADE,
  type text NOT NULL,
  category text,
  description text NOT NULL,
  value numeric(12,2) NOT NULL,
  document text,
  transaction_date timestamptz DEFAULT now(),
  cost_center_id uuid REFERENCES public.fin_cost_centers(id) ON DELETE SET NULL,
  related_type text,
  related_id text,
  notes text,
  created_by text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.fin_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  number text NOT NULL,
  series text,
  type text DEFAULT 'service',
  status text DEFAULT 'draft',
  emitter_id text,
  emitter_name text,
  emitter_document text,
  receiver_id text,
  receiver_name text,
  receiver_document text,
  items jsonb DEFAULT '[]'::jsonb,
  subtotal numeric(12,2) DEFAULT 0,
  discount numeric(12,2) DEFAULT 0,
  taxes numeric(12,2) DEFAULT 0,
  total numeric(12,2) DEFAULT 0,
  issue_date timestamptz DEFAULT now(),
  key text,
  xml_url text,
  pdf_url text,
  notes text,
  service_order_id uuid REFERENCES public.service_orders(id) ON DELETE SET NULL,
  purchase_order_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. MÓDULO DE ESTOQUE & COMPRAS
CREATE TABLE IF NOT EXISTS public.inv_warehouses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text NOT NULL,
  location text,
  is_default boolean DEFAULT false,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.inv_bins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  warehouse_id uuid NOT NULL REFERENCES public.inv_warehouses(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  aisle text,
  shelf text,
  level text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.inv_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  sku text NOT NULL,
  barcode text,
  name text NOT NULL,
  description text,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL,
  unit text DEFAULT 'UN',
  cost_price numeric(12,2) DEFAULT 0,
  sale_price numeric(12,2) DEFAULT 0,
  current_stock numeric(10,2) DEFAULT 0,
  min_stock numeric(10,2) DEFAULT 0,
  max_stock numeric(10,2) DEFAULT 0,
  default_warehouse_id uuid REFERENCES public.inv_warehouses(id) ON DELETE SET NULL,
  default_bin_id uuid REFERENCES public.inv_bins(id) ON DELETE SET NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.inv_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.inv_products(id) ON DELETE CASCADE,
  warehouse_id uuid NOT NULL REFERENCES public.inv_warehouses(id) ON DELETE CASCADE,
  type text NOT NULL,
  quantity numeric(10,2) NOT NULL,
  unit_cost numeric(12,2) DEFAULT 0,
  total_cost numeric(12,2) DEFAULT 0,
  previous_stock numeric(10,2) DEFAULT 0,
  new_stock numeric(10,2) DEFAULT 0,
  reason text,
  service_order_id uuid REFERENCES public.service_orders(id) ON DELETE SET NULL,
  purchase_order_id uuid,
  created_by text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pur_purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  number text NOT NULL,
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'draft',
  items jsonb DEFAULT '[]'::jsonb,
  subtotal numeric(12,2) DEFAULT 0,
  shipping numeric(12,2) DEFAULT 0,
  discount numeric(12,2) DEFAULT 0,
  taxes numeric(12,2) DEFAULT 0,
  total numeric(12,2) DEFAULT 0,
  payment_term_id uuid REFERENCES public.payment_terms(id) ON DELETE SET NULL,
  expected_delivery_date date,
  notes text,
  created_by text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pur_receivings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  purchase_order_id uuid REFERENCES public.pur_purchase_orders(id) ON DELETE SET NULL,
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  invoice_number text,
  invoice_key text,
  warehouse_id uuid REFERENCES public.inv_warehouses(id) ON DELETE SET NULL,
  items jsonb DEFAULT '[]'::jsonb,
  total_value numeric(12,2) DEFAULT 0,
  received_by text,
  received_at timestamptz DEFAULT now(),
  notes text
);

-- 3. MÓDULO DE RECURSOS HUMANOS & COMISSÕES
CREATE TABLE IF NOT EXISTS public.hr_employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  document text,
  email text,
  phone text,
  role text NOT NULL,
  department text,
  hire_date date,
  base_salary numeric(12,2) DEFAULT 0,
  commission_rate_service numeric(5,2) DEFAULT 0,
  commission_rate_part numeric(5,2) DEFAULT 0,
  active boolean DEFAULT true,
  skills jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.hr_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.hr_employees(id) ON DELETE CASCADE,
  service_order_id uuid REFERENCES public.service_orders(id) ON DELETE SET NULL,
  description text NOT NULL,
  base_value numeric(12,2) NOT NULL,
  rate numeric(5,2) NOT NULL,
  commission_value numeric(12,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  paid_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.hr_timesheets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.hr_employees(id) ON DELETE CASCADE,
  date date NOT NULL,
  clock_in timestamptz,
  clock_out timestamptz,
  lunch_start timestamptz,
  lunch_end timestamptz,
  total_minutes integer DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- 4. MÓDULO DE DOCUMENTOS & ASSINATURAS
CREATE TABLE IF NOT EXISTS public.doc_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL,
  content jsonb NOT NULL,
  is_default boolean DEFAULT false,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.doc_generated (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  template_id uuid REFERENCES public.doc_templates(id) ON DELETE SET NULL,
  service_order_id uuid REFERENCES public.service_orders(id) ON DELETE SET NULL,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  type text NOT NULL,
  title text NOT NULL,
  pdf_url text,
  qr_code_hash text UNIQUE,
  is_signed boolean DEFAULT false,
  signature_data jsonb,
  created_at timestamptz DEFAULT now()
);

-- 5. GRANTS DE ACESSO
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- 6. ATIVAÇÃO DE RLS
ALTER TABLE public.fin_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_cost_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_payables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_receivables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inv_warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inv_bins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inv_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inv_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pur_purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pur_receivings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_timesheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doc_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doc_generated ENABLE ROW LEVEL SECURITY;

-- 7. POLÍTICAS DE ACESSO
CREATE POLICY fin_accounts_policy ON public.fin_accounts FOR ALL USING (true);
CREATE POLICY fin_cost_centers_policy ON public.fin_cost_centers FOR ALL USING (true);
CREATE POLICY fin_payables_policy ON public.fin_payables FOR ALL USING (true);
CREATE POLICY fin_receivables_policy ON public.fin_receivables FOR ALL USING (true);
CREATE POLICY fin_transactions_policy ON public.fin_transactions FOR ALL USING (true);
CREATE POLICY fin_invoices_policy ON public.fin_invoices FOR ALL USING (true);
CREATE POLICY inv_warehouses_policy ON public.inv_warehouses FOR ALL USING (true);
CREATE POLICY inv_bins_policy ON public.inv_bins FOR ALL USING (true);
CREATE POLICY inv_products_policy ON public.inv_products FOR ALL USING (true);
CREATE POLICY inv_movements_policy ON public.inv_movements FOR ALL USING (true);
CREATE POLICY pur_purchase_orders_policy ON public.pur_purchase_orders FOR ALL USING (true);
CREATE POLICY pur_receivings_policy ON public.pur_receivings FOR ALL USING (true);
CREATE POLICY hr_employees_policy ON public.hr_employees FOR ALL USING (true);
CREATE POLICY hr_commissions_policy ON public.hr_commissions FOR ALL USING (true);
CREATE POLICY hr_timesheets_policy ON public.hr_timesheets FOR ALL USING (true);
CREATE POLICY doc_templates_policy ON public.doc_templates FOR ALL USING (true);
CREATE POLICY doc_generated_policy ON public.doc_generated FOR ALL USING (true);
