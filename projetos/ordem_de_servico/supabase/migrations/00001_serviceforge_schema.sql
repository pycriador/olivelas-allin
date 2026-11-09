-- ServiceForge Platform — Supabase Schema
-- This migration creates all tables for the 37 modules

-- ============================================================
-- UTILITY FUNCTIONS
-- ============================================================

create extension if not exists "pgcrypto";

create or replace function gen_uid() returns text as $$
  select upper(substr(md5(gen_random_uuid()::text), 1, 12));
$$ language sql;

create or replace function now_utc() returns timestamptz as $$
  select now() at time zone 'utc';
$$ language sql;

-- ============================================================
-- 1. COMPANIES
-- ============================================================

create table if not exists companies (
  id text primary key default gen_uid(),
  name text not null,
  document text,
  email text,
  phone text,
  logo text,
  active boolean default true,
  settings jsonb default '{}',
  created_at timestamptz default now_utc(),
  updated_at timestamptz default now_utc()
);

-- ============================================================
-- 2. ADMIN — Users, Roles, Permissions
-- ============================================================

create table if not exists users (
  id text primary key default gen_uid(),
  email text unique not null,
  name text not null,
  role text default 'viewer',
  company_id text references companies(id),
  active boolean default true,
  preferences jsonb default '{}',
  created_at timestamptz default now_utc(),
  updated_at timestamptz default now_utc()
);

create table if not exists roles (
  id text primary key default gen_uid(),
  name text not null,
  description text,
  permissions jsonb default '[]',
  created_at timestamptz default now_utc()
);

create table if not exists audit_log (
  id text primary key default gen_uid(),
  user_id text references users(id),
  action text not null,
  entity text not null,
  entity_id text,
  details jsonb default '{}',
  created_at timestamptz default now_utc()
);

-- ============================================================
-- 3. CUSTOMERS
-- ============================================================

create table if not exists customers (
  id text primary key default gen_uid(),
  name text not null,
  document text,
  email text,
  phone text,
  mobile text,
  type text default 'pf',
  company_id text references companies(id),
  notes text,
  active boolean default true,
  tags jsonb default '[]',
  created_at timestamptz default now_utc(),
  updated_at timestamptz default now_utc()
);

create table if not exists customer_addresses (
  id text primary key default gen_uid(),
  customer_id text references customers(id) on delete cascade,
  label text,
  street text,
  number text,
  complement text,
  neighborhood text,
  city text,
  state text,
  zip text,
  type text default 'residential',
  created_at timestamptz default now_utc()
);

create table if not exists customer_contacts (
  id text primary key default gen_uid(),
  customer_id text references customers(id) on delete cascade,
  name text,
  email text,
  phone text,
  role text,
  is_primary boolean default false,
  created_at timestamptz default now_utc()
);

-- ============================================================
-- 4. SERVICE ORDERS
-- ============================================================

create table if not exists service_orders (
  id text primary key default gen_uid(),
  number text not null,
  company_id text references companies(id),
  customer_id text references customers(id),
  customer_name text,
  device_id text,
  device_info text,
  technician_id text,
  technician_name text,
  defect_id text,
  defect_name text,
  category_id text,
  description text,
  diagnosis text,
  notes text,
  priority text default 'medium',
  status text default 'Em Aberto',
  status_label text,
  warranty_id text,
  entry_date timestamptz default now_utc(),
  deadline timestamptz,
  delivery_date timestamptz,
  estimated_value numeric(12,2),
  final_value numeric(12,2),
  services jsonb default '[]',
  parts jsonb default '[]',
  timeline jsonb default '[]',
  comments jsonb default '[]',
  attachments jsonb default '[]',
  documents jsonb default '[]',
  communications jsonb default '[]',
  tags jsonb default '[]',
  pinned boolean default false,
  created_at timestamptz default now_utc(),
  updated_at timestamptz default now_utc(),
  created_by text,
  updated_by text
);

