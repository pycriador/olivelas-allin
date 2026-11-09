-- =============================================================================
-- OLIVELAS ALL IN - MIGRATION 01: UNIFIED LOGIN (public.profiles) & CORE HUB
-- =============================================================================
-- Arquitetura padronizada baseada no gestao_estoque:
-- 1. Login e perfis de usuários centralizados em uma única tabela: public.profiles
-- 2. View compatível public.allin_users apontando para public.profiles
-- 3. Multi-tenancy corporativo (public.allin_companies), HBAC (public.allin_roles),
--    Catálogo dos 16 módulos Olivelas (public.allin_modules) e governança completa.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. TABELA ÚNICA DE LOGIN / PERFIS DE USUÁRIOS (public.profiles)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  auth_user_id UUID UNIQUE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  is_global_admin BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending_onboarding', 'blocked', 'archived')),
  language TEXT NOT NULL DEFAULT 'pt-BR' CHECK (language IN ('pt-BR', 'en', 'es')),
  role_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  company_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  individual_permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  archive_metadata JSONB,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);

-- View espelho para compatibilidade direta com referências a allin_users
CREATE OR REPLACE VIEW public.allin_users AS
SELECT
  id,
  auth_user_id,
  email,
  full_name,
  full_name AS name,
  phone,
  avatar_url,
  is_global_admin,
  status,
  language,
  role_ids,
  company_ids,
  individual_permissions,
  archive_metadata,
  last_login_at,
  created_at,
  updated_at
FROM public.profiles;

-- Trigger de sincronização automática com auth.users do Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    auth_user_id,
    email,
    full_name,
    avatar_url,
    phone,
    is_global_admin,
    status
  )
  VALUES (
    NEW.id::text,
    NEW.id,
    COALESCE(NEW.email, NEW.id::text || '@olivelas.com.br'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(COALESCE(NEW.email, 'usuario'), '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.phone,
    COALESCE((NEW.raw_user_meta_data->>'is_global_admin')::boolean, FALSE),
    'active'
  )
  ON CONFLICT (email) DO UPDATE
    SET auth_user_id = EXCLUDED.auth_user_id,
        full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
        updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- -----------------------------------------------------------------------------
-- 2. EMPRESAS / TENANTS (public.allin_companies)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.allin_companies (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  trade_name TEXT NOT NULL,
  legal_name TEXT NOT NULL,
  cnpj TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'onboarding', 'archived')),
  theme_id TEXT NOT NULL DEFAULT 'corporate-navy',
  primary_color TEXT NOT NULL DEFAULT '#1E3A8A',
  logo_url TEXT,
  domains JSONB NOT NULL DEFAULT '[]'::jsonb,
  allowed_global_ip_ranges JSONB NOT NULL DEFAULT '[]'::jsonb,
  parent_company_id TEXT REFERENCES public.allin_companies(id) ON DELETE SET NULL,
  is_branch BOOLEAN NOT NULL DEFAULT FALSE,
  branch_code TEXT,
  archive_metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Vínculo Usuário <-> Empresa (padrão store_users do gestao_estoque unificado)
CREATE TABLE IF NOT EXISTS public.company_users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL REFERENCES public.allin_companies(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'COMPANY_ADMIN',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, user_id)
);

