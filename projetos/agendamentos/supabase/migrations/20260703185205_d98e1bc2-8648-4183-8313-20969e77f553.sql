
-- =========================
-- ENUMS
-- =========================
CREATE TYPE public.app_role AS ENUM (
  'global_admin',
  'clinic_admin',
  'receptionist',
  'psychologist',
  'supervisor',
  'read_only'
);

CREATE TYPE public.tenant_status AS ENUM ('active', 'suspended', 'trial');
CREATE TYPE public.user_status AS ENUM ('active', 'inactive', 'invited');
CREATE TYPE public.client_status AS ENUM ('active', 'inactive', 'archived');
CREATE TYPE public.event_status AS ENUM ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show');
CREATE TYPE public.event_source AS ENUM ('manual', 'google', 'client_portal', 'api');
CREATE TYPE public.block_reason AS ENUM ('vacation', 'sick_leave', 'meeting', 'training', 'conference', 'day_off', 'holiday', 'manual');
CREATE TYPE public.schedule_group_kind AS ENUM ('full', 'morning', 'afternoon', 'evening', 'on_call', 'custom');

-- =========================
-- UPDATED_AT HELPER
-- =========================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =========================
-- TENANTS
-- =========================
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  status public.tenant_status NOT NULL DEFAULT 'trial',
  timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  locale TEXT NOT NULL DEFAULT 'pt-BR',
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenants TO authenticated;
GRANT ALL ON public.tenants TO service_role;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_tenants_updated_at BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================
-- PROFILES
-- =========================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  status public.user_status NOT NULL DEFAULT 'active',
  locale TEXT NOT NULL DEFAULT 'pt-BR',
  timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_profiles_tenant_id ON public.profiles(tenant_id);

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================
-- USER ROLES (RBAC)
-- =========================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, tenant_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_tenant_id ON public.user_roles(tenant_id);

-- =========================
-- SECURITY DEFINER HELPERS
-- =========================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_global_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'global_admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.user_belongs_to_tenant(_user_id UUID, _tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id AND tenant_id = _tenant_id
  );
$$;

-- =========================
-- TENANTS RLS
-- =========================
CREATE POLICY "Users view their tenant" ON public.tenants
  FOR SELECT TO authenticated
  USING (id = public.current_tenant_id() OR public.is_global_admin(auth.uid()));

CREATE POLICY "Clinic admins update their tenant" ON public.tenants
  FOR UPDATE TO authenticated
  USING (
    (id = public.current_tenant_id() AND public.has_role(auth.uid(), 'clinic_admin'))
    OR public.is_global_admin(auth.uid())
  );

CREATE POLICY "Anyone authenticated can create a tenant" ON public.tenants
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- =========================
-- PROFILES RLS
-- =========================
CREATE POLICY "Users view profiles in their tenant" ON public.profiles
  FOR SELECT TO authenticated
  USING (tenant_id = public.current_tenant_id() OR id = auth.uid() OR public.is_global_admin(auth.uid()));

CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_global_admin(auth.uid()));

CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "Clinic admins delete profiles in tenant" ON public.profiles
  FOR DELETE TO authenticated
  USING (
    (tenant_id = public.current_tenant_id() AND public.has_role(auth.uid(), 'clinic_admin'))
    OR public.is_global_admin(auth.uid())
  );

-- =========================
-- USER_ROLES RLS
-- =========================
CREATE POLICY "Users view roles in their tenant" ON public.user_roles
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR tenant_id = public.current_tenant_id()
    OR public.is_global_admin(auth.uid())
  );

CREATE POLICY "Clinic admins manage roles in tenant" ON public.user_roles
  FOR ALL TO authenticated
  USING (
    (tenant_id = public.current_tenant_id() AND public.has_role(auth.uid(), 'clinic_admin'))
    OR public.is_global_admin(auth.uid())
  )
  WITH CHECK (
    (tenant_id = public.current_tenant_id() AND public.has_role(auth.uid(), 'clinic_admin'))
    OR public.is_global_admin(auth.uid())
  );