create index idx_so_customer on service_orders(customer_id);
create index idx_so_status on service_orders(status);
create index idx_so_technician on service_orders(technician_id);
create index idx_so_number on service_orders(number);

-- Service Order sub-entities (stored in dedicated tables for proper relational access)

create table if not exists so_diagnostics (
  id text primary key default gen_uid(),
  service_order_id text references service_orders(id) on delete cascade,
  current_version int default 1,
  revisions jsonb default '[]',
  created_at timestamptz default now_utc(),
  updated_at timestamptz default now_utc()
);

create table if not exists so_checklists (
  id text primary key default gen_uid(),
  service_order_id text references service_orders(id) on delete cascade,
  name text,
  items jsonb default '[]',
  completed boolean default false,
  created_at timestamptz default now_utc()
);

create table if not exists so_execution_activities (
  id text primary key default gen_uid(),
  service_order_id text references service_orders(id) on delete cascade,
  name text,
  description text,
  status text default 'pending',
  assigned_to text,
  time_tracking jsonb default '{}',
  comments jsonb default '[]',
  created_at timestamptz default now_utc(),
  updated_at timestamptz default now_utc()
);

create table if not exists so_photos (
  id text primary key default gen_uid(),
  service_order_id text references service_orders(id) on delete cascade,
  url text,
  thumb_url text,
  category text,
  description text,
  favorite boolean default false,
  uploaded_by text,
  created_at timestamptz default now_utc()
);

create table if not exists so_returns (
  id text primary key default gen_uid(),
  service_order_id text references service_orders(id) on delete cascade,
  reason text,
  description text,
  status text default 'open',
  comments jsonb default '[]',
  created_by text,
  created_at timestamptz default now_utc(),
  updated_at timestamptz default now_utc()
);

create table if not exists so_warranties (
  id text primary key default gen_uid(),
  service_order_id text references service_orders(id) on delete cascade,
  type text,
  description text,
  duration_days int,
  start_date timestamptz,
  end_date timestamptz,
  status text default 'active',
  created_at timestamptz default now_utc(),
  updated_at timestamptz default now_utc()
);

create table if not exists so_budgets (
  id text primary key default gen_uid(),
  service_order_id text references service_orders(id) on delete cascade,
  version int default 1,
  items jsonb default '[]',
  subtotal numeric(12,2) default 0,
  discount_type text,
  discount_value numeric(12,2) default 0,
  discount_total numeric(12,2) default 0,
  tax numeric(12,2) default 0,
  final_value numeric(12,2) default 0,
  validity_days int default 7,
  notes text,
  status text default 'draft',
  created_by text,
  created_at timestamptz default now_utc(),
  updated_at timestamptz default now_utc()
);

create table if not exists so_approvals (
  id text primary key default gen_uid(),
  service_order_id text references service_orders(id) on delete cascade,
  method text,
  status text default 'pending',
  requested_at timestamptz,
  responded_at timestamptz,
  response text,
  notes text,
  created_by text,
  created_at timestamptz default now_utc(),
  updated_at timestamptz default now_utc()
);

create table if not exists so_payments (
  id text primary key default gen_uid(),
  service_order_id text references service_orders(id) on delete cascade,
  method text,
  amount numeric(12,2),
  installments int default 1,
  status text default 'pending',
  confirmed_by text,
  confirmed_at timestamptz,
  created_at timestamptz default now_utc()
);

create table if not exists so_deliveries (
  id text primary key default gen_uid(),
  service_order_id text references service_orders(id) on delete cascade,
  type text default 'pickup',
  delivered_by text,
  received_by text,
  checklist jsonb default '[]',
  notes text,
  completed_at timestamptz,
  created_at timestamptz default now_utc()
);

create table if not exists so_signatures (
  id text primary key default gen_uid(),
  service_order_id text references service_orders(id) on delete cascade,
  type text,
  signatory_name text,
  signatory_document text,
  signature_data text,
  collected_at timestamptz default now_utc()
);

