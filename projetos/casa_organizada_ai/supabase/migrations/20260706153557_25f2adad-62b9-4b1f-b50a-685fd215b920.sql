
-- =========================================================
-- 1) RBAC: enum, tabela user_roles, admin_emails, has_role
-- =========================================================
CREATE TYPE public.app_role AS ENUM ('global_admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'global_admin'));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'global_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'global_admin'));

-- =========================================================
-- 2) admin_emails (seed configurável)
-- =========================================================
CREATE TABLE public.admin_emails (
  email TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.admin_emails TO authenticated;
GRANT ALL ON public.admin_emails TO service_role;
ALTER TABLE public.admin_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage admin_emails"
  ON public.admin_emails FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'global_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'global_admin'));

INSERT INTO public.admin_emails (email) VALUES
  ('willian.o.jesus@gmail.com'),
  ('py.criador@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- =========================================================
-- 3) Trigger: concede global_admin quando email verificado ∈ admin_emails
-- =========================================================
CREATE OR REPLACE FUNCTION public.grant_admin_for_seed_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL
     AND EXISTS (SELECT 1 FROM public.admin_emails WHERE lower(email) = lower(NEW.email))
  THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'global_admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  -- Todo usuário recebe o papel 'user' base
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_grant_role
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.grant_admin_for_seed_email();

CREATE TRIGGER on_auth_user_confirmed_grant_admin
AFTER UPDATE OF email_confirmed_at ON auth.users
FOR EACH ROW
WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
EXECUTE FUNCTION public.grant_admin_for_seed_email();

-- Retroativo: aplicar aos usuários já existentes
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'user'::public.app_role
FROM auth.users u
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'global_admin'::public.app_role
FROM auth.users u
JOIN public.admin_emails a ON lower(a.email) = lower(u.email)
WHERE u.email_confirmed_at IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- =========================================================
-- 4) Extensão do perfil
-- =========================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  ADD COLUMN IF NOT EXISTS country TEXT NOT NULL DEFAULT 'BR',
  ADD COLUMN IF NOT EXISTS notifications JSONB NOT NULL DEFAULT
    '{"in_app": true, "email": false, "push": false, "reminders": true, "invites": true, "shares": true}'::jsonb,
  ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS banned_reason TEXT;

-- Admin pode ver todos os perfis
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'global_admin'));

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'global_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'global_admin'));

-- =========================================================
-- 5) Auditoria
-- =========================================================
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX audit_log_user_id_idx ON public.audit_log (user_id, created_at DESC);
CREATE INDEX audit_log_action_idx ON public.audit_log (action, created_at DESC);
CREATE INDEX audit_log_entity_idx ON public.audit_log (entity_type, entity_id);

GRANT SELECT, INSERT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Cada um vê os próprios registros; admin vê tudo
CREATE POLICY "Users can view own audit"
  ON public.audit_log FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all audit"
  ON public.audit_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'global_admin'));

CREATE POLICY "Users can insert own audit"
  ON public.audit_log FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
