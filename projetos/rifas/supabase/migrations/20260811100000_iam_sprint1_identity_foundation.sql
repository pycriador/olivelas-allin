-- =============================================================================
-- IAM Sprint 1 — Identity Foundation
-- =============================================================================

-- 1. Roles table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    is_system_role BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ
);
GRANT SELECT ON public.roles TO authenticated;
GRANT ALL ON public.roles TO service_role;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can read roles"
    ON public.roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage roles"
    ON public.roles FOR ALL TO authenticated USING (public.is_global_admin())
    WITH CHECK (public.is_global_admin());
CREATE TRIGGER roles_updated_at
    BEFORE UPDATE ON public.roles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Plans table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    max_campaigns INTEGER NOT NULL DEFAULT 0,
    max_gallery_images_per_campaign INTEGER NOT NULL DEFAULT 0,
    max_cover_images_per_campaign INTEGER NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ
);
GRANT SELECT ON public.plans TO authenticated;
GRANT ALL ON public.plans TO service_role;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can read plans"
    ON public.plans FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage plans"
    ON public.plans FOR ALL TO authenticated USING (public.is_global_admin())
    WITH CHECK (public.is_global_admin());
CREATE TRIGGER plans_updated_at
    BEFORE UPDATE ON public.plans
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Seed roles
-- ---------------------------------------------------------------------------
INSERT INTO public.roles (code, name, description, is_system_role) VALUES
    ('GLOBAL_ADMIN', 'Global Administrator', 'Máxima autoridade na plataforma', true),
    ('ADMIN', 'Administrator', 'Administrador operacional', true),
    ('PUBLISHER', 'Publisher', 'Criador e gerenciador de campanhas', true)
ON CONFLICT (code) DO NOTHING;

-- 4. Seed plans
-- ---------------------------------------------------------------------------
INSERT INTO public.plans (code, name, description, max_campaigns, max_gallery_images_per_campaign, max_cover_images_per_campaign) VALUES
    ('FREE', 'Free', 'Plano gratuito', 2, 3, 1),
    ('STANDARD', 'Standard', 'Plano padrão', 10, 5, 1),
    ('PRO', 'Pro', 'Plano profissional', 20, 20, 1)
ON CONFLICT (code) DO NOTHING;

-- 5. Extend profile_status enum
-- ---------------------------------------------------------------------------
ALTER TYPE public.profile_status ADD VALUE IF NOT EXISTS 'INACTIVE';
ALTER TYPE public.profile_status ADD VALUE IF NOT EXISTS 'PENDING';
ALTER TYPE public.profile_status ADD VALUE IF NOT EXISTS 'SUSPENDED';

-- 6. Add role_id and plan_id to profiles
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES public.roles(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES public.plans(id);

-- 7. Migrate existing data: map user_roles to roles table
-- ---------------------------------------------------------------------------
DO $$
DECLARE
    global_admin_id UUID;
    publisher_id UUID;
    free_plan_id UUID;
BEGIN
    SELECT id INTO global_admin_id FROM public.roles WHERE code = 'GLOBAL_ADMIN';
    SELECT id INTO publisher_id FROM public.roles WHERE code = 'PUBLISHER';
    SELECT id INTO free_plan_id FROM public.plans WHERE code = 'FREE';

    -- Profiles with GLOBAL_ADMIN role → role_id = GLOBAL_ADMIN, plan_id = NULL
    UPDATE public.profiles p
    SET role_id = global_admin_id
    WHERE p.role_id IS NULL
      AND EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = p.id AND ur.role = 'GLOBAL_ADMIN'
      );

    -- Profiles with USER role → role_id = PUBLISHER, plan_id = FREE
    UPDATE public.profiles p
    SET role_id = publisher_id,
        plan_id = free_plan_id
    WHERE p.role_id IS NULL
      AND EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = p.id AND ur.role = 'USER'
      );
END $$;

-- 8. Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_profiles_role_id ON public.profiles(role_id);
CREATE INDEX IF NOT EXISTS idx_profiles_plan_id ON public.profiles(plan_id);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);

-- 9. Updated handle_new_user trigger with race-condition protection
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    is_first BOOLEAN;
    assigned_role_code TEXT;
    assigned_role_id UUID;
    free_plan_id UUID;
    user_status public.profile_status;
BEGIN
    PERFORM pg_advisory_xact_lock(hashtext('bootstrap_global_admin'));
    SELECT NOT EXISTS (SELECT 1 FROM public.profiles WHERE deleted_at IS NULL) INTO is_first;

    assigned_role_code := CASE WHEN is_first THEN 'GLOBAL_ADMIN' ELSE 'PUBLISHER' END;
    user_status := 'ACTIVE';

    SELECT id INTO assigned_role_id FROM public.roles WHERE code = assigned_role_code;

    INSERT INTO public.profiles (id, name, email, avatar_url, status, role_id, plan_id, last_login)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture'),
        user_status,
        assigned_role_id,
        CASE WHEN assigned_role_code = 'PUBLISHER' THEN (SELECT id FROM public.plans WHERE code = 'FREE') ELSE NULL END,
        now()
    )
    ON CONFLICT (id) DO NOTHING;

    -- Backward compat: keep user_roles populated for existing RLS policies
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, CASE WHEN is_first THEN 'GLOBAL_ADMIN'::public.app_role ELSE 'USER'::public.app_role END)
    ON CONFLICT (user_id, role) DO NOTHING;

    RETURN NEW;
END; $$;

-- 10. Helper functions for roles-based checks
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_role_code(_user_id UUID)
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT r.code
    FROM public.profiles p
    JOIN public.roles r ON r.id = p.role_id
    WHERE p.id = _user_id AND p.deleted_at IS NULL;
$$;

CREATE OR REPLACE FUNCTION public.is_global_admin_v2()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT public.get_user_role_code(auth.uid()) = 'GLOBAL_ADMIN';
$$;

-- 11. Clean up: update obsolete policies to also recognize profiles without user_roles
-- RLS policies that use is_global_admin() still work because user_roles is kept in sync.
-- is_global_admin_v2() is the new variant that reads from roles table via profiles.
