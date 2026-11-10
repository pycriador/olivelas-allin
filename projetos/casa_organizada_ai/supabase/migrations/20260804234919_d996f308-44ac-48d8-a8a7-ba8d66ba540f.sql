-- 1) Restrict download activity to the downloading user (or admins)
DROP POLICY IF EXISTS template_downloads_read ON public.template_downloads;
CREATE POLICY template_downloads_read ON public.template_downloads
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'global_admin'::app_role));

REVOKE ALL ON public.template_downloads FROM anon;
REVOKE ALL ON public.template_downloads FROM authenticated;
GRANT SELECT, INSERT ON public.template_downloads TO authenticated;
GRANT ALL ON public.template_downloads TO service_role;

-- 2) Ratings: no anonymous access; readable by signed-in users only
DROP POLICY IF EXISTS template_ratings_read ON public.template_ratings;
CREATE POLICY template_ratings_read ON public.template_ratings
  FOR SELECT TO authenticated
  USING (true);

REVOKE ALL ON public.template_ratings FROM anon;
REVOKE ALL ON public.template_ratings FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.template_ratings TO authenticated;
GRANT ALL ON public.template_ratings TO service_role;

DROP POLICY IF EXISTS theme_ratings_read ON public.theme_ratings;
CREATE POLICY theme_ratings_read ON public.theme_ratings
  FOR SELECT TO authenticated
  USING (true);

REVOKE ALL ON public.theme_ratings FROM anon;
REVOKE ALL ON public.theme_ratings FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.theme_ratings TO authenticated;
GRANT ALL ON public.theme_ratings TO service_role;

-- 3) SECURITY DEFINER hardening: has_role can only be used to check the caller's own roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT CASE
    WHEN auth.uid() IS NULL OR _user_id IS DISTINCT FROM auth.uid() THEN false
    ELSE EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id AND role = _role
    )
  END
$$;

REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;