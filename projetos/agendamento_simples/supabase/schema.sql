-- ============================================================================
-- ESQUEMA RELACIONAL SUPABASE — DRA. MARTA GELSI DIAS
-- Odontologia Integrada & Estética
-- ============================================================================

-- 1. TABELA DE PACIENTES
CREATE TABLE IF NOT EXISTS public.patients (
    id VARCHAR(50) PRIMARY KEY,
    name TEXT NOT NULL,
    cpf VARCHAR(20),
    phone VARCHAR(30),
    email VARCHAR(150),
    address JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(20) DEFAULT 'active',
    notes TEXT,
    last_appointment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABELA DE AGENDAMENTOS
CREATE TABLE IF NOT EXISTS public.appointments (
    id VARCHAR(50) PRIMARY KEY,
    date DATE NOT NULL,
    time VARCHAR(20) NOT NULL,
    duration VARCHAR(30) DEFAULT '30 min',
    patient_id VARCHAR(50) REFERENCES public.patients(id) ON DELETE SET NULL,
    patient_name TEXT NOT NULL,
    service TEXT NOT NULL,
    professional TEXT DEFAULT 'Dra. Marta Gelsi Dias',
    status VARCHAR(30) DEFAULT 'confirmed',
    origin VARCHAR(50) DEFAULT 'Online',
    notes TEXT,
    google_event_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABELA DE SERVIÇOS
CREATE TABLE IF NOT EXISTS public.services (
    id VARCHAR(50) PRIMARY KEY,
    name TEXT NOT NULL,
    category VARCHAR(60),
    duration VARCHAR(30),
    price VARCHAR(60) DEFAULT 'Consultar',
    status VARCHAR(20) DEFAULT 'active',
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABELA DE PLANOS & PROCEDIMENTOS
CREATE TABLE IF NOT EXISTS public.plans (
    id VARCHAR(50) PRIMARY KEY,
    name TEXT NOT NULL,
    category VARCHAR(60),
    price VARCHAR(60),
    installments VARCHAR(60),
    status VARCHAR(20) DEFAULT 'active',
    description TEXT,
    features JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABELA DE CONFIGURAÇÕES DA CLÍNICA
CREATE TABLE IF NOT EXISTS public.clinic_settings (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'main',
    clinic_name TEXT DEFAULT 'Dra. Marta Gelsi Dias — Odontologia',
    dentist_name TEXT DEFAULT 'Dra. Marta Gelsi Dias',
    cro VARCHAR(40) DEFAULT 'CRO 71482',
    phone VARCHAR(30) DEFAULT '(11) 99577-0004',
    whatsapp VARCHAR(30) DEFAULT '11995770004',
    email VARCHAR(150) DEFAULT 'contato@dramartagelsi.com.br',
    address JSONB DEFAULT '{"street":"Av. Paulista","number":"1000","complement":"Sala 82","neighborhood":"Bela Vista","city":"São Paulo","state":"SP","zipCode":"01310-100"}'::jsonb,
    business_hours JSONB DEFAULT '{"weekdays":"08:00 - 19:00","saturday":"08:00 - 13:00","sunday":"Fechado"}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABELA DE MENSAGENS / COMUNICAÇÃO
CREATE TABLE IF NOT EXISTS public.messages (
    id VARCHAR(50) PRIMARY KEY,
    patient_id VARCHAR(50),
    patient_name TEXT,
    phone VARCHAR(30),
    channel VARCHAR(30) DEFAULT 'whatsapp',
    direction VARCHAR(20) DEFAULT 'outbound',
    content TEXT,
    status VARCHAR(20) DEFAULT 'sent',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABELA DE LOGS DE AUDITORIA
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id BIGSERIAL PRIMARY KEY,
    action VARCHAR(60) NOT NULL,
    description TEXT NOT NULL,
    entity_id VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ÍNDICES DE PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_patients_name ON public.patients(name);
CREATE INDEX IF NOT EXISTS idx_patients_phone ON public.patients(phone);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_services_category ON public.services(category);

-- ============================================================================
-- HABILITAÇÃO DE ROW LEVEL SECURITY (RLS) & POLÍTICAS
-- ============================================================================
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso para anon e authenticated
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'patients' AND policyname = 'allow_all_patients') THEN
        CREATE POLICY allow_all_patients ON public.patients FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'appointments' AND policyname = 'allow_all_appointments') THEN
        CREATE POLICY allow_all_appointments ON public.appointments FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'services' AND policyname = 'allow_all_services') THEN
        CREATE POLICY allow_all_services ON public.services FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'plans' AND policyname = 'allow_all_plans') THEN
        CREATE POLICY allow_all_plans ON public.plans FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'clinic_settings' AND policyname = 'allow_all_settings') THEN
        CREATE POLICY allow_all_settings ON public.clinic_settings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'allow_all_messages') THEN
        CREATE POLICY allow_all_messages ON public.messages FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'audit_logs' AND policyname = 'allow_all_audit') THEN
        CREATE POLICY allow_all_audit ON public.audit_logs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
    END IF;
END $$;

-- Concessão de permissões de acesso
GRANT ALL ON TABLE public.patients TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.appointments TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.services TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.plans TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.clinic_settings TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.messages TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.audit_logs TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE public.audit_logs_id_seq TO anon, authenticated, service_role;
