-- ORDERS & CUSTOMERS: Sprint 4.1 — CRM, vendas manuais e reserva via WhatsApp
--
-- Princípios:
--   * Toda venda obrigatoriamente gera um pedido (orders + order_items).
--   * O status dos números (campaign_numbers) NUNCA é alterado diretamente
--     pelo cliente: o fluxo é Order -> Number -> Dashboard -> Auditoria.
--   * Números presos a pedidos usam purchase_id e NÃO têm prazo de expiração
--     (constraint relaxada abaixo); reservas temporárias seguem com
--     reserved_until e continuam sendo liberadas pelo job automático.
--   * Escrita em orders/order_items só via RPC (SECURITY DEFINER); admins
--     apenas leem direto (RLS).
--   * Pagamentos: apenas persistência do método (payment_method). Integração
--     com gateways (PIX etc.) fica para a Sprint 5.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
CREATE TYPE public.order_source AS ENUM ('ONLINE', 'WHATSAPP', 'MANUAL');
CREATE TYPE public.order_status AS ENUM (
  'OPEN', 'WAITING_CONTACT', 'WAITING_PAYMENT', 'PAID', 'CANCELLED', 'EXPIRED', 'REFUNDED'
);
CREATE TYPE public.payment_method AS ENUM (
  'PIX', 'DINHEIRO', 'CARTAO', 'TRANSFERENCIA', 'MERCADO_PAGO', 'PAGBANK', 'INFINITYPAY', 'OUTRO'
);
CREATE TYPE public.campaign_purchase_mode AS ENUM ('MANUAL', 'AUTOMATIC');

-- ---------------------------------------------------------------------------
-- campaigns: campos de contato WhatsApp e modo de compra
-- ---------------------------------------------------------------------------
ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS contact_name TEXT,
  ADD COLUMN IF NOT EXISTS contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_message_template TEXT,
  ADD COLUMN IF NOT EXISTS purchase_mode public.campaign_purchase_mode NOT NULL DEFAULT 'MANUAL';

COMMENT ON COLUMN public.campaigns.purchase_mode IS
  'MANUAL = venda confirmada manualmente (WhatsApp); AUTOMATIC = reservado para Sprint 5 (gateway).';

-- ---------------------------------------------------------------------------
-- campaign_numbers: permite reter números vinculados a pedidos sem expirar
-- ---------------------------------------------------------------------------
ALTER TABLE public.campaign_numbers DROP CONSTRAINT IF EXISTS campaign_numbers_reserved_until_check;

ALTER TABLE public.campaign_numbers
  ADD CONSTRAINT campaign_numbers_reserved_until_check CHECK (
    (status IN ('RESERVED', 'PENDING_PAYMENT') AND (reserved_until IS NOT NULL OR purchase_id IS NOT NULL))
    OR (status NOT IN ('RESERVED', 'PENDING_PAYMENT') AND reserved_until IS NULL)
  );

-- ---------------------------------------------------------------------------
-- customers
-- ---------------------------------------------------------------------------
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  city TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE public.customers IS
  'CRM de compradores. Soft delete: deleted_at. Criado pelo admin ou automaticamente no fluxo WhatsApp.';

CREATE INDEX customers_phone_idx ON public.customers (phone);
CREATE INDEX customers_email_idx ON public.customers (email) WHERE email IS NOT NULL;
CREATE INDEX customers_full_name_idx ON public.customers (full_name);
CREATE INDEX customers_deleted_at_idx ON public.customers (deleted_at);

CREATE TRIGGER customers_updated_at BEFORE UPDATE ON public.customers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------------
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  reservation_token UUID,
  source public.order_source NOT NULL DEFAULT 'ONLINE',
  status public.order_status NOT NULL DEFAULT 'OPEN',
  payment_method public.payment_method,
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
  discount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT orders_total_check CHECK (total >= 0),
  CONSTRAINT orders_discount_check CHECK (discount >= 0),
  CONSTRAINT orders_reservation_token_check CHECK (
    (source = 'ONLINE' AND reservation_token IS NOT NULL)
    OR (source <> 'ONLINE' AND reservation_token IS NULL)
  )
);

