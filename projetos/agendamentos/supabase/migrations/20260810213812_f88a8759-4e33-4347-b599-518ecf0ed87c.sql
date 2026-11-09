SET search_path = public, extensions;
CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA extensions;

-- ============ ENUMS ============
CREATE TYPE public.appointment_status AS ENUM (
  'draft','requested','reserved','confirmed','in_progress','completed','cancelled','no_show','rescheduled'
);
CREATE TYPE public.appointment_source AS ENUM ('manual','client_portal','google','api','waiting_list');
CREATE TYPE public.appointment_booking_type AS ENUM ('regular','fit_in');
CREATE TYPE public.appointment_modality AS ENUM ('in_person','online','hybrid');
CREATE TYPE public.appointment_sync_status AS ENUM ('not_synced','pending','synced','error');
CREATE TYPE public.appointment_cancellation_reason AS ENUM (
  'client_request','professional_request','conflict','illness','holiday','emergency','other'
);
CREATE TYPE public.no_show_party AS ENUM ('client','professional','both');
CREATE TYPE public.waiting_list_status AS ENUM ('waiting','contacted','scheduled','cancelled');
CREATE TYPE public.notification_channel AS ENUM ('email','whatsapp','sms','push');
CREATE TYPE public.notification_status AS ENUM ('pending','scheduled','sent','failed','cancelled');

-- ============ PERMISSIONS ============
CREATE OR REPLACE FUNCTION private.has_permission(_user_id uuid, _permission text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = private, public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND (ur.role = 'global_admin' OR ur.tenant_id = private.current_tenant_id())
      AND (
        ur.role IN ('global_admin','clinic_admin')
        OR (ur.role = 'receptionist' AND _permission IN (
              'appointments.view','appointments.create','appointments.edit','appointments.cancel',
              'appointments.reschedule','appointments.no_show',
              'waiting_list.view','waiting_list.manage'))
        OR (ur.role = 'psychologist' AND _permission IN (
              'appointments.view','appointments.create','appointments.edit','appointments.cancel',
              'appointments.reschedule','appointments.complete','appointments.no_show',
              'waiting_list.view'))
        OR (ur.role = 'supervisor' AND _permission IN (
              'appointments.view','appointments.fit_in','waiting_list.view'))
        OR (ur.role = 'read_only' AND _permission IN ('appointments.view','waiting_list.view'))
      )
  );
