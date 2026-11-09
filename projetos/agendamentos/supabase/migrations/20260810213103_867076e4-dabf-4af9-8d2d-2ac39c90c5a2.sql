-- 1. availability_cache: reads for tenant members, writes only from backend/service role
DROP POLICY IF EXISTS "avcache_write" ON public.availability_cache;
REVOKE INSERT, UPDATE, DELETE ON public.availability_cache FROM authenticated;
GRANT SELECT ON public.availability_cache TO authenticated;
GRANT ALL ON public.availability_cache TO service_role;

-- 2. professional_workload: same treatment
DROP POLICY IF EXISTS "workload_write" ON public.professional_workload;
REVOKE INSERT, UPDATE, DELETE ON public.professional_workload FROM authenticated;
GRANT SELECT ON public.professional_workload TO authenticated;
GRANT ALL ON public.professional_workload TO service_role;

-- 3. availability_audit_logs: read-only for tenant members, writes only from backend
REVOKE INSERT, UPDATE, DELETE ON public.availability_audit_logs FROM authenticated;
GRANT SELECT ON public.availability_audit_logs TO authenticated;
GRANT ALL ON public.availability_audit_logs TO service_role;

-- 4. google_accounts: restrict SELECT to owner or clinic admin
DROP POLICY IF EXISTS "Tenant members read google accounts" ON public.google_accounts;
CREATE POLICY "Owner or clinic admin reads google accounts"
ON public.google_accounts
FOR SELECT
TO authenticated
USING (
  tenant_id = private.current_tenant_id()
  AND (user_id = auth.uid() OR private.has_role(auth.uid(), 'clinic_admin'::app_role))
);

-- 5. google_calendars: restrict SELECT to owner of the account or clinic admin
DROP POLICY IF EXISTS "Tenant members read google calendars" ON public.google_calendars;
CREATE POLICY "Owner or clinic admin reads google calendars"
ON public.google_calendars
FOR SELECT
TO authenticated
USING (
  tenant_id = private.current_tenant_id()
  AND EXISTS (
    SELECT 1 FROM public.google_accounts ga
    WHERE ga.id = google_calendars.account_id
      AND ga.tenant_id = private.current_tenant_id()
      AND (ga.user_id = auth.uid() OR private.has_role(auth.uid(), 'clinic_admin'::app_role))
  )
);