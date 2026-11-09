
CREATE TYPE public.platform_role AS ENUM ('GLOBAL_ADMIN');
CREATE TYPE public.org_role AS ENUM ('OWNER','ADMIN','MEMBER','VIEWER');
CREATE TYPE public.org_status AS ENUM ('ACTIVE','SUSPENDED','INACTIVE');
CREATE TYPE public.membership_status AS ENUM ('ACTIVE','INVITED','REMOVED');
CREATE TYPE public.invitation_status AS ENUM ('INVITED','ACCEPTED','EXPIRED','REVOKED');
CREATE TYPE public.plan_status AS ENUM ('ACTIVE','INACTIVE');
CREATE TYPE public.subscription_status AS ENUM ('TRIALING','ACTIVE','PAST_DUE','CANCELLED','EXPIRED','SUSPENDED');
CREATE TYPE public.billing_interval AS ENUM ('MONTHLY','YEARLY');

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.platform_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role public.platform_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
CREATE INDEX idx_platform_roles_user ON public.platform_roles(user_id);

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
GRANT SELECT ON public.platform_roles TO authenticated;
GRANT ALL ON public.platform_roles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_global_admin(_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.platform_roles WHERE user_id = _user_id AND role = 'GLOBAL_ADMIN');
$$;

CREATE POLICY "profiles_select_own_or_admin" ON public.profiles FOR SELECT TO authenticated
USING (id = auth.uid() OR public.is_global_admin());
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated
USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated
WITH CHECK (id = auth.uid());

CREATE POLICY "platform_roles_select_own_or_admin" ON public.platform_roles FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_global_admin());