$$;
REVOKE ALL ON FUNCTION private.has_permission(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.has_permission(uuid, text) TO authenticated, service_role;

-- ============ LOCATIONS ============
CREATE TABLE public.locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  address text,
  room text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_locations_tenant ON public.locations(tenant_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.locations TO authenticated;
GRANT ALL ON public.locations TO service_role;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "locations_select" ON public.locations FOR SELECT TO authenticated
  USING (tenant_id = private.current_tenant_id());
CREATE POLICY "locations_write" ON public.locations FOR ALL TO authenticated
  USING (tenant_id = private.current_tenant_id() AND private.has_role(auth.uid(), 'clinic_admin'::app_role))
  WITH CHECK (tenant_id = private.current_tenant_id() AND private.has_role(auth.uid(), 'clinic_admin'::app_role));
CREATE TRIGGER trg_locations_updated_at BEFORE UPDATE ON public.locations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ APPOINTMENTS ============
CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE RESTRICT,
  service_type_id uuid REFERENCES public.appointment_types(id) ON DELETE SET NULL,
  location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL,
  event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
  google_event_id text,
  calendar_id uuid REFERENCES public.google_calendars(id) ON DELETE SET NULL,
  sync_status public.appointment_sync_status NOT NULL DEFAULT 'not_synced',
  sync_error text,
  meet_url text,
  meet_id text,
  title text NOT NULL DEFAULT 'Atendimento',
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  duration_minutes integer NOT NULL,
  timezone text NOT NULL DEFAULT 'America/Sao_Paulo',
  status public.appointment_status NOT NULL DEFAULT 'draft',
  source public.appointment_source NOT NULL DEFAULT 'manual',
  booking_type public.appointment_booking_type NOT NULL DEFAULT 'regular',
  modality public.appointment_modality NOT NULL DEFAULT 'in_person',
  notes text,
  reserved_until timestamptz,
  reserved_by uuid,
  previous_start_at timestamptz,
  previous_end_at timestamptz,
  rescheduled_from uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  no_show_party public.no_show_party,
  no_show_notes text,
  no_show_at timestamptz,
  cancellation_reason public.appointment_cancellation_reason,
  cancellation_notes text,
  cancelled_at timestamptz,
  cancelled_by uuid,
  completed_at timestamptz,
  started_at timestamptz,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_appointments_tenant ON public.appointments(tenant_id);
CREATE INDEX idx_appointments_client ON public.appointments(client_id);
CREATE INDEX idx_appointments_professional ON public.appointments(professional_id);
CREATE INDEX idx_appointments_start ON public.appointments(start_at);
CREATE INDEX idx_appointments_end ON public.appointments(end_at);
CREATE INDEX idx_appointments_status ON public.appointments(status);
CREATE INDEX idx_appointments_google_event ON public.appointments(google_event_id);
CREATE INDEX idx_appointments_tenant_range ON public.appointments(tenant_id, start_at, end_at);

-- Hard double-booking guard for firm appointments (no time-dependent predicate).
ALTER TABLE public.appointments
  ADD CONSTRAINT appointments_no_double_booking
  EXCLUDE USING gist (
    professional_id WITH =,
    tstzrange(start_at, end_at, '[)') WITH &&
  ) WHERE (status IN ('confirmed','in_progress','completed'));

-- ============ HISTORY / AUDIT ============
CREATE TABLE public.appointment_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  previous_status public.appointment_status,
  new_status public.appointment_status NOT NULL,
  reason text,
  notes text,
  changed_by uuid,
  changed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_appt_history_appointment ON public.appointment_status_history(appointment_id);
CREATE INDEX idx_appt_history_tenant ON public.appointment_status_history(tenant_id);
GRANT SELECT ON public.appointment_status_history TO authenticated;
GRANT ALL ON public.appointment_status_history TO service_role;
ALTER TABLE public.appointment_status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "appt_history_select" ON public.appointment_status_history FOR SELECT TO authenticated
  USING (tenant_id = private.current_tenant_id());

CREATE TABLE public.appointment_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE CASCADE,
  action text NOT NULL,
  source public.appointment_source NOT NULL DEFAULT 'manual',
  previous_data jsonb,
  new_data jsonb,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_appt_audit_appointment ON public.appointment_audit_logs(appointment_id);
CREATE INDEX idx_appt_audit_tenant ON public.appointment_audit_logs(tenant_id, created_at DESC);
GRANT SELECT ON public.appointment_audit_logs TO authenticated;
GRANT ALL ON public.appointment_audit_logs TO service_role;
ALTER TABLE public.appointment_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "appt_audit_select" ON public.appointment_audit_logs FOR SELECT TO authenticated
  USING (tenant_id = private.current_tenant_id());

-- ============ STATE MACHINE + CONCURRENCY ============
CREATE OR REPLACE FUNCTION public.appointments_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  allowed boolean := false;
  conflicts integer;
BEGIN
  IF NEW.end_at <= NEW.start_at THEN
    RAISE EXCEPTION 'invalid_time_range';
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    allowed := CASE OLD.status
      WHEN 'draft'       THEN NEW.status IN ('requested','reserved','confirmed','cancelled')
      WHEN 'requested'   THEN NEW.status IN ('reserved','confirmed','cancelled')
      WHEN 'reserved'    THEN NEW.status IN ('confirmed','cancelled','draft','requested')
      WHEN 'confirmed'   THEN NEW.status IN ('in_progress','cancelled','rescheduled','no_show','completed')
      WHEN 'in_progress' THEN NEW.status IN ('completed','cancelled')
      WHEN 'cancelled'   THEN NEW.status IN ('rescheduled')
      WHEN 'no_show'     THEN NEW.status IN ('rescheduled')
      WHEN 'rescheduled' THEN NEW.status IN ('confirmed')
      ELSE false
    END;
    IF NOT allowed THEN
      RAISE EXCEPTION 'invalid_status_transition:%->%', OLD.status, NEW.status;
    END IF;
  END IF;

  -- Serialize concurrent booking attempts for the same professional.
  IF NEW.status IN ('reserved','confirmed','in_progress','completed') THEN
    PERFORM pg_advisory_xact_lock(hashtext(NEW.professional_id::text));

    SELECT count(*) INTO conflicts
    FROM public.appointments a
    WHERE a.professional_id = NEW.professional_id
      AND a.id <> NEW.id
      AND tstzrange(a.start_at, a.end_at, '[)') && tstzrange(NEW.start_at, NEW.end_at, '[)')
      AND (
        a.status IN ('confirmed','in_progress','completed')
        OR (a.status = 'reserved' AND a.reserved_until IS NOT NULL AND a.reserved_until > now())
      );

    IF conflicts > 0 THEN
      RAISE EXCEPTION 'slot_taken';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_appointments_guard
  BEFORE INSERT OR UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.appointments_guard();

CREATE OR REPLACE FUNCTION public.appointments_log_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.appointment_status_history
      (tenant_id, appointment_id, previous_status, new_status, changed_by)
    VALUES (NEW.tenant_id, NEW.id, NULL, NEW.status, COALESCE(NEW.created_by, auth.uid()));
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.appointment_status_history
      (tenant_id, appointment_id, previous_status, new_status, reason, notes, changed_by)
    VALUES (
      NEW.tenant_id, NEW.id, OLD.status, NEW.status,
      CASE WHEN NEW.status = 'cancelled' THEN NEW.cancellation_reason::text ELSE NULL END,
      CASE WHEN NEW.status = 'cancelled' THEN NEW.cancellation_notes
           WHEN NEW.status = 'no_show' THEN NEW.no_show_notes ELSE NULL END,
      COALESCE(NEW.updated_by, auth.uid())
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_appointments_log_status
  AFTER INSERT OR UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.appointments_log_status();

CREATE TRIGGER trg_appointments_updated_at BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ APPOINTMENTS RLS ============
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT ALL ON public.appointments TO service_role;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "appointments_select" ON public.appointments FOR SELECT TO authenticated
  USING (tenant_id = private.current_tenant_id() AND private.has_permission(auth.uid(), 'appointments.view'));
CREATE POLICY "appointments_insert" ON public.appointments FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = private.current_tenant_id()
    AND private.has_permission(auth.uid(), 'appointments.create')
    AND (booking_type <> 'fit_in' OR private.has_permission(auth.uid(), 'appointments.fit_in'))
  );
CREATE POLICY "appointments_update" ON public.appointments FOR UPDATE TO authenticated
  USING (tenant_id = private.current_tenant_id() AND private.has_permission(auth.uid(), 'appointments.edit'))
  WITH CHECK (
    tenant_id = private.current_tenant_id()
    AND private.has_permission(auth.uid(), 'appointments.edit')
    AND (booking_type <> 'fit_in' OR private.has_permission(auth.uid(), 'appointments.fit_in'))
  );
CREATE POLICY "appointments_delete" ON public.appointments FOR DELETE TO authenticated
  USING (tenant_id = private.current_tenant_id() AND private.has_permission(auth.uid(), 'appointments.delete'));

-- ============ WAITING LIST ============
CREATE TABLE public.waiting_list (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  service_type_id uuid REFERENCES public.appointment_types(id) ON DELETE SET NULL,
  preferred_professional_id uuid REFERENCES public.professionals(id) ON DELETE SET NULL,
  preferred_date date,
  preferred_time_start time,
  preferred_time_end time,
  modality public.appointment_modality NOT NULL DEFAULT 'in_person',
  priority integer NOT NULL DEFAULT 0,
  notes text,
  status public.waiting_list_status NOT NULL DEFAULT 'waiting',
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_waiting_list_tenant ON public.waiting_list(tenant_id, status, priority DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.waiting_list TO authenticated;
GRANT ALL ON public.waiting_list TO service_role;
ALTER TABLE public.waiting_list ENABLE ROW LEVEL SECURITY;
CREATE POLICY "waiting_list_select" ON public.waiting_list FOR SELECT TO authenticated
  USING (tenant_id = private.current_tenant_id() AND private.has_permission(auth.uid(), 'waiting_list.view'));
CREATE POLICY "waiting_list_write" ON public.waiting_list FOR ALL TO authenticated
  USING (tenant_id = private.current_tenant_id() AND private.has_permission(auth.uid(), 'waiting_list.manage'))
  WITH CHECK (tenant_id = private.current_tenant_id() AND private.has_permission(auth.uid(), 'waiting_list.manage'));
CREATE TRIGGER trg_waiting_list_updated_at BEFORE UPDATE ON public.waiting_list
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ NOTIFICATIONS (structure only) ============
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  professional_id uuid REFERENCES public.professionals(id) ON DELETE SET NULL,
  type text NOT NULL,
  channel public.notification_channel NOT NULL DEFAULT 'email',
  status public.notification_status NOT NULL DEFAULT 'pending',
  scheduled_at timestamptz,
  sent_at timestamptz,
  error text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_tenant ON public.notifications(tenant_id, status, scheduled_at);
GRANT SELECT ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_select" ON public.notifications FOR SELECT TO authenticated
  USING (tenant_id = private.current_tenant_id() AND private.has_permission(auth.uid(), 'appointments.view'));
CREATE TRIGGER trg_notifications_updated_at BEFORE UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ DEFAULT LOCATIONS FOR EXISTING TENANTS ============
INSERT INTO public.locations (tenant_id, name, description, active)
SELECT t.id, 'Consultório 1', 'Local padrão', true FROM public.tenants t;
INSERT INTO public.locations (tenant_id, name, description, active)
SELECT t.id, 'Online', 'Atendimento remoto', true FROM public.tenants t;