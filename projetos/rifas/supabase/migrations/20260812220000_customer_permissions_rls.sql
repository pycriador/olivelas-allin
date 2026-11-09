-- =============================================================================
-- Permissoes granulares de Clientes + Relatorios.
--
-- Catalogo novo:
--   customers.all         -> ver TODOS os clientes (nao so os proprios)
--   customers.edit        -> editar qualquer cliente
--   customers.delete      -> excluir qualquer cliente
--   reports.customer.view -> baixar relatorio de clientes
--   reports.payment.view  -> baixar relatorio de pagamentos
--   reports.campaign.view -> baixar relatorio de rifas/campanhas
--   reports.finance.view  -> baixar relatorio financeiro (valores)
--   reports.orders.view   -> baixar relatorio de pedidos
--
-- 1. has_permission(perm): verifica role_permissions pelo perfil atual
--    (modelo novo profiles.role_id -> roles -> role_permissions).
-- 2. Policies de customers: admins OU detentores da permissao tem acesso
--    ampliado; o dono (created_by) mantem acesso ao proprio cadastro.
-- 3. Seed das novas permissoes por role.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Helper has_permission(perm)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.has_permission(p_permission text)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles pr
    JOIN public.role_permissions rp ON rp.role_id = pr.role_id
    WHERE pr.id = auth.uid()
      AND rp.permission = p_permission
  );
$$;

REVOKE ALL ON FUNCTION public.has_permission(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_permission(text) TO authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 2. Policies de customers: admin/permissao ampliada OU dono.
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins read customers" ON public.customers;
DROP POLICY IF EXISTS "Admins update customers" ON public.customers;
DROP POLICY IF EXISTS "Admins delete customers" ON public.customers;

CREATE POLICY "Admins read customers" ON public.customers
  FOR SELECT TO authenticated
  USING (public.is_admin_user() OR public.has_permission('customers.all'));

CREATE POLICY "Admins update customers" ON public.customers
  FOR UPDATE TO authenticated
  USING (public.is_admin_user() OR public.has_permission('customers.edit'))
  WITH CHECK (public.is_admin_user() OR public.has_permission('customers.edit'));

CREATE POLICY "Admins delete customers" ON public.customers
  FOR DELETE TO authenticated
  USING (public.is_admin_user() OR public.has_permission('customers.delete'));

-- -----------------------------------------------------------------------------
-- 3. Seed das novas permissoes por role.
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  role_id UUID;
  customer_perms TEXT[] := ARRAY['customers.all', 'customers.edit', 'customers.delete'];
  report_perms TEXT[] := ARRAY[
    'reports.customer.view',
    'reports.payment.view',
    'reports.campaign.view',
    'reports.finance.view',
    'reports.orders.view'
  ];
BEGIN
  SELECT id INTO role_id FROM public.roles WHERE code = 'GLOBAL_ADMIN' LIMIT 1;
  IF role_id IS NOT NULL THEN
    INSERT INTO public.role_permissions (role_id, permission)
    SELECT role_id, p FROM unnest(customer_perms || report_perms) AS p
    ON CONFLICT (role_id, permission) DO NOTHING;
  END IF;

  SELECT id INTO role_id FROM public.roles WHERE code = 'ADMIN' LIMIT 1;
  IF role_id IS NOT NULL THEN
    INSERT INTO public.role_permissions (role_id, permission)
    SELECT role_id, p FROM unnest(customer_perms || report_perms) AS p
    ON CONFLICT (role_id, permission) DO NOTHING;
  END IF;

  SELECT id INTO role_id FROM public.roles WHERE code = 'PUBLISHER' LIMIT 1;
  IF role_id IS NOT NULL THEN
    INSERT INTO public.role_permissions (role_id, permission)
    SELECT role_id, p FROM unnest(customer_perms) AS p
    ON CONFLICT (role_id, permission) DO NOTHING;
  END IF;
END $$;
