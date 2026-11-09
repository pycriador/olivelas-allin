
-- Helper: is user an admin of a specific company?
CREATE OR REPLACE FUNCTION public.is_company_admin(_user_id uuid, _company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_global_admin(_user_id)
      OR EXISTS (
        SELECT 1 FROM public.user_companies uc
        WHERE uc.user_id = _user_id
          AND uc.company_id = _company_id
          AND uc.role IN ('admin', 'global_admin')
      )
$$;

-- companies: fix tautology in update policy
DROP POLICY IF EXISTS "companies admin update" ON public.companies;
CREATE POLICY "companies admin update" ON public.companies
FOR UPDATE TO authenticated
USING (public.is_company_admin(auth.uid(), id))
WITH CHECK (public.is_company_admin(auth.uid(), id));

-- company_email_domains: fix tautology
DROP POLICY IF EXISTS "company_email_domains admin write" ON public.company_email_domains;
CREATE POLICY "company_email_domains admin write" ON public.company_email_domains
FOR ALL TO authenticated
USING (public.is_company_admin(auth.uid(), company_id))
WITH CHECK (public.is_company_admin(auth.uid(), company_id));

-- user_companies: fix tautologies
DROP POLICY IF EXISTS "user_companies admin write" ON public.user_companies;
CREATE POLICY "user_companies admin write" ON public.user_companies
FOR ALL TO authenticated
USING (public.is_company_admin(auth.uid(), company_id))
WITH CHECK (public.is_company_admin(auth.uid(), company_id));

DROP POLICY IF EXISTS "user_companies self read" ON public.user_companies;
CREATE POLICY "user_companies self read" ON public.user_companies
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_company_admin(auth.uid(), company_id));

-- Fix mutable search_path
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- Internal-only functions must not be callable from the API
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.on_email_confirmed() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.link_user_by_verified_domain(uuid, text) FROM PUBLIC, anon, authenticated;

-- RLS helper functions: only signed-in users need them
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_global_admin(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_company_access(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_company_admin(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_global_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_company_access(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_company_admin(uuid, uuid) TO authenticated;
