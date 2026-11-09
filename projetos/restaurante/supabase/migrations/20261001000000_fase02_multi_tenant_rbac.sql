-- ==============================================================================
-- OLIVELAS RESTAURANT — FASE 02: MULTI-TENANT + RESTAURANTE + USUÁRIOS + RBAC
-- Migration: 20261001000000_fase02_multi_tenant_rbac.sql
-- ==============================================================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Profiles Table (Global user profile linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    email TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Trigger to handle updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_profiles_updated
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Trigger to automatically populate public.profiles from auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.email,
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
        updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Restaurants Table (Tenants)
CREATE TABLE IF NOT EXISTS public.restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL CHECK (char_length(trim(name)) > 0),
    legal_name TEXT,
    document TEXT,
    email TEXT,
    phone TEXT,
    whatsapp TEXT,
    logo_url TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    country TEXT DEFAULT 'BR' NOT NULL,
    timezone TEXT DEFAULT 'America/Sao_Paulo' NOT NULL,
    currency TEXT DEFAULT 'BRL' NOT NULL,
    status TEXT DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE TRIGGER on_restaurants_updated
    BEFORE UPDATE ON public.restaurants
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 4. Roles Table
CREATE TABLE IF NOT EXISTS public.roles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 5. Permissions Table
CREATE TABLE IF NOT EXISTS public.permissions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 6. Role Permissions Association
CREATE TABLE IF NOT EXISTS public.role_permissions (
    role_id TEXT NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id TEXT NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    PRIMARY KEY (role_id, permission_id)
);

-- 7. Restaurant Members (Association between user and restaurant tenant)
CREATE TABLE IF NOT EXISTS public.restaurant_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id TEXT NOT NULL REFERENCES public.roles(id),
    status TEXT DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'invited', 'suspended', 'removed')),
    joined_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    CONSTRAINT uq_restaurant_member UNIQUE (restaurant_id, user_id)
);

CREATE TRIGGER on_restaurant_members_updated
    BEFORE UPDATE ON public.restaurant_members
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_restaurant_members_user ON public.restaurant_members(user_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_members_tenant ON public.restaurant_members(restaurant_id, status);

-- Add explicit relation to public.profiles for PostgREST schema cache
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'restaurant_members_user_id_profiles_fkey'
    ) THEN
        ALTER TABLE public.restaurant_members
        ADD CONSTRAINT restaurant_members_user_id_profiles_fkey
        FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END $$;

-- 8. Restaurant Invitations
CREATE TABLE IF NOT EXISTS public.restaurant_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    email TEXT NOT NULL CHECK (char_length(trim(email)) > 0),
    role_id TEXT NOT NULL REFERENCES public.roles(id),
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.restaurant_invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_restaurant ON public.restaurant_invitations(restaurant_id);

-- 9. Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_restaurant_created ON public.audit_logs(restaurant_id, created_at DESC);

-- ==============================================================================
-- 10. SECURITY DEFINER HELPER FUNCTIONS
-- ==============================================================================

