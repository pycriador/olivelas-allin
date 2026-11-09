-- =============================================================================
-- HARD FIX: isolamento TOTAL de clientes por dono (created_by).
--
-- Problema: usuários ainda enxergam clientes uns dos outros. Causas raiz:
--   1. is_admin_user() tinha fallback para o legado user_roles (has_role):
--      qualquer usuário com GLOBAL_ADMIN "sobrando" em user_roles era tratado
--      como admin e a policy "Admins read customers" expunha TODOS os clientes.
--   2. Se a migration 20260812150000 não foi aplicada no banco, a policy antiga
--      "Owners read customers" (dono de campanha com pedido do cliente) ainda
--      compartilhava clientes entre donos de campanhas diferentes.
--   3. Clientes órfãos (created_by NULL) sem dono definido.
--
-- Script idempotente. Resolve as três frentes:
--   A) Backfill de created_by em clientes órfãos.
--   B) is_admin_user() e is_global_admin() passam a ler SOMENTE o modelo novo
--      (profiles.role_id -> roles.code), sem fallback legado.
--   C) Policies de customers re-criadas de forma estrita (admin ou created_by).
--   D) Limpeza de GLOBAL_ADMIN obsoleto em user_roles.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- A. Backfill: clientes órfãos (created_by IS NULL) passam a ser do dono da
--    campanha do pedido mais recente deles. Idempotente.
-- -----------------------------------------------------------------------------
WITH latest_owner AS (
  SELECT DISTINCT ON (o.customer_id) o.customer_id AS cid, c.created_by AS owner_id
  FROM public.orders o
  JOIN public.campaigns c ON c.id = o.campaign_id
  WHERE o.customer_id IS NOT NULL AND c.created_by IS NOT NULL
  ORDER BY o.customer_id, o.created_at DESC
)
UPDATE public.customers cu
SET created_by = latest_owner.owner_id
FROM latest_owner
WHERE cu.id = latest_owner.cid
  AND cu.created_by IS NULL;

-- -----------------------------------------------------------------------------
-- B. Helpers de papel SEM fallback legado (user_roles). O modelo novo
--    (profiles.role_id -> roles.code) é a única fonte de verdade. A trigger
--    handle_new_user e a migration IAM mantêm user_roles como compat
--    somente-leitura, então o fallback só servia para vazar acesso.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(public.get_user_role_code(auth.uid()), '') IN ('GLOBAL_ADMIN', 'ADMIN');
$$;

CREATE OR REPLACE FUNCTION public.is_global_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_user_role_code(auth.uid()) = 'GLOBAL_ADMIN';
$$;

REVOKE ALL ON FUNCTION public.is_admin_user() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.is_global_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_global_admin() TO authenticated, service_role;

-- -----------------------------------------------------------------------------
-- C. Policies de customers: admin vê tudo; usuário vê/gerencia só o que criou.
--    Re-criadas de forma idempotente (drop de TODOS os nomes já usados).
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins read customers" ON public.customers;
DROP POLICY IF EXISTS "Owners read customers" ON public.customers;
DROP POLICY IF EXISTS "Owners read own customers" ON public.customers;
DROP POLICY IF EXISTS "Admins insert customers" ON public.customers;
DROP POLICY IF EXISTS "Owners insert own customers" ON public.customers;
DROP POLICY IF EXISTS "Admins update customers" ON public.customers;
DROP POLICY IF EXISTS "Owners update own customers" ON public.customers;
DROP POLICY IF EXISTS "Admins delete customers" ON public.customers;
DROP POLICY IF EXISTS "Owners delete own customers" ON public.customers;

CREATE POLICY "Admins read customers" ON public.customers
  FOR SELECT TO authenticated USING (public.is_admin_user());

CREATE POLICY "Owners read own customers" ON public.customers
  FOR SELECT TO authenticated USING (created_by = auth.uid());

CREATE POLICY "Owners insert own customers" ON public.customers
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());

CREATE POLICY "Admins update customers" ON public.customers
  FOR UPDATE TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

CREATE POLICY "Owners update own customers" ON public.customers
  FOR UPDATE TO authenticated USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());

CREATE POLICY "Admins delete customers" ON public.customers
  FOR DELETE TO authenticated USING (public.is_admin_user());

CREATE POLICY "Owners delete own customers" ON public.customers
  FOR DELETE TO authenticated USING (created_by = auth.uid());

-- -----------------------------------------------------------------------------
-- D. Limpeza: remove GLOBAL_ADMIN obsoleto em user_roles quando o perfil do
--    usuário indica outro papel (evita que o legado vaze acesso via qualquer
--    policy que ainda use is_global_admin/has_role).
-- -----------------------------------------------------------------------------
DELETE FROM public.user_roles ur
USING public.profiles p
JOIN public.roles r ON r.id = p.role_id
WHERE ur.user_id = p.id
  AND ur.role = 'GLOBAL_ADMIN'::public.app_role
  AND r.code <> 'GLOBAL_ADMIN';
