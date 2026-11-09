-- =============================================================================
-- Hotfix: Corrige verificacao de conflito nas RPCs de reserva/pedido
--
-- Problema: numeros com reserva expirada (reserved_until <= now) ainda eram
-- tratados como conflito, criando uma janela de ate 59s entre a expiracao
-- do cliente e a limpeza do pg_cron.
-- =============================================================================

-- 1. reserve_campaign_numbers — conflito so com reservas ativas + fixos
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.reserve_campaign_numbers(
  p_campaign_id UUID,
  p_numbers BIGINT[],
  p_reserved_by UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  campaign_row public.campaigns%ROWTYPE;
  token UUID := gen_random_uuid();
  reserved_until_ts TIMESTAMPTZ;
  conflicts BIGINT[];
  out_of_range BIGINT[];
  duplicate_count INTEGER;
  recent_count INTEGER;
  total_requested INTEGER;
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

  IF p_numbers IS NULL OR array_length(p_numbers, 1) IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'NO_NUMBERS');
  END IF;

  SELECT count(*) INTO recent_count
  FROM public.campaign_numbers
  WHERE reserved_by = p_reserved_by
    AND created_at > now() - interval '60 seconds';
  IF recent_count >= 10 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'RATE_LIMITED');
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('rafflehub_campaign'), hashtext(p_campaign_id::text));

  SELECT array_agg(DISTINCT x.n ORDER BY x.n) INTO p_numbers
  FROM unnest(p_numbers) AS x(n);

  SELECT count(*) INTO total_requested FROM unnest(p_numbers) AS x(n);

  SELECT array_agg(x.n ORDER BY x.n) INTO out_of_range
  FROM unnest(p_numbers) AS x(n)
  WHERE x.n < campaign_row.number_start OR x.n > campaign_row.number_end;
  IF out_of_range IS NOT NULL AND array_length(out_of_range, 1) > 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'NUMBER_OUT_OF_RANGE', 'numbers', out_of_range);
  END IF;

  IF campaign_row.max_numbers_per_purchase IS NOT NULL
     AND total_requested > campaign_row.max_numbers_per_purchase THEN
    RETURN jsonb_build_object('ok', false, 'error', 'MAX_NUMBERS_EXCEEDED');
  END IF;

  -- FIX: conflito apenas com numeros permanentemente ocupados OU com reserva ativa
  SELECT array_agg(n.number ORDER BY n.number) INTO conflicts
  FROM public.campaign_numbers n
  WHERE n.campaign_id = p_campaign_id AND n.number = ANY(p_numbers)
    AND (
      n.status IN ('PAID', 'BLOCKED', 'WINNER', 'CANCELLED')
      OR (n.status IN ('RESERVED', 'PENDING_PAYMENT') AND n.reserved_until > now())
    );
  IF conflicts IS NOT NULL AND array_length(conflicts, 1) > 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'CONFLICT', 'numbers', conflicts);
  END IF;

  -- Limpa registros expirados ANTES de inserir (evita duplicata)
  DELETE FROM public.campaign_numbers
  WHERE campaign_id = p_campaign_id
    AND number = ANY(p_numbers)
    AND status IN ('RESERVED', 'PENDING_PAYMENT')
    AND (reserved_until IS NULL OR reserved_until <= now());

  reserved_until_ts := now() + make_interval(mins => campaign_row.reservation_timeout_minutes);

  INSERT INTO public.campaign_numbers (campaign_id, number, status, reserved_by, reservation_token, reserved_until)
  SELECT p_campaign_id, x.n, 'RESERVED'::public.campaign_number_status,
         p_reserved_by, token, reserved_until_ts
  FROM unnest(p_numbers) AS x(n);

  RETURN jsonb_build_object(
    'ok', true, 'token', token, 'reserved_until', reserved_until_ts,
    'timeout_minutes', campaign_row.reservation_timeout_minutes,
    'numbers', p_numbers, 'count', total_requested
  );
END; $$;

