
-- =========================================================
-- Sprint 32 Phase 1: Foundation Cloud + Multiempresa + RBAC
-- =========================================================

-- ROLES ENUM
CREATE TYPE public.app_role AS ENUM ('global_admin', 'admin', 'editor', 'viewer');

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- USER_ROLES (global)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- SECURITY DEFINER helpers
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_global_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'global_admin')
$$;

-- COMPANIES
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cnpj TEXT,
  logo_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO authenticated;
GRANT ALL ON public.companies TO service_role;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- USER_COMPANIES
CREATE TABLE public.user_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'viewer',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, company_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_companies TO authenticated;
GRANT ALL ON public.user_companies TO service_role;
ALTER TABLE public.user_companies ENABLE ROW LEVEL SECURITY;

-- Access helper
CREATE OR REPLACE FUNCTION public.has_company_access(_user_id UUID, _company_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.is_global_admin(_user_id)
      OR EXISTS (
        SELECT 1 FROM public.user_companies
        WHERE user_id = _user_id AND company_id = _company_id
      )
$$;

-- COMPANY EMAIL DOMAINS
CREATE TABLE public.company_email_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  default_role public.app_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (domain)
);
GRANT SELECT ON public.company_email_domains TO authenticated;
GRANT ALL ON public.company_email_domains TO service_role;
ALTER TABLE public.company_email_domains ENABLE ROW LEVEL SECURITY;

-- AUDIT LOG
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource TEXT,
  result TEXT,
  ip TEXT,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- =====================
-- POLICIES
-- =====================

-- profiles
CREATE POLICY "profiles self read" ON public.profiles
  FOR SELECT TO authenticated USING (id = auth.uid() OR public.is_global_admin(auth.uid()));
CREATE POLICY "profiles self write" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "profiles self insert" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

-- user_roles: read own; global_admin all
CREATE POLICY "user_roles self read" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_global_admin(auth.uid()));

-- companies: members + global_admin
CREATE POLICY "companies members read" ON public.companies
  FOR SELECT TO authenticated USING (public.has_company_access(auth.uid(), id));
CREATE POLICY "companies admin write" ON public.companies
  FOR INSERT TO authenticated WITH CHECK (public.is_global_admin(auth.uid()));
CREATE POLICY "companies admin update" ON public.companies
  FOR UPDATE TO authenticated USING (
    public.is_global_admin(auth.uid())
    OR EXISTS (SELECT 1 FROM public.user_companies uc
               WHERE uc.company_id = id AND uc.user_id = auth.uid() AND uc.role IN ('admin','global_admin'))
  );
CREATE POLICY "companies admin delete" ON public.companies
  FOR DELETE TO authenticated USING (public.is_global_admin(auth.uid()));

-- user_companies
CREATE POLICY "user_companies self read" ON public.user_companies
  FOR SELECT TO authenticated USING (
    user_id = auth.uid() OR public.is_global_admin(auth.uid())
    OR EXISTS (SELECT 1 FROM public.user_companies uc2
               WHERE uc2.company_id = company_id AND uc2.user_id = auth.uid() AND uc2.role IN ('admin','global_admin'))
  );
CREATE POLICY "user_companies admin write" ON public.user_companies
  FOR ALL TO authenticated
  USING (
    public.is_global_admin(auth.uid())
    OR EXISTS (SELECT 1 FROM public.user_companies uc3
               WHERE uc3.company_id = company_id AND uc3.user_id = auth.uid() AND uc3.role IN ('admin','global_admin'))
  )
  WITH CHECK (
    public.is_global_admin(auth.uid())
    OR EXISTS (SELECT 1 FROM public.user_companies uc4
               WHERE uc4.company_id = company_id AND uc4.user_id = auth.uid() AND uc4.role IN ('admin','global_admin'))
  );

-- company_email_domains: admin-only
CREATE POLICY "company_email_domains admin read" ON public.company_email_domains
  FOR SELECT TO authenticated USING (public.has_company_access(auth.uid(), company_id));
CREATE POLICY "company_email_domains admin write" ON public.company_email_domains
  FOR ALL TO authenticated
  USING (
    public.is_global_admin(auth.uid())
    OR EXISTS (SELECT 1 FROM public.user_companies uc
               WHERE uc.company_id = company_id AND uc.user_id = auth.uid() AND uc.role IN ('admin','global_admin'))
  )
  WITH CHECK (
    public.is_global_admin(auth.uid())
    OR EXISTS (SELECT 1 FROM public.user_companies uc
               WHERE uc.company_id = company_id AND uc.user_id = auth.uid() AND uc.role IN ('admin','global_admin'))
  );

-- audit_log
CREATE POLICY "audit self read" ON public.audit_log
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_global_admin(auth.uid()));
CREATE POLICY "audit self insert" ON public.audit_log
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- =====================
-- TRIGGERS
-- =====================

-- updated_at helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_companies_updated BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-link by verified email domain
CREATE OR REPLACE FUNCTION public.link_user_by_verified_domain(_user_id UUID, _email TEXT)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _domain TEXT := lower(split_part(_email, '@', 2));
BEGIN
  IF _domain IS NULL OR _domain = '' THEN RETURN; END IF;

  INSERT INTO public.user_companies (user_id, company_id, role, is_default)
  SELECT _user_id, ced.company_id, ced.default_role,
         NOT EXISTS (SELECT 1 FROM public.user_companies WHERE user_id = _user_id)
  FROM public.company_email_domains ced
  WHERE ced.domain = _domain
  ON CONFLICT (user_id, company_id) DO NOTHING;
END; $$;

-- handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'viewer')
  ON CONFLICT (user_id, role) DO NOTHING;

  IF NEW.email_confirmed_at IS NOT NULL AND NEW.email IS NOT NULL THEN
    PERFORM public.link_user_by_verified_domain(NEW.id, NEW.email);
  END IF;

  INSERT INTO public.audit_log (user_id, action, result, metadata)
  VALUES (NEW.id, 'user.signup', 'success', jsonb_build_object('email', NEW.email));

  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Re-link when email is later confirmed
CREATE OR REPLACE FUNCTION public.on_email_confirmed()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL AND NEW.email IS NOT NULL THEN
    PERFORM public.link_user_by_verified_domain(NEW.id, NEW.email);
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_email_confirmed
AFTER UPDATE OF email_confirmed_at ON auth.users
FOR EACH ROW
WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
EXECUTE FUNCTION public.on_email_confirmed();

-- Indexes
CREATE INDEX idx_user_companies_user ON public.user_companies(user_id);
CREATE INDEX idx_user_companies_company ON public.user_companies(company_id);
CREATE INDEX idx_audit_user ON public.audit_log(user_id, created_at DESC);
CREATE INDEX idx_audit_company ON public.audit_log(company_id, created_at DESC);
