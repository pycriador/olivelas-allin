-- =============================================================================
-- IAM: role_permissions table (editavel via admin) + seed defaults
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.role_permissions (
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (role_id, permission)
);

GRANT SELECT ON public.role_permissions TO authenticated;
GRANT ALL ON public.role_permissions TO service_role;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage role permissions" ON public.role_permissions;
CREATE POLICY "Admins manage role permissions" ON public.role_permissions
  FOR ALL TO authenticated
  USING (public.is_global_admin())
  WITH CHECK (public.is_global_admin());

-- Seed defaults (apenas se a tabela estiver vazia)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.role_permissions LIMIT 1) THEN
    -- PUBLISHER
    INSERT INTO public.role_permissions (role_id, permission)
    SELECT r.id, p.perm FROM public.roles r
    CROSS JOIN LATERAL UNNEST(ARRAY[
      'dashboard.view','users.view','campaigns.view','files.view',
      'files.upload','files.delete','audit.view','settings.view'
    ]) AS p(perm)
    WHERE r.code = 'PUBLISHER';

    -- ADMIN
    INSERT INTO public.role_permissions (role_id, permission)
    SELECT r.id, p.perm FROM public.roles r
    CROSS JOIN LATERAL UNNEST(ARRAY[
      'dashboard.view','users.view','users.create','users.edit','users.update',
      'users.delete','users.change_role','users.change_status','campaigns.view',
      'campaigns.manage','campaigns.publish','files.view','files.view_all',
      'files.upload','files.delete','audit.view','audit.view_all',
      'settings.view','settings.edit','reports.view'
    ]) AS p(perm)
    WHERE r.code = 'ADMIN';

    -- GLOBAL_ADMIN (todas)
    INSERT INTO public.role_permissions (role_id, permission)
    SELECT r.id, p.perm FROM public.roles r
    CROSS JOIN LATERAL UNNEST(ARRAY[
      'dashboard.view','users.view','users.view_all','users.create','users.edit',
      'users.update','users.delete','users.change_role','users.change_status',
      'campaigns.view','campaigns.manage','campaigns.publish','files.view',
      'files.view_all','files.upload','files.delete','audit.view','audit.view_all',
      'settings.view','settings.edit','reports.view'
    ]) AS p(perm)
    WHERE r.code = 'GLOBAL_ADMIN';
  END IF;
END $$;