create table if not exists so_receipts (
  id text primary key default gen_uid(),
  service_order_id text references service_orders(id) on delete cascade,
  type text,
  number text,
  data jsonb default '{}',
  generated_by text,
  generated_at timestamptz default now_utc()
);

create table if not exists so_financial_history (
  id text primary key default gen_uid(),
  service_order_id text references service_orders(id) on delete cascade,
  type text,
  description text,
  amount numeric(12,2),
  user_name text,
  created_at timestamptz default now_utc()
);

create table if not exists so_tests (
  id text primary key default gen_uid(),
  service_order_id text references service_orders(id) on delete cascade,
  type text,
  name text,
  description text,
  result text default 'pending',
  notes text,
  tested_by text,
  tested_at timestamptz,
  created_at timestamptz default now_utc(),
  updated_at timestamptz default now_utc()
);

create table if not exists so_quality_control (
  id text primary key default gen_uid(),
  service_order_id text references service_orders(id) on delete cascade,
  result text,
  observations text,
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz default now_utc()
);

create table if not exists so_costs (
  id text primary key default gen_uid(),
  service_order_id text references service_orders(id) on delete cascade,
  parts_cost numeric(12,2) default 0,
  labor_cost numeric(12,2) default 0,
  third_party_cost numeric(12,2) default 0,
  total_cost numeric(12,2) default 0,
  final_value numeric(12,2) default 0,
  margin numeric(12,2) default 0,
  profit numeric(12,2) default 0,
  created_at timestamptz default now_utc(),
  updated_at timestamptz default now_utc()
);

-- ============================================================
-- 5. DEVICES / ASSETS
-- ============================================================

create table if not exists equipment_types (
  id text primary key default gen_uid(),
  name text not null,
  description text,
  created_at timestamptz default now_utc()
);

create table if not exists manufacturers (
  id text primary key default gen_uid(),
  name text not null,
  created_at timestamptz default now_utc()
);

create table if not exists brands (
  id text primary key default gen_uid(),
  name text not null,
  manufacturer_id text references manufacturers(id),
  created_at timestamptz default now_utc()
);

create table if not exists models (
  id text primary key default gen_uid(),
  name text not null,
  brand_id text references brands(id),
  equipment_type_id text references equipment_types(id),
  created_at timestamptz default now_utc()
);

create table if not exists devices (
  id text primary key default gen_uid(),
  customer_id text references customers(id),
  equipment_type_id text references equipment_types(id),
  brand_id text references brands(id),
  model_id text references models(id),
  serial text,
  color text,
  accessories text,
  notes text,
  photos jsonb default '[]',
  documents jsonb default '[]',
  created_at timestamptz default now_utc(),
  updated_at timestamptz default now_utc()
);

-- ============================================================
-- 6. RECORDS (Parts, Services, Defects, etc.)
-- ============================================================

create table if not exists parts (
  id text primary key default gen_uid(),
  name text not null,
  code text,
  description text,
  unit text,
  cost_price numeric(12,2) default 0,
  sale_price numeric(12,2) default 0,
  stock_min int default 0,
  stock_current int default 0,
  created_at timestamptz default now_utc()
);

create table if not exists services_catalog (
  id text primary key default gen_uid(),
  name text not null,
  description text,
  estimated_time int,
  default_value numeric(12,2) default 0,
  created_at timestamptz default now_utc()
);

create table if not exists defects (
  id text primary key default gen_uid(),
  name text not null,
  equipment_type_id text references equipment_types(id),
  description text,
  created_at timestamptz default now_utc()
);

create table if not exists categories (
  id text primary key default gen_uid(),
  name text not null,
  type text,
  created_at timestamptz default now_utc()
);

create table if not exists measurement_units (
  id text primary key default gen_uid(),
  name text not null,
  abbreviation text,
  created_at timestamptz default now_utc()
);

create table if not exists technicians (
  id text primary key default gen_uid(),
  name text not null,
  email text,
  phone text,
  document text,
  specialties jsonb default '[]',
  active boolean default true,
  created_at timestamptz default now_utc()
);

