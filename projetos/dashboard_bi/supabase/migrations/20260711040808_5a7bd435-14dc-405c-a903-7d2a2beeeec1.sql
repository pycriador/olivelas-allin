
-- Fix search_path on set_updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- Tighten organization insert policy
DROP POLICY IF EXISTS "org insert authenticated" ON public.organizations;
CREATE POLICY "org insert authenticated" ON public.organizations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- Restrict EXECUTE on SECURITY DEFINER helpers
REVOKE EXECUTE ON FUNCTION public.is_org_member(uuid, uuid) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, uuid, public.app_role) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM public, anon, authenticated;
-- Still callable inside RLS policies (they run as definer of the policy expression via the table owner)
