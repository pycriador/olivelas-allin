-- ============ availability_rules ============
CREATE TABLE public.availability_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 100,
  enabled BOOLEAN NOT NULL DEFAULT true,
  params JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, type)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.availability_rules TO authenticated;
GRANT ALL ON public.availability_rules TO service_role;
ALTER TABLE public.availability_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rules_select" ON public.availability_rules FOR SELECT TO authenticated
  USING (tenant_id = public.current_tenant_id());
CREATE POLICY "rules_write" ON public.availability_rules FOR ALL TO authenticated
  USING (tenant_id = public.current_tenant_id() AND public.has_role(auth.uid(), 'clinic_admin'))
  WITH CHECK (tenant_id = public.current_tenant_id() AND public.has_role(auth.uid(), 'clinic_admin'));
CREATE TRIGGER trg_availability_rules_updated_at BEFORE UPDATE ON public.availability_rules
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ availability_settings ============
CREATE TABLE public.availability_settings (
  tenant_id UUID PRIMARY KEY REFERENCES public.tenants(id) ON DELETE CASCADE,
  weight_available INTEGER NOT NULL DEFAULT 50,
  weight_same_professional INTEGER NOT NULL DEFAULT 30,
  weight_lower_workload INTEGER NOT NULL DEFAULT 20,
  weight_preferred_period INTEGER NOT NULL DEFAULT 10,
  weight_almost_full INTEGER NOT NULL DEFAULT -20,
  weight_near_lunch INTEGER NOT NULL DEFAULT -15,
  weight_overbooking INTEGER NOT NULL DEFAULT -10,
  weight_conflict INTEGER NOT NULL DEFAULT -100,
  weight_specialty INTEGER NOT NULL DEFAULT 15,
  min_minutes_between_appointments INTEGER NOT NULL DEFAULT 0,
  max_daily_minutes INTEGER NOT NULL DEFAULT 480,
  max_weekly_minutes INTEGER NOT NULL DEFAULT 2400,
  max_daily_appointments INTEGER NOT NULL DEFAULT 12,
  overbooking_margin_minutes INTEGER NOT NULL DEFAULT 0,
  lunch_start TIME NOT NULL DEFAULT '12:00',
  lunch_end TIME NOT NULL DEFAULT '13:00',
  slot_granularity_minutes INTEGER NOT NULL DEFAULT 15,
  cache_ttl_seconds INTEGER NOT NULL DEFAULT 300,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.availability_settings TO authenticated;
GRANT ALL ON public.availability_settings TO service_role;
ALTER TABLE public.availability_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "avset_select" ON public.availability_settings FOR SELECT TO authenticated
  USING (tenant_id = public.current_tenant_id());
CREATE POLICY "avset_write" ON public.availability_settings FOR ALL TO authenticated
  USING (tenant_id = public.current_tenant_id() AND public.has_role(auth.uid(), 'clinic_admin'))
  WITH CHECK (tenant_id = public.current_tenant_id() AND public.has_role(auth.uid(), 'clinic_admin'));
CREATE TRIGGER trg_availability_settings_updated_at BEFORE UPDATE ON public.availability_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ professional_workload ============
CREATE TABLE public.professional_workload (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  worked_minutes INTEGER NOT NULL DEFAULT 0,
  free_minutes INTEGER NOT NULL DEFAULT 0,
  appointments INTEGER NOT NULL DEFAULT 0,
  occupancy_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  overbookings INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (professional_id, date)
);
CREATE INDEX idx_workload_tenant_date ON public.professional_workload (tenant_id, date);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.professional_workload TO authenticated;
GRANT ALL ON public.professional_workload TO service_role;
ALTER TABLE public.professional_workload ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workload_select" ON public.professional_workload FOR SELECT TO authenticated
  USING (tenant_id = public.current_tenant_id());
CREATE POLICY "workload_write" ON public.professional_workload FOR ALL TO authenticated
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());
CREATE TRIGGER trg_workload_updated_at BEFORE UPDATE ON public.professional_workload
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ availability_cache ============
CREATE TABLE public.availability_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  slot_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  available BOOLEAN NOT NULL DEFAULT true,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (professional_id, date, slot_time, duration_minutes)
);
CREATE INDEX idx_avcache_tenant_date ON public.availability_cache (tenant_id, date);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.availability_cache TO authenticated;
GRANT ALL ON public.availability_cache TO service_role;
ALTER TABLE public.availability_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "avcache_select" ON public.availability_cache FOR SELECT TO authenticated
  USING (tenant_id = public.current_tenant_id());
