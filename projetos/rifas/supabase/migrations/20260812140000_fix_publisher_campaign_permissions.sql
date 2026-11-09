-- =============================================================================
-- Fix: PUBLISHER (Criador) consegue criar campanhas
-- =============================================================================

-- 1) RLS: permitir que qualquer usuário autenticado LEIA role_permissions.
--    A matriz de permissões é lida no cliente para renderizar a interface
--    (PermissionGuard, Can, matriz de permissões), então as concessões feitas
--    na UI de administração precisam ser visíveis para todas as roles.
--    A gestão (INSERT/UPDATE/DELETE) continua restrita a GLOBAL_ADMIN.
DROP POLICY IF EXISTS "Everyone can read role permissions" ON public.role_permissions;
CREATE POLICY "Everyone can read role permissions" ON public.role_permissions
  FOR SELECT TO authenticated USING (true);

-- 2) Padrão para PUBLISHER (Criador de campanhas): poder criar e publicar.
--    Idempotente — garante o default mesmo em instalações onde o seed
--    de 20260812120000 já foi executado (que não incluía esses itens).
INSERT INTO public.role_permissions (role_id, permission)
SELECT r.id, p.perm
FROM public.roles r
CROSS JOIN LATERAL UNNEST(ARRAY['campaigns.manage', 'campaigns.publish']) AS p(perm)
WHERE r.code = 'PUBLISHER'
ON CONFLICT (role_id, permission) DO NOTHING;