-- Check if current authenticated user is an active member of restaurant
CREATE OR REPLACE FUNCTION public.is_restaurant_member(target_restaurant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN FALSE;
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

-- Check if current authenticated user has a specific role in restaurant
CREATE OR REPLACE FUNCTION public.has_restaurant_role(target_restaurant_id UUID, target_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN FALSE;
    END IF;

    RETURN EXISTS (
        SELECT 1
        FROM public.restaurant_members
        WHERE restaurant_id = target_restaurant_id
          AND user_id = auth.uid()
          AND role_id = target_role
          AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Check if current authenticated user has a specific permission in restaurant
CREATE OR REPLACE FUNCTION public.has_restaurant_permission(target_restaurant_id UUID, target_permission TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN FALSE;
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

-- Atomic transaction: create restaurant + assign restaurant_admin membership + audit log
CREATE OR REPLACE FUNCTION public.create_restaurant_with_admin(
    p_name TEXT,
    p_legal_name TEXT DEFAULT NULL,
    p_document TEXT DEFAULT NULL,
    p_email TEXT DEFAULT NULL,
    p_phone TEXT DEFAULT NULL,
    p_whatsapp TEXT DEFAULT NULL,
    p_address TEXT DEFAULT NULL,
    p_city TEXT DEFAULT NULL,
    p_state TEXT DEFAULT NULL,
    p_zip_code TEXT DEFAULT NULL,
    p_country TEXT DEFAULT 'BR',
    p_timezone TEXT DEFAULT 'America/Sao_Paulo',
    p_currency TEXT DEFAULT 'BRL'
)
RETURNS UUID AS $$
DECLARE
    v_restaurant_id UUID;
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado.';
    END IF;

    IF trim(p_name) IS NULL OR trim(p_name) = '' THEN
        RAISE EXCEPTION 'O nome do restaurante é obrigatório.';
    END IF;

    -- 1. Insert Restaurant
    INSERT INTO public.restaurants (
        name, legal_name, document, email, phone, whatsapp,
        address, city, state, zip_code, country, timezone, currency,
        status, created_by
    ) VALUES (
        trim(p_name), p_legal_name, p_document, p_email, p_phone, p_whatsapp,
        p_address, p_city, p_state, p_zip_code, p_country, p_timezone, p_currency,
        'active', v_user_id
    ) RETURNING id INTO v_restaurant_id;

    -- 2. Insert Membership as restaurant_admin
    INSERT INTO public.restaurant_members (
        restaurant_id, user_id, role_id, status, joined_at
    ) VALUES (
        v_restaurant_id, v_user_id, 'restaurant_admin', 'active', TIMEZONE('utc', NOW())
    );

    -- 3. Log Audit
    INSERT INTO public.audit_logs (
        restaurant_id, actor_user_id, action, entity_type, entity_id, metadata
    ) VALUES (
        v_restaurant_id, v_user_id, 'RESTAURANT_CREATED', 'restaurant', v_restaurant_id::text,
        jsonb_build_object('name', p_name, 'created_by', v_user_id)
    );

    RETURN v_restaurant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Prevent removing the last active administrator of a restaurant
CREATE OR REPLACE FUNCTION public.check_last_admin_removal()
RETURNS TRIGGER AS $$
DECLARE
    v_active_admins_count INT;
BEGIN
    -- Only check if an admin is being removed or status changed from active
    IF (OLD.role_id = 'restaurant_admin' AND (TG_OP = 'DELETE' OR NEW.status != 'active' OR NEW.role_id != 'restaurant_admin')) THEN
        SELECT COUNT(*)
        INTO v_active_admins_count
        FROM public.restaurant_members
        WHERE restaurant_id = OLD.restaurant_id
          AND role_id = 'restaurant_admin'
          AND status = 'active'
          AND id != OLD.id;

        IF v_active_admins_count = 0 THEN
            RAISE EXCEPTION 'Não é permitido remover ou alterar o último administrador ativo do restaurante.';
        END IF;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_last_admin_removal
    BEFORE UPDATE OR DELETE ON public.restaurant_members
    FOR EACH ROW EXECUTE FUNCTION public.check_last_admin_removal();

-- ==============================================================================
-- 11. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tenant tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 11.1. PROFILES RLS
CREATE POLICY "profiles_select_policy"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (
        id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.restaurant_members rm1
            JOIN public.restaurant_members rm2 ON rm1.restaurant_id = rm2.restaurant_id
            WHERE rm1.user_id = auth.uid() AND rm2.user_id = public.profiles.id
        )
    );

CREATE POLICY "profiles_update_own"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_insert_own"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (id = auth.uid());

-- 11.2. RESTAURANTS RLS
CREATE POLICY "restaurants_select_member"
    ON public.restaurants FOR SELECT
    TO authenticated
    USING (public.is_restaurant_member(id));

CREATE POLICY "restaurants_update_admin_or_manager"
    ON public.restaurants FOR UPDATE
    TO authenticated
    USING (public.has_restaurant_permission(id, 'restaurant.update'))
    WITH CHECK (public.has_restaurant_permission(id, 'restaurant.update'));

CREATE POLICY "restaurants_insert_authenticated"
    ON public.restaurants FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL);

-- 11.3. ROLES, PERMISSIONS & ROLE_PERMISSIONS (Read-only for authenticated)
CREATE POLICY "roles_select_authenticated"
    ON public.roles FOR SELECT
    TO authenticated
    USING (TRUE);

CREATE POLICY "permissions_select_authenticated"
    ON public.permissions FOR SELECT
    TO authenticated
    USING (TRUE);

CREATE POLICY "role_permissions_select_authenticated"
    ON public.role_permissions FOR SELECT
    TO authenticated
    USING (TRUE);

-- 11.4. RESTAURANT_MEMBERS RLS
CREATE POLICY "restaurant_members_select"
    ON public.restaurant_members FOR SELECT
    TO authenticated
    USING (public.is_restaurant_member(restaurant_id));

CREATE POLICY "restaurant_members_insert"
    ON public.restaurant_members FOR INSERT
    TO authenticated
    WITH CHECK (
        public.has_restaurant_permission(restaurant_id, 'users.create')
        OR (user_id = auth.uid() AND NOT EXISTS (
            SELECT 1 FROM public.restaurant_members rm WHERE rm.restaurant_id = restaurant_members.restaurant_id
        ))
    );

CREATE POLICY "restaurant_members_update"
    ON public.restaurant_members FOR UPDATE
    TO authenticated
    USING (public.has_restaurant_permission(restaurant_id, 'users.update'))
    WITH CHECK (public.has_restaurant_permission(restaurant_id, 'users.update'));

CREATE POLICY "restaurant_members_delete"
    ON public.restaurant_members FOR DELETE
    TO authenticated
    USING (public.has_restaurant_permission(restaurant_id, 'users.remove'));

-- 11.5. RESTAURANT_INVITATIONS RLS
CREATE POLICY "invitations_select"
    ON public.restaurant_invitations FOR SELECT
    TO authenticated
    USING (
        public.is_restaurant_member(restaurant_id)
        OR email = (SELECT email FROM public.profiles WHERE id = auth.uid())
    );

CREATE POLICY "invitations_insert"
    ON public.restaurant_invitations FOR INSERT
    TO authenticated
    WITH CHECK (public.has_restaurant_permission(restaurant_id, 'users.create'));

CREATE POLICY "invitations_update"
    ON public.restaurant_invitations FOR UPDATE
    TO authenticated
    USING (
        public.has_restaurant_permission(restaurant_id, 'users.update')
        OR email = (SELECT email FROM public.profiles WHERE id = auth.uid())
    );

CREATE POLICY "invitations_delete"
    ON public.restaurant_invitations FOR DELETE
    TO authenticated
    USING (public.has_restaurant_permission(restaurant_id, 'users.remove'));

-- 11.6. AUDIT_LOGS RLS
CREATE POLICY "audit_logs_select"
    ON public.audit_logs FOR SELECT
    TO authenticated
    USING (public.has_restaurant_permission(restaurant_id, 'restaurant.view'));

CREATE POLICY "audit_logs_insert"
    ON public.audit_logs FOR INSERT
    TO authenticated
    WITH CHECK (public.is_restaurant_member(restaurant_id));

-- ==============================================================================
-- 12. STORAGE BUCKET & POLICIES (Restaurants Storage)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('restaurants', 'restaurants', true)
ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY "storage_restaurants_read"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'restaurants');

CREATE POLICY "storage_restaurants_insert"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'restaurants'
        AND public.has_restaurant_permission((storage.foldername(name))[2]::uuid, 'restaurant.update')
    );

