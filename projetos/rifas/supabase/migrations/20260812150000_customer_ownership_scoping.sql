-- =============================================================================
-- Clientes escopados por dono (created_by).
--
-- Antes: a leitura de customers usava "dono de campanha com pedido do cliente"
-- (exposição cruzada entre usuários) e os clientes criados pelo fluxo público
-- (checkout online / WhatsApp) eram gravados com created_by = NULL, sumindo do
-- CRM do organizador.
--
-- Agora: cada usuário vê e gerencia apenas os clientes que criou; admins
-- (GLOBAL_ADMIN/ADMIN) veem e gerenciam todos.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Backfill: clientes órfãos (created_by IS NULL) passam a ser do dono da
--    campanha do pedido mais recente deles. Ex.: cliente comprou na campanha A
--    (dona = willian) -> willian passa a ser o dono do cliente.
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
-- 2. RLS em public.customers
-- -----------------------------------------------------------------------------
-- SELECT: admin vê todos; usuário vê apenas os próprios.
DROP POLICY IF EXISTS "Admins read customers" ON public.customers;
CREATE POLICY "Admins read customers" ON public.customers
  FOR SELECT TO authenticated USING (public.is_admin_user());

DROP POLICY IF EXISTS "Owners read customers" ON public.customers;
DROP POLICY IF EXISTS "Owners read own customers" ON public.customers;
CREATE POLICY "Owners read own customers" ON public.customers
  FOR SELECT TO authenticated USING (created_by = auth.uid());

-- INSERT: todo usuário logado cria cliente como seu (criado via app sempre
-- envia created_by = auth.uid()); criação "órfã" via cliente é bloqueada.
DROP POLICY IF EXISTS "Admins insert customers" ON public.customers;
CREATE POLICY "Owners insert own customers" ON public.customers
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());

-- UPDATE: admin pode editar qualquer um; usuário edita só os seus.
DROP POLICY IF EXISTS "Admins update customers" ON public.customers;
CREATE POLICY "Admins update customers" ON public.customers
  FOR UPDATE TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "Owners update own customers" ON public.customers;
CREATE POLICY "Owners update own customers" ON public.customers
  FOR UPDATE TO authenticated USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());

-- DELETE: admin pode excluir qualquer um; usuário exclui só os seus.
DROP POLICY IF EXISTS "Admins delete customers" ON public.customers;
CREATE POLICY "Admins delete customers" ON public.customers
  FOR DELETE TO authenticated USING (public.is_admin_user());

DROP POLICY IF EXISTS "Owners delete own customers" ON public.customers;
CREATE POLICY "Owners delete own customers" ON public.customers
  FOR DELETE TO authenticated USING (created_by = auth.uid());

-- -----------------------------------------------------------------------------
-- 3. Clientes criados no fluxo público pertencem ao dono da campanha
--    (antes ficavam com created_by = NULL e não apareciam no CRM do organizador).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_whatsapp_order(
  p_campaign_id UUID,
  p_token UUID,
  p_reserved_by UUID,
  p_customer_name TEXT,
  p_customer_phone TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  campaign_row public.campaigns%ROWTYPE;
  order_row public.orders%ROWTYPE;
  customer_row public.customers%ROWTYPE;
  numbers BIGINT[];
  total_value NUMERIC(12, 2);
  count_conflicts INTEGER;
  total_count INTEGER;
BEGIN
  SELECT * INTO campaign_row
  FROM public.campaigns
  WHERE id = p_campaign_id AND deleted_at IS NULL;
  IF campaign_row.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'CAMPAIGN_NOT_FOUND');
  END IF;

  IF campaign_row.visibility <> 'PUBLIC' OR campaign_row.status <> 'ACTIVE' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'CAMPAIGN_NOT_ACTIVE');
  END IF;

  IF p_token IS NULL OR p_reserved_by IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'INVALID_RESERVATION');
  END IF;

  -- Só converte números da reserva do próprio dispositivo, ainda válida.
  SELECT array_agg(n.number ORDER BY n.number) INTO numbers
  FROM public.campaign_numbers n
  WHERE n.campaign_id = p_campaign_id
    AND n.reservation_token = p_token
    AND n.reserved_by = p_reserved_by
    AND n.status = 'RESERVED'
    AND n.purchase_id IS NULL
    AND (n.reserved_until IS NULL OR n.reserved_until > now());
  IF numbers IS NULL OR array_length(numbers, 1) IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'RESERVATION_NOT_FOUND');
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('rafflehub_orders'), hashtext(p_campaign_id::text));
  total_count := array_length(numbers, 1);

  -- Revalida sob lock: nenhum número pode ter sido vinculado a outro pedido.
  SELECT count(*) INTO count_conflicts
  FROM public.campaign_numbers n
  WHERE n.campaign_id = p_campaign_id AND n.number = ANY(numbers) AND n.purchase_id IS NOT NULL;
  IF count_conflicts > 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'CONFLICT');
  END IF;

  INSERT INTO public.customers (full_name, phone, created_by)
  VALUES (
    COALESCE(NULLIF(trim(p_customer_name), ''), 'Participante'),
    COALESCE(p_customer_phone, ''),
    campaign_row.created_by
  )
  RETURNING * INTO customer_row;

  total_value := total_count * campaign_row.price_per_number;

  INSERT INTO public.orders (
    campaign_id, customer_id, source, status, subtotal, discount, total, notes, created_by
  )
  VALUES (
    p_campaign_id, customer_row.id, 'WHATSAPP'::public.order_source, 'WAITING_CONTACT'::public.order_status,
    total_value, 0, total_value, 'Pedido via WhatsApp — aguardando contato do organizador.', NULL
  )
  RETURNING * INTO order_row;

  INSERT INTO public.order_items (order_id, campaign_id, number, unit_price, status)
  SELECT order_row.id, p_campaign_id, x.n, campaign_row.price_per_number,
         'RESERVED'::public.campaign_number_status
  FROM unnest(numbers) AS x(n);

  UPDATE public.campaign_numbers n
  SET purchase_id = order_row.id, reserved_until = NULL
  WHERE n.campaign_id = p_campaign_id
    AND n.reservation_token = p_token
    AND n.reserved_by = p_reserved_by;

  PERFORM public.log_order_audit('ORDER_CREATED', order_row.id, p_campaign_id, NULL,
    jsonb_build_object('source', 'WHATSAPP', 'numbers', numbers, 'count', total_count,
      'total', total_value, 'customer_id', customer_row.id));

  RETURN jsonb_build_object(
    'ok', true, 'order_id', order_row.id, 'status', order_row.status,
    'numbers', numbers, 'count', total_count, 'total', total_value
  );