create table if not exists suppliers (
  id text primary key default gen_uid(),
  name text not null,
  document text,
  email text,
  phone text,
  created_at timestamptz default now_utc()
);

create table if not exists payment_methods (
  id text primary key default gen_uid(),
  name text not null,
  created_at timestamptz default now_utc()
);

create table if not exists payment_terms (
  id text primary key default gen_uid(),
  name text not null,
  installments int default 1,
  days_between int default 30,
  created_at timestamptz default now_utc()
);

create table if not exists warranties (
  id text primary key default gen_uid(),
  name text not null,
  duration_days int,
  description text,
  created_at timestamptz default now_utc()
);

-- ============================================================
-- 7. KNOWLEDGE PLATFORM
-- ============================================================

create table if not exists knowledge_articles (
  id text primary key default gen_uid(),
  type text not null,
  title text not null,
  summary text,
  content text,
  category_id text,
  category_name text,
  language text default 'pt-BR',
  status text default 'draft',
  difficulty text default 'intermediate',
  author text,
  author_id text,
  manufacturer text,
  brand text,
  model text,
  equipment_type_id text,
  equipment_type_name text,
  keywords jsonb default '[]',
  tags jsonb default '[]',
  attachments jsonb default '[]',
  comments jsonb default '[]',
  relationships jsonb default '[]',
  versions jsonb default '[]',
  version int default 1,
  analytics jsonb default '{}',
  views int default 0,
  favorites int default 0,
  pinned boolean default false,
  ai_generated boolean default false,
  ai_summary text,
  ai_keywords jsonb default '[]',
  estimated_time int,
  tools jsonb default '[]',
  parts jsonb default '[]',
  prerequisites jsonb default '[]',
  checklist jsonb default '[]',
  steps jsonb default '[]',
  images jsonb default '[]',
  videos jsonb default '[]',
  subcategory text,
  reviewer text,
  reviewer_id text,
  created_at timestamptz default now_utc(),
  updated_at timestamptz default now_utc(),
  created_by text,
  updated_by text
);

create index idx_ka_status on knowledge_articles(status);
create index idx_ka_type on knowledge_articles(type);
create index idx_ka_brand on knowledge_articles(brand);
create index idx_ka_category on knowledge_articles(category_id);

create table if not exists knowledge_categories (
  id text primary key default gen_uid(),
  name text not null,
  description text,
  icon text,
  color text,
  "order" int default 0,
  article_count int default 0,
  created_at timestamptz default now_utc(),
  updated_at timestamptz default now_utc()
);

create table if not exists knowledge_collections (
  id text primary key default gen_uid(),
  name text not null,
  description text,
  articles jsonb default '[]',
  created_by text,
  created_at timestamptz default now_utc(),
  updated_at timestamptz default now_utc()
);

-- ============================================================
-- 8. FINANCIAL
-- ============================================================

create table if not exists financial_accounts (
  id text primary key default gen_uid(),
  name text not null,
  type text,
  code text,
  balance numeric(12,2) default 0,
  company_id text references companies(id),
  created_at timestamptz default now_utc()
);

create table if not exists financial_transactions (
  id text primary key default gen_uid(),
  account_id text references financial_accounts(id),
  type text,
  description text,
  amount numeric(12,2),
  category text,
  reference_id text,
  reference_type text,
  due_date timestamptz,
  paid_at timestamptz,
  status text default 'pending',
  created_at timestamptz default now_utc(),
  created_by text
);

create table if not exists financial_invoices (
  id text primary key default gen_uid(),
  number text,
  type text,
  customer_id text references customers(id),
  company_id text references companies(id),
  items jsonb default '[]',
  subtotal numeric(12,2),
  tax numeric(12,2),
  total numeric(12,2),
  status text default 'draft',
  issued_at timestamptz,
  created_at timestamptz default now_utc()
);

-- ============================================================
-- 9. INVENTORY
-- ============================================================