CREATE POLICY "storage_restaurants_update"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'restaurants'
        AND public.has_restaurant_permission((storage.foldername(name))[2]::uuid, 'restaurant.update')
    );

CREATE POLICY "storage_restaurants_delete"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'restaurants'
        AND public.has_restaurant_permission((storage.foldername(name))[2]::uuid, 'restaurant.update')
    );

-- ==============================================================================
-- 13. SEED INITIAL ROLES & PERMISSIONS
-- ==============================================================================

-- 13.1. Roles
INSERT INTO public.roles (id, name, description) VALUES
    ('restaurant_admin', 'Administrador', 'Controle completo do restaurante e da equipe.'),
    ('manager', 'Gerente', 'Gerenciamento operacional, produtos e atendimento.'),
    ('waiter', 'Garçom', 'Operação de mesas e pedidos no salão.'),
    ('kitchen', 'Cozinha', 'Operação e visualização dos pedidos na cozinha.'),
    ('cashier', 'Caixa', 'Operação de caixa e fechamento de contas.')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description;

-- 13.2. Permissions
INSERT INTO public.permissions (id, name, description) VALUES
    -- Restaurant
    ('restaurant.view', 'Visualizar Restaurante', 'Permissão para consultar dados do restaurante.'),
    ('restaurant.update', 'Editar Restaurante', 'Permissão para atualizar dados e configurações do restaurante.'),
    -- Users / Team
    ('users.view', 'Visualizar Equipe', 'Permissão para visualizar membros do restaurante.'),
    ('users.create', 'Adicionar Usuários', 'Permissão para convidar ou adicionar novos membros à equipe.'),
    ('users.update', 'Editar Papel de Usuários', 'Permissão para atualizar cargos e status de membros.'),
    ('users.remove', 'Remover Usuários', 'Permissão para desvincular membros da equipe.'),
    -- Prepared for Future Phases
    ('products.view', 'Visualizar Produtos', 'Consultar catálogo de produtos e cardápio.'),
    ('products.create', 'Criar Produtos', 'Cadastrar novos itens no cardápio.'),
    ('products.update', 'Editar Produtos', 'Atualizar itens do cardápio.'),
    ('products.delete', 'Excluir Produtos', 'Remover itens do cardápio.'),
    ('tables.view', 'Visualizar Mesas', 'Visualizar mapa de mesas.'),
    ('tables.create', 'Cadastrar Mesas', 'Criar novas mesas físicas.'),
    ('tables.update', 'Atualizar Mesas', 'Editar dados de mesas.'),
    ('tables.delete', 'Excluir Mesas', 'Remover mesas.'),
    ('orders.view', 'Visualizar Pedidos', 'Visualizar pedidos do salão.'),
    ('orders.create', 'Criar Pedidos', 'Lançar novos pedidos em mesas.'),
    ('orders.update', 'Editar Pedidos', 'Modificar itens ou status de pedidos.'),
    ('orders.cancel', 'Cancelar Pedidos', 'Cancelar pedidos lançados.'),
    ('kitchen.view', 'Visualizar Cozinha', 'Acessar display KDS da cozinha.'),
    ('kitchen.update', 'Atualizar Cozinha', 'Alterar status de pratos na cozinha.'),
    ('cashier.view', 'Visualizar Caixa', 'Acessar fluxo financeiro do caixa.'),
    ('cashier.update', 'Atualizar Caixa', 'Receber pagamentos e fechar mesas.')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description;

