-- =============================================================================
-- Permissoes de Pagamento / Gateways de Pagamento.
--
-- Catalogo (por gateway, conforme cadastrado pelo Global Admin):
--   payments.view                         -> ler a area de pagamentos (ledger geral)
--   payments.manage                      -> acoes batch (conciliar abertos, expirar)
--   payments.gateways.<gateway>.view     -> ver config/pagamentos do gateway
--   payments.gateways.<gateway>.manage   -> editar credenciais/testar/conciliar/retry
--
-- Defaults: GLOBAL_ADMIN e ADMIN recebem todas; PUBLISHER nao recebe nenhuma
-- (a area fica restrita ao /admin). O Global Admin pode revogar por role na
-- tela de Roles & Permissoes.
-- =============================================================================

DO $$
DECLARE
  admin_role_id UUID;
  ga_role_id UUID;
  payment_perms TEXT[] := ARRAY[
    'payments.view',
    'payments.manage',
    'payments.gateways.infinitypay.view',
    'payments.gateways.infinitypay.manage',
    'payments.gateways.mercado_pago.view',
    'payments.gateways.mercado_pago.manage',
    'payments.gateways.pagbank.view',
    'payments.gateways.pagbank.manage'
  ];
BEGIN
  SELECT id INTO admin_role_id FROM public.roles WHERE code = 'ADMIN' LIMIT 1;
  SELECT id INTO ga_role_id FROM public.roles WHERE code = 'GLOBAL_ADMIN' LIMIT 1;

  IF admin_role_id IS NOT NULL THEN
    INSERT INTO public.role_permissions (role_id, permission)
    SELECT admin_role_id, p FROM unnest(payment_perms) AS p
    ON CONFLICT (role_id, permission) DO NOTHING;
  END IF;

  IF ga_role_id IS NOT NULL THEN
    INSERT INTO public.role_permissions (role_id, permission)
    SELECT ga_role_id, p FROM unnest(payment_perms) AS p
    ON CONFLICT (role_id, permission) DO NOTHING;
  END IF;
END $$;
