-- =============================================================================
-- Novo tipo de pagamento: ADVANCED_FEE (taxa do plano Avancado).
--
-- 1. Adiciona 'ADVANCED_FEE' ao enum payment_gateway (em transacao propria,
--    antes de qualquer uso da view/ledger).
-- 2. Permissoes especificas do gateway (view/manage) para GLOBAL_ADMIN e ADMIN.
-- =============================================================================

ALTER TYPE public.payment_gateway ADD VALUE IF NOT EXISTS 'ADVANCED_FEE';

DO $$
DECLARE
  target_role_id UUID;
  advanced_fee_perms TEXT[] := ARRAY[
    'payments.gateways.advanced_fee.view',
    'payments.gateways.advanced_fee.manage'
  ];
BEGIN
  SELECT id INTO target_role_id FROM public.roles WHERE code = 'GLOBAL_ADMIN' LIMIT 1;
  IF target_role_id IS NOT NULL THEN
    INSERT INTO public.role_permissions (role_id, permission)
    SELECT target_role_id, p FROM unnest(advanced_fee_perms) AS p
    ON CONFLICT (role_id, permission) DO NOTHING;
  END IF;

  SELECT id INTO target_role_id FROM public.roles WHERE code = 'ADMIN' LIMIT 1;
  IF target_role_id IS NOT NULL THEN
    INSERT INTO public.role_permissions (role_id, permission)
    SELECT target_role_id, p FROM unnest(advanced_fee_perms) AS p
    ON CONFLICT (role_id, permission) DO NOTHING;
  END IF;
END $$;
