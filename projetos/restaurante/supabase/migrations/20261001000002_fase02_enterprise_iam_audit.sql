-- ==============================================================================
-- OLIVELAS RESTAURANT — FASE 02: ENTERPRISE IAM, MULTI-TENANT, GLOBAL ADMIN, AUDITORIA
-- Migration: 20261001000002_fase02_enterprise_iam_audit.sql
-- ==============================================================================

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Enhanced Profiles
ALTER TABLE IF EXISTS public.profiles 
    ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deactivated'));

-- Sync existing profiles auth_user_id
UPDATE public.profiles SET auth_user_id = id WHERE auth_user_id IS NULL;

-- 3. Platform Roles
CREATE TABLE IF NOT EXISTS public.platform_roles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

INSERT INTO public.platform_roles (id, name, description)
VALUES 
    ('global_admin', 'Global Admin', 'Administrador geral da plataforma Olivelas com acesso irrestrito a todos os tenants e operações.'),
    ('platform_support', 'Suporte da Plataforma', 'Agente de suporte técnico e atendimento aos restaurantes.')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description;

-- 4. User Platform Roles
CREATE TABLE IF NOT EXISTS public.user_platform_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role_id TEXT NOT NULL REFERENCES public.platform_roles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'suspended')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    CONSTRAINT uq_user_platform_role UNIQUE (user_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_upr_user ON public.user_platform_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_upr_role ON public.user_platform_roles(role_id, status);

-- 5. Enhanced Restaurants Table
ALTER TABLE IF EXISTS public.restaurants
    ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 6. Support Sessions (Audit-driven support access)
CREATE TABLE IF NOT EXISTS public.support_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    global_admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    reason TEXT,
    ip_address TEXT,
    user_agent TEXT,
    status TEXT DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'ended')),
    started_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    ended_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::JSONB
);

CREATE INDEX IF NOT EXISTS idx_support_sessions_admin ON public.support_sessions(global_admin_id);
CREATE INDEX IF NOT EXISTS idx_support_sessions_restaurant ON public.support_sessions(restaurant_id, status);

-- 7. Enhanced Audit Logs (Append-Only)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    actor_platform_role TEXT,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    session_id TEXT,
    support_session_id UUID REFERENCES public.support_sessions(id) ON DELETE SET NULL,
    ip_address TEXT,
    user_agent TEXT,
    request_id TEXT,
    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Add any missing columns to existing audit_logs
