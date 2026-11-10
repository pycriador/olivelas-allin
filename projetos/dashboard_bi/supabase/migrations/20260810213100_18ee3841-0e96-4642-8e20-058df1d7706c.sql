-- 1) Scope reference-table reads to users who belong to an organization
DROP POLICY IF EXISTS role_permissions_read ON public.role_permissions;
CREATE POLICY role_permissions_read ON public.role_permissions
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.organization_members om WHERE om.user_id = auth.uid()));

DROP POLICY IF EXISTS permissions_catalog_read ON public.permissions_catalog;
CREATE POLICY permissions_catalog_read ON public.permissions_catalog
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.organization_members om WHERE om.user_id = auth.uid()));

-- 2) saved_queries update: prevent owner/org reassignment
DROP POLICY IF EXISTS saved_queries_update ON public.saved_queries;
CREATE POLICY saved_queries_update ON public.saved_queries
  FOR UPDATE TO authenticated
  USING (
    public.is_org_member(auth.uid(), organization_id)
    AND (owner_id = auth.uid() OR public.has_role(auth.uid(), organization_id, 'administrator'::app_role))
  )
  WITH CHECK (
    public.is_org_member(auth.uid(), organization_id)
    AND (owner_id = auth.uid() OR public.has_role(auth.uid(), organization_id, 'administrator'::app_role))
  );

-- 3) catalog_tags: explicit per-command write scoping
DROP POLICY IF EXISTS ctag_write ON public.catalog_tags;
CREATE POLICY ctag_insert ON public.catalog_tags
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_org_member(auth.uid(), organization_id)
    AND (public.can_manage_datasources(auth.uid(), organization_id)
         OR public.has_permission(auth.uid(), organization_id, 'catalog.curate'))
  );
CREATE POLICY ctag_update ON public.catalog_tags
  FOR UPDATE TO authenticated
  USING (
    public.is_org_member(auth.uid(), organization_id)
    AND (public.can_manage_datasources(auth.uid(), organization_id)
         OR public.has_permission(auth.uid(), organization_id, 'catalog.curate'))
  )
  WITH CHECK (
    public.is_org_member(auth.uid(), organization_id)
    AND (public.can_manage_datasources(auth.uid(), organization_id)
         OR public.has_permission(auth.uid(), organization_id, 'catalog.curate'))
  );
CREATE POLICY ctag_delete ON public.catalog_tags
  FOR DELETE TO authenticated
  USING (
    public.is_org_member(auth.uid(), organization_id)
    AND (public.can_manage_datasources(auth.uid(), organization_id)
         OR public.has_permission(auth.uid(), organization_id, 'catalog.curate'))
  );

-- 4) Revoke API-callable EXECUTE on the SECURITY DEFINER helper the app never calls
REVOKE EXECUTE ON FUNCTION public.current_org_id() FROM anon, authenticated, PUBLIC;