CREATE OR REPLACE FUNCTION public.grant_platform_admin_for_allowlisted_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL
     AND lower(NEW.email) IN ('willian.o.jesus@gmail.com', 'py.criador@gmail.com') THEN
    INSERT INTO public.user_roles (user_id, tenant_id, role)
    SELECT NEW.id, NULL, 'global_admin'::app_role
    WHERE NOT EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = NEW.id AND ur.role = 'global_admin'::app_role
    );
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.grant_platform_admin_for_allowlisted_email() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created_grant_platform_admin ON auth.users;
CREATE TRIGGER on_auth_user_created_grant_platform_admin
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.grant_platform_admin_for_allowlisted_email();

DROP TRIGGER IF EXISTS on_auth_user_confirmed_grant_platform_admin ON auth.users;
CREATE TRIGGER on_auth_user_confirmed_grant_platform_admin
AFTER UPDATE OF email_confirmed_at ON auth.users
FOR EACH ROW
WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
EXECUTE FUNCTION public.grant_platform_admin_for_allowlisted_email();

INSERT INTO public.user_roles (user_id, tenant_id, role)
SELECT u.id, NULL, 'global_admin'::app_role
FROM auth.users u
WHERE lower(u.email) IN ('willian.o.jesus@gmail.com', 'py.criador@gmail.com')
  AND u.email_confirmed_at IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = u.id AND ur.role = 'global_admin'::app_role
  );