CREATE INDEX orders_campaign_status_idx ON public.orders (campaign_id, status);
CREATE INDEX orders_customer_idx ON public.orders (customer_id);
CREATE INDEX orders_status_idx ON public.orders (status);
CREATE INDEX orders_created_at_idx ON public.orders (created_at DESC);
CREATE INDEX orders_token_idx ON public.orders (reservation_token) WHERE reservation_token IS NOT NULL;

CREATE TRIGGER orders_updated_at BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------------
-- order_items
-- ---------------------------------------------------------------------------
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  number BIGINT NOT NULL,
  unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  status public.campaign_number_status NOT NULL DEFAULT 'PAID',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT order_items_unique_number UNIQUE (order_id, number),
  CONSTRAINT order_items_number_check CHECK (number >= 0)
);

CREATE INDEX order_items_order_idx ON public.order_items (order_id);
CREATE INDEX order_items_campaign_number_idx ON public.order_items (campaign_id, number);
CREATE INDEX order_items_status_idx ON public.order_items (status);

-- ---------------------------------------------------------------------------
-- order_receipts (comprovantes de pagamento — imagem/PDF)
-- ---------------------------------------------------------------------------
CREATE TABLE public.order_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL UNIQUE,
  mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
  size BIGINT NOT NULL DEFAULT 0,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX order_receipts_order_idx ON public.order_receipts (order_id);

-- ---------------------------------------------------------------------------
-- Helper de auditoria de pedidos (SECURITY DEFINER)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.log_order_audit(
  p_action TEXT,
  p_order_id UUID,
  p_campaign_id UUID,
  p_actor_id UUID,
  p_metadata JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (actor_id, action, entity, entity_id, metadata)
  VALUES (p_actor_id, p_action, 'order', p_order_id::text,
          COALESCE(p_metadata, '{}'::jsonb) || jsonb_build_object('campaign_id', p_campaign_id));
END; $$;

-- ---------------------------------------------------------------------------
-- create_manual_order — venda manual pelo admin
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

-- ---------------------------------------------------------------------------
-- create_whatsapp_order — público converte reserva temporária em pedido
-- ---------------------------------------------------------------------------
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
    NULL
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

-- ---------------------------------------------------------------------------
-- add_order_numbers — adiciona números a pedido editável
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

  SELECT array_agg(n.number ORDER BY n.number) INTO conflicts
  FROM public.campaign_numbers n
  WHERE n.campaign_id = order_row.campaign_id AND n.number = ANY(p_numbers);
  IF conflicts IS NOT NULL AND array_length(conflicts, 1) > 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'CONFLICT', 'numbers', conflicts);
  END IF;

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

-- ---------------------------------------------------------------------------
-- remove_order_numbers — remove números de pedido editável (libera na grade)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.remove_order_numbers(
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
  invalid BIGINT[];
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

  SELECT array_agg(x.n ORDER BY x.n) INTO invalid
  FROM unnest(p_numbers) AS x(n)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.order_items oi
    WHERE oi.order_id = p_order_id AND oi.number = x.n
  );
  IF invalid IS NOT NULL AND array_length(invalid, 1) > 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'NUMBER_NOT_IN_ORDER', 'numbers', invalid);
  END IF;

  SELECT count(*) INTO total_count
  FROM public.order_items WHERE order_id = p_order_id AND number = ANY(p_numbers);

  DELETE FROM public.order_items
  WHERE order_id = p_order_id AND number = ANY(p_numbers);

  DELETE FROM public.campaign_numbers
  WHERE campaign_id = order_row.campaign_id AND purchase_id = p_order_id AND number = ANY(p_numbers);

  SELECT count(*) * campaign_row.price_per_number INTO item_total
  FROM public.order_items WHERE order_id = p_order_id;

  UPDATE public.orders
  SET subtotal = item_total, total = GREATEST(0, item_total - discount)
  WHERE id = p_order_id;

  PERFORM public.log_order_audit('ORDER_NUMBER_REMOVED', p_order_id, order_row.campaign_id, actor_id,
    jsonb_build_object('numbers', p_numbers, 'count', total_count));

  RETURN jsonb_build_object('ok', true, 'order_id', p_order_id, 'numbers', p_numbers, 'count', total_count);
