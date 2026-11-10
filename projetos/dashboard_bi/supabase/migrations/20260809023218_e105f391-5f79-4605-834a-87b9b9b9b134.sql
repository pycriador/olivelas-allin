-- 1) Remove read access to credential columns for app roles.
REVOKE SELECT (secret_ciphertext, ssl_client_key, ssl_client_certificate, ssl_ca_certificate)
  ON public.data_sources FROM authenticated;
REVOKE SELECT (secret_ciphertext, ssl_client_key, ssl_client_certificate, ssl_ca_certificate)
  ON public.data_sources FROM anon;
REVOKE ALL ON public.data_sources FROM anon;

-- 2) Trigger-only SECURITY DEFINER functions must not be callable from the API.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM anon, authenticated, PUBLIC;

-- 3) Helper functions used inside RLS policies stay callable by authenticated
--    (required for policy evaluation) but never by anonymous callers.
REVOKE ALL ON FUNCTION public.has_role(uuid, uuid, public.app_role) FROM anon, PUBLIC;
REVOKE ALL ON FUNCTION public.has_permission(uuid, uuid, text) FROM anon, PUBLIC;
REVOKE ALL ON FUNCTION public.is_org_member(uuid, uuid) FROM anon, PUBLIC;
REVOKE ALL ON FUNCTION public.current_org_id() FROM anon, PUBLIC;
REVOKE ALL ON FUNCTION public.can_manage_datasources(uuid, uuid) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_permission(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_org_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_datasources(uuid, uuid) TO authenticated;

-- 4) profiles: deletes stay fail-closed and no broad ALL policy may override it.
REVOKE DELETE ON public.profiles FROM anon, authenticated;