create table if not exists inventory_products (
  id text primary key default gen_uid(),
  name text not null,
  code text,
  description text,
  category_id text,
  unit text,
  cost_price numeric(12,2) default 0,
  sale_price numeric(12,2) default 0,
  stock_min int default 0,
  stock_max int default 0,
  stock_current int default 0,
  location text,
  created_at timestamptz default now_utc(),
  updated_at timestamptz default now_utc()
);

create table if not exists inventory_warehouses (
  id text primary key default gen_uid(),
  name text not null,
  code text,
  address text,
  active boolean default true,
  created_at timestamptz default now_utc()
);

create table if not exists inventory_movements (
  id text primary key default gen_uid(),
  product_id text references inventory_products(id),
  warehouse_id text references inventory_warehouses(id),
  type text,
  quantity numeric(12,3),
  unit_price numeric(12,2),
  total numeric(12,2),
  reference_type text,
  reference_id text,
  notes text,
  created_by text,
  created_at timestamptz default now_utc()
);

-- ============================================================
-- 10. PURCHASING
-- ============================================================

create table if not exists purchase_orders (
  id text primary key default gen_uid(),
  number text,
  supplier_id text references suppliers(id),
  company_id text references companies(id),
  items jsonb default '[]',
  subtotal numeric(12,2),
  tax numeric(12,2),
  total numeric(12,2),
  status text default 'draft',
  notes text,
  ordered_at timestamptz,
  received_at timestamptz,
  created_by text,
  created_at timestamptz default now_utc(),
  updated_at timestamptz default now_utc()
);

-- ============================================================
-- 11. CRM
-- ============================================================

create table if not exists crm_leads (
  id text primary key default gen_uid(),
  name text not null,
  email text,
  phone text,
  source text,
  status text default 'new',
  company_id text references companies(id),
  notes text,
  assigned_to text,
  created_at timestamptz default now_utc(),
  updated_at timestamptz default now_utc()
);

create table if not exists crm_opportunities (
  id text primary key default gen_uid(),
  lead_id text references crm_leads(id),
  title text not null,
  description text,
  value numeric(12,2),
  stage text default 'prospecting',
  probability int default 0,
  expected_close timestamptz,
  assigned_to text,
  created_at timestamptz default now_utc(),
  updated_at timestamptz default now_utc()
);

create table if not exists crm_campaigns (
  id text primary key default gen_uid(),
  name text not null,
  type text,
  start_date timestamptz,
  end_date timestamptz,
  budget numeric(12,2),
  status text default 'draft',
  created_at timestamptz default now_utc()
);

-- ============================================================
-- 12. HR
-- ============================================================

create table if not exists hr_employees (
  id text primary key default gen_uid(),
  name text not null,
  email text,
  phone text,
  document text,
  role text,
  department text,
  company_id text references companies(id),
  hire_date timestamptz,
  active boolean default true,
  created_at timestamptz default now_utc()
);

create table if not exists hr_timesheets (
  id text primary key default gen_uid(),
  employee_id text references hr_employees(id),
  date date,
  start_time time,
  end_time time,
  break_time int default 0,
  total_hours numeric(5,2),
  notes text,
  created_at timestamptz default now_utc()
);

-- ============================================================
-- 13. COMMUNICATION
-- ============================================================

create table if not exists comm_messages (
  id text primary key default gen_uid(),
  channel text,
  from_address text,
  to_address text,
  subject text,
  body text,
  status text default 'pending',
  reference_type text,
  reference_id text,
  sent_at timestamptz,
  created_at timestamptz default now_utc()
);

create table if not exists comm_templates (
  id text primary key default gen_uid(),
  name text not null,
  channel text,
  subject text,
  body text,
  variables jsonb default '[]',
  created_at timestamptz default now_utc()
);

-- ============================================================
-- 14. DOCUMENTS
-- ============================================================

create table if not exists doc_templates (
  id text primary key default gen_uid(),
  name text not null,
  type text,
  content text,
  variables jsonb default '[]',
  created_at timestamptz default now_utc()
);

