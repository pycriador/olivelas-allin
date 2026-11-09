-- ==============================================================================
-- OLIVELAS RESTAURANT — GLOBAL ADMIN (SUPERADMIN) PERMISSIONS
-- Migration: 20261001000001_global_admin.sql
-- Global Admin user: willian.o.jesus@gmail.com
-- ==============================================================================

-- 1. Helper function to check if the current caller is a Global Admin
CREATE OR REPLACE FUNCTION public.is_global_admin()
RETURNS BOOLEAN AS $$
DECLARE
    v_email TEXT;
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Check from jwt email claim first (fastest)
    v_email := LOWER(COALESCE(auth.jwt() ->> 'email', ''));
    IF v_email = 'willian.o.jesus@gmail.com' THEN
        RETURN TRUE;
    END IF;

    -- Fallback to auth.users lookup
    RETURN EXISTS (
        SELECT 1
        FROM auth.users
        WHERE id = auth.uid()
          AND LOWER(email) = 'willian.o.jesus@gmail.com'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- 2. Update is_restaurant_member: Global Admin is treated as a member of ALL restaurants
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

-- 3. Update has_restaurant_role: Global Admin has restaurant_admin role across ALL restaurants
CREATE OR REPLACE FUNCTION public.has_restaurant_role(target_restaurant_id UUID, target_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Global Admin possesses restaurant_admin permissions everywhere
    IF public.is_global_admin() THEN
        RETURN TRUE;
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

-- 4. Update has_restaurant_permission: Global Admin has ALL permissions across ALL restaurants
CREATE OR REPLACE FUNCTION public.has_restaurant_permission(target_restaurant_id UUID, target_permission TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN FALSE;
    END IF;

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

-- 5. RLS on public.restaurants: Global Admin can view ALL restaurants
DROP POLICY IF EXISTS "restaurant_select_member" ON public.restaurants;
CREATE POLICY "restaurant_select_member" ON public.restaurants
    FOR SELECT USING (
        public.is_global_admin() OR public.is_restaurant_member(id)
    );

-- 6. RLS on public.restaurants: Global Admin can update ANY restaurant
DROP POLICY IF EXISTS "restaurant_update_admin" ON public.restaurants;
CREATE POLICY "restaurant_update_admin" ON public.restaurants
    FOR UPDATE USING (
        public.is_global_admin() OR public.has_restaurant_permission(id, 'restaurant.update')
    );

-- 7. RLS on public.restaurant_members: Global Admin can view, add, update ANY member
DROP POLICY IF EXISTS "members_select_colleagues" ON public.restaurant_members;
CREATE POLICY "members_select_colleagues" ON public.restaurant_members
    FOR SELECT USING (
        public.is_global_admin() OR public.is_restaurant_member(restaurant_id)
    );

DROP POLICY IF EXISTS "members_insert_admin" ON public.restaurant_members;
CREATE POLICY "members_insert_admin" ON public.restaurant_members
    FOR INSERT WITH CHECK (
        public.is_global_admin() OR public.has_restaurant_permission(restaurant_id, 'users.manage')
    );

DROP POLICY IF EXISTS "members_update_admin" ON public.restaurant_members;
CREATE POLICY "members_update_admin" ON public.restaurant_members
    FOR UPDATE USING (
        public.is_global_admin() OR public.has_restaurant_permission(restaurant_id, 'users.manage')
    );

DROP POLICY IF EXISTS "members_delete_admin" ON public.restaurant_members;
CREATE POLICY "members_delete_admin" ON public.restaurant_members
    FOR DELETE USING (
        public.is_global_admin() OR public.has_restaurant_permission(restaurant_id, 'users.manage')
    );

-- 8. RLS on public.audit_logs: Global Admin can view audit logs of all restaurants
DROP POLICY IF EXISTS "audit_select_admin" ON public.audit_logs;
CREATE POLICY "audit_select_admin" ON public.audit_logs
    FOR SELECT USING (
        public.is_global_admin() OR public.has_restaurant_role(restaurant_id, 'restaurant_admin')
    );

-- 9. Storage policy for restaurants bucket: Global Admin can upload/update/delete any restaurant assets
DO $$
BEGIN
    DROP POLICY IF EXISTS "storage_restaurants_manage" ON storage.objects;
    CREATE POLICY "storage_restaurants_manage" ON storage.objects
        FOR ALL USING (
            bucket_id = 'restaurants' AND (
                public.is_global_admin() OR
                auth.uid() IS NOT NULL
            )
        );
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END $$;
