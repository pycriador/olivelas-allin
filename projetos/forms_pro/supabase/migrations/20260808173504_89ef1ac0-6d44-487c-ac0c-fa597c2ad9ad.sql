
CREATE OR REPLACE FUNCTION public.assign_default_role()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE has_admin boolean;
BEGIN
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') INTO has_admin;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, CASE WHEN has_admin THEN 'user'::public.app_role ELSE 'admin'::public.app_role END)
  ON CONFLICT (user_id, role) DO NOTHING;
  IF NOT has_admin THEN
    UPDATE public.profiles SET group_id = (SELECT id FROM public.groups WHERE name = 'Administradores' LIMIT 1)
    WHERE id = NEW.id AND group_id IS NULL;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER profiles_assign_role AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.assign_default_role();

CREATE POLICY "roles admin write" ON public.user_roles FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
GRANT INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;

REVOKE EXECUTE ON FUNCTION public.assign_default_role() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.can_manage_form(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.user_group(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_permission(uuid, public.app_permission) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM anon;