create table if not exists doc_generated (
  id text primary key default gen_uid(),
  template_id text references doc_templates(id),
  reference_type text,
  reference_id text,
  data jsonb default '{}',
  file_url text,
  status text default 'draft',
  created_by text,
  created_at timestamptz default now_utc()
);

-- ============================================================
-- 15. ERP
-- ============================================================

create table if not exists erp_companies (
  id text primary key default gen_uid(),
  name text not null,
  document text,
  company_id text references companies(id),
  settings jsonb default '{}',
  created_at timestamptz default now_utc()
);

-- ============================================================
-- 16. EVENTS
-- ============================================================

create table if not exists event_log (
  id text primary key default gen_uid(),
  name text not null,
  source text,
  source_type text,
  payload jsonb default '{}',
  created_at timestamptz default now_utc()
);

-- ============================================================
-- 17. AI
-- ============================================================

create table if not exists ai_prompts (
  id text primary key default gen_uid(),
  name text,
  provider text,
  model text,
  prompt text,
  system_prompt text,
  variables jsonb default '[]',
  created_at timestamptz default now_utc()
);

create table if not exists ai_audit_log (
  id text primary key default gen_uid(),
  provider text,
  model text,
  prompt text,
  response text,
  tokens_used int,
  duration_ms int,
  created_by text,
  created_at timestamptz default now_utc()
);

-- ============================================================
-- 18. INTEGRATIONS
-- ============================================================

create table if not exists integration_connections (
  id text primary key default gen_uid(),
  name text,
  type text,
  config jsonb default '{}',
  status text default 'disconnected',
  last_sync_at timestamptz,
  created_at timestamptz default now_utc()
);

create table if not exists integration_webhooks (
  id text primary key default gen_uid(),
  name text,
  url text,
  events jsonb default '[]',
  secret text,
  active boolean default true,
  created_at timestamptz default now_utc()
);

-- ============================================================
-- 19. AUTOMATION
-- ============================================================

create table if not exists automation_rules (
  id text primary key default gen_uid(),
  name text not null,
  event text,
  conditions jsonb default '[]',
  actions jsonb default '[]',
  active boolean default true,
  created_at timestamptz default now_utc(),
  updated_at timestamptz default now_utc()
);

create table if not exists automation_workflows (
  id text primary key default gen_uid(),
  name text not null,
  states jsonb default '[]',
  transitions jsonb default '[]',
  active boolean default true,
  created_at timestamptz default now_utc()
);

-- ============================================================
-- 20. REPORTING
-- ============================================================

create table if not exists report_dashboards (
  id text primary key default gen_uid(),
  name text not null,
  description text,
  widgets jsonb default '[]',
  created_by text,
  created_at timestamptz default now_utc()
);

create table if not exists report_widgets (
  id text primary key default gen_uid(),
  dashboard_id text references report_dashboards(id) on delete cascade,
  type text,
  title text,
  config jsonb default '{}',
  position jsonb default '{}',
  created_at timestamptz default now_utc()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table companies enable row level security;
alter table users enable row level security;
alter table customers enable row level security;
alter table service_orders enable row level security;
alter table knowledge_articles enable row level security;
alter table financial_transactions enable row level security;
alter table inventory_products enable row level security;
alter table purchase_orders enable row level security;

-- Default policies: authenticated users can CRUD their own company's data
create policy "Users can view their own company" on companies
  for select using (true);

create policy "Users can view customers" on customers
  for select using (true);

create policy "Users can CRUD service_orders" on service_orders
  for all using (true);

create policy "Users can CRUD knowledge_articles" on knowledge_articles
  for all using (true);

-- ============================================================
-- REAL-TIME SUBSCRIPTIONS
-- ============================================================

alter publication supabase_realtime add table service_orders;
alter publication supabase_realtime add table knowledge_articles;
alter publication supabase_realtime add table customers;
alter publication supabase_realtime add table financial_transactions;