-- 2. update create_manual_order — same fix for conflict check + p_initial_status
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_manual_order(
  p_campaign_id UUID,
  p_customer_id UUID,
  p_payment_method public.payment_method,
  p_discount NUMERIC,
  p_notes TEXT,
  p_numbers BIGINT[],
  p_initial_status public.order_status DEFAULT 'OPEN'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  campaign_row public.campaigns%ROWTYPE;
  order_row public.orders%ROWTYPE;
  actor_id UUID := auth.uid();
  conflicts BIGINT[];
  out_of_range BIGINT[];
  item_total NUMERIC(12, 2);
  total_count INTEGER;
  number_status public.campaign_number_status;
BEGIN
  IF actor_id IS NULL OR NOT public.is_global_admin() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'FORBIDDEN');
  END IF;

  SELECT * INTO campaign_row
  FROM public.campaigns
  WHERE id = p_campaign_id AND deleted_at IS NULL;
  IF campaign_row.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'CAMPAIGN_NOT_FOUND');
  END IF;

  IF p_numbers IS NULL OR array_length(p_numbers, 1) IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'NO_NUMBERS');
  END IF;

  IF p_customer_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.customers WHERE id = p_customer_id AND deleted_at IS NULL
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'CUSTOMER_NOT_FOUND');
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('rafflehub_orders'), hashtext(p_campaign_id::text));

  SELECT array_agg(DISTINCT x.n ORDER BY x.n) INTO p_numbers FROM unnest(p_numbers) AS x(n);
  SELECT count(*) INTO total_count FROM unnest(p_numbers) AS x(n);

  SELECT array_agg(x.n ORDER BY x.n) INTO out_of_range
  FROM unnest(p_numbers) AS x(n)
  WHERE x.n < campaign_row.number_start OR x.n > campaign_row.number_end;
  IF out_of_range IS NOT NULL AND array_length(out_of_range, 1) > 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'NUMBER_OUT_OF_RANGE', 'numbers', out_of_range);
  END IF;

  -- FIX: conflito apenas com numeros permanentemente ocupados OU com reserva ativa
  SELECT array_agg(n.number ORDER BY n.number) INTO conflicts
  FROM public.campaign_numbers n
  WHERE n.campaign_id = p_campaign_id AND n.number = ANY(p_numbers)
    AND (
      n.status IN ('PAID', 'BLOCKED', 'WINNER', 'CANCELLED')
      OR (n.status IN ('RESERVED', 'PENDING_PAYMENT') AND n.reserved_until > now())
    );
  IF conflicts IS NOT NULL AND array_length(conflicts, 1) > 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'CONFLICT', 'numbers', conflicts);
  END IF;

  -- Limpa reservas expiradas dos numeros escolhidos
  DELETE FROM public.campaign_numbers
  WHERE campaign_id = p_campaign_id
    AND number = ANY(p_numbers)
    AND status IN ('RESERVED', 'PENDING_PAYMENT')
    AND (reserved_until IS NULL OR reserved_until <= now());

  item_total := total_count * campaign_row.price_per_number;
  IF p_discount IS NULL OR p_discount < 0 THEN p_discount := 0; END IF;

  -- Determina status do pedido e dos numeros conforme initial_status
  number_status := CASE p_initial_status
    WHEN 'PAID' THEN 'PAID'::public.campaign_number_status
    WHEN 'WAITING_PAYMENT' THEN 'PENDING_PAYMENT'::public.campaign_number_status
    ELSE 'RESERVED'::public.campaign_number_status
  END;

  INSERT INTO public.orders (
    campaign_id, customer_id, source, status, payment_method, subtotal, discount, total, notes, created_by
  )
  VALUES (
    p_campaign_id, p_customer_id, 'MANUAL'::public.order_source, p_initial_status,
    p_payment_method, item_total, p_discount, GREATEST(0, item_total - p_discount), p_notes, actor_id
  )
  RETURNING * INTO order_row;

  INSERT INTO public.order_items (order_id, campaign_id, number, unit_price, status)
  SELECT order_row.id, p_campaign_id, x.n, campaign_row.price_per_number, number_status
  FROM unnest(p_numbers) AS x(n);

  INSERT INTO public.campaign_numbers (campaign_id, number, status, reserved_by, purchase_id)
  SELECT p_campaign_id, x.n, number_status, actor_id, order_row.id
  FROM unnest(p_numbers) AS x(n);

  PERFORM public.log_order_audit('ORDER_CREATED', order_row.id, p_campaign_id, actor_id,
    jsonb_build_object('source', 'MANUAL', 'numbers', p_numbers, 'count', total_count,
      'subtotal', item_total, 'discount', p_discount, 'total', order_row.total,
      'initial_status', p_initial_status));

  RETURN jsonb_build_object(
    'ok', true, 'order_id', order_row.id, 'status', order_row.status,
    'numbers', p_numbers, 'count', total_count
  );
END; $$;

