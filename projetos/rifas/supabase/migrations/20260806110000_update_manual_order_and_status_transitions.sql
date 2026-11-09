-- Update create_manual_order to accept initial status (OPEN, WAITING_PAYMENT, PAID)
-- and update set_order_status to allow direct transition from OPEN/WAITING_CONTACT to PAID.

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
  target_order_status public.order_status;
  target_number_status public.campaign_number_status;
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

  SELECT array_agg(n.number ORDER BY n.number) INTO conflicts
  FROM public.campaign_numbers n
  WHERE n.campaign_id = p_campaign_id AND n.number = ANY(p_numbers);
  IF conflicts IS NOT NULL AND array_length(conflicts, 1) > 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'CONFLICT', 'numbers', conflicts);
  END IF;

  target_order_status := COALESCE(p_initial_status, 'OPEN'::public.order_status);
  IF target_order_status NOT IN ('OPEN', 'WAITING_PAYMENT', 'PAID') THEN
    target_order_status := 'OPEN'::public.order_status;
  END IF;

  target_number_status := CASE target_order_status
    WHEN 'PAID' THEN 'PAID'::public.campaign_number_status
    WHEN 'WAITING_PAYMENT' THEN 'PENDING_PAYMENT'::public.campaign_number_status
    ELSE 'RESERVED'::public.campaign_number_status
  END;

  item_total := total_count * campaign_row.price_per_number;
  IF p_discount IS NULL OR p_discount < 0 THEN p_discount := 0; END IF;

  INSERT INTO public.orders (
    campaign_id, customer_id, source, status, payment_method, subtotal, discount, total, notes, created_by
  )
  VALUES (
    p_campaign_id, p_customer_id, 'MANUAL'::public.order_source, target_order_status,
    p_payment_method, item_total, p_discount, GREATEST(0, item_total - p_discount), p_notes, actor_id
  )
  RETURNING * INTO order_row;

  INSERT INTO public.order_items (order_id, campaign_id, number, unit_price, status)
  SELECT order_row.id, p_campaign_id, x.n, campaign_row.price_per_number, target_number_status
  FROM unnest(p_numbers) AS x(n);

  INSERT INTO public.campaign_numbers (campaign_id, number, status, reserved_by, purchase_id)
  SELECT p_campaign_id, x.n, target_number_status, actor_id, order_row.id
  FROM unnest(p_numbers) AS x(n);

  PERFORM public.log_order_audit('ORDER_CREATED', order_row.id, p_campaign_id, actor_id,
    jsonb_build_object('source', 'MANUAL', 'numbers', p_numbers, 'count', total_count,
      'status', target_order_status, 'subtotal', item_total, 'discount', p_discount, 'total', order_row.total));

  RETURN jsonb_build_object(
    'ok', true, 'order_id', order_row.id, 'status', order_row.status,
    'numbers', p_numbers, 'count', total_count
  );
END; $$;

CREATE OR REPLACE FUNCTION public.set_order_status(
  p_order_id UUID,
  p_status public.order_status
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  order_row public.orders%ROWTYPE;
  actor_id UUID := auth.uid();
  numbers BIGINT[];
  audit_action TEXT;
BEGIN
  IF actor_id IS NULL OR NOT public.is_global_admin() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'FORBIDDEN');
  END IF;

  SELECT * INTO order_row FROM public.orders WHERE id = p_order_id;
  IF order_row.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'ORDER_NOT_FOUND');
  END IF;

  IF order_row.status = p_status THEN
    RETURN jsonb_build_object('ok', true, 'order_id', p_order_id, 'status', p_status, 'unchanged', true);
  END IF;

  IF NOT (
    (order_row.status = 'OPEN' AND p_status IN ('WAITING_CONTACT', 'WAITING_PAYMENT', 'PAID', 'CANCELLED', 'EXPIRED'))
    OR (order_row.status = 'WAITING_CONTACT' AND p_status IN ('OPEN', 'WAITING_PAYMENT', 'PAID', 'CANCELLED', 'EXPIRED'))
    OR (order_row.status = 'WAITING_PAYMENT' AND p_status IN ('OPEN', 'WAITING_CONTACT', 'PAID', 'CANCELLED', 'EXPIRED'))
    OR (order_row.status = 'PAID' AND p_status IN ('REFUNDED', 'CANCELLED'))
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'INVALID_TRANSITION',
      'from', order_row.status, 'to', p_status);
  END IF;

  SELECT array_agg(number ORDER BY number) INTO numbers
  FROM public.order_items WHERE order_id = p_order_id;

  IF p_status IN ('CANCELLED', 'EXPIRED', 'REFUNDED') THEN
    DELETE FROM public.campaign_numbers
    WHERE campaign_id = order_row.campaign_id AND purchase_id = p_order_id AND number = ANY(numbers);
  ELSIF p_status = 'PAID' THEN
    UPDATE public.campaign_numbers
    SET status = 'PAID'::public.campaign_number_status, reserved_until = NULL
    WHERE campaign_id = order_row.campaign_id AND purchase_id = p_order_id AND number = ANY(numbers);
    UPDATE public.order_items SET status = 'PAID'::public.campaign_number_status WHERE order_id = p_order_id;
  ELSIF p_status = 'WAITING_PAYMENT' THEN
    UPDATE public.campaign_numbers
    SET status = 'PENDING_PAYMENT'::public.campaign_number_status
    WHERE campaign_id = order_row.campaign_id AND purchase_id = p_order_id AND number = ANY(numbers);
    UPDATE public.order_items SET status = 'PENDING_PAYMENT'::public.campaign_number_status WHERE order_id = p_order_id;
  ELSE
    UPDATE public.campaign_numbers
    SET status = 'RESERVED'::public.campaign_number_status
    WHERE campaign_id = order_row.campaign_id AND purchase_id = p_order_id AND number = ANY(numbers);
    UPDATE public.order_items SET status = 'RESERVED'::public.campaign_number_status WHERE order_id = p_order_id;
  END IF;

  UPDATE public.orders SET status = p_status WHERE id = p_order_id;

  audit_action := CASE
    WHEN p_status = 'PAID' THEN 'ORDER_PAYMENT_CONFIRMED'
    WHEN p_status = 'REFUNDED' THEN 'ORDER_REFUNDED'
    WHEN p_status = 'CANCELLED' THEN 'ORDER_CANCELLED'
    WHEN p_status = 'EXPIRED' THEN 'ORDER_EXPIRED'
    ELSE 'ORDER_STATUS_CHANGED'
  END;

  PERFORM public.log_order_audit(audit_action, p_order_id, order_row.campaign_id, actor_id,
    jsonb_build_object('from', order_row.status, 'to', p_status, 'numbers', numbers));

  RETURN jsonb_build_object('ok', true, 'order_id', p_order_id, 'status', p_status, 'from', order_row.status);
END; $$;

GRANT EXECUTE ON FUNCTION public.create_manual_order(uuid, uuid, public.payment_method, numeric, text, bigint[], public.order_status) TO authenticated;
REVOKE ALL ON FUNCTION public.create_manual_order(uuid, uuid, public.payment_method, numeric, text, bigint[], public.order_status) FROM PUBLIC;