-- =========================
-- TENANT SETTINGS
-- =========================
CREATE TABLE public.tenant_settings (
  tenant_id UUID PRIMARY KEY REFERENCES public.tenants(id) ON DELETE CASCADE,
  logo_url TEXT,
  locale TEXT NOT NULL DEFAULT 'pt-BR',
  timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  theme TEXT NOT NULL DEFAULT 'system',
  date_format TEXT NOT NULL DEFAULT 'DD/MM/YYYY',
  time_format TEXT NOT NULL DEFAULT 'HH:mm',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenant_settings TO authenticated;
GRANT ALL ON public.tenant_settings TO service_role;
ALTER TABLE public.tenant_settings ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_tenant_settings_updated_at BEFORE UPDATE ON public.tenant_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Tenant members view settings" ON public.tenant_settings
  FOR SELECT TO authenticated
  USING (tenant_id = public.current_tenant_id() OR public.is_global_admin(auth.uid()));

CREATE POLICY "Clinic admins manage settings" ON public.tenant_settings
  FOR ALL TO authenticated
  USING (
    (tenant_id = public.current_tenant_id() AND public.has_role(auth.uid(), 'clinic_admin'))
    OR public.is_global_admin(auth.uid())
  )
  WITH CHECK (
    (tenant_id = public.current_tenant_id() AND public.has_role(auth.uid(), 'clinic_admin'))
    OR public.is_global_admin(auth.uid())
  );

-- =========================
-- CLIENTS
-- =========================
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  birth_date DATE,
  cpf TEXT,
  guardian_name TEXT,
  notes TEXT,
  status public.client_status NOT NULL DEFAULT 'active',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO authenticated;
GRANT ALL ON public.clients TO service_role;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_clients_tenant_id ON public.clients(tenant_id);
CREATE INDEX idx_clients_full_name ON public.clients(tenant_id, full_name);
CREATE TRIGGER trg_clients_updated_at BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Tenant members view clients" ON public.clients
  FOR SELECT TO authenticated
  USING (tenant_id = public.current_tenant_id() OR public.is_global_admin(auth.uid()));

CREATE POLICY "Tenant staff manage clients" ON public.clients
  FOR ALL TO authenticated
  USING (
    tenant_id = public.current_tenant_id()
    AND (
      public.has_role(auth.uid(), 'clinic_admin')
      OR public.has_role(auth.uid(), 'receptionist')
      OR public.has_role(auth.uid(), 'psychologist')
      OR public.has_role(auth.uid(), 'supervisor')
    )
  )
  WITH CHECK (
    tenant_id = public.current_tenant_id()
    AND (
      public.has_role(auth.uid(), 'clinic_admin')
      OR public.has_role(auth.uid(), 'receptionist')
      OR public.has_role(auth.uid(), 'psychologist')
      OR public.has_role(auth.uid(), 'supervisor')
    )
  );

-- =========================
-- APPOINTMENT TYPES
-- =========================
CREATE TABLE public.appointment_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1',
  duration_minutes INTEGER NOT NULL DEFAULT 50,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointment_types TO authenticated;
GRANT ALL ON public.appointment_types TO service_role;
ALTER TABLE public.appointment_types ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_appointment_types_tenant_id ON public.appointment_types(tenant_id);
CREATE TRIGGER trg_appointment_types_updated_at BEFORE UPDATE ON public.appointment_types
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Tenant members view appointment types" ON public.appointment_types
  FOR SELECT TO authenticated
  USING (tenant_id = public.current_tenant_id() OR public.is_global_admin(auth.uid()));

CREATE POLICY "Clinic admins manage appointment types" ON public.appointment_types
  FOR ALL TO authenticated
  USING (tenant_id = public.current_tenant_id() AND public.has_role(auth.uid(), 'clinic_admin'))
  WITH CHECK (tenant_id = public.current_tenant_id() AND public.has_role(auth.uid(), 'clinic_admin'));

-- =========================
-- PROFESSIONALS
-- =========================
CREATE TABLE public.professionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  crp TEXT,
  specialty TEXT,
  agenda_color TEXT NOT NULL DEFAULT '#6366f1',
  bio TEXT,
  default_session_minutes INTEGER NOT NULL DEFAULT 50,
  default_interval_minutes INTEGER NOT NULL DEFAULT 10,
  accepts_online BOOLEAN NOT NULL DEFAULT true,
  accepts_in_person BOOLEAN NOT NULL DEFAULT true,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.professionals TO authenticated;
GRANT ALL ON public.professionals TO service_role;
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_professionals_tenant_id ON public.professionals(tenant_id);
CREATE TRIGGER trg_professionals_updated_at BEFORE UPDATE ON public.professionals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Tenant members view professionals" ON public.professionals
  FOR SELECT TO authenticated
  USING (tenant_id = public.current_tenant_id() OR public.is_global_admin(auth.uid()));

CREATE POLICY "Clinic admins manage professionals" ON public.professionals
  FOR ALL TO authenticated
  USING (tenant_id = public.current_tenant_id() AND public.has_role(auth.uid(), 'clinic_admin'))
  WITH CHECK (tenant_id = public.current_tenant_id() AND public.has_role(auth.uid(), 'clinic_admin'));

CREATE TABLE public.professional_appointment_types (
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  appointment_type_id UUID NOT NULL REFERENCES public.appointment_types(id) ON DELETE CASCADE,
  PRIMARY KEY (professional_id, appointment_type_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.professional_appointment_types TO authenticated;
GRANT ALL ON public.professional_appointment_types TO service_role;
ALTER TABLE public.professional_appointment_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant staff view prof-types" ON public.professional_appointment_types
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.professionals p WHERE p.id = professional_id AND p.tenant_id = public.current_tenant_id()));

CREATE POLICY "Clinic admins manage prof-types" ON public.professional_appointment_types
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'clinic_admin') AND EXISTS (SELECT 1 FROM public.professionals p WHERE p.id = professional_id AND p.tenant_id = public.current_tenant_id()))
  WITH CHECK (public.has_role(auth.uid(), 'clinic_admin') AND EXISTS (SELECT 1 FROM public.professionals p WHERE p.id = professional_id AND p.tenant_id = public.current_tenant_id()));

