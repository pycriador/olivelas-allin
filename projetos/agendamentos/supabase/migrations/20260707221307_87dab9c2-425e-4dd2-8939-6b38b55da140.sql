
-- 1. Tenant-scope has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND ur.role = _role
      AND (
        ur.role = 'global_admin'::app_role
        OR ur.tenant_id = public.current_tenant_id()
      )
  );
$$;

-- 2. Prevent clinic_admin self-grant of global_admin
DROP POLICY IF EXISTS "Clinic admins manage roles in tenant" ON public.user_roles;

CREATE POLICY "Clinic admins view roles in tenant"
ON public.user_roles FOR SELECT
USING (
  user_id = auth.uid()
  OR ((tenant_id = current_tenant_id()) AND has_role(auth.uid(), 'clinic_admin'::app_role))
  OR is_global_admin(auth.uid())
);

CREATE POLICY "Clinic admins insert non-global roles"
ON public.user_roles FOR INSERT
WITH CHECK (
  (
    tenant_id = current_tenant_id()
    AND has_role(auth.uid(), 'clinic_admin'::app_role)
    AND role <> 'global_admin'::app_role
  )
  OR is_global_admin(auth.uid())
);

CREATE POLICY "Clinic admins update non-global roles"
ON public.user_roles FOR UPDATE
USING (
  (
    tenant_id = current_tenant_id()
    AND has_role(auth.uid(), 'clinic_admin'::app_role)
    AND role <> 'global_admin'::app_role
  )
  OR is_global_admin(auth.uid())
)
WITH CHECK (
  (
    tenant_id = current_tenant_id()
    AND has_role(auth.uid(), 'clinic_admin'::app_role)
    AND role <> 'global_admin'::app_role
  )
  OR is_global_admin(auth.uid())
);

CREATE POLICY "Clinic admins delete non-global roles"
ON public.user_roles FOR DELETE
USING (
  (
    tenant_id = current_tenant_id()
    AND has_role(auth.uid(), 'clinic_admin'::app_role)
    AND role <> 'global_admin'::app_role
  )
  OR is_global_admin(auth.uid())
);

-- Drop the older permissive SELECT to avoid duplicate
DROP POLICY IF EXISTS "Users view roles in their tenant" ON public.user_roles;
CREATE POLICY "Users view roles in their tenant"
ON public.user_roles FOR SELECT
USING (
  user_id = auth.uid()
  OR (tenant_id = current_tenant_id() AND has_role(auth.uid(), 'clinic_admin'::app_role))
  OR is_global_admin(auth.uid())
);
DROP POLICY IF EXISTS "Clinic admins view roles in tenant" ON public.user_roles;

-- 3. Google Calendar tokens: owner-only visibility
DROP POLICY IF EXISTS "Users view own gcal connections" ON public.google_calendar_connections;
DROP POLICY IF EXISTS "Users manage own gcal connections" ON public.google_calendar_connections;

CREATE POLICY "Users view own gcal connections"
ON public.google_calendar_connections FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users manage own gcal connections"
ON public.google_calendar_connections FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid() AND tenant_id = current_tenant_id());

-- 4. Remove permissive tenants INSERT policy (creation happens via SECURITY DEFINER trigger)
DROP POLICY IF EXISTS "Anyone authenticated can create a tenant" ON public.tenants;

-- 5. Lock down SECURITY DEFINER function execution
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_global_admin(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.current_tenant_id() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.user_belongs_to_tenant(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_global_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_tenant_id() TO authenticated;