-- 3. update add_order_numbers — same fix
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.add_order_numbers(
  p_order_id UUID,
  p_numbers BIGINT[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  order_row public.orders%ROWTYPE;
  campaign_row public.campaigns%ROWTYPE;
  actor_id UUID := auth.uid();
  conflicts BIGINT[];
  out_of_range BIGINT[];
  status_for_number public.campaign_number_status;
  item_total NUMERIC(12, 2);
  total_count INTEGER;
BEGIN
  IF actor_id IS NULL OR NOT public.is_global_admin() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'FORBIDDEN');
  END IF;

  SELECT * INTO order_row FROM public.orders WHERE id = p_order_id;
  IF order_row.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'ORDER_NOT_FOUND');
  END IF;
  IF order_row.status NOT IN ('OPEN', 'WAITING_CONTACT', 'WAITING_PAYMENT') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'ORDER_LOCKED');
  END IF;
  IF p_numbers IS NULL OR array_length(p_numbers, 1) IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'NO_NUMBERS');
  END IF;

  SELECT * INTO campaign_row FROM public.campaigns WHERE id = order_row.campaign_id;
  PERFORM pg_advisory_xact_lock(hashtext('rafflehub_orders'), hashtext(order_row.campaign_id::text));

  SELECT array_agg(DISTINCT x.n ORDER BY x.n) INTO p_numbers FROM unnest(p_numbers) AS x(n);
  SELECT count(*) INTO total_count FROM unnest(p_numbers) AS x(n);

  SELECT array_agg(x.n ORDER BY x.n) INTO out_of_range
  FROM unnest(p_numbers) AS x(n)
  WHERE x.n < campaign_row.number_start OR x.n > campaign_row.number_end;
  IF out_of_range IS NOT NULL AND array_length(out_of_range, 1) > 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'NUMBER_OUT_OF_RANGE', 'numbers', out_of_range);
  END IF;

  -- FIX: conflito apenas com numeros permanentemente ocupados OU com reserva ativa
  SELECT array_agg(n.number ORDER BY n.number) INTO conflicts
  FROM public.campaign_numbers n
  WHERE n.campaign_id = order_row.campaign_id AND n.number = ANY(p_numbers)
    AND (
      n.status IN ('PAID', 'BLOCKED', 'WINNER', 'CANCELLED')
      OR (n.status IN ('RESERVED', 'PENDING_PAYMENT') AND n.reserved_until > now())
    );
  IF conflicts IS NOT NULL AND array_length(conflicts, 1) > 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'CONFLICT', 'numbers', conflicts);
  END IF;

  -- Limpa reservas expiradas dos numeros escolhidos
  DELETE FROM public.campaign_numbers
  WHERE campaign_id = order_row.campaign_id
    AND number = ANY(p_numbers)
    AND status IN ('RESERVED', 'PENDING_PAYMENT')
    AND (reserved_until IS NULL OR reserved_until <= now());

  status_for_number := CASE order_row.status
    WHEN 'WAITING_PAYMENT' THEN 'PENDING_PAYMENT'::public.campaign_number_status
    ELSE 'RESERVED'::public.campaign_number_status
  END;

  INSERT INTO public.order_items (order_id, campaign_id, number, unit_price, status)
  SELECT p_order_id, order_row.campaign_id, x.n, campaign_row.price_per_number, status_for_number
  FROM unnest(p_numbers) AS x(n);

  INSERT INTO public.campaign_numbers (campaign_id, number, status, reserved_by, purchase_id)
  SELECT order_row.campaign_id, x.n, status_for_number, order_row.created_by, p_order_id
  FROM unnest(p_numbers) AS x(n);

  SELECT count(*) * campaign_row.price_per_number INTO item_total
  FROM public.order_items WHERE order_id = p_order_id;

  UPDATE public.orders
  SET subtotal = item_total, total = GREATEST(0, item_total - discount)
  WHERE id = p_order_id;

  PERFORM public.log_order_audit('ORDER_NUMBER_ADDED', p_order_id, order_row.campaign_id, actor_id,
    jsonb_build_object('numbers', p_numbers, 'count', total_count));

  RETURN jsonb_build_object('ok', true, 'order_id', p_order_id, 'numbers', p_numbers, 'count', total_count);
END; $$;

-- Re-grant permissions
GRANT EXECUTE ON FUNCTION public.reserve_campaign_numbers(UUID, BIGINT[], UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_manual_order(UUID, UUID, public.payment_method, NUMERIC, TEXT, BIGINT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_order_numbers(UUID, BIGINT[]) TO authenticated;