-- =========================
-- SCHEDULE GROUPS
-- =========================
CREATE TABLE public.schedule_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  kind public.schedule_group_kind NOT NULL DEFAULT 'custom',
  color TEXT NOT NULL DEFAULT '#94a3b8',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.schedule_groups TO authenticated;
GRANT ALL ON public.schedule_groups TO service_role;
ALTER TABLE public.schedule_groups ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_schedule_groups_tenant_id ON public.schedule_groups(tenant_id);
CREATE TRIGGER trg_schedule_groups_updated_at BEFORE UPDATE ON public.schedule_groups
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Tenant members view schedule groups" ON public.schedule_groups
  FOR SELECT TO authenticated
  USING (tenant_id = public.current_tenant_id() OR public.is_global_admin(auth.uid()));

CREATE POLICY "Clinic admins manage schedule groups" ON public.schedule_groups
  FOR ALL TO authenticated
  USING (tenant_id = public.current_tenant_id() AND public.has_role(auth.uid(), 'clinic_admin'))
  WITH CHECK (tenant_id = public.current_tenant_id() AND public.has_role(auth.uid(), 'clinic_admin'));

-- =========================
-- SCHEDULES
-- =========================
CREATE TABLE public.schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  schedule_group_id UUID REFERENCES public.schedule_groups(id) ON DELETE SET NULL,
  weekday SMALLINT NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  interval_minutes INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.schedules TO authenticated;
GRANT ALL ON public.schedules TO service_role;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_schedules_prof ON public.schedules(professional_id);
CREATE INDEX idx_schedules_tenant ON public.schedules(tenant_id);
CREATE TRIGGER trg_schedules_updated_at BEFORE UPDATE ON public.schedules
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Tenant members view schedules" ON public.schedules
  FOR SELECT TO authenticated
  USING (tenant_id = public.current_tenant_id() OR public.is_global_admin(auth.uid()));

CREATE POLICY "Clinic admins manage schedules" ON public.schedules
  FOR ALL TO authenticated
  USING (tenant_id = public.current_tenant_id() AND public.has_role(auth.uid(), 'clinic_admin'))
  WITH CHECK (tenant_id = public.current_tenant_id() AND public.has_role(auth.uid(), 'clinic_admin'));

