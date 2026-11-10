
-- Restrict profile reads
DROP POLICY IF EXISTS profiles_select_auth ON public.profiles;

CREATE POLICY profiles_select_own
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY profiles_select_admin
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Remove ability for users to write audit log entries from the client
DROP POLICY IF EXISTS audit_insert_auth ON public.audit_log;
