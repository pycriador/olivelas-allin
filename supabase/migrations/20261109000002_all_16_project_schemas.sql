-- =============================================================================
-- OLIVELAS ALL IN - MIGRATION 02: 16 DEDICATED PROJECT SCHEMAS & SEED DATA
-- =============================================================================
-- Cada projeto de /projetos possui seu próprio schema PostgreSQL isolado no
-- Supabase, enquanto compartilha o login único (public.profiles) e o tenant
-- corporativo (public.allin_companies).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- CRIAÇÃO DOS 16 SCHEMAS DEDICADOS
-- -----------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS agendamento_simples;
CREATE SCHEMA IF NOT EXISTS agendamentos;
CREATE SCHEMA IF NOT EXISTS app_condominio;
CREATE SCHEMA IF NOT EXISTS art_hub;
CREATE SCHEMA IF NOT EXISTS casa_organizada;
CREATE SCHEMA IF NOT EXISTS contratos;
CREATE SCHEMA IF NOT EXISTS especificacoes;
CREATE SCHEMA IF NOT EXISTS gestao_estoque;
CREATE SCHEMA IF NOT EXISTS ordem_de_servico;
CREATE SCHEMA IF NOT EXISTS personal_treiner;
CREATE SCHEMA IF NOT EXISTS restaurante;
CREATE SCHEMA IF NOT EXISTS rifas;
CREATE SCHEMA IF NOT EXISTS sistema_delivery;
CREATE SCHEMA IF NOT EXISTS sistema_mercado;
CREATE SCHEMA IF NOT EXISTS suite_rifa;
CREATE SCHEMA IF NOT EXISTS vitrine_digital;

