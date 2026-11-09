-- 1. ACL
DROP POLICY IF EXISTS "approved members full access" ON public.acl;
CREATE POLICY "acl read own or admin" ON public.acl FOR SELECT TO authenticated
  USING (user_id = (auth.uid())::text OR public.is_global_admin());
CREATE POLICY "acl admin write" ON public.acl FOR ALL TO authenticated
  USING (public.is_global_admin()) WITH CHECK (public.is_global_admin());

-- 2. app_settings
DROP POLICY IF EXISTS "approved members full access" ON public.app_settings;
CREATE POLICY "app_settings read approved" ON public.app_settings FOR SELECT TO authenticated
  USING (public.is_approved());
CREATE POLICY "app_settings admin write" ON public.app_settings FOR ALL TO authenticated
  USING (public.is_global_admin()) WITH CHECK (public.is_global_admin());

-- 3. audit_logs
DROP POLICY IF EXISTS "approved members full access" ON public.audit_logs;
CREATE POLICY "audit_logs read approved" ON public.audit_logs FOR SELECT TO authenticated
  USING (public.is_approved());
CREATE POLICY "audit_logs insert approved" ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (public.is_approved());
CREATE POLICY "audit_logs admin update" ON public.audit_logs FOR UPDATE TO authenticated
  USING (public.is_global_admin()) WITH CHECK (public.is_global_admin());
CREATE POLICY "audit_logs admin delete" ON public.audit_logs FOR DELETE TO authenticated
  USING (public.is_global_admin());

-- 4. profiles self insert cannot escalate
DROP POLICY IF EXISTS "profiles self insert" ON public.profiles;
CREATE POLICY "profiles self insert" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (
    id = (auth.uid())::text
    AND status = 'pending'
    AND role_id = 'role-viewer'
    AND group_ids = '{}'::text[]
  );

-- 5. storage update/delete require active profile
DROP POLICY IF EXISTS "assets_update" ON storage.objects;
DROP POLICY IF EXISTS "assets_delete" ON storage.objects;
CREATE POLICY "assets_update" ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'project-assets' AND owner = auth.uid()
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (auth.uid())::text AND p.status = 'active')
  )
  WITH CHECK (
    bucket_id = 'project-assets' AND owner = auth.uid()
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (auth.uid())::text AND p.status = 'active')
  );
CREATE POLICY "assets_delete" ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'project-assets' AND owner = auth.uid()
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (auth.uid())::text AND p.status = 'active')
  );

-- 6. SECURITY DEFINER function execute grants
REVOKE ALL ON FUNCTION public.profiles_guard() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_app_role(text, text) FROM PUBLIC, anon, authenticated;