-- 13.3. Role Permissions Mapping
-- Manager permissions
INSERT INTO public.role_permissions (role_id, permission_id) VALUES
    ('manager', 'restaurant.view'),
    ('manager', 'restaurant.update'),
    ('manager', 'users.view'),
    ('manager', 'products.view'),
    ('manager', 'products.create'),
    ('manager', 'products.update'),
    ('manager', 'products.delete'),
    ('manager', 'tables.view'),
    ('manager', 'tables.create'),
    ('manager', 'tables.update'),
    ('manager', 'tables.delete'),
    ('manager', 'orders.view'),
    ('manager', 'orders.create'),
    ('manager', 'orders.update'),
    ('manager', 'orders.cancel'),
    ('manager', 'kitchen.view'),
    ('manager', 'kitchen.update'),
    ('manager', 'cashier.view')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Waiter permissions
INSERT INTO public.role_permissions (role_id, permission_id) VALUES
    ('waiter', 'restaurant.view'),
    ('waiter', 'tables.view'),
    ('waiter', 'orders.view'),
    ('waiter', 'orders.create'),
    ('waiter', 'orders.update'),
    ('waiter', 'products.view')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Kitchen permissions
INSERT INTO public.role_permissions (role_id, permission_id) VALUES
    ('kitchen', 'restaurant.view'),
    ('kitchen', 'kitchen.view'),
    ('kitchen', 'kitchen.update'),
    ('kitchen', 'orders.view')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Cashier permissions
INSERT INTO public.role_permissions (role_id, permission_id) VALUES
    ('cashier', 'restaurant.view'),
    ('cashier', 'tables.view'),
    ('cashier', 'orders.view'),
    ('cashier', 'cashier.view'),
    ('cashier', 'cashier.update')
ON CONFLICT (role_id, permission_id) DO NOTHING;