CREATE POLICY "avcache_write" ON public.availability_cache FOR ALL TO authenticated
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());
CREATE TRIGGER trg_avcache_updated_at BEFORE UPDATE ON public.availability_cache
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ availability_audit_logs ============
CREATE TABLE public.availability_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID,
  criteria JSONB NOT NULL DEFAULT '{}'::jsonb,
  result_count INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_avaudit_tenant_created ON public.availability_audit_logs (tenant_id, created_at DESC);
GRANT SELECT ON public.availability_audit_logs TO authenticated;
GRANT ALL ON public.availability_audit_logs TO service_role;
ALTER TABLE public.availability_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "avaudit_select" ON public.availability_audit_logs FOR SELECT TO authenticated
  USING (tenant_id = public.current_tenant_id());

-- ============ default rules + settings for existing tenants ============
INSERT INTO public.availability_settings (tenant_id)
SELECT id FROM public.tenants ON CONFLICT DO NOTHING;

INSERT INTO public.availability_rules (tenant_id, name, description, type, priority, enabled, params)
SELECT t.id, r.name, r.description, r.type, r.priority, r.enabled, r.params
FROM public.tenants t
CROSS JOIN (VALUES
  ('Horário de trabalho', 'Considera apenas horários dentro da agenda configurada do profissional.', 'working_hours', 10, true, '{}'::jsonb),
  ('Intervalo entre atendimentos', 'Aplica o intervalo configurado entre consultas.', 'interval', 20, true, '{}'::jsonb),
  ('Almoço', 'Bloqueia o período de almoço.', 'lunch', 30, true, '{}'::jsonb),
  ('Férias e licenças', 'Remove períodos de férias e licenças.', 'vacation_leave', 40, true, '{}'::jsonb),
  ('Bloqueios', 'Remove períodos bloqueados manualmente.', 'blocks', 50, true, '{}'::jsonb),
  ('Feriados', 'Remove feriados cadastrados como bloqueio da clínica.', 'holidays', 60, true, '{}'::jsonb),
  ('Eventos internos', 'Considera eventos já agendados no ClinicFlow.', 'internal_events', 70, true, '{}'::jsonb),
  ('Google Calendar', 'Considera eventos importados do Google Calendar.', 'google_calendar', 80, true, '{}'::jsonb),
  ('Tempo mínimo entre consultas', 'Garante folga mínima entre atendimentos.', 'min_gap', 90, true, '{}'::jsonb),
  ('Tempo máximo diário', 'Limita a carga diária do profissional.', 'max_daily', 100, true, '{}'::jsonb),
  ('Carga horária semanal', 'Limita a carga semanal do profissional.', 'max_weekly', 110, true, '{}'::jsonb),
  ('Quantidade máxima de atendimentos', 'Limita o número de consultas por dia.', 'max_appointments', 120, true, '{}'::jsonb),
  ('Modalidade online', 'Filtra profissionais que atendem online.', 'online', 130, true, '{}'::jsonb),
  ('Modalidade presencial', 'Filtra profissionais que atendem presencialmente.', 'in_person', 140, true, '{}'::jsonb),
  ('Especialidade', 'Filtra por especialidade do profissional.', 'specialty', 150, true, '{}'::jsonb),
  ('Tipo de atendimento', 'Filtra por tipos de atendimento habilitados.', 'appointment_type', 160, true, '{}'::jsonb),
  ('Agenda compartilhada', 'Considera grupos de horário compartilhados.', 'shared_agenda', 170, false, '{}'::jsonb),
  ('Permissão para encaixe', 'Permite encaixes dentro da margem configurada.', 'overbooking', 180, false, '{}'::jsonb),
  ('Eventos recorrentes', 'Considera séries recorrentes de eventos.', 'recurring_events', 190, true, '{}'::jsonb)
) AS r(name, description, type, priority, enabled, params)
ON CONFLICT (tenant_id, type) DO NOTHING;

-- ============ new tenants get defaults ============
CREATE OR REPLACE FUNCTION public.seed_availability_defaults()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.availability_settings (tenant_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  INSERT INTO public.availability_rules (tenant_id, name, description, type, priority, enabled, params)
  SELECT NEW.id, r.name, r.description, r.type, r.priority, r.enabled, r.params
  FROM public.availability_rules r
  WHERE r.tenant_id = (SELECT id FROM public.tenants WHERE id <> NEW.id ORDER BY created_at LIMIT 1)
  ON CONFLICT (tenant_id, type) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_seed_availability_defaults AFTER INSERT ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.seed_availability_defaults();