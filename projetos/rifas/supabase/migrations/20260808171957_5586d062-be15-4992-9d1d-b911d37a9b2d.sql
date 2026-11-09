-- ============ ENUMS ============
CREATE TYPE public.payment_gateway AS ENUM ('INFINITYPAY', 'MERCADO_PAGO', 'PAGBANK');
CREATE TYPE public.payment_environment AS ENUM ('SANDBOX', 'PRODUCTION');
CREATE TYPE public.payment_status AS ENUM ('CREATED','PENDING','WAITING_PAYMENT','PAID','FAILED','CANCELLED','EXPIRED','REFUNDED');
CREATE TYPE public.payment_method_type AS ENUM ('PIX','CREDIT_CARD','DEBIT_CARD','BOLETO');

-- ============ GATEWAY SETTINGS (secrets: backend only) ============
CREATE TABLE public.payment_gateway_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway public.payment_gateway NOT NULL UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT false,
  environment public.payment_environment NOT NULL DEFAULT 'SANDBOX',
  pix_enabled BOOLEAN NOT NULL DEFAULT true,
  credentials JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_tested_at TIMESTAMPTZ,
  last_test_ok BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Deliberately NO anon/authenticated grants: credentials are only reachable
-- through the service role inside server functions.
GRANT ALL ON public.payment_gateway_settings TO service_role;
ALTER TABLE public.payment_gateway_settings ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER payment_gateway_settings_updated_at
  BEFORE UPDATE ON public.payment_gateway_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.payment_gateway_settings (gateway) VALUES
  ('INFINITYPAY'), ('MERCADO_PAGO'), ('PAGBANK');

-- ============ DEFAULT / CAMPAIGN GATEWAY ============
ALTER TABLE public.platform_settings
  ADD COLUMN default_payment_gateway public.payment_gateway;

ALTER TABLE public.campaign_settings
  ADD COLUMN payment_gateway public.payment_gateway,
  ADD COLUMN enable_pix BOOLEAN NOT NULL DEFAULT true;

-- ============ PAYMENTS ============
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  gateway public.payment_gateway NOT NULL,
  environment public.payment_environment NOT NULL DEFAULT 'SANDBOX',
  gateway_payment_id TEXT,
  gateway_order_id TEXT,
  method public.payment_method_type NOT NULL DEFAULT 'PIX',
  status public.payment_status NOT NULL DEFAULT 'CREATED',
  attempt_number INTEGER NOT NULL DEFAULT 1,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BRL',
  pix_qr_code TEXT,
  pix_copy_paste TEXT,
  idempotency_key TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  failure_code TEXT,
  failure_message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX payments_order_id_idx ON public.payments (order_id, created_at DESC);
CREATE INDEX payments_campaign_id_idx ON public.payments (campaign_id);
CREATE INDEX payments_status_idx ON public.payments (status);
CREATE UNIQUE INDEX payments_gateway_payment_id_idx
  ON public.payments (gateway, gateway_payment_id)
  WHERE gateway_payment_id IS NOT NULL;

GRANT SELECT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read payments" ON public.payments
  FOR SELECT TO authenticated USING (public.is_global_admin());

CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ PAYMENT EVENTS (idempotency) ============
CREATE TABLE public.payment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID REFERENCES public.payments(id) ON DELETE CASCADE,
  gateway public.payment_gateway NOT NULL,
  event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  status public.payment_status,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  processed BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (gateway, event_id)
);

CREATE INDEX payment_events_payment_id_idx ON public.payment_events (payment_id, created_at DESC);

GRANT SELECT ON public.payment_events TO authenticated;
GRANT ALL ON public.payment_events TO service_role;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read payment events" ON public.payment_events
  FOR SELECT TO authenticated USING (public.is_global_admin());

-- ============ CHECKOUT: reservation -> online order ============
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
    NULL
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

REVOKE ALL ON FUNCTION public.create_checkout_order(uuid, uuid, uuid, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_checkout_order(uuid, uuid, uuid, text, text, text) TO service_role;

-- ============ CONFIRM PAYMENT (backend only, idempotent) ============
CREATE OR REPLACE FUNCTION public.confirm_payment(
  p_payment_id UUID,
  p_gateway_payment_id TEXT,
  p_paid_at TIMESTAMPTZ
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  payment_row public.payments%ROWTYPE;
  order_row public.orders%ROWTYPE;
  numbers BIGINT[];
BEGIN
  SELECT * INTO payment_row FROM public.payments WHERE id = p_payment_id FOR UPDATE;
  IF payment_row.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'PAYMENT_NOT_FOUND');
  END IF;
  IF payment_row.status = 'PAID' THEN
    RETURN jsonb_build_object('ok', true, 'unchanged', true, 'order_id', payment_row.order_id);
  END IF;

  SELECT * INTO order_row FROM public.orders WHERE id = payment_row.order_id FOR UPDATE;
  IF order_row.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'ORDER_NOT_FOUND');
  END IF;

  UPDATE public.payments
  SET status = 'PAID',
      paid_at = COALESCE(p_paid_at, now()),
      gateway_payment_id = COALESCE(p_gateway_payment_id, gateway_payment_id),
      failure_code = NULL,
      failure_message = NULL
  WHERE id = p_payment_id;

  SELECT array_agg(number ORDER BY number) INTO numbers
  FROM public.order_items WHERE order_id = order_row.id;

  UPDATE public.campaign_numbers
  SET status = 'PAID'::public.campaign_number_status, reserved_until = NULL
  WHERE campaign_id = order_row.campaign_id AND purchase_id = order_row.id;

  UPDATE public.order_items SET status = 'PAID'::public.campaign_number_status
  WHERE order_id = order_row.id;

  IF order_row.status <> 'PAID' THEN
    UPDATE public.orders SET status = 'PAID'::public.order_status WHERE id = order_row.id;
  END IF;

  -- Demais tentativas em aberto do mesmo pedido são encerradas.
  UPDATE public.payments
  SET status = 'CANCELLED', cancelled_at = now()
  WHERE order_id = order_row.id AND id <> p_payment_id
    AND status IN ('CREATED', 'PENDING', 'WAITING_PAYMENT');

  PERFORM public.log_order_audit('ORDER_PAYMENT_CONFIRMED', order_row.id, order_row.campaign_id, NULL,
    jsonb_build_object('payment_id', p_payment_id, 'gateway', payment_row.gateway,
      'numbers', numbers, 'total', payment_row.amount));

  RETURN jsonb_build_object('ok', true, 'order_id', order_row.id, 'payment_id', p_payment_id);
