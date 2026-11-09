-- 1. Server-only encrypted connector key storage
CREATE TABLE public.app_user_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  connector_id text NOT NULL,
  connection_key_ciphertext text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, connector_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_user_connections TO service_role;
ALTER TABLE public.app_user_connections ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER app_user_connections_updated_at BEFORE UPDATE ON public.app_user_connections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. Google accounts
CREATE TYPE public.google_account_status AS ENUM ('connected', 'disconnected', 'expired', 'error');

CREATE TABLE public.google_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  professional_id uuid REFERENCES public.professionals(id) ON DELETE SET NULL,
  google_user_id text,
  email text,
  display_name text,
  picture text,
  scopes text[] NOT NULL DEFAULT '{}',
  status public.google_account_status NOT NULL DEFAULT 'connected',
  last_sync timestamptz,
  last_error text,
  sync_token text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.google_accounts TO authenticated;
GRANT ALL ON public.google_accounts TO service_role;
ALTER TABLE public.google_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members read google accounts"
  ON public.google_accounts FOR SELECT TO authenticated
  USING (tenant_id = public.current_tenant_id());

CREATE POLICY "Owner or clinic admin manages google account insert"
  ON public.google_accounts FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.current_tenant_id() AND user_id = auth.uid());

CREATE POLICY "Owner or clinic admin manages google account update"
  ON public.google_accounts FOR UPDATE TO authenticated
  USING (tenant_id = public.current_tenant_id() AND (user_id = auth.uid() OR public.has_role(auth.uid(), 'clinic_admin')))
  WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY "Owner or clinic admin deletes google account"
  ON public.google_accounts FOR DELETE TO authenticated
  USING (tenant_id = public.current_tenant_id() AND (user_id = auth.uid() OR public.has_role(auth.uid(), 'clinic_admin')));

CREATE TRIGGER google_accounts_updated_at BEFORE UPDATE ON public.google_accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. Google calendars
CREATE TABLE public.google_calendars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES public.google_accounts(id) ON DELETE CASCADE,
  calendar_id text NOT NULL,
  name text NOT NULL,
  description text,
  color text,
  is_primary boolean NOT NULL DEFAULT false,
  timezone text,
  access_role text,
  selected boolean NOT NULL DEFAULT false,
  sync_enabled boolean NOT NULL DEFAULT false,
  read_only boolean NOT NULL DEFAULT false,
  show_in_agenda boolean NOT NULL DEFAULT true,
  sync_token text,
  last_sync timestamptz,
  watch_channel_id text,
  watch_resource_id text,
  watch_expiration timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (account_id, calendar_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.google_calendars TO authenticated;
GRANT ALL ON public.google_calendars TO service_role;
ALTER TABLE public.google_calendars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members read google calendars"
  ON public.google_calendars FOR SELECT TO authenticated
  USING (tenant_id = public.current_tenant_id());

CREATE POLICY "Account owner manages google calendars"
  ON public.google_calendars FOR ALL TO authenticated
  USING (
    tenant_id = public.current_tenant_id()
    AND EXISTS (
      SELECT 1 FROM public.google_accounts ga
      WHERE ga.id = google_calendars.account_id
        AND ga.tenant_id = public.current_tenant_id()
        AND (ga.user_id = auth.uid() OR public.has_role(auth.uid(), 'clinic_admin'))
    )
  )
  WITH CHECK (
    tenant_id = public.current_tenant_id()
    AND EXISTS (
      SELECT 1 FROM public.google_accounts ga
      WHERE ga.id = google_calendars.account_id
        AND ga.tenant_id = public.current_tenant_id()
        AND (ga.user_id = auth.uid() OR public.has_role(auth.uid(), 'clinic_admin'))
    )
  );

CREATE TRIGGER google_calendars_updated_at BEFORE UPDATE ON public.google_calendars
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. Sync logs
CREATE TABLE public.calendar_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  account_id uuid REFERENCES public.google_accounts(id) ON DELETE CASCADE,
  calendar_id uuid REFERENCES public.google_calendars(id) ON DELETE SET NULL,
  user_id uuid,
  sync_type text NOT NULL DEFAULT 'manual',
  direction text NOT NULL DEFAULT 'inbound',
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  duration_ms integer,
  events_total integer NOT NULL DEFAULT 0,
  events_created integer NOT NULL DEFAULT 0,
  events_updated integer NOT NULL DEFAULT 0,
  events_deleted integer NOT NULL DEFAULT 0,
  conflicts integer NOT NULL DEFAULT 0,
  success boolean NOT NULL DEFAULT true,
  error_message text,
  response jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.calendar_sync_logs TO authenticated;
GRANT ALL ON public.calendar_sync_logs TO service_role;
ALTER TABLE public.calendar_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members read sync logs"
  ON public.calendar_sync_logs FOR SELECT TO authenticated
  USING (tenant_id = public.current_tenant_id());

CREATE INDEX idx_calendar_sync_logs_tenant_started ON public.calendar_sync_logs (tenant_id, started_at DESC);
CREATE INDEX idx_google_calendars_account ON public.google_calendars (account_id);