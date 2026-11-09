-- 1) Remove legacy plaintext OAuth token table (unused, empty)
DROP TABLE IF EXISTS public.google_calendar_connections;

-- 2) google_accounts UPDATE must re-verify ownership
DROP POLICY IF EXISTS "Owner or clinic admin manages google account update" ON public.google_accounts;
CREATE POLICY "Owner or clinic admin manages google account update"
ON public.google_accounts FOR UPDATE TO authenticated
USING (
  tenant_id = public.current_tenant_id()
  AND (user_id = auth.uid() OR public.has_role(auth.uid(), 'clinic_admin'::app_role))
)
WITH CHECK (
  tenant_id = public.current_tenant_id()
  AND (user_id = auth.uid() OR public.has_role(auth.uid(), 'clinic_admin'::app_role))
);

-- 3) Harden SECURITY DEFINER functions callable by authenticated users:
--    they may only answer about the caller (global admins may query anyone).
CREATE OR REPLACE FUNCTION public.is_global_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT CASE
    WHEN auth.uid() IS NULL THEN false
    WHEN _user_id IS DISTINCT FROM auth.uid()
      AND NOT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'global_admin'
      ) THEN false
    ELSE EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id AND role = 'global_admin'
    )
  END;
$function$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT CASE
    WHEN auth.uid() IS NULL THEN false
    WHEN _user_id IS DISTINCT FROM auth.uid()
      AND NOT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'global_admin'
      ) THEN false
    ELSE EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = _user_id
        AND ur.role = _role
        AND (
          ur.role = 'global_admin'::app_role
          OR ur.tenant_id = public.current_tenant_id()
        )
    )
  END;
$function$;

CREATE OR REPLACE FUNCTION public.user_belongs_to_tenant(_user_id uuid, _tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT CASE
    WHEN auth.uid() IS NULL THEN false
    WHEN _user_id IS DISTINCT FROM auth.uid()
      AND NOT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'global_admin'
      ) THEN false
    ELSE EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = _user_id AND tenant_id = _tenant_id
    )
  END;
$function$;

REVOKE ALL ON FUNCTION public.is_global_admin(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.user_belongs_to_tenant(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.current_tenant_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_global_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_tenant_id() TO authenticated;