-- =========================
-- EVENTS (agenda)
-- =========================
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES public.professionals(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  appointment_type_id UUID REFERENCES public.appointment_types(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  status public.event_status NOT NULL DEFAULT 'scheduled',
  source public.event_source NOT NULL DEFAULT 'manual',
  color TEXT,
  google_event_id TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_events_tenant ON public.events(tenant_id);
CREATE INDEX idx_events_prof_start ON public.events(professional_id, starts_at);
CREATE INDEX idx_events_starts_at ON public.events(tenant_id, starts_at);
CREATE TRIGGER trg_events_updated_at BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Tenant members view events" ON public.events
  FOR SELECT TO authenticated
  USING (tenant_id = public.current_tenant_id() OR public.is_global_admin(auth.uid()));

CREATE POLICY "Tenant staff manage events" ON public.events
  FOR ALL TO authenticated
  USING (
    tenant_id = public.current_tenant_id()
    AND (
      public.has_role(auth.uid(), 'clinic_admin')
      OR public.has_role(auth.uid(), 'receptionist')
      OR public.has_role(auth.uid(), 'psychologist')
      OR public.has_role(auth.uid(), 'supervisor')
    )
  )
  WITH CHECK (
    tenant_id = public.current_tenant_id()
    AND (
      public.has_role(auth.uid(), 'clinic_admin')
      OR public.has_role(auth.uid(), 'receptionist')
      OR public.has_role(auth.uid(), 'psychologist')
      OR public.has_role(auth.uid(), 'supervisor')
    )
  );

-- =========================
-- BLOCKS
-- =========================
CREATE TABLE public.blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES public.professionals(id) ON DELETE CASCADE,
  reason public.block_reason NOT NULL DEFAULT 'manual',
  title TEXT,
  description TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  all_day BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blocks TO authenticated;
GRANT ALL ON public.blocks TO service_role;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_blocks_tenant ON public.blocks(tenant_id);
CREATE INDEX idx_blocks_prof ON public.blocks(professional_id);
CREATE TRIGGER trg_blocks_updated_at BEFORE UPDATE ON public.blocks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Tenant members view blocks" ON public.blocks
  FOR SELECT TO authenticated
  USING (tenant_id = public.current_tenant_id() OR public.is_global_admin(auth.uid()));

CREATE POLICY "Tenant admins/receptionists manage blocks" ON public.blocks
  FOR ALL TO authenticated
  USING (
    tenant_id = public.current_tenant_id()
    AND (
      public.has_role(auth.uid(), 'clinic_admin')
      OR public.has_role(auth.uid(), 'receptionist')
      OR public.has_role(auth.uid(), 'psychologist')
    )
  )
  WITH CHECK (
    tenant_id = public.current_tenant_id()
    AND (
      public.has_role(auth.uid(), 'clinic_admin')
      OR public.has_role(auth.uid(), 'receptionist')
      OR public.has_role(auth.uid(), 'psychologist')
    )
  );

-- =========================
-- GOOGLE CALENDAR CONNECTIONS (future use)
-- =========================
CREATE TABLE public.google_calendar_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES public.professionals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  google_user TEXT,
  calendar_id TEXT,
  refresh_token TEXT,
  access_token TEXT,
  token_expiration TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'disconnected',
  last_sync_at TIMESTAMPTZ,
  webhook_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.google_calendar_connections TO authenticated;
GRANT ALL ON public.google_calendar_connections TO service_role;
ALTER TABLE public.google_calendar_connections ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_gcal_tenant ON public.google_calendar_connections(tenant_id);
CREATE TRIGGER trg_gcal_updated_at BEFORE UPDATE ON public.google_calendar_connections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Users view own gcal connections" ON public.google_calendar_connections
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR (tenant_id = public.current_tenant_id() AND public.has_role(auth.uid(), 'clinic_admin')));

CREATE POLICY "Users manage own gcal connections" ON public.google_calendar_connections
  FOR ALL TO authenticated
  USING (user_id = auth.uid() OR (tenant_id = public.current_tenant_id() AND public.has_role(auth.uid(), 'clinic_admin')))
  WITH CHECK (user_id = auth.uid() OR (tenant_id = public.current_tenant_id() AND public.has_role(auth.uid(), 'clinic_admin')));

-- =========================
-- SIGNUP TRIGGER: create tenant + profile + role
-- =========================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_tenant_id UUID;
  clinic_name TEXT;
  base_slug TEXT;
  final_slug TEXT;
  slug_suffix INT := 0;
BEGIN
  clinic_name := COALESCE(
    NEW.raw_user_meta_data->>'clinic_name',
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1) || '''s Clinic'
  );

  base_slug := regexp_replace(lower(clinic_name), '[^a-z0-9]+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  IF base_slug = '' THEN base_slug := 'clinic'; END IF;

  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM public.tenants WHERE slug = final_slug) LOOP
    slug_suffix := slug_suffix + 1;
    final_slug := base_slug || '-' || slug_suffix::text;
  END LOOP;

  INSERT INTO public.tenants (name, slug, status)
  VALUES (clinic_name, final_slug, 'trial')
  RETURNING id INTO new_tenant_id;

  INSERT INTO public.tenant_settings (tenant_id) VALUES (new_tenant_id);

  INSERT INTO public.profiles (id, tenant_id, full_name, email, locale)
  VALUES (
    NEW.id,
    new_tenant_id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'locale', 'pt-BR')
  );

  INSERT INTO public.user_roles (user_id, tenant_id, role)
  VALUES (NEW.id, new_tenant_id, 'clinic_admin');

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