END; $$;

-- ---------------------------------------------------------------------------
-- swap_order_number — troca um número do pedido por outro disponível
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.swap_order_number(
  p_order_id UUID,
  p_old_number BIGINT,
  p_new_number BIGINT
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
  status_for_number public.campaign_number_status;
  conflict_count INTEGER;
  old_in_order INTEGER;
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

  SELECT * INTO campaign_row FROM public.campaigns WHERE id = order_row.campaign_id;
  IF p_new_number < campaign_row.number_start OR p_new_number > campaign_row.number_end THEN
    RETURN jsonb_build_object('ok', false, 'error', 'NUMBER_OUT_OF_RANGE');
  END IF;
  IF p_old_number = p_new_number THEN
    RETURN jsonb_build_object('ok', false, 'error', 'SAME_NUMBER');
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('rafflehub_orders'), hashtext(order_row.campaign_id::text));

  SELECT count(*) INTO old_in_order
  FROM public.order_items WHERE order_id = p_order_id AND number = p_old_number;
  IF old_in_order = 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'NUMBER_NOT_IN_ORDER');
  END IF;

  SELECT count(*) INTO conflict_count
  FROM public.campaign_numbers
  WHERE campaign_id = order_row.campaign_id AND number = p_new_number;
  IF conflict_count > 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'CONFLICT');
  END IF;

  DELETE FROM public.order_items WHERE order_id = p_order_id AND number = p_old_number;
  DELETE FROM public.campaign_numbers
  WHERE campaign_id = order_row.campaign_id AND purchase_id = p_order_id AND number = p_old_number;

  status_for_number := CASE order_row.status
    WHEN 'WAITING_PAYMENT' THEN 'PENDING_PAYMENT'::public.campaign_number_status
    ELSE 'RESERVED'::public.campaign_number_status
  END;

  INSERT INTO public.order_items (order_id, campaign_id, number, unit_price, status)
  VALUES (p_order_id, order_row.campaign_id, p_new_number, campaign_row.price_per_number, status_for_number);

  INSERT INTO public.campaign_numbers (campaign_id, number, status, reserved_by, purchase_id)
  VALUES (order_row.campaign_id, p_new_number, status_for_number, order_row.created_by, p_order_id);

  PERFORM public.log_order_audit('ORDER_NUMBER_SWAPPED', p_order_id, order_row.campaign_id, actor_id,
    jsonb_build_object('from', p_old_number, 'to', p_new_number));

  RETURN jsonb_build_object('ok', true, 'order_id', p_order_id, 'from', p_old_number, 'to', p_new_number);
END; $$;

-- ---------------------------------------------------------------------------
-- set_order_status — transição de status sincronizando os números
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- import_sold_numbers — cadastro em lote de números já vendidos
-- Gera um pedido MANUAL com status PAID (invariante: toda venda vira pedido).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.import_sold_numbers(
  p_campaign_id UUID,
  p_customer_id UUID,
  p_payment_method public.payment_method,
  p_notes TEXT,
  p_numbers BIGINT[]
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
BEGIN
  IF actor_id IS NULL OR NOT public.is_global_admin() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'FORBIDDEN');
  END IF;

  SELECT * INTO campaign_row
  FROM public.campaigns WHERE id = p_campaign_id AND deleted_at IS NULL;
  IF campaign_row.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'CAMPAIGN_NOT_FOUND');
  END IF;
  IF p_numbers IS NULL OR array_length(p_numbers, 1) IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'NO_NUMBERS');
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

  item_total := total_count * campaign_row.price_per_number;

  INSERT INTO public.orders (
    campaign_id, customer_id, source, status, payment_method, subtotal, discount, total, notes, created_by
  )
  VALUES (
    p_campaign_id, p_customer_id, 'MANUAL'::public.order_source, 'PAID'::public.order_status,
    p_payment_method, item_total, 0, item_total, COALESCE(p_notes, 'Importação em lote de números vendidos.'), actor_id
  )
  RETURNING * INTO order_row;

  INSERT INTO public.order_items (order_id, campaign_id, number, unit_price, status)
  SELECT order_row.id, p_campaign_id, x.n, campaign_row.price_per_number,
         'PAID'::public.campaign_number_status
  FROM unnest(p_numbers) AS x(n);

  INSERT INTO public.campaign_numbers (campaign_id, number, status, reserved_by, purchase_id)
  SELECT p_campaign_id, x.n, 'PAID'::public.campaign_number_status, actor_id, order_row.id
  FROM unnest(p_numbers) AS x(n);

  PERFORM public.log_order_audit('ORDER_NUMBER_IMPORTED', order_row.id, p_campaign_id, actor_id,
    jsonb_build_object('numbers', p_numbers, 'count', total_count, 'total', item_total));

  RETURN jsonb_build_object(
    'ok', true, 'order_id', order_row.id, 'status', order_row.status,
    'numbers', p_numbers, 'count', total_count
  );
