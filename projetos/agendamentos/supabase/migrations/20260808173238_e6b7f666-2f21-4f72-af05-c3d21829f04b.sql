CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

ALTER FUNCTION public.has_role(uuid, public.app_role) SET SCHEMA private;
ALTER FUNCTION public.is_global_admin(uuid) SET SCHEMA private;
ALTER FUNCTION public.current_tenant_id() SET SCHEMA private;
ALTER FUNCTION public.user_belongs_to_tenant(uuid, uuid) SET SCHEMA private;

ALTER FUNCTION private.has_role(uuid, public.app_role) SET search_path = public;
ALTER FUNCTION private.is_global_admin(uuid) SET search_path = public;
ALTER FUNCTION private.current_tenant_id() SET search_path = public;
ALTER FUNCTION private.user_belongs_to_tenant(uuid, uuid) SET search_path = public;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.is_global_admin(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.current_tenant_id() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.user_belongs_to_tenant(uuid, uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_global_admin(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.current_tenant_id() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.user_belongs_to_tenant(uuid, uuid) TO authenticated, service_role;