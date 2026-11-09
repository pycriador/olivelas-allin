-- =============================================================================
-- Permissoes de visualizacao: Clientes, Pedidos e Notificacoes.
--
-- Catalogo:
--   customers.view        -> ver a pagina de Clientes (CRM)
--   orders.view           -> ver a pagina de Pedidos
--   notifications.view    -> ver a central de Notificacoes (admin)
--
-- Defaults: GLOBAL_ADMIN e ADMIN recebem todas; PUBLISHER recebe customers e
-- orders (gerencia seus proprios clientes/pedidos). O Global Admin pode
-- ajustar por role na tela de Roles & Permissoes.
-- =============================================================================
DO $$
DECLARE
  v_role_id UUID;

  all_perms TEXT[] := ARRAY[
    'customers.view',
    'orders.view',
    'notifications.view'
  ];

  publisher_perms TEXT[] := ARRAY[
    'customers.view',
    'orders.view'
  ];

BEGIN
  -- GLOBAL_ADMIN
  SELECT r.id
    INTO v_role_id
  FROM public.roles AS r
  WHERE r.code = 'GLOBAL_ADMIN'
  LIMIT 1;

  IF v_role_id IS NOT NULL THEN
    INSERT INTO public.role_permissions (role_id, permission)
    SELECT v_role_id, p
    FROM unnest(all_perms) AS p
    ON CONFLICT (role_id, permission) DO NOTHING;
  END IF;


  -- ADMIN
  SELECT r.id
    INTO v_role_id
  FROM public.roles AS r
  WHERE r.code = 'ADMIN'
  LIMIT 1;

  IF v_role_id IS NOT NULL THEN
    INSERT INTO public.role_permissions (role_id, permission)
    SELECT v_role_id, p
    FROM unnest(all_perms) AS p
    ON CONFLICT (role_id, permission) DO NOTHING;
  END IF;


  -- PUBLISHER
  SELECT r.id
    INTO v_role_id
  FROM public.roles AS r
  WHERE r.code = 'PUBLISHER'
  LIMIT 1;

  IF v_role_id IS NOT NULL THEN
    INSERT INTO public.role_permissions (role_id, permission)
    SELECT v_role_id, p
    FROM unnest(publisher_perms) AS p
    ON CONFLICT (role_id, permission) DO NOTHING;
  END IF;

END $$;