END; $$;

REVOKE ALL ON FUNCTION public.confirm_payment(uuid, text, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.confirm_payment(uuid, text, timestamptz) TO service_role;

-- ============ FAIL / CANCEL / EXPIRE PAYMENT ============
CREATE OR REPLACE FUNCTION public.finalize_payment(
  p_payment_id UUID,
  p_status public.payment_status,
  p_failure_code TEXT,
  p_failure_message TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  payment_row public.payments%ROWTYPE;
  order_row public.orders%ROWTYPE;
BEGIN
  IF p_status NOT IN ('FAILED', 'CANCELLED', 'EXPIRED', 'REFUNDED') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'INVALID_STATUS');
  END IF;

  SELECT * INTO payment_row FROM public.payments WHERE id = p_payment_id FOR UPDATE;
  IF payment_row.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'PAYMENT_NOT_FOUND');
  END IF;
  IF payment_row.status = p_status THEN
    RETURN jsonb_build_object('ok', true, 'unchanged', true);
  END IF;
  IF payment_row.status = 'PAID' AND p_status <> 'REFUNDED' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'PAYMENT_ALREADY_PAID');
  END IF;

  UPDATE public.payments
  SET status = p_status,
      failure_code = p_failure_code,
      failure_message = p_failure_message,
      cancelled_at = CASE WHEN p_status IN ('CANCELLED','EXPIRED') THEN now() ELSE cancelled_at END,
      refunded_at = CASE WHEN p_status = 'REFUNDED' THEN now() ELSE refunded_at END
  WHERE id = p_payment_id;

  SELECT * INTO order_row FROM public.orders WHERE id = payment_row.order_id FOR UPDATE;

  -- Libera números somente quando não há outra tentativa viva no pedido.
  IF p_status IN ('CANCELLED', 'EXPIRED', 'REFUNDED') AND order_row.id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.payments
      WHERE order_id = order_row.id AND id <> p_payment_id
        AND status IN ('CREATED','PENDING','WAITING_PAYMENT','PAID')
    ) THEN
      DELETE FROM public.campaign_numbers
      WHERE campaign_id = order_row.campaign_id AND purchase_id = order_row.id;

      UPDATE public.orders
      SET status = CASE WHEN p_status = 'REFUNDED' THEN 'REFUNDED'::public.order_status
                        WHEN p_status = 'EXPIRED' THEN 'EXPIRED'::public.order_status
                        ELSE 'CANCELLED'::public.order_status END
      WHERE id = order_row.id;
    END IF;
  END IF;

  PERFORM public.log_order_audit('PAYMENT_' || p_status, payment_row.order_id, payment_row.campaign_id, NULL,
    jsonb_build_object('payment_id', p_payment_id, 'gateway', payment_row.gateway,
      'failure_code', p_failure_code));

  RETURN jsonb_build_object('ok', true, 'payment_id', p_payment_id, 'status', p_status);
END; $$;

REVOKE ALL ON FUNCTION public.finalize_payment(uuid, public.payment_status, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.finalize_payment(uuid, public.payment_status, text, text) TO service_role;

-- ============ EXPIRE STALE ONLINE ORDERS ============
CREATE OR REPLACE FUNCTION public.expire_stale_payments()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  expired_count INTEGER := 0;
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT id FROM public.payments
    WHERE status IN ('CREATED','PENDING','WAITING_PAYMENT')
      AND expires_at IS NOT NULL AND expires_at <= now()
  LOOP
    PERFORM public.finalize_payment(rec.id, 'EXPIRED'::public.payment_status, 'EXPIRED', 'Pagamento expirado.');
    expired_count := expired_count + 1;
  END LOOP;
  RETURN expired_count;
END; $$;

REVOKE ALL ON FUNCTION public.expire_stale_payments() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.expire_stale_payments() TO service_role;

-- ============ REALTIME ============
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;