ALTER TABLE IF EXISTS public.audit_logs
    ADD COLUMN IF NOT EXISTS actor_platform_role TEXT,
    ADD COLUMN IF NOT EXISTS session_id TEXT,
    ADD COLUMN IF NOT EXISTS support_session_id UUID REFERENCES public.support_sessions(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS ip_address TEXT,
    ADD COLUMN IF NOT EXISTS user_agent TEXT,
    ADD COLUMN IF NOT EXISTS request_id TEXT;

CREATE INDEX IF NOT EXISTS idx_audit_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_created ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON public.audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_restaurant ON public.audit_logs(restaurant_id);

-- 8. Security Definer Helper Functions

-- Is caller a Global Admin? (Checks database table user_platform_roles + bootstrap safety)
CREATE OR REPLACE FUNCTION public.is_global_admin()
RETURNS BOOLEAN AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_email TEXT;
BEGIN
    IF v_uid IS NULL THEN
        RETURN FALSE;
    END IF;

    -- 1. Fast check: is user assigned global_admin in user_platform_roles?
    IF EXISTS (
        SELECT 1
        FROM public.user_platform_roles upr
        WHERE upr.user_id = v_uid
          AND upr.role_id = 'global_admin'
          AND upr.status = 'active'
    ) THEN
        RETURN TRUE;
    END IF;

    -- 2. Bootstrap check for primary owner
    v_email := LOWER(COALESCE(auth.jwt() ->> 'email', ''));
    IF v_email = 'willian.o.jesus@gmail.com' THEN
        RETURN TRUE;
    END IF;

    RETURN EXISTS (
        SELECT 1
        FROM auth.users
        WHERE id = v_uid
          AND LOWER(email) = 'willian.o.jesus@gmail.com'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Is active support session currently open by Global Admin for restaurant?
CREATE OR REPLACE FUNCTION public.is_active_support_session(target_restaurant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN FALSE;
    END IF;

    IF NOT public.is_global_admin() THEN
        RETURN FALSE;
    END IF;

    RETURN EXISTS (
        SELECT 1
        FROM public.support_sessions
        WHERE global_admin_id = auth.uid()
          AND restaurant_id = target_restaurant_id
          AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Check if user is an active member or global admin
CREATE OR REPLACE FUNCTION public.is_restaurant_member(target_restaurant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN FALSE;
    END IF;

    IF public.is_global_admin() THEN
        RETURN TRUE;
    END IF;

    RETURN EXISTS (
        SELECT 1
        FROM public.restaurant_members
        WHERE restaurant_id = target_restaurant_id
          AND user_id = auth.uid()
          AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Check restaurant permission
CREATE OR REPLACE FUNCTION public.has_restaurant_permission(target_restaurant_id UUID, target_permission TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Global Admin has universal permission
    IF public.is_global_admin() THEN
        RETURN TRUE;
    END IF;

    -- restaurant_admin has full permissions implicitly
    IF EXISTS (
        SELECT 1
        FROM public.restaurant_members
        WHERE restaurant_id = target_restaurant_id
          AND user_id = auth.uid()
          AND role_id = 'restaurant_admin'
          AND status = 'active'
    ) THEN
        RETURN TRUE;
    END IF;

    RETURN EXISTS (
        SELECT 1
        FROM public.restaurant_members rm
        JOIN public.role_permissions rp ON rp.role_id = rm.role_id
        WHERE rm.restaurant_id = target_restaurant_id
          AND rm.user_id = auth.uid()
          AND rm.status = 'active'
          AND rp.permission_id = target_permission
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- 9. Support Session Management Functions
CREATE OR REPLACE FUNCTION public.start_support_session(
    p_restaurant_id UUID,
    p_reason TEXT DEFAULT NULL,
    p_ip TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_admin_id UUID := auth.uid();
    v_session_id UUID;
    v_restaurant_name TEXT;
BEGIN
    IF NOT public.is_global_admin() THEN
        RAISE EXCEPTION 'Acesso negado: apenas Global Admin pode iniciar sessão de suporte.';
    END IF;

    SELECT name INTO v_restaurant_name FROM public.restaurants WHERE id = p_restaurant_id;
    IF v_restaurant_name IS NULL THEN
        RAISE EXCEPTION 'Restaurante não encontrado.';
    END IF;

    -- End any existing active support sessions by this admin for this restaurant
    UPDATE public.support_sessions
    SET status = 'ended', ended_at = TIMEZONE('utc', NOW())
    WHERE global_admin_id = v_admin_id
      AND restaurant_id = p_restaurant_id
      AND status = 'active';

    -- Create new support session
    INSERT INTO public.support_sessions (
        global_admin_id, restaurant_id, reason, ip_address, user_agent, status, started_at
    ) VALUES (
        v_admin_id, p_restaurant_id, p_reason, p_ip, p_user_agent, 'active', TIMEZONE('utc', NOW())
    )
    RETURNING id INTO v_session_id;

    -- Audit log event: SUPPORT_ACCESS_STARTED
    INSERT INTO public.audit_logs (
        restaurant_id,
        actor_user_id,
        actor_platform_role,
        action,
        entity_type,
        entity_id,
        support_session_id,
        ip_address,
        user_agent,
        metadata
    ) VALUES (
        p_restaurant_id,
        v_admin_id,
        'global_admin',
        'SUPPORT_ACCESS_STARTED',
        'support_session',
        v_session_id::text,
        v_session_id,
        p_ip,
        p_user_agent,
        jsonb_build_object(
            'restaurant_name', v_restaurant_name,
            'reason', p_reason
        )
    );

    RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.end_support_session(p_session_id UUID)
RETURNS VOID AS $$
DECLARE
    v_admin_id UUID := auth.uid();
    v_session RECORD;
BEGIN
    IF NOT public.is_global_admin() THEN
        RAISE EXCEPTION 'Acesso negado: apenas Global Admin pode finalizar sessão de suporte.';
    END IF;

    SELECT * INTO v_session
    FROM public.support_sessions
    WHERE id = p_session_id;

    IF v_session.id IS NULL THEN
        RAISE EXCEPTION 'Sessão de suporte não encontrada.';
    END IF;

    UPDATE public.support_sessions
    SET status = 'ended', ended_at = TIMEZONE('utc', NOW())
    WHERE id = p_session_id;

    -- Audit log event: SUPPORT_ACCESS_ENDED
    INSERT INTO public.audit_logs (
        restaurant_id,
        actor_user_id,
        actor_platform_role,
        action,
        entity_type,
        entity_id,
        support_session_id,
        metadata
    ) VALUES (
        v_session.restaurant_id,
        v_admin_id,
        'global_admin',
        'SUPPORT_ACCESS_ENDED',
        'support_session',
        p_session_id::text,
        p_session_id,
        jsonb_build_object(
            'duration_seconds', EXTRACT(EPOCH FROM (TIMEZONE('utc', NOW()) - v_session.started_at))
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 10. Automatic Global Admin Bootstrap Trigger & Seeding
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_full_name TEXT;
    v_email TEXT;
BEGIN
    v_email := LOWER(NEW.email);
    v_full_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1)
    );

    -- 1. Insert profile
    INSERT INTO public.profiles (id, auth_user_id, full_name, email, avatar_url, status)
    VALUES (
        NEW.id,
        NEW.id,
        v_full_name,
        v_email,
        NEW.raw_user_meta_data->>'avatar_url',
        'active'
    )
    ON CONFLICT (id) DO UPDATE SET
        auth_user_id = EXCLUDED.id,
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
        updated_at = TIMEZONE('utc', NOW());

    -- 2. Bootstrap Global Admin role if email is willian.o.jesus@gmail.com
    IF v_email = 'willian.o.jesus@gmail.com' THEN
        INSERT INTO public.user_platform_roles (user_id, role_id, status)
        VALUES (NEW.id, 'global_admin', 'active')
        ON CONFLICT (user_id, role_id) DO UPDATE SET
            status = 'active',
            updated_at = TIMEZONE('utc', NOW());
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Seed existing user willian.o.jesus@gmail.com into user_platform_roles if already registered
DO $$
DECLARE
    v_admin_id UUID;
BEGIN
    SELECT id INTO v_admin_id FROM auth.users WHERE LOWER(email) = 'willian.o.jesus@gmail.com';
    IF v_admin_id IS NOT NULL THEN
        -- Ensure profile exists
        INSERT INTO public.profiles (id, auth_user_id, full_name, email, status)
        VALUES (v_admin_id, v_admin_id, 'Willian Jesus', 'willian.o.jesus@gmail.com', 'active')
        ON CONFLICT (id) DO NOTHING;

        -- Ensure platform role exists
        INSERT INTO public.user_platform_roles (user_id, role_id, status)
        VALUES (v_admin_id, 'global_admin', 'active')
        ON CONFLICT (user_id, role_id) DO UPDATE SET status = 'active';
    END IF;
END $$;

-- 11. Row Level Security Policies

-- Enable RLS
ALTER TABLE public.platform_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_platform_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- platform_roles: read-only for authenticated, managed by global_admin
DROP POLICY IF EXISTS "platform_roles_select" ON public.platform_roles;
CREATE POLICY "platform_roles_select" ON public.platform_roles
    FOR SELECT TO authenticated USING (TRUE);

-- user_platform_roles: users see own; global_admin sees all and manages all
DROP POLICY IF EXISTS "upr_select" ON public.user_platform_roles;
CREATE POLICY "upr_select" ON public.user_platform_roles
    FOR SELECT TO authenticated USING (
        user_id = auth.uid() OR public.is_global_admin()
    );

DROP POLICY IF EXISTS "upr_manage_admin" ON public.user_platform_roles;
CREATE POLICY "upr_manage_admin" ON public.user_platform_roles
    FOR ALL TO authenticated USING (
        public.is_global_admin()
    );

-- support_sessions: global admin only
DROP POLICY IF EXISTS "support_sessions_policy" ON public.support_sessions;
CREATE POLICY "support_sessions_policy" ON public.support_sessions
    FOR ALL TO authenticated USING (
        public.is_global_admin()
    );

-- audit_logs: append-only! NO DELETE or UPDATE for anyone!
DROP POLICY IF EXISTS "audit_logs_select" ON public.audit_logs;
CREATE POLICY "audit_logs_select" ON public.audit_logs
    FOR SELECT TO authenticated USING (
        public.is_global_admin() OR 
        (restaurant_id IS NOT NULL AND public.has_restaurant_permission(restaurant_id, 'restaurant.view'))
    );

DROP POLICY IF EXISTS "audit_logs_insert" ON public.audit_logs;
CREATE POLICY "audit_logs_insert" ON public.audit_logs
    FOR INSERT TO authenticated WITH CHECK (
        actor_user_id = auth.uid() OR public.is_global_admin()
    );

-- profiles: all authenticated can view profiles of team members or global admin
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles
    FOR SELECT TO authenticated USING (
        id = auth.uid() OR
        public.is_global_admin() OR
        EXISTS (
            SELECT 1 FROM public.restaurant_members rm1
            JOIN public.restaurant_members rm2 ON rm1.restaurant_id = rm2.restaurant_id
            WHERE rm1.user_id = auth.uid() AND rm2.user_id = public.profiles.id
        )
    );

DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_update" ON public.profiles
    FOR UPDATE TO authenticated USING (
        id = auth.uid() OR public.is_global_admin()
    );

-- restaurants:
DROP POLICY IF EXISTS "restaurants_select" ON public.restaurants;
CREATE POLICY "restaurants_select" ON public.restaurants
    FOR SELECT TO authenticated USING (
        public.is_global_admin() OR public.is_restaurant_member(id)
    );

DROP POLICY IF EXISTS "restaurants_insert" ON public.restaurants;
CREATE POLICY "restaurants_insert" ON public.restaurants
    FOR INSERT TO authenticated WITH CHECK (
        auth.uid() IS NOT NULL
    );

DROP POLICY IF EXISTS "restaurants_update" ON public.restaurants;
CREATE POLICY "restaurants_update" ON public.restaurants
    FOR UPDATE TO authenticated USING (
        public.is_global_admin() OR public.has_restaurant_permission(id, 'restaurant.update')
    );
