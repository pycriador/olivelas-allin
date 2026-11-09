-- Migration: IAM, HBAC, API Tokens, Group Gemini Quotas and Art Submissions
-- Date: 2026-09-10

-- 1. Tabela de Grupos (HBAC)
CREATE TABLE IF NOT EXISTS public.iam_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  gemini_api_key TEXT, -- Chave de API do Gemini segura gravada por grupo
  quota_brl NUMERIC(10,2) NOT NULL DEFAULT 200.00,
  used_brl NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  max_requests_per_day INT DEFAULT 500,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Tabela de Perfis IAM e Papéis
CREATE TABLE IF NOT EXISTS public.iam_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'consumer' CHECK (role IN ('global_admin', 'analyst', 'consumer')),
  group_ids UUID[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  custom_quota_brl NUMERIC(10,2) DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Tabela de Tokens de API
CREATE TABLE IF NOT EXISTS public.iam_api_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  token_prefix TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  user_id UUID REFERENCES public.iam_users(id) ON DELETE SET NULL,
  group_id UUID REFERENCES public.iam_groups(id) ON DELETE SET NULL,
  assigned_role TEXT NOT NULL DEFAULT 'consumer' CHECK (assigned_role IN ('global_admin', 'analyst', 'consumer')),
  quota_brl NUMERIC(10,2) NOT NULL DEFAULT 50.00,
  used_brl NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  expires_at TIMESTAMPTZ DEFAULT NULL,
  last_used_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Tabela de Fila de Submissões de Artes (Consumidores -> Analistas/Admins)
CREATE TABLE IF NOT EXISTS public.art_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submitted_by_user_id TEXT NOT NULL,
  submitted_by_email TEXT NOT NULL,
  submitted_by_name TEXT,
  image_path TEXT NOT NULL,
  image_url TEXT NOT NULL,
  notes TEXT,
  sender_phone TEXT,
  sender_name TEXT,
  target_group_id UUID REFERENCES public.iam_groups(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by_user_id TEXT,
  approved_by_email TEXT,
  rejection_reason TEXT,
  processed_analysis_id UUID REFERENCES public.image_analysis(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Inserção de dados iniciais padrão
INSERT INTO public.iam_groups (name, slug, description, quota_brl, used_brl)
VALUES 
  ('Monumento', 'monumento', 'Grupo Comercial Monumento com cota inicial de IA', 200.00, 0.00),
  ('Geral & Varejo', 'geral-varejo', 'Grupo geral para lojistas e ofertas variadas', 100.00, 0.00)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.iam_users (email, full_name, role, is_active)
VALUES 
  ('willian.o.jesus@gmail.com', 'Willian Jesus', 'global_admin', true)
ON CONFLICT (email) DO UPDATE SET role = 'global_admin';