END; $$;

CREATE OR REPLACE FUNCTION public.create_checkout_order(
  p_campaign_id UUID,
  p_token UUID,
  p_reserved_by UUID,
  p_customer_name TEXT,
  p_customer_phone TEXT,
  p_customer_email TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  campaign_row public.campaigns%ROWTYPE;
  order_row public.orders%ROWTYPE;
  customer_row public.customers%ROWTYPE;
  numbers BIGINT[];
  total_value NUMERIC(12,2);
  total_count INTEGER;
  count_conflicts INTEGER;
  reserved_until_ts TIMESTAMPTZ;
BEGIN
  SELECT * INTO campaign_row FROM public.campaigns
  WHERE id = p_campaign_id AND deleted_at IS NULL;
  IF campaign_row.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'CAMPAIGN_NOT_FOUND');
  END IF;
  IF campaign_row.visibility <> 'PUBLIC' OR campaign_row.status <> 'ACTIVE' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'CAMPAIGN_NOT_ACTIVE');
  END IF;
  IF campaign_row.purchase_mode <> 'AUTOMATIC' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'CHECKOUT_DISABLED');
  END IF;
  IF p_token IS NULL OR p_reserved_by IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'INVALID_RESERVATION');
  END IF;

  SELECT array_agg(n.number ORDER BY n.number) INTO numbers
  FROM public.campaign_numbers n
  WHERE n.campaign_id = p_campaign_id
    AND n.reservation_token = p_token
    AND n.reserved_by = p_reserved_by
    AND n.status = 'RESERVED'
    AND n.purchase_id IS NULL
    AND (n.reserved_until IS NULL OR n.reserved_until > now());
  IF numbers IS NULL OR array_length(numbers, 1) IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'RESERVATION_NOT_FOUND');
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('rafflehub_orders'), hashtext(p_campaign_id::text));
  total_count := array_length(numbers, 1);

  SELECT count(*) INTO count_conflicts
  FROM public.campaign_numbers n
  WHERE n.campaign_id = p_campaign_id AND n.number = ANY(numbers) AND n.purchase_id IS NOT NULL;
  IF count_conflicts > 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'CONFLICT');
  END IF;

  INSERT INTO public.customers (full_name, phone, email, created_by)
  VALUES (
    COALESCE(NULLIF(trim(p_customer_name), ''), 'Participante'),
    COALESCE(p_customer_phone, ''),
    NULLIF(trim(COALESCE(p_customer_email, '')), ''),
    campaign_row.created_by
  )
  RETURNING * INTO customer_row;

  -- Preço SEMPRE recalculado no banco a partir da campanha.
  total_value := total_count * campaign_row.price_per_number;
  reserved_until_ts := now() + make_interval(mins => campaign_row.reservation_timeout_minutes);

  INSERT INTO public.orders (
    campaign_id, customer_id, reservation_token, source, status,
    payment_method, subtotal, discount, total, notes, created_by
  ) VALUES (
    p_campaign_id, customer_row.id, p_token, 'ONLINE'::public.order_source,
    'WAITING_PAYMENT'::public.order_status, 'PIX'::public.payment_method,
    total_value, 0, total_value, 'Pedido online — aguardando pagamento.', NULL
  )
  RETURNING * INTO order_row;

  INSERT INTO public.order_items (order_id, campaign_id, number, unit_price, status)
  SELECT order_row.id, p_campaign_id, x.n, campaign_row.price_per_number,
         'PENDING_PAYMENT'::public.campaign_number_status
  FROM unnest(numbers) AS x(n);

  UPDATE public.campaign_numbers n
  SET purchase_id = order_row.id,
      status = 'PENDING_PAYMENT'::public.campaign_number_status,
      reserved_until = reserved_until_ts
  WHERE n.campaign_id = p_campaign_id
    AND n.reservation_token = p_token
    AND n.reserved_by = p_reserved_by;

  PERFORM public.log_order_audit('ORDER_CREATED', order_row.id, p_campaign_id, NULL,
    jsonb_build_object('source', 'ONLINE', 'numbers', numbers, 'count', total_count,
      'total', total_value, 'customer_id', customer_row.id));

  RETURN jsonb_build_object(
    'ok', true, 'order_id', order_row.id, 'status', order_row.status,
    'numbers', numbers, 'count', total_count, 'total', total_value,
    'reserved_until', reserved_until_ts, 'customer_id', customer_row.id
  );
END; $$;

-- Apenas o service_role executa o checkout online (fluxo backend/público).
REVOKE ALL ON FUNCTION public.create_checkout_order(uuid, uuid, uuid, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_checkout_order(uuid, uuid, uuid, text, text, text) TO service_role;