-- =============================================================================
-- 1. SCHEMA: agendamento_simples (Olivelas - Consultório & Odonto)
-- =============================================================================
CREATE TABLE IF NOT EXISTS agendamento_simples.clinic_settings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL DEFAULT 'comp_nebula' REFERENCES public.allin_companies(id) ON DELETE CASCADE,
  clinic_name TEXT NOT NULL DEFAULT 'Olivelas - Consultório & Odonto',
  specialty TEXT NOT NULL DEFAULT 'Odontologia & Estética Facial',
  whatsapp_phone TEXT,
  business_hours JSONB NOT NULL DEFAULT '{"seg_sex": "08:00-19:00", "sab": "08:00-13:00"}'::jsonb,
  updated_by TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agendamento_simples.plans (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL DEFAULT 'comp_nebula' REFERENCES public.allin_companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  coverage_type TEXT NOT NULL DEFAULT 'Completo',
  discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  monthly_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  archive_metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agendamento_simples.services (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL DEFAULT 'comp_nebula' REFERENCES public.allin_companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Clínica Geral',
  duration_minutes INTEGER NOT NULL DEFAULT 45,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  archive_metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agendamento_simples.patients (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL DEFAULT 'comp_nebula' REFERENCES public.allin_companies(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  plan_id TEXT REFERENCES agendamento_simples.plans(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  cpf TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  birth_date DATE,
  clinical_notes TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  archive_metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agendamento_simples.appointments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL DEFAULT 'comp_nebula' REFERENCES public.allin_companies(id) ON DELETE CASCADE,
  patient_id TEXT REFERENCES agendamento_simples.patients(id) ON DELETE CASCADE,
  service_id TEXT REFERENCES agendamento_simples.services(id) ON DELETE SET NULL,
  dentist_user_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  patient_name TEXT NOT NULL,
  service_name TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed',
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  archive_metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agendamento_simples.messages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL DEFAULT 'comp_nebula' REFERENCES public.allin_companies(id) ON DELETE CASCADE,
  patient_id TEXT REFERENCES agendamento_simples.patients(id) ON DELETE SET NULL,
  channel TEXT NOT NULL DEFAULT 'whatsapp',
  recipient TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agendamento_simples.audit_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL DEFAULT 'comp_nebula' REFERENCES public.allin_companies(id) ON DELETE CASCADE,
  actor_user_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- 2. SCHEMA: agendamentos (Olivelas - Clínicas & Agendamentos)
-- =============================================================================
CREATE TABLE IF NOT EXISTS agendamentos.professionals (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL DEFAULT 'comp_nebula' REFERENCES public.allin_companies(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  specialty TEXT NOT NULL,
  council_register TEXT,
  email TEXT,
  phone TEXT,
  color TEXT NOT NULL DEFAULT '#2563EB',
  status TEXT NOT NULL DEFAULT 'active',
  archive_metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agendamentos.locations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL DEFAULT 'comp_nebula' REFERENCES public.allin_companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  room_code TEXT NOT NULL,
  address TEXT,
  capacity INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agendamentos.appointment_types (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL DEFAULT 'comp_nebula' REFERENCES public.allin_companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  color TEXT NOT NULL DEFAULT '#10B981',
  requires_preparation BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agendamentos.clients (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL DEFAULT 'comp_nebula' REFERENCES public.allin_companies(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  document TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  health_insurance TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  archive_metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agendamentos.schedules (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL DEFAULT 'comp_nebula' REFERENCES public.allin_companies(id) ON DELETE CASCADE,
  professional_id TEXT REFERENCES agendamentos.professionals(id) ON DELETE CASCADE,
  location_id TEXT REFERENCES agendamentos.locations(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  weekday INTEGER NOT NULL DEFAULT 1,
  start_time TEXT NOT NULL DEFAULT '08:00',
  end_time TEXT NOT NULL DEFAULT '18:00',
  slot_minutes INTEGER NOT NULL DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agendamentos.appointments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL DEFAULT 'comp_nebula' REFERENCES public.allin_companies(id) ON DELETE CASCADE,
  schedule_id TEXT REFERENCES agendamentos.schedules(id) ON DELETE SET NULL,
  professional_id TEXT REFERENCES agendamentos.professionals(id) ON DELETE SET NULL,
  client_id TEXT REFERENCES agendamentos.clients(id) ON DELETE SET NULL,
  appointment_type_id TEXT REFERENCES agendamentos.appointment_types(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed',
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  archive_metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agendamentos.waiting_list (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL DEFAULT 'comp_nebula' REFERENCES public.allin_companies(id) ON DELETE CASCADE,
  client_id TEXT REFERENCES agendamentos.clients(id) ON DELETE CASCADE,
  professional_id TEXT REFERENCES agendamentos.professionals(id) ON DELETE SET NULL,
  desired_date DATE,
  priority TEXT NOT NULL DEFAULT 'high',
  status TEXT NOT NULL DEFAULT 'waiting',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- 3. SCHEMA: app_condominio (Olivelas - Gestão de Condomínios)
-- =============================================================================
CREATE TABLE IF NOT EXISTS app_condominio.condominiums (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL DEFAULT 'comp_nebula' REFERENCES public.allin_companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cnpj TEXT,
  address TEXT NOT NULL,
  total_units INTEGER NOT NULL DEFAULT 48,
  syndic_user_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active',
  archive_metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_condominio.units (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL DEFAULT 'comp_nebula' REFERENCES public.allin_companies(id) ON DELETE CASCADE,
  condominium_id TEXT NOT NULL REFERENCES app_condominio.condominiums(id) ON DELETE CASCADE,
  block TEXT NOT NULL DEFAULT 'A',
  unit_number TEXT NOT NULL,
  resident_user_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  resident_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'occupied',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_condominio.resources (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL DEFAULT 'comp_nebula' REFERENCES public.allin_companies(id) ON DELETE CASCADE,
  condominium_id TEXT NOT NULL REFERENCES app_condominio.condominiums(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 30,
  reservation_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  rules TEXT,
  status TEXT NOT NULL DEFAULT 'available',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_condominio.reservations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL DEFAULT 'comp_nebula' REFERENCES public.allin_companies(id) ON DELETE CASCADE,
  resource_id TEXT NOT NULL REFERENCES app_condominio.resources(id) ON DELETE CASCADE,
  unit_id TEXT REFERENCES app_condominio.units(id) ON DELETE SET NULL,
  resident_user_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  reserved_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'approved',
  fee_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  archive_metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_condominio.announcements (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL DEFAULT 'comp_nebula' REFERENCES public.allin_companies(id) ON DELETE CASCADE,
  condominium_id TEXT NOT NULL REFERENCES app_condominio.condominiums(id) ON DELETE CASCADE,
  author_user_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal',
  published_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_condominio.occurrences (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL DEFAULT 'comp_nebula' REFERENCES public.allin_companies(id) ON DELETE CASCADE,
  condominium_id TEXT NOT NULL REFERENCES app_condominio.condominiums(id) ON DELETE CASCADE,
  unit_id TEXT REFERENCES app_condominio.units(id) ON DELETE SET NULL,
  reporter_user_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Manutenção',
  status TEXT NOT NULL DEFAULT 'open',
  description TEXT,
  archive_metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_condominio.bills (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL DEFAULT 'comp_nebula' REFERENCES public.allin_companies(id) ON DELETE CASCADE,
  condominium_id TEXT NOT NULL REFERENCES app_condominio.condominiums(id) ON DELETE CASCADE,
  unit_id TEXT REFERENCES app_condominio.units(id) ON DELETE SET NULL,
  competence TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- 4. SCHEMA: art_hub (Olivelas - Art Hub & Catálogo IA)
-- =============================================================================
CREATE TABLE IF NOT EXISTS art_hub.collections (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL DEFAULT 'comp_nebula' REFERENCES public.allin_companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  curator_user_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active',
  archive_metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS art_hub.artworks (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL DEFAULT 'comp_nebula' REFERENCES public.allin_companies(id) ON DELETE CASCADE,
  collection_id TEXT REFERENCES art_hub.collections(id) ON DELETE SET NULL,
  created_by TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  style TEXT NOT NULL DEFAULT 'Contemporâneo',
  dimensions TEXT DEFAULT '100x70cm',
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  image_url TEXT,
  ai_tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  ai_description TEXT,
  status TEXT NOT NULL DEFAULT 'published',
  archive_metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS art_hub.ai_prompts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL DEFAULT 'comp_nebula' REFERENCES public.allin_companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  model TEXT NOT NULL DEFAULT 'gemini-2.5-flash',
  prompt_template TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS art_hub.ai_queue (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL DEFAULT 'comp_nebula' REFERENCES public.allin_companies(id) ON DELETE CASCADE,
  artwork_id TEXT REFERENCES art_hub.artworks(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'completed',
  confidence_score NUMERIC(5,2) DEFAULT 98.4,
  processed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- 5. SCHEMA: casa_organizada (Olivelas - Casa Organizada & Rotinas)
-- =============================================================================
CREATE TABLE IF NOT EXISTS casa_organizada.household_profiles (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL DEFAULT 'comp_nebula' REFERENCES public.allin_companies(id) ON DELETE CASCADE,
  owner_user_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  household_name TEXT NOT NULL,
  rooms JSONB NOT NULL DEFAULT '["Cozinha", "Sala", "Suíte Master", "Lavanderia", "Escritório"]'::jsonb,
  residents_count INTEGER NOT NULL DEFAULT 3,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS casa_organizada.global_default_tasks (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL DEFAULT 'comp_nebula' REFERENCES public.allin_companies(id) ON DELETE CASCADE,
  room TEXT NOT NULL,
  title TEXT NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'seasonal')),
  estimated_minutes INTEGER NOT NULL DEFAULT 15,
  points INTEGER NOT NULL DEFAULT 10,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS casa_organizada.custom_tasks (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL DEFAULT 'comp_nebula' REFERENCES public.allin_companies(id) ON DELETE CASCADE,
  household_id TEXT REFERENCES casa_organizada.household_profiles(id) ON DELETE CASCADE,
  assigned_user_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  room TEXT NOT NULL,
  title TEXT NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'weekly',
  status TEXT NOT NULL DEFAULT 'pending',
  due_date DATE DEFAULT CURRENT_DATE,
  archive_metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS casa_organizada.task_completions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL DEFAULT 'comp_nebula' REFERENCES public.allin_companies(id) ON DELETE CASCADE,
  task_id TEXT,
  completed_by_user_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  completed_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- 6. SCHEMA: contratos (Olivelas - Automação de Contratos)
-- =============================================================================
CREATE TABLE IF NOT EXISTS contratos.workspaces (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL DEFAULT 'comp_nebula' REFERENCES public.allin_companies(id) ON DELETE CASCADE,
  owner_user_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contratos.projects (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL DEFAULT 'comp_nebula' REFERENCES public.allin_companies(id) ON DELETE CASCADE,
  workspace_id TEXT REFERENCES contratos.workspaces(id) ON DELETE CASCADE,
  created_by TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'B2B SaaS & Prestação de Serviços',
  version TEXT NOT NULL DEFAULT '1.0.0',
  status TEXT NOT NULL DEFAULT 'published',
  variables_schema JSONB NOT NULL DEFAULT '[]'::jsonb,
  archive_metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contratos.clauses (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL DEFAULT 'comp_nebula' REFERENCES public.allin_companies(id) ON DELETE CASCADE,
  project_id TEXT REFERENCES contratos.projects(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'LGPD & Compliance',
  body_markdown TEXT NOT NULL,
  mandatory BOOLEAN NOT NULL DEFAULT TRUE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contratos.generated_documents (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL DEFAULT 'comp_nebula' REFERENCES public.allin_companies(id) ON DELETE CASCADE,
  project_id TEXT REFERENCES contratos.projects(id) ON DELETE SET NULL,
  generated_by TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  counterparty_name TEXT NOT NULL,
  contract_value NUMERIC(12,2) NOT NULL DEFAULT 0,
  risk_score NUMERIC(5,2) NOT NULL DEFAULT 12.0,
  status TEXT NOT NULL DEFAULT 'signed',
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  archive_metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- 7. SCHEMA: especificacoes (Olivelas - Engenharia de Especificações)
-- =============================================================================
CREATE TABLE IF NOT EXISTS especificacoes.workspaces (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL DEFAULT 'comp_nebula' REFERENCES public.allin_companies(id) ON DELETE CASCADE,
  owner_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS especificacoes.projects (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL DEFAULT 'comp_nebula' REFERENCES public.allin_companies(id) ON DELETE CASCADE,
  workspace_id TEXT REFERENCES especificacoes.workspaces(id) ON DELETE CASCADE,
  owner_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  color TEXT DEFAULT '#2563EB',
  archive_metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS especificacoes.sprints (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL DEFAULT 'comp_nebula' REFERENCES public.allin_companies(id) ON DELETE CASCADE,
  project_id TEXT REFERENCES especificacoes.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE DEFAULT (CURRENT_DATE + INTERVAL '14 days'),
  sort_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS especificacoes.specifications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL DEFAULT 'comp_nebula' REFERENCES public.allin_companies(id) ON DELETE CASCADE,
  project_id TEXT REFERENCES especificacoes.projects(id) ON DELETE CASCADE,
  sprint_id TEXT REFERENCES especificacoes.sprints(id) ON DELETE SET NULL,
  created_by TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'architecture',
  status TEXT NOT NULL DEFAULT 'approved',
  version INTEGER NOT NULL DEFAULT 1,
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  blocks JSONB NOT NULL DEFAULT '[]'::jsonb,
  favorite BOOLEAN NOT NULL DEFAULT FALSE,
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  archive_metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS especificacoes.snippets (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL DEFAULT 'comp_nebula' REFERENCES public.allin_companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  language TEXT NOT NULL DEFAULT 'sql',
  content TEXT NOT NULL,
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- 8. SCHEMA: gestao_estoque (Olivelas - Gestão de Estoque & PDV)
-- =============================================================================
CREATE TABLE IF NOT EXISTS gestao_estoque.stores (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL DEFAULT 'comp_nebula' REFERENCES public.allin_companies(id) ON DELETE CASCADE,
  parent_store_id TEXT REFERENCES gestao_estoque.stores(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  cnpj TEXT,
  is_branch BOOLEAN NOT NULL DEFAULT FALSE,
  branch_code TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  archive_metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gestao_estoque.store_users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  store_id TEXT NOT NULL REFERENCES gestao_estoque.stores(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'STORE_ADMIN',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(store_id, user_id)
);

CREATE TABLE IF NOT EXISTS gestao_estoque.categories (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  store_id TEXT NOT NULL REFERENCES gestao_estoque.stores(id) ON DELETE CASCADE,
  company_id TEXT NOT NULL DEFAULT 'comp_nebula' REFERENCES public.allin_companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gestao_estoque.suppliers (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  store_id TEXT NOT NULL REFERENCES gestao_estoque.stores(id) ON DELETE CASCADE,
  company_id TEXT NOT NULL DEFAULT 'comp_nebula' REFERENCES public.allin_companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cnpj TEXT,
  email TEXT,
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gestao_estoque.products (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  store_id TEXT NOT NULL REFERENCES gestao_estoque.stores(id) ON DELETE CASCADE,
  company_id TEXT NOT NULL DEFAULT 'comp_nebula' REFERENCES public.allin_companies(id) ON DELETE CASCADE,
  category_id TEXT REFERENCES gestao_estoque.categories(id) ON DELETE SET NULL,
  supplier_id TEXT REFERENCES gestao_estoque.suppliers(id) ON DELETE SET NULL,
  sku TEXT NOT NULL,
  barcode TEXT,
  name TEXT NOT NULL,
  cost_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  sale_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  min_stock NUMERIC(12,2) NOT NULL DEFAULT 5,
  current_stock NUMERIC(12,2) NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'UN',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  archive_metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gestao_estoque.stock_batches (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  store_id TEXT NOT NULL REFERENCES gestao_estoque.stores(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES gestao_estoque.products(id) ON DELETE CASCADE,
  lot_number TEXT NOT NULL,
  quantity NUMERIC(12,2) NOT NULL DEFAULT 0,
  expiration_date DATE,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gestao_estoque.orders (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  store_id TEXT NOT NULL REFERENCES gestao_estoque.stores(id) ON DELETE CASCADE,
  company_id TEXT NOT NULL DEFAULT 'comp_nebula' REFERENCES public.allin_companies(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  order_number TEXT NOT NULL,
  customer_name TEXT NOT NULL DEFAULT 'Consumidor Final',
  channel TEXT NOT NULL DEFAULT 'IN_STORE',
  status TEXT NOT NULL DEFAULT 'DELIVERED',
  payment_method TEXT NOT NULL DEFAULT 'PIX',
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  archive_metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- 9. SCHEMA: ordem_de_servico (Olivelas - Ordens de Serviço & Assistência)
-- =============================================================================
CREATE TABLE IF NOT EXISTS ordem_de_servico.customers (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL DEFAULT 'comp_nebula' REFERENCES public.allin_companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  document TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ordem_de_servico.devices (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL DEFAULT 'comp_nebula' REFERENCES public.allin_companies(id) ON DELETE CASCADE,
  customer_id TEXT REFERENCES ordem_de_servico.customers(id) ON DELETE CASCADE,
  equipment_type TEXT NOT NULL DEFAULT 'Smartphone / Notebook',
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  serial_number TEXT,
  imei TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ordem_de_servico.technicians (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL DEFAULT 'comp_nebula' REFERENCES public.allin_companies(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  specialty TEXT NOT NULL DEFAULT 'Microeletrônica & Reparo Avançado',
  commission_percent NUMERIC(5,2) NOT NULL DEFAULT 15,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ordem_de_servico.service_orders (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL DEFAULT 'comp_nebula' REFERENCES public.allin_companies(id) ON DELETE CASCADE,
  os_number TEXT NOT NULL,
  customer_id TEXT REFERENCES ordem_de_servico.customers(id) ON DELETE SET NULL,
  device_id TEXT REFERENCES ordem_de_servico.devices(id) ON DELETE SET NULL,
  technician_id TEXT REFERENCES ordem_de_servico.technicians(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  device_label TEXT NOT NULL,
  reported_defect TEXT NOT NULL,
  diagnostic_report TEXT,
  status TEXT NOT NULL DEFAULT 'in_repair',
  priority TEXT NOT NULL DEFAULT 'high',
  parts_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  labor_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  warranty_days INTEGER NOT NULL DEFAULT 90,
  archive_metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- 10. SCHEMA: personal_treiner (Olivelas - Personal Trainer)
-- =============================================================================
CREATE TABLE IF NOT EXISTS personal_treiner.trainers (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL DEFAULT 'comp_nebula' REFERENCES public.allin_companies(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  cref TEXT NOT NULL,
  specialty TEXT NOT NULL DEFAULT 'Hipertrofia, Performance & Reabilitação',
  email TEXT,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS personal_treiner.students (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL DEFAULT 'comp_nebula' REFERENCES public.allin_companies(id) ON DELETE CASCADE,
  trainer_id TEXT REFERENCES personal_treiner.trainers(id) ON DELETE SET NULL,
  user_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  goal TEXT NOT NULL DEFAULT 'Hipertrofia & Condicionamento',
  plan_name TEXT NOT NULL DEFAULT 'Consultoria Premium Presencial + App',
  monthly_fee NUMERIC(10,2) NOT NULL DEFAULT 450,
  weight_kg NUMERIC(5,2),
  body_fat_percent NUMERIC(5,2),
  streak_days INTEGER NOT NULL DEFAULT 12,
  status TEXT NOT NULL DEFAULT 'active',
  archive_metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS personal_treiner.exercises (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL DEFAULT 'comp_nebula' REFERENCES public.allin_companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  muscle_group TEXT NOT NULL,
  equipment TEXT NOT NULL DEFAULT 'Livre / Polia',
  video_url TEXT,
  instructions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS personal_treiner.workout_plans (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL DEFAULT 'comp_nebula' REFERENCES public.allin_companies(id) ON DELETE CASCADE,
  student_id TEXT REFERENCES personal_treiner.students(id) ON DELETE CASCADE,
  trainer_id TEXT REFERENCES personal_treiner.trainers(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  split_type TEXT NOT NULL DEFAULT 'ABCDE - Periodização Ondulatória',
  weeks_duration INTEGER NOT NULL DEFAULT 8,
  sessions_completed INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  exercises_payload JSONB NOT NULL DEFAULT '[]'::jsonb,
  archive_metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS personal_treiner.nutrition_plans (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL DEFAULT 'comp_nebula' REFERENCES public.allin_companies(id) ON DELETE CASCADE,
  student_id TEXT REFERENCES personal_treiner.students(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  daily_calories INTEGER NOT NULL DEFAULT 2400,
  protein_g INTEGER NOT NULL DEFAULT 180,
  carbs_g INTEGER NOT NULL DEFAULT 250,
  fat_g INTEGER NOT NULL DEFAULT 70,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- 11. SCHEMA: restaurante (Olivelas - Gestão de Restaurantes & KDS)
-- =============================================================================
CREATE TABLE IF NOT EXISTS restaurante.restaurants (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL DEFAULT 'comp_nebula' REFERENCES public.allin_companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cuisine_type TEXT NOT NULL DEFAULT 'Gastronomia Contemporânea & Grill',
  open_tables INTEGER NOT NULL DEFAULT 8,
  total_tables INTEGER NOT NULL DEFAULT 24,
  service_fee_percent NUMERIC(5,2) NOT NULL DEFAULT 10,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS restaurante.products (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL DEFAULT 'comp_nebula' REFERENCES public.allin_companies(id) ON DELETE CASCADE,
  restaurant_id TEXT REFERENCES restaurante.restaurants(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'Pratos Principais',
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  prep_time_minutes INTEGER NOT NULL DEFAULT 20,
  kds_station TEXT NOT NULL DEFAULT 'Cozinha Quente',
  available BOOLEAN NOT NULL DEFAULT TRUE,
  archive_metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS restaurante.restaurant_tables (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL DEFAULT 'comp_nebula' REFERENCES public.allin_companies(id) ON DELETE CASCADE,
  restaurant_id TEXT REFERENCES restaurante.restaurants(id) ON DELETE CASCADE,
  table_number INTEGER NOT NULL,
  area TEXT NOT NULL DEFAULT 'Salão Principal',
  capacity INTEGER NOT NULL DEFAULT 4,
  status TEXT NOT NULL DEFAULT 'occupied',
  current_bill NUMERIC(10,2) NOT NULL DEFAULT 0,
  waiter_user_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS restaurante.orders (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL DEFAULT 'comp_nebula' REFERENCES public.allin_companies(id) ON DELETE CASCADE,
  restaurant_id TEXT REFERENCES restaurante.restaurants(id) ON DELETE CASCADE,
  table_number INTEGER NOT NULL DEFAULT 1,
  waiter_user_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  order_code TEXT NOT NULL,
  items_summary TEXT NOT NULL,
  kds_status TEXT NOT NULL DEFAULT 'preparing',
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  archive_metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- 12. SCHEMA: rifas (Olivelas - Rifas & Sorteios Digitais)
-- =============================================================================
CREATE TABLE IF NOT EXISTS rifas.campaigns (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL DEFAULT 'comp_nebula' REFERENCES public.allin_companies(id) ON DELETE CASCADE,
  created_by TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  prize_description TEXT NOT NULL,
  ticket_price NUMERIC(10,2) NOT NULL DEFAULT 19.90,
  total_numbers INTEGER NOT NULL DEFAULT 10000,
  sold_numbers INTEGER NOT NULL DEFAULT 0,
  draw_date DATE,
  status TEXT NOT NULL DEFAULT 'active',
  archive_metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rifas.orders (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL DEFAULT 'comp_nebula' REFERENCES public.allin_companies(id) ON DELETE CASCADE,
  campaign_id TEXT REFERENCES rifas.campaigns(id) ON DELETE CASCADE,
  buyer_user_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  buyer_name TEXT NOT NULL,
  buyer_phone TEXT NOT NULL,
  tickets_count INTEGER NOT NULL DEFAULT 5,
  numbers_selected JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'paid',
  pix_txid TEXT,
  archive_metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- 13. SCHEMA: sistema_delivery (Olivelas - Central de Delivery)
-- =============================================================================
CREATE TABLE IF NOT EXISTS sistema_delivery.stores (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL DEFAULT 'comp_nebula' REFERENCES public.allin_companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'São Paulo - SP',
  delivery_radius_km NUMERIC(5,2) NOT NULL DEFAULT 12,
  avg_prep_minutes INTEGER NOT NULL DEFAULT 25,
  status TEXT NOT NULL DEFAULT 'online',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sistema_delivery.couriers (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL DEFAULT 'comp_nebula' REFERENCES public.allin_companies(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  vehicle_type TEXT NOT NULL DEFAULT 'Moto',
  plate TEXT,
  status TEXT NOT NULL DEFAULT 'available',
  deliveries_today INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sistema_delivery.delivery_orders (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL DEFAULT 'comp_nebula' REFERENCES public.allin_companies(id) ON DELETE CASCADE,
  store_id TEXT REFERENCES sistema_delivery.stores(id) ON DELETE CASCADE,
  courier_id TEXT REFERENCES sistema_delivery.couriers(id) ON DELETE SET NULL,
  external_code TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'App Próprio / iFood',
  customer_name TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'dispatched',
  delivery_fee NUMERIC(10,2) NOT NULL DEFAULT 9.90,
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  archive_metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- 14. SCHEMA: sistema_mercado (Olivelas - Supermercado & Cestas)
-- =============================================================================
CREATE TABLE IF NOT EXISTS sistema_mercado.products (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL DEFAULT 'comp_nebula' REFERENCES public.allin_companies(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  name TEXT NOT NULL,
  aisle_category TEXT NOT NULL DEFAULT 'Mercearia & Matinais',
  brand TEXT NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  stock_quantity NUMERIC(12,2) NOT NULL DEFAULT 0,
  expiration_date DATE,
  status TEXT NOT NULL DEFAULT 'active',
  archive_metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sistema_mercado.breakfast_baskets (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL DEFAULT 'comp_nebula' REFERENCES public.allin_companies(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  theme TEXT NOT NULL DEFAULT 'Cesta Café da Manhã Especial',
  items_count INTEGER NOT NULL DEFAULT 14,
  price NUMERIC(10,2) NOT NULL DEFAULT 189.90,
  stock_ready INTEGER NOT NULL DEFAULT 10,
  status TEXT NOT NULL DEFAULT 'available',
  archive_metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sistema_mercado.catalog_requests (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL DEFAULT 'comp_nebula' REFERENCES public.allin_companies(id) ON DELETE CASCADE,
  basket_id TEXT REFERENCES sistema_mercado.breakfast_baskets(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  delivery_date DATE NOT NULL DEFAULT CURRENT_DATE,
  gift_message TEXT,
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'confirmed',
  archive_metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- 15. SCHEMA: suite_rifa (Olivelas - Suíte Multi-Organização de Rifas)
-- =============================================================================
CREATE TABLE IF NOT EXISTS suite_rifa.organizations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL DEFAULT 'comp_nebula' REFERENCES public.allin_companies(id) ON DELETE CASCADE,
  owner_user_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  plan_tier TEXT NOT NULL DEFAULT 'Enterprise Multi-Org',
  active_campaigns_limit INTEGER NOT NULL DEFAULT 50,
  monthly_volume NUMERIC(14,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  archive_metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS suite_rifa.campaigns (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL DEFAULT 'comp_nebula' REFERENCES public.allin_companies(id) ON DELETE CASCADE,
  organization_id TEXT REFERENCES suite_rifa.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  quota_price NUMERIC(10,2) NOT NULL DEFAULT 9.90,
  total_quotas INTEGER NOT NULL DEFAULT 100000,
  sold_quotas INTEGER NOT NULL DEFAULT 0,
  revenue_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  archive_metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- 16. SCHEMA: vitrine_digital (Olivelas - Vitrine Digital & Analisador IA)
-- =============================================================================
CREATE TABLE IF NOT EXISTS vitrine_digital.art_submissions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL DEFAULT 'comp_nebula' REFERENCES public.allin_companies(id) ON DELETE CASCADE,
  submitted_by TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  sku_code TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Vitrine E-Commerce & Moda',
  image_url TEXT,
  ai_quality_score NUMERIC(5,2) NOT NULL DEFAULT 96.5,
  seo_headline TEXT,
  conversion_tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'approved',
  archive_metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vitrine_digital.image_analysis (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL DEFAULT 'comp_nebula' REFERENCES public.allin_companies(id) ON DELETE CASCADE,
  submission_id TEXT REFERENCES vitrine_digital.art_submissions(id) ON DELETE CASCADE,
  model_used TEXT NOT NULL DEFAULT 'gemini-2.5-pro-vision',
  lighting_score NUMERIC(5,2) NOT NULL DEFAULT 95,
  composition_score NUMERIC(5,2) NOT NULL DEFAULT 97,
  recommendations TEXT,
  tokens_used INTEGER NOT NULL DEFAULT 1420,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- GRANTS E EXPOSIÇÃO DE SCHEMAS NO POSTGREST (SUPABASE REST API)
-- =============================================================================
DO $$
DECLARE
  s TEXT;
  r RECORD;
  schemas TEXT[] := ARRAY[
    'public',
    'agendamento_simples',
    'agendamentos',
    'app_condominio',
    'art_hub',
    'casa_organizada',
    'contratos',
    'especificacoes',
    'gestao_estoque',
    'ordem_de_servico',
    'personal_treiner',
    'restaurante',
    'rifas',
    'sistema_delivery',
    'sistema_mercado',
    'suite_rifa',
    'vitrine_digital'
  ];
BEGIN
  FOREACH s IN ARRAY schemas LOOP
    EXECUTE format('GRANT USAGE ON SCHEMA %I TO anon, authenticated, service_role, postgres;', s);
    EXECUTE format('GRANT ALL ON ALL TABLES IN SCHEMA %I TO anon, authenticated, service_role, postgres;', s);
    EXECUTE format('GRANT ALL ON ALL SEQUENCES IN SCHEMA %I TO anon, authenticated, service_role, postgres;', s);
    EXECUTE format('GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA %I TO anon, authenticated, service_role, postgres;', s);
    EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I GRANT ALL ON TABLES TO anon, authenticated, service_role, postgres;', s);
    EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I GRANT ALL ON SEQUENCES TO anon, authenticated, service_role, postgres;', s);
  END LOOP;

  FOR r IN
    SELECT schemaname, tablename
    FROM pg_tables
    WHERE schemaname = ANY(schemas)
  LOOP
    EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY;', r.schemaname, r.tablename);
    EXECUTE format('DROP POLICY IF EXISTS "olivelas_unified_access" ON %I.%I;', r.schemaname, r.tablename);
    EXECUTE format(
      'CREATE POLICY "olivelas_unified_access" ON %I.%I FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);',
      r.schemaname,
      r.tablename
    );
  END LOOP;
END $$;

-- Expõe todos os 16 schemas + public no PostgREST para acesso direto via supabase.schema('<schema>')
ALTER ROLE authenticator SET pgrst.db_schemas = 'public, graphql_public, agendamento_simples, agendamentos, app_condominio, art_hub, casa_organizada, contratos, especificacoes, gestao_estoque, ordem_de_servico, personal_treiner, restaurante, rifas, sistema_delivery, sistema_mercado, suite_rifa, vitrine_digital';
NOTIFY pgrst, 'reload config';
NOTIFY pgrst, 'reload schema';

-- =============================================================================
-- SEED INICIAL UNIFICADO (LOGIN ÚNICO + EMPRESAS + 16 MÓDULOS + DADOS REAIS)
-- =============================================================================

-- 1. Empresas (Tenants)
INSERT INTO public.allin_companies (id, trade_name, legal_name, cnpj, status, theme_id, primary_color, domains, allowed_global_ip_ranges)
VALUES
  ('emp-olivelas-matriz', 'Olivelas Atelier & Varejo', 'Olivelas Atelier & Manufatura Ltda.', '18.492.310/0001-54', 'active', 'corporate-navy', '#1E3A8A', '["olivelas-atelier.com.br", "allin.olivelas.com.br"]'::jsonb, '["10.0.0.0/8", "192.168.0.0/16"]'::jsonb),
  ('emp-aurora-log', 'Aurora Logística Sul', 'Aurora Logística & Suprimentos S.A.', '29.741.802/0001-19', 'active', 'emerald-executive', '#065F46', '["auroralog.com.br"]'::jsonb, '["172.16.0.0/12"]'::jsonb),
  ('emp-vega-retail', 'Vega Mercados & Café', 'Vega Café & Torrefação Especial Ltda.', '41.093.655/0001-88', 'active', 'royal-indigo', '#3730A3', '["vegamercados.pt"]'::jsonb, '[]'::jsonb),
  ('emp-solaris-tech', 'Solaris Engenharia', 'Solaris Engenharia Solar Ltda.', '52.811.409/0001-02', 'suspended', 'amber-industrial', '#92400E', '["solaris-eng.com.br"]'::jsonb, '[]'::jsonb),
  ('comp_nebula', 'Olivelas Nebula Holdings', 'Olivelas Nebula Participações e Tecnologia S.A.', '12.345.678/0001-90', 'active', 'corporate-navy', '#1E3A8A', '["nebula.olivelas.com.br"]'::jsonb, '["10.0.0.0/8"]'::jsonb),
  ('comp_aurora', 'Olivelas Aurora Retail & Health', 'Aurora Comércio, Saúde e Serviços Ltda.', '98.765.432/0001-10', 'active', 'emerald-executive', '#065F46', '["aurora.olivelas.com.br"]'::jsonb, '["172.16.0.0/12"]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  trade_name = EXCLUDED.trade_name,
  legal_name = EXCLUDED.legal_name,
  status = EXCLUDED.status,
  updated_at = now();

-- 2. Perfis de Login Unificados (public.profiles -> tabela única de login para todos os 16 projetos e All In)
INSERT INTO public.profiles (id, email, full_name, phone, is_global_admin, status, language, role_ids, company_ids)
VALUES
  ('usr-super-admin', 'clara.monteiro@olivelas-allin.demo', 'Clara Monteiro', '+55 (11) 99812-0001', TRUE, 'active', 'pt-BR', '["role-super-admin"]'::jsonb, '["emp-olivelas-matriz", "emp-aurora-log", "emp-vega-retail", "emp-solaris-tech"]'::jsonb),
  ('usr-admin', 'rafael.admin@olivelas-allin.demo', 'Rafael Vasconcelos', '+55 (11) 99740-0002', TRUE, 'active', 'pt-BR', '["role-admin"]'::jsonb, '["emp-olivelas-matriz", "emp-aurora-log"]'::jsonb),
  ('usr-financeiro', 'beatriz.fin@olivelas-allin.demo', 'Beatriz Nogueira', '+55 (11) 99610-0003', FALSE, 'active', 'pt-BR', '["role-financeiro"]'::jsonb, '["emp-olivelas-matriz", "emp-aurora-log", "emp-vega-retail"]'::jsonb),
  ('usr-cliente', 'helena@olivelas-atelier.com.br', 'Helena Oliveira', '+55 (11) 98821-4100', FALSE, 'active', 'pt-BR', '["role-cliente"]'::jsonb, '["emp-olivelas-matriz", "emp-vega-retail"]'::jsonb),
  ('usr-gerente', 'lucas.prado@olivelas-atelier.com.br', 'Lucas Prado', '+55 (11) 98411-2200', FALSE, 'active', 'pt-BR', '["role-gerente"]'::jsonb, '["emp-olivelas-matriz"]'::jsonb),
  ('usr-funcionario', 'camila.duarte@olivelas-atelier.com.br', 'Camila Duarte', '+55 (11) 98122-3300', FALSE, 'active', 'pt-BR', '["role-funcionario"]'::jsonb, '["emp-olivelas-matriz"]'::jsonb),
  ('usr-aurora-cliente', 'marcos.toledo@auroralog.com.br', 'Marcos Toledo', '+55 (41) 99102-8800', FALSE, 'active', 'pt-BR', '["role-cliente"]'::jsonb, '["emp-aurora-log"]'::jsonb),
  ('usr_global', 'global.admin@olivelas.com.br', 'Helena Vasconcelos (Global Admin)', '+55 11 99888-0001', TRUE, 'active', 'pt-BR', '["role-super-admin"]'::jsonb, '["emp-olivelas-matriz", "comp_nebula", "comp_aurora"]'::jsonb),
  ('usr_tenant_admin', 'carlos.mendes@nebula.com.br', 'Carlos Eduardo Mendes (Admin Empresa)', '+55 11 99888-0002', FALSE, 'active', 'pt-BR', '["role-cliente"]'::jsonb, '["emp-olivelas-matriz", "comp_nebula"]'::jsonb),
  ('usr_finance', 'fernanda.lima@nebula.com.br', 'Fernanda Lima (Gestora Financeira)', '+55 11 99888-0003', FALSE, 'active', 'pt-BR', '["role-financeiro"]'::jsonb, '["emp-olivelas-matriz", "comp_nebula"]'::jsonb),
  ('usr_aurora_admin', 'roberto.almeida@aurora.com.br', 'Roberto Almeida (Diretor Aurora)', '+55 11 99888-0004', FALSE, 'active', 'pt-BR', '["role-cliente"]'::jsonb, '["emp-aurora-log", "comp_aurora"]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  is_global_admin = EXCLUDED.is_global_admin,
  role_ids = EXCLUDED.role_ids,
  company_ids = EXCLUDED.company_ids,
  updated_at = now();

INSERT INTO public.company_users (id, company_id, user_id, role, is_active)
VALUES
  ('cu_m1', 'emp-olivelas-matriz', 'usr-super-admin', 'GLOBAL_ADMIN', TRUE),
  ('cu_m2', 'emp-olivelas-matriz', 'usr-cliente', 'COMPANY_ADMIN', TRUE),
  ('cu_m3', 'emp-olivelas-matriz', 'usr-gerente', 'MANAGER', TRUE),
  ('cu_m4', 'emp-olivelas-matriz', 'usr-funcionario', 'EMPLOYEE', TRUE),
  ('cu_a1', 'emp-aurora-log', 'usr-aurora-cliente', 'COMPANY_ADMIN', TRUE),
  ('cu_1', 'comp_nebula', 'usr_global', 'GLOBAL_ADMIN', TRUE),
  ('cu_2', 'comp_nebula', 'usr_tenant_admin', 'COMPANY_ADMIN', TRUE),
  ('cu_3', 'comp_nebula', 'usr_finance', 'FINANCE_MANAGER', TRUE),
  ('cu_4', 'comp_aurora', 'usr_global', 'GLOBAL_ADMIN', TRUE),
  ('cu_5', 'comp_aurora', 'usr_aurora_admin', 'COMPANY_ADMIN', TRUE)
ON CONFLICT (company_id, user_id) DO NOTHING;

-- 3. Catálogo Oficial de Módulos (Core + 16 Projetos Padronizados Olivelas)
INSERT INTO public.allin_modules (id, name, slug, project_folder, db_schema, category, description, monthly_price, active, features)
VALUES
  ('mod_agendamento_simples', 'Olivelas - Consultório & Odonto', 'allin_agendamento_simples', 'agendamento_simples', 'agendamento_simples', 'operations', 'Agenda clínica odontológica, prontuário rápido, convênios e lembretes WhatsApp.', 249.00, TRUE, '["Agenda de Pacientes", "Planos & Convênios", "Disparo WhatsApp", "Auditoria Clínica"]'::jsonb),
  ('mod_agendamentos', 'Olivelas - Clínicas & Agendamentos', 'allin_agendamentos', 'agendamentos', 'agendamentos', 'operations', 'Gestão multiprofissional de clínicas, salas, grades de horário e lista de espera.', 349.00, TRUE, '["Escalas Multiprofissionais", "Salas & Unidades", "Lista de Espera", "Regras de Disponibilidade"]'::jsonb),
  ('mod_app_condominio', 'Olivelas - Gestão de Condomínios', 'allin_condominio', 'app_condominio', 'app_condominio', 'operations', 'Administração de condomínios, unidades, reservas de áreas comuns, assembleias e boletos.', 490.00, TRUE, '["Unidades & Moradores", "Reserva de Espaços", "Ocorrências & Chamados", "Boletos Condominiais"]'::jsonb),
  ('mod_art_hub', 'Olivelas - Art Hub & Catálogo IA', 'allin_art_hub', 'art_hub', 'art_hub', 'analytics', 'Curadoria artística, catalogação assistida por IA generativa e fila de metadados visuais.', 390.00, TRUE, '["Acervo & Coleções", "Catalogação com Gemini IA", "Prompts Customizados", "Fila de Processamento"]'::jsonb),
  ('mod_casa_organizada', 'Olivelas - Casa Organizada & Rotinas', 'allin_casa_organizada', 'casa_organizada', 'casa_organizada', 'operations', 'Planejamento inteligente de rotinas domésticas e corporativas por ambiente e frequência.', 149.00, TRUE, '["Checklist por Cômodo", "Tarefas Diárias e Semanais", "Histórico de Execução", "Gamificação"]'::jsonb),
  ('mod_contratos', 'Olivelas - Automação de Contratos', 'allin_contratos_automacao', 'contratos', 'contratos', 'finance', 'Construção dinâmica de minutas, biblioteca de cláusulas LGPD, fluxos e análise de risco IA.', 590.00, TRUE, '["Builder de Contratos", "Cláusulas Padronizadas", "Geração Automatizada", "Score de Risco Jurídico"]'::jsonb),
  ('mod_especificacoes', 'Olivelas - Engenharia de Especificações', 'allin_especificacoes', 'especificacoes', 'especificacoes', 'analytics', 'Engenharia de requisitos SDD, roadmaps, sprints, blocos técnicos, RFCs, ADRs e snippets.', 450.00, TRUE, '["Roadmaps & Sprints", "Documentos SDD/ADR/RFC", "Templates reutilizáveis", "Biblioteca de Snippets"]'::jsonb),
  ('mod_gestao_estoque', 'Olivelas - Gestão de Estoque & PDV', 'allin_gestao_estoque', 'gestao_estoque', 'gestao_estoque', 'operations', 'Controle multi-loja (matriz/filial), lotes FEFO, ponto de venda (PDV), compras e transferências.', 549.00, TRUE, '["Multi-Loja Matriz/Filial", "Controle de Lotes & Validade", "PDV & Pedidos", "Ordens de Compra"]'::jsonb),
  ('mod_ordem_de_servico', 'Olivelas - Ordens de Serviço & Assistência', 'allin_ordem_servico', 'ordem_de_servico', 'ordem_de_servico', 'operations', 'Gestão completa de assistência técnica, bancada, laudos, garantias, peças e financeiro.', 379.00, TRUE, '["Abertura de OS & Checklist", "Diagnóstico Técnico", "Peças & Orçamentos", "Termos de Garantia"]'::jsonb),
  ('mod_personal_treiner', 'Olivelas - Personal Trainer', 'allin_personal_trainer', 'personal_treiner', 'personal_treiner', 'operations', 'Prescrição de treinos periodizados, avaliação física, planos nutricionais e ranking de alunos.', 279.00, TRUE, '["Prescrição de Treinos", "Planos Nutricionais", "Anamnese & Biometria", "Ranking & Gamificação"]'::jsonb),
  ('mod_restaurante', 'Olivelas - Gestão de Restaurantes & KDS', 'allin_restaurante', 'restaurante', 'restaurante', 'operations', 'Mapa de mesas, comandas eletrônicas, cardápio digital, KDS por praça e fechamento de caixa.', 429.00, TRUE, '["Mapa de Mesas & Salão", "Display de Cozinha (KDS)", "Cardápio & Complementos", "Turnos de Caixa"]'::jsonb),
  ('mod_rifas', 'Olivelas - Rifas & Sorteios Digitais', 'allin_rifas', 'rifas', 'rifas', 'finance', 'Campanhas de sorteios digitais, reserva automática de cotas, checkout PIX e auditoria de ganhadores.', 319.00, TRUE, '["Campanhas & Cotas", "Baixa Automática PIX", "Ranking de Compradores", "Sorteio Auditável"]'::jsonb),
  ('mod_sistema_delivery', 'Olivelas - Central de Delivery', 'allin_delivery', 'sistema_delivery', 'sistema_delivery', 'operations', 'Despacho logístico em tempo real, gestão de entregadores, roteirização e integração de canais.', 389.00, TRUE, '["Torre de Despacho", "Frota de Entregadores", "Monitor SLA de Entrega", "Webhooks & API Keys"]'::jsonb),
  ('mod_sistema_mercado', 'Olivelas - Supermercado & Cestas', 'allin_mercado', 'sistema_mercado', 'sistema_mercado', 'operations', 'Gestão de gôndolas, controle de perecíveis, montagem de cestas matinais e catálogo de encomendas.', 469.00, TRUE, '["Estoque de Supermercado", "Montagem de Cestas", "Encomendas Online", "Controle de Validades"]'::jsonb),
  ('mod_suite_rifa', 'Olivelas - Suíte Multi-Organização de Rifas', 'allin_suite_rifa', 'suite_rifa', 'suite_rifa', 'finance', 'Plataforma SaaS multi-tenant para organizadores de campanhas com controle de planos e bilhetagem.', 690.00, TRUE, '["Multi-Organizações", "Planos & Assinaturas", "Métricas de Consumo", "Campanhas High-Volume"]'::jsonb),
  ('mod_vitrine_digital', 'Olivelas - Vitrine Digital & Analisador IA', 'allin_vitrine_digital', 'vitrine_digital', 'vitrine_digital', 'analytics', 'Vitrine inteligente com inspeção visual por IA, score fotográfico, geração de SEO e governança IAM.', 419.00, TRUE, '["Análise Visual IA", "Gerador de Copy & SEO", "Score de Qualidade", "Monitoramento de Tokens IA"]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  project_folder = EXCLUDED.project_folder,
  db_schema = EXCLUDED.db_schema,
  description = EXCLUDED.description,
  monthly_price = EXCLUDED.monthly_price,
  features = EXCLUDED.features,
  updated_at = now();

-- Vincula todos os 16 módulos à empresa principal (emp-olivelas-matriz e comp_nebula) e módulos principais às demais
INSERT INTO public.allin_company_modules (company_id, module_id, status)
SELECT 'emp-olivelas-matriz', id, 'active' FROM public.allin_modules
ON CONFLICT (company_id, module_id) DO NOTHING;

INSERT INTO public.allin_company_modules (company_id, module_id, status)
SELECT 'comp_nebula', id, 'active' FROM public.allin_modules
ON CONFLICT (company_id, module_id) DO NOTHING;

INSERT INTO public.allin_company_modules (company_id, module_id, status)
SELECT 'emp-aurora-log', id, 'active' FROM public.allin_modules
WHERE id IN ('mod_gestao_estoque', 'mod_sistema_delivery', 'mod_ordem_de_servico', 'mod_especificacoes')
ON CONFLICT (company_id, module_id) DO NOTHING;

INSERT INTO public.allin_company_modules (company_id, module_id, status)
SELECT 'emp-vega-retail', id, 'active' FROM public.allin_modules
WHERE id IN ('mod_gestao_estoque', 'mod_restaurante', 'mod_sistema_mercado', 'mod_vitrine_digital', 'mod_art_hub')
ON CONFLICT (company_id, module_id) DO NOTHING;

INSERT INTO public.allin_company_modules (company_id, module_id, status)
SELECT 'comp_aurora', id, 'active' FROM public.allin_modules
WHERE id IN ('mod_gestao_estoque', 'mod_agendamentos', 'mod_personal_treiner', 'mod_restaurante', 'mod_sistema_mercado')
ON CONFLICT (company_id, module_id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- SEED REALISTA EM CADA UM DOS 16 SCHEMAS DO POSTGRESQL
-- -----------------------------------------------------------------------------

-- 1. agendamento_simples
INSERT INTO agendamento_simples.plans (id, company_id, name, coverage_type, discount_percent, monthly_fee)
VALUES ('plan_odonto_1', 'comp_nebula', 'Olivelas Odonto Prime', 'Integral + Ortodontia', 25.00, 149.90)
ON CONFLICT (id) DO NOTHING;

INSERT INTO agendamento_simples.services (id, company_id, name, category, duration_minutes, price)
VALUES
  ('srv_odonto_1', 'comp_nebula', 'Profilaxia Ultrassônica & Checkup Digital', 'Prevenção', 45, 220.00),
  ('srv_odonto_2', 'comp_nebula', 'Clareamento Dental a Laser', 'Estética', 60, 890.00)
ON CONFLICT (id) DO NOTHING;

INSERT INTO agendamento_simples.patients (id, company_id, user_id, plan_id, full_name, cpf, phone, email, clinical_notes)
VALUES
  ('pat_1', 'comp_nebula', 'usr_tenant_admin', 'plan_odonto_1', 'Mariana Costa Ribeiro', '321.654.987-01', '+55 11 99111-2233', 'mariana.ribeiro@email.com', 'Paciente em acompanhamento semestral de profilaxia e clareamento.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO agendamento_simples.appointments (id, company_id, patient_id, service_id, dentist_user_id, patient_name, service_name, scheduled_at, status, amount, notes)
VALUES
  ('apt_odonto_1', 'comp_nebula', 'pat_1', 'srv_odonto_1', 'usr_global', 'Mariana Costa Ribeiro', 'Profilaxia Ultrassônica & Checkup Digital', now() + INTERVAL '1 day', 'confirmed', 220.00, 'Confirmado via WhatsApp automático')
ON CONFLICT (id) DO NOTHING;

-- 2. agendamentos
INSERT INTO agendamentos.professionals (id, company_id, user_id, name, specialty, council_register, email, phone)
VALUES
  ('prof_1', 'comp_nebula', 'usr_global', 'Dra. Camila Albuquerque', 'Dermatologia & Laser', 'CRM-SP 194821', 'camila@olivelas.com.br', '+55 11 98811-2200')
ON CONFLICT (id) DO NOTHING;

INSERT INTO agendamentos.locations (id, company_id, name, room_code, address, capacity)
VALUES
  ('loc_1', 'comp_nebula', 'Unidade Jardins - Sala 04', 'SALA-04', 'Av. Paulista, 1842 - Conjunto 42', 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO agendamentos.appointment_types (id, company_id, name, duration_minutes, price)
VALUES
  ('atype_1', 'comp_nebula', 'Consulta Dermatológica + Mapeamento Digital', 45, 480.00)
ON CONFLICT (id) DO NOTHING;

INSERT INTO agendamentos.clients (id, company_id, full_name, document, phone, email, health_insurance)
VALUES
  ('cli_ag_1', 'comp_nebula', 'Henrique Vasconcelos Prado', '289.441.008-55', '+55 11 97722-3311', 'henrique.prado@email.com', 'Omint Corporate')
ON CONFLICT (id) DO NOTHING;

INSERT INTO agendamentos.appointments (id, company_id, professional_id, client_id, appointment_type_id, title, start_at, end_at, status, amount, notes)
VALUES
  ('ag_apt_1', 'comp_nebula', 'prof_1', 'cli_ag_1', 'atype_1', 'Consulta Dermatológica - Henrique Prado', now() + INTERVAL '2 days', now() + INTERVAL '2 days 45 minutes', 'confirmed', 480.00, 'Primeira consulta executiva')
ON CONFLICT (id) DO NOTHING;

-- 3. app_condominio
INSERT INTO app_condominio.condominiums (id, company_id, name, cnpj, address, total_units, syndic_user_id)
VALUES
  ('cond_1', 'comp_nebula', 'Residencial Olivelas Grand Park', '41.223.890/0001-44', 'Rua Oscar Freire, 920 - São Paulo/SP', 96, 'usr_tenant_admin')
ON CONFLICT (id) DO NOTHING;

INSERT INTO app_condominio.units (id, company_id, condominium_id, block, unit_number, resident_user_id, resident_name, status)
VALUES
  ('unit_1', 'comp_nebula', 'cond_1', 'Torre A', '1402', 'usr_tenant_admin', 'Carlos Eduardo Mendes', 'occupied')
ON CONFLICT (id) DO NOTHING;

INSERT INTO app_condominio.resources (id, company_id, condominium_id, name, capacity, reservation_fee, rules)
VALUES
  ('res_cond_1', 'comp_nebula', 'cond_1', 'Espaço Gourmet & Wine Lounge', 40, 280.00, 'Uso até 23h00 com lista de convidados na portaria.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO app_condominio.reservations (id, company_id, resource_id, unit_id, resident_user_id, reserved_date, status, fee_amount)
VALUES
  ('rsv_cond_1', 'comp_nebula', 'res_cond_1', 'unit_1', 'usr_tenant_admin', CURRENT_DATE + 5, 'approved', 280.00)
ON CONFLICT (id) DO NOTHING;

INSERT INTO app_condominio.occurrences (id, company_id, condominium_id, unit_id, reporter_user_id, title, category, status, description)
VALUES
  ('occ_cond_1', 'comp_nebula', 'cond_1', 'unit_1', 'usr_tenant_admin', 'Revisão Preventiva dos Elevadores Regenerativos', 'Manutenção Predial', 'open', 'Agendamento de inspeção técnica mensal com equipe certificada.')
ON CONFLICT (id) DO NOTHING;

-- 4. art_hub
INSERT INTO art_hub.collections (id, company_id, name, slug, description, curator_user_id)
VALUES
  ('col_art_1', 'comp_nebula', 'Coleção Neo-Modernismo Brasileiro 2026', 'neo-modernismo-2026', 'Obras catalogadas com visão computacional e curadoria Olivelas Art Hub.', 'usr_global')
ON CONFLICT (id) DO NOTHING;

INSERT INTO art_hub.artworks (id, company_id, collection_id, created_by, code, title, artist_name, style, dimensions, price, ai_tags, ai_description, status)
VALUES
  ('art_1', 'comp_nebula', 'col_art_1', 'usr_global', 'ART-2026-001', 'Horizonte Atlântico em Ouro e Azul', 'Beatriz Monteiro', 'Abstracionismo Geométrico', '120x90cm', 7800.00, '["abstrato", "acrílica sobre tela", "alto padrão", "azul ultramar"]'::jsonb, 'Obra de composição equilibrada com contraste cromático profundo e textura espatulada.', 'published')
ON CONFLICT (id) DO NOTHING;

-- 5. casa_organizada
INSERT INTO casa_organizada.household_profiles (id, company_id, owner_user_id, household_name, residents_count)
VALUES
  ('house_1', 'comp_nebula', 'usr_tenant_admin', 'Residência Família Mendes - Cobertura Jardins', 4)
ON CONFLICT (id) DO NOTHING;

INSERT INTO casa_organizada.global_default_tasks (id, company_id, room, title, frequency, estimated_minutes, points)
VALUES
  ('gtask_1', 'comp_nebula', 'Cozinha', 'Higienizar bancada de quartzo e cafeteira expresso', 'daily', 15, 20),
  ('gtask_2', 'comp_nebula', 'Suíte Master', 'Troca completa de roupa de cama 400 fios e ventilação', 'weekly', 25, 35)
ON CONFLICT (id) DO NOTHING;

INSERT INTO casa_organizada.custom_tasks (id, company_id, household_id, assigned_user_id, room, title, frequency, status)
VALUES
  ('ctask_1', 'comp_nebula', 'house_1', 'usr_tenant_admin', 'Escritório', 'Organizar documentos fiscais e backup do NAS doméstico', 'monthly', 'pending')
ON CONFLICT (id) DO NOTHING;

-- 6. contratos
INSERT INTO contratos.workspaces (id, company_id, owner_user_id, name, slug)
VALUES
  ('ws_cnt_1', 'comp_nebula', 'usr_global', 'Jurídico Corporativo Olivelas', 'juridico-olivelas')
ON CONFLICT (id) DO NOTHING;

INSERT INTO contratos.projects (id, company_id, workspace_id, created_by, name, category, version, status)
VALUES
  ('prj_cnt_1', 'comp_nebula', 'ws_cnt_1', 'usr_global', 'Contrato Master SaaS Enterprise + DPA LGPD', 'Tecnologia & SaaS B2B', '3.2.0', 'published')
ON CONFLICT (id) DO NOTHING;

INSERT INTO contratos.clauses (id, company_id, project_id, code, title, category, body_markdown, mandatory)
VALUES
  ('cls_1', 'comp_nebula', 'prj_cnt_1', 'CL-LGPD-01', 'Proteção de Dados Pessoais e Isolamento Multi-Tenant', 'LGPD & Segurança', 'As partes comprometem-se a tratar dados pessoais estritamente sob criptografia e segregação lógica de schemas.', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO contratos.generated_documents (id, company_id, project_id, generated_by, title, counterparty_name, contract_value, risk_score, status)
VALUES
  ('gdoc_1', 'comp_nebula', 'prj_cnt_1', 'usr_finance', 'Contrato Corporativo #2026-884 - Grupo Vanguarda S.A.', 'Grupo Vanguarda Participações S.A.', 84000.00, 8.5, 'signed')
ON CONFLICT (id) DO NOTHING;

-- 7. especificacoes
INSERT INTO especificacoes.workspaces (id, company_id, owner_id, name, slug, description)
VALUES
  ('ws_spec_1', 'comp_nebula', 'usr_global', 'Arquitetura & Engenharia Olivelas All In', 'engenharia-allin', 'Workspace oficial de especificações técnicas SDD, RFCs e ADRs.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO especificacoes.projects (id, company_id, workspace_id, owner_id, name, slug, description, status)
VALUES
  ('prj_spec_1', 'comp_nebula', 'ws_spec_1', 'usr_global', 'Unificação Multi-Schema Supabase 16 Plataformas', 'unificacao-supabase', 'Padronização arquitetural dos 16 sistemas no ecossistema Olivelas All In.', 'active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO especificacoes.sprints (id, company_id, project_id, title, status, sort_order)
VALUES
  ('spr_spec_1', 'comp_nebula', 'prj_spec_1', 'Sprint 01 - Schemas Dedicados & Login Único', 'active', 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO especificacoes.specifications (id, company_id, project_id, sprint_id, created_by, code, title, description, type, status, version, tags, favorite)
VALUES
  ('spec_1', 'comp_nebula', 'prj_spec_1', 'spr_spec_1', 'usr_global', 'ADR-001', 'Arquitetura Multi-Schema com Login Único em public.profiles', 'Define o padrão oficial onde cada módulo opera em seu próprio schema PostgreSQL compartilhando public.profiles.', 'architecture', 'approved', 2, '["supabase", "multi-schema", "iam", "hbac"]'::jsonb, TRUE)
ON CONFLICT (id) DO NOTHING;

-- 8. gestao_estoque
INSERT INTO gestao_estoque.stores (id, company_id, name, slug, cnpj, is_branch, branch_code, is_active)
VALUES
  ('store_matriz', 'comp_nebula', 'Olivelas Matriz Prime', 'olivelas-matriz-prime', '12.345.678/0001-90', FALSE, 'MATRIZ', TRUE),
  ('store_filial_p1', 'comp_nebula', 'Olivelas Matriz Prime • Filial Paulista', 'olivelas-filial-paulista', '12.345.678/0002-71', TRUE, 'FILIAL-P1', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO gestao_estoque.store_users (store_id, user_id, role, is_active)
VALUES
  ('store_matriz', 'usr_global', 'GLOBAL_ADMIN', TRUE),
  ('store_matriz', 'usr_tenant_admin', 'STORE_ADMIN', TRUE),
  ('store_filial_p1', 'usr_tenant_admin', 'STORE_ADMIN', TRUE)
ON CONFLICT (store_id, user_id) DO NOTHING;

INSERT INTO gestao_estoque.categories (id, store_id, company_id, name, slug)
VALUES
  ('cat_est_1', 'store_matriz', 'comp_nebula', ' Linha Premium & Perfumaria', 'linha-premium-perfumaria')
ON CONFLICT (id) DO NOTHING;

INSERT INTO gestao_estoque.products (id, store_id, company_id, category_id, sku, barcode, name, cost_price, sale_price, min_stock, current_stock, unit)
VALUES
  ('prd_est_1', 'store_matriz', 'comp_nebula', 'cat_est_1', 'OLV-VELA-001', '7898901234567', 'Vela Aromática Olivelas Bourbon Vanilla 320g', 42.00, 129.90, 20, 145, 'UN'),
  ('prd_est_2', 'store_matriz', 'comp_nebula', 'cat_est_1', 'OLV-DIF-002', '7898901234574', 'Difusor de Ambientes Olivelas Figo & Âmbar 250ml', 38.50, 119.90, 15, 92, 'UN')
ON CONFLICT (id) DO NOTHING;

INSERT INTO gestao_estoque.orders (id, store_id, company_id, user_id, order_number, customer_name, channel, status, payment_method, total_amount)
VALUES
  ('ord_est_1', 'store_matriz', 'comp_nebula', 'usr_tenant_admin', 'PDV-2026-0001', 'Atelier Santa Clara', 'IN_STORE', 'DELIVERED', 'PIX', 1299.00)
ON CONFLICT (id) DO NOTHING;

-- 9. ordem_de_servico
INSERT INTO ordem_de_servico.customers (id, company_id, name, document, phone, email)
VALUES
  ('cust_os_1', 'comp_nebula', 'TechCorp Engenharia Ltda.', '33.112.445/0001-09', '+55 11 96655-4433', 'infra@techcorp.com.br')
ON CONFLICT (id) DO NOTHING;

INSERT INTO ordem_de_servico.technicians (id, company_id, user_id, name, specialty, commission_percent)
VALUES
  ('tech_os_1', 'comp_nebula', 'usr_tenant_admin', 'Lucas Ferreira (Especialista Apple & SMD)', 'Reparo Avançado de Placa Lógica', 18.00)
ON CONFLICT (id) DO NOTHING;

INSERT INTO ordem_de_servico.service_orders (id, company_id, os_number, customer_id, technician_id, customer_name, device_label, reported_defect, diagnostic_report, status, priority, parts_total, labor_total, total_amount, warranty_days)
VALUES
  ('os_2026_1', 'comp_nebula', 'OS-2026-0104', 'cust_os_1', 'tech_os_1', 'TechCorp Engenharia Ltda.', 'MacBook Pro 16" M3 Max (SN: C02X991)', 'Não carrega via MagSafe 3 / Curto no circuito CD3217', 'Substituição do controlador USB-C/Thunderbolt e limpeza ultrassônica concluída.', 'ready_for_pickup', 'high', 520.00, 680.00, 1200.00, 180)
ON CONFLICT (id) DO NOTHING;

-- 10. personal_treiner
INSERT INTO personal_treiner.trainers (id, company_id, user_id, full_name, cref, specialty, email, phone)
VALUES
  ('trn_1', 'comp_nebula', 'usr_global', 'Prof. Rafael Oliveira (Head Coach)', 'CREF 142980-G/SP', 'Biomecânica Aplicada & Alta Performance', 'rafael.coach@olivelas.com.br', '+55 11 95544-3322')
ON CONFLICT (id) DO NOTHING;

INSERT INTO personal_treiner.students (id, company_id, trainer_id, user_id, full_name, email, phone, goal, plan_name, monthly_fee, weight_kg, body_fat_percent, streak_days)
VALUES
  ('std_1', 'comp_nebula', 'trn_1', 'usr_tenant_admin', 'Carlos Eduardo Mendes', 'carlos.mendes@nebula.com.br', '+55 11 99888-0002', 'Recomposição Corporal & Força', 'Black VIP Presencial + App Olivelas', 690.00, 82.4, 13.8, 24)
ON CONFLICT (id) DO NOTHING;

INSERT INTO personal_treiner.workout_plans (id, company_id, student_id, trainer_id, title, split_type, weeks_duration, sessions_completed, status)
VALUES
  ('wkp_1', 'comp_nebula', 'std_1', 'trn_1', 'Mesociclo 03 - Força & Hipertrofia Miofibrilar', 'Upper / Lower + Push / Pull / Legs', 8, 19, 'active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO personal_treiner.nutrition_plans (id, company_id, student_id, title, daily_calories, protein_g, carbs_g, fat_g)
VALUES
  ('nut_1', 'comp_nebula', 'std_1', 'Protocolo Normocalórico Limpo (Ciclagem de Carboidratos)', 2650, 195, 290, 75)
ON CONFLICT (id) DO NOTHING;

-- 11. restaurante
INSERT INTO restaurante.restaurants (id, company_id, name, cuisine_type, open_tables, total_tables, service_fee_percent)
VALUES
  ('rest_1', 'comp_nebula', 'Olivelas Bistrô & Rooftop', 'Cozinha Autoral Mediterrânea', 11, 28, 12.00)
ON CONFLICT (id) DO NOTHING;

INSERT INTO restaurante.products (id, company_id, restaurant_id, category, name, description, price, prep_time_minutes, kds_station)
VALUES
  ('rprd_1', 'comp_nebula', 'rest_1', 'Pratos Principais', 'Risoto de Açafrão com Polvo Grelhado na Brasa', 'Arroz carnaroli italiano, tentáculos de polvo grelhados no carvão e azeite trufado.', 148.00, 22, 'Praça Quente & Grill')
ON CONFLICT (id) DO NOTHING;

INSERT INTO restaurante.orders (id, company_id, restaurant_id, table_number, waiter_user_id, order_code, items_summary, kds_status, total_amount)
VALUES
  ('rord_1', 'comp_nebula', 'rest_1', 14, 'usr_tenant_admin', 'MESA-14-089', '2x Risoto de Polvo, 1x Burrata ao Pesto, 2x Taça Pinot Noir', 'preparing', 462.00)
ON CONFLICT (id) DO NOTHING;

-- 12. rifas
INSERT INTO rifas.campaigns (id, company_id, created_by, title, slug, prize_description, ticket_price, total_numbers, sold_numbers, draw_date, status)
VALUES
  ('rif_camp_1', 'comp_nebula', 'usr_global', 'Sorteio Beneficente Olivelas - Porsche Macan Elétrico + Kit Casa', 'porsche-macan-olivelas-2026', 'Porsche Macan EV 0km Blindado + R$ 50.000 no PIX', 29.90, 100000, 68420, CURRENT_DATE + 20, 'active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO rifas.orders (id, company_id, campaign_id, buyer_user_id, buyer_name, buyer_phone, tickets_count, numbers_selected, total_amount, payment_status, pix_txid)
VALUES
  ('rif_ord_1', 'comp_nebula', 'rif_camp_1', 'usr_finance', 'Fernanda Lima', '+55 11 99888-0003', 10, '[10492, 18201, 24910, 33812, 40192, 51209, 64812, 77321, 88412, 91044]'::jsonb, 299.00, 'paid', 'E1823612020261109PIX001')
ON CONFLICT (id) DO NOTHING;

-- 13. sistema_delivery
INSERT INTO sistema_delivery.stores (id, company_id, name, city, delivery_radius_km, avg_prep_minutes, status)
VALUES
  ('dlv_store_1', 'comp_nebula', 'Hub Dark Kitchen & Express Olivelas - Itaim', 'São Paulo - SP', 14.0, 18, 'online')
ON CONFLICT (id) DO NOTHING;

INSERT INTO sistema_delivery.couriers (id, company_id, name, phone, vehicle_type, plate, status, deliveries_today)
VALUES
  ('dlv_cour_1', 'comp_nebula', 'Diego Nascimento (Entregador Líder)', '+55 11 94433-2211', 'Moto Honda PCX 160', 'BRA-2E19', 'on_route', 16)
ON CONFLICT (id) DO NOTHING;

INSERT INTO sistema_delivery.delivery_orders (id, company_id, store_id, courier_id, external_code, channel, customer_name, delivery_address, status, delivery_fee, total_amount)
VALUES
  ('dlv_ord_1', 'comp_nebula', 'dlv_store_1', 'dlv_cour_1', 'DLV-99412', 'App Olivelas Direto', 'Gabriela Fontes', 'Rua Joaquim Floriano, 1050 - Apto 182 - Itaim Bibi', 'dispatched', 12.90, 218.50)
ON CONFLICT (id) DO NOTHING;

-- 14. sistema_mercado
INSERT INTO sistema_mercado.products (id, company_id, sku, name, aisle_category, brand, unit_price, stock_quantity, expiration_date)
VALUES
  ('mrc_prd_1', 'comp_nebula', 'MRC-CAF-001', 'Café Especial Torra Média Grãos 500g Mantiqueira', 'Cafés & Matinais', 'Olivelas Seleção', 54.90, 86, CURRENT_DATE + 180)
ON CONFLICT (id) DO NOTHING;

INSERT INTO sistema_mercado.breakfast_baskets (id, company_id, code, name, theme, items_count, price, stock_ready)
VALUES
  ('mrc_bsk_1', 'comp_nebula', 'CESTA-LUX-01', 'Cesta Bom Dia Imperial Olivelas', 'Presente Corporativo & Datas Especiais', 18, 289.90, 14)
ON CONFLICT (id) DO NOTHING;

INSERT INTO sistema_mercado.catalog_requests (id, company_id, basket_id, customer_name, customer_phone, delivery_date, gift_message, total_amount, status)
VALUES
  ('mrc_req_1', 'comp_nebula', 'mrc_bsk_1', 'Diretoria Banco Atlas', '+55 11 93322-1100', CURRENT_DATE + 1, 'Parabéns pelos resultados extraordinários do trimestre!', 2899.00, 'confirmed')
ON CONFLICT (id) DO NOTHING;

-- 15. suite_rifa
INSERT INTO suite_rifa.organizations (id, company_id, owner_user_id, name, slug, plan_tier, active_campaigns_limit, monthly_volume, status)
VALUES
  ('srf_org_1', 'comp_nebula', 'usr_global', 'Olivelas Sorteios & Filantropia Nacional', 'olivelas-sorteios-nacional', 'Enterprise Unlimited', 100, 485000.00, 'active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO suite_rifa.campaigns (id, company_id, organization_id, title, quota_price, total_quotas, sold_quotas, revenue_amount, status)
VALUES
  ('srf_cmp_1', 'comp_nebula', 'srf_org_1', 'Mega Ação Nacional - Apartamento Decorado Jardins', 14.90, 500000, 210400, 3134960.00, 'active')
ON CONFLICT (id) DO NOTHING;

-- 16. vitrine_digital
INSERT INTO vitrine_digital.art_submissions (id, company_id, submitted_by, sku_code, title, category, ai_quality_score, seo_headline, conversion_tags, status)
VALUES
  ('vit_sub_1', 'comp_nebula', 'usr_global', 'VIT-2026-001', 'Kit Home Fragrance Olivelas Gold Edition', 'Home & Decor Premium', 98.7, 'Kit Difusor e Vela Olivelas Gold Edition | Perfumaria de Luxo para Ambientes', '["alta conversão", "iluminação estúdio", "seo otimizado", "luxo"]'::jsonb, 'approved')
ON CONFLICT (id) DO NOTHING;

INSERT INTO vitrine_digital.image_analysis (id, company_id, submission_id, model_used, lighting_score, composition_score, recommendations, tokens_used)
VALUES
  ('vit_ana_1', 'comp_nebula', 'vit_sub_1', 'gemini-2.5-pro-vision', 99.0, 98.4, 'Iluminação difusa impecável, nitidez de rótulo excelente para zoom no e-commerce.', 1280)
ON CONFLICT (id) DO NOTHING;