END; $$;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;

GRANT SELECT ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;

GRANT SELECT ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_receipts TO authenticated;
GRANT ALL ON public.order_receipts TO service_role;

GRANT EXECUTE ON FUNCTION public.create_manual_order(uuid, uuid, public.payment_method, numeric, text, bigint[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_whatsapp_order(uuid, uuid, uuid, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.add_order_numbers(uuid, bigint[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_order_numbers(uuid, bigint[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.swap_order_number(uuid, bigint, bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_order_status(uuid, public.order_status) TO authenticated;
GRANT EXECUTE ON FUNCTION public.import_sold_numbers(uuid, uuid, public.payment_method, text, bigint[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_order_audit(text, uuid, uuid, uuid, jsonb) TO service_role;

REVOKE ALL ON FUNCTION public.create_manual_order(uuid, uuid, public.payment_method, numeric, text, bigint[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_whatsapp_order(uuid, uuid, uuid, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.add_order_numbers(uuid, bigint[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.remove_order_numbers(uuid, bigint[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.swap_order_number(uuid, bigint, bigint) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_order_status(uuid, public.order_status) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.import_sold_numbers(uuid, uuid, public.payment_method, text, bigint[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.log_order_audit(text, uuid, uuid, uuid, jsonb) FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read customers" ON public.customers FOR SELECT TO authenticated
USING (public.is_global_admin());
CREATE POLICY "Admins insert customers" ON public.customers FOR INSERT TO authenticated
WITH CHECK (public.is_global_admin());
CREATE POLICY "Admins update customers" ON public.customers FOR UPDATE TO authenticated
USING (public.is_global_admin()) WITH CHECK (public.is_global_admin());
CREATE POLICY "Admins delete customers" ON public.customers FOR DELETE TO authenticated
USING (public.is_global_admin());

CREATE POLICY "Admins read orders" ON public.orders FOR SELECT TO authenticated
USING (public.is_global_admin());
CREATE POLICY "Admins read order items" ON public.order_items FOR SELECT TO authenticated
USING (public.is_global_admin());

CREATE POLICY "Admins read order receipts" ON public.order_receipts FOR SELECT TO authenticated
USING (public.is_global_admin());
CREATE POLICY "Admins insert order receipts" ON public.order_receipts FOR INSERT TO authenticated
WITH CHECK (public.is_global_admin());
CREATE POLICY "Admins update order receipts" ON public.order_receipts FOR UPDATE TO authenticated
USING (public.is_global_admin()) WITH CHECK (public.is_global_admin());
CREATE POLICY "Admins delete order receipts" ON public.order_receipts FOR DELETE TO authenticated
USING (public.is_global_admin());

-- ---------------------------------------------------------------------------
-- Realtime: pedidos (operação/dashboard acompanham mudanças em tempo real)
-- ---------------------------------------------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;

-- ---------------------------------------------------------------------------
-- Storage: bucket privado para comprovantes de pagamento
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('order-receipts', 'order-receipts', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Admins read order receipt objects" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'order-receipts' AND public.is_global_admin());

CREATE POLICY "Admins insert order receipt objects" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'order-receipts' AND public.is_global_admin());

CREATE POLICY "Admins update order receipt objects" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'order-receipts' AND public.is_global_admin())
WITH CHECK (bucket_id = 'order-receipts' AND public.is_global_admin());

CREATE POLICY "Admins delete order receipt objects" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'order-receipts' AND public.is_global_admin());
