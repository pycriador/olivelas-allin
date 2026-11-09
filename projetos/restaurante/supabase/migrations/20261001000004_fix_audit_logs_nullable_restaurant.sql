-- ==============================================================================
-- OLIVELAS RESTAURANT — FIX: ALLOW PLATFORM-LEVEL & AUTH AUDIT LOGS
-- Migration: 20261001000004_fix_audit_logs_nullable_restaurant.sql
-- ==============================================================================

-- 1. Remove NOT NULL constraint on audit_logs.restaurant_id
-- Platform events (LOGIN_SUCCESS, LOGOUT, SESSION_REVOKED, USER_REGISTERED, GLOBAL_ADMIN_ACTION)
-- happen at the identity/platform level, before a specific tenant context is active.
ALTER TABLE IF EXISTS public.audit_logs 
    ALTER COLUMN restaurant_id DROP NOT NULL;

-- 2. Ensure RLS policies allow global admin and authenticated users to log auth events
DROP POLICY IF EXISTS "audit_logs_insert" ON public.audit_logs;
CREATE POLICY "audit_logs_insert"
    ON public.audit_logs FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "audit_logs_select" ON public.audit_logs;
CREATE POLICY "audit_logs_select"
    ON public.audit_logs FOR SELECT
    USING (
        public.is_global_admin()
        OR (restaurant_id IS NOT NULL AND public.is_restaurant_member(restaurant_id))
        OR (actor_user_id = auth.uid())
    );
