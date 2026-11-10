REVOKE EXECUTE ON FUNCTION public.can_manage_datasources(uuid, uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.can_manage_datasources(uuid, uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.has_permission(uuid, uuid, text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.has_permission(uuid, uuid, text) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, uuid, public.app_role) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, uuid, public.app_role) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.is_org_member(uuid, uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.is_org_member(uuid, uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.current_org_id() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.current_org_id() TO authenticated, service_role;