-- -----------------------------------------------------------------------------
-- 3. PAPÉIS HBAC (public.allin_roles)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.allin_roles (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('global', 'company')),
  company_id TEXT REFERENCES public.allin_companies(id) ON DELETE CASCADE,
  description TEXT,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  archive_metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 4. CATÁLOGO DE MÓDULOS OLIVELAS (public.allin_modules & company_modules)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.allin_modules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  project_folder TEXT,
  db_schema TEXT NOT NULL DEFAULT 'public',
  category TEXT NOT NULL CHECK (category IN ('core', 'finance', 'operations', 'integrations', 'analytics')),
  description TEXT NOT NULL,
  monthly_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  archive_metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.allin_company_modules (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL REFERENCES public.allin_companies(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL REFERENCES public.allin_modules(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trial', 'suspended', 'cancelled')),
  activated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  UNIQUE(company_id, module_id)
);

-- -----------------------------------------------------------------------------
-- 5. CONTRATOS, COBRANÇAS, PARCELAS E PAGAMENTOS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.allin_contracts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL REFERENCES public.allin_companies(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  plan_name TEXT NOT NULL,
  module_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  value NUMERIC(12,2) NOT NULL DEFAULT 0,
  billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'quarterly', 'yearly')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'draft', 'suspended', 'expired', 'archived')),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  clauses TEXT,
  archive_metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.allin_payment_methods (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL REFERENCES public.allin_companies(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('credit_card', 'pix', 'boleto', 'bank_transfer')),
  label TEXT NOT NULL,
  holder_name TEXT NOT NULL,
  masked_number TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  archive_metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.allin_charges (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL REFERENCES public.allin_companies(id) ON DELETE CASCADE,
  contract_id TEXT REFERENCES public.allin_contracts(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  due_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled', 'partial')),
  payment_method_type TEXT NOT NULL DEFAULT 'pix',
  installments_count INTEGER NOT NULL DEFAULT 1,
  archive_metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.allin_installments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  charge_id TEXT NOT NULL REFERENCES public.allin_charges(id) ON DELETE CASCADE,
  company_id TEXT NOT NULL REFERENCES public.allin_companies(id) ON DELETE CASCADE,
  number INTEGER NOT NULL DEFAULT 1,
  total_installments INTEGER NOT NULL DEFAULT 1,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  due_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  paid_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.allin_payments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  charge_id TEXT NOT NULL REFERENCES public.allin_charges(id) ON DELETE CASCADE,
  installment_id TEXT REFERENCES public.allin_installments(id) ON DELETE SET NULL,
  company_id TEXT NOT NULL REFERENCES public.allin_companies(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  method TEXT NOT NULL DEFAULT 'pix',
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'processing', 'failed', 'refunded')),
  paid_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  transaction_code TEXT NOT NULL,
  receipt_url TEXT
);

-- -----------------------------------------------------------------------------
-- 6. INTEGRADOR DE API, CHAMADOS, OPERAÇÕES E AUDITORIA
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.allin_api_collections (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT REFERENCES public.allin_companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  requests JSONB NOT NULL DEFAULT '[]'::jsonb,
  archive_metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.allin_api_environments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT REFERENCES public.allin_companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  base_url TEXT NOT NULL,
  variables JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  archive_metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.allin_api_services (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT REFERENCES public.allin_companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  provider TEXT NOT NULL,
  base_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'healthy' CHECK (status IN ('healthy', 'degraded', 'down', 'archived')),
  auth_type TEXT NOT NULL DEFAULT 'bearer',
  last_sync_at TIMESTAMPTZ,
  archive_metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.allin_api_tokens (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT REFERENCES public.allin_companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  prefix TEXT NOT NULL,
  masked_token TEXT NOT NULL,
  scopes JSONB NOT NULL DEFAULT '[]'::jsonb,
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired', 'archived')),
  last_used_at TIMESTAMPTZ,
  archive_metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.allin_api_history (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT REFERENCES public.allin_companies(id) ON DELETE CASCADE,
  method TEXT NOT NULL,
  url TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  executed_by TEXT,
  response_preview TEXT
);

CREATE TABLE IF NOT EXISTS public.allin_tickets (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL REFERENCES public.allin_companies(id) ON DELETE CASCADE,
  protocol TEXT NOT NULL,
  subject TEXT NOT NULL,
  category TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_customer', 'resolved', 'archived')),
  requester_user_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_user_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  archive_metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.allin_operational_items (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL REFERENCES public.allin_companies(id) ON DELETE CASCADE,
  module_slug TEXT NOT NULL,
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'completed', 'paused', 'archived')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  due_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  archive_metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.allin_audit_events (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT REFERENCES public.allin_companies(id) ON DELETE SET NULL,
  actor_user_id TEXT,
  actor_name TEXT NOT NULL,
  actor_email TEXT NOT NULL,
  action TEXT NOT NULL,
  module TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  target_label TEXT NOT NULL,
  reason TEXT,
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 7. FUNÇÕES AUXILIARES DE SEGURANÇA (padrão gestao_estoque)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_global_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_global_admin FROM public.profiles WHERE id = auth.uid()::text OR auth_user_id = auth.uid() LIMIT 1),
    TRUE
  );
$$;

CREATE OR REPLACE FUNCTION public.has_company_access(check_company_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    public.is_global_admin() OR EXISTS (
      SELECT 1 FROM public.company_users
      WHERE company_id = check_company_id
        AND user_id = auth.uid()::text
        AND is_active = TRUE
    ),
    TRUE
  );
$$;

-- Permissões e RLS aberta para operação unificada com chave publishable/authenticated
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', r.tablename);
    EXECUTE format('DROP POLICY IF EXISTS "olivelas_allin_public_access" ON public.%I;', r.tablename);
    EXECUTE format(
      'CREATE POLICY "olivelas_allin_public_access" ON public.%I FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);',
      r.tablename
    );
  END LOOP;
END $$;

