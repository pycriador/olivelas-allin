
-- ============================================================
-- SPRINT 6: PAYMENT ENGINE
-- payment_gateways, payments, payment_webhook_events
-- ============================================================

-- ============ ENUMS ============
DO $$ BEGIN
  CREATE TYPE public.payment_status AS ENUM ('PENDING','PROCESSING','CONFIRMED','FAILED','CANCELLED','EXPIRED','REFUNDED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_gateway_provider AS ENUM ('INFINITY_PAY','MERCADO_PAGO','PAGBANK');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_method_online AS ENUM ('PIX','CREDIT_CARD','BOLETO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ TABLES ============
CREATE TABLE public.payment_gateways (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  provider public.payment_gateway_provider NOT NULL,
  label TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  credentials_encrypted TEXT,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_payment_gateways_org ON public.payment_gateways(organization_id);
CREATE INDEX idx_payment_gateways_provider ON public.payment_gateways(organization_id, provider);
CREATE TRIGGER payment_gateways_updated_at BEFORE UPDATE ON public.payment_gateways FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  reservation_id UUID REFERENCES public.number_reservations(id) ON DELETE SET NULL,
  gateway_id UUID REFERENCES public.payment_gateways(id) ON DELETE SET NULL,
  provider public.payment_gateway_provider NOT NULL,
  provider_payment_id TEXT,
  method public.payment_method_online NOT NULL DEFAULT 'PIX',
  status public.payment_status NOT NULL DEFAULT 'PENDING',
  amount NUMERIC NOT NULL DEFAULT 0 CHECK (amount >= 0),
  currency TEXT NOT NULL DEFAULT 'BRL',
  pix_code TEXT,
  pix_qr_base64 TEXT,
  pix_expires_at TIMESTAMPTZ,
  buyer_name TEXT,
  buyer_phone TEXT,
  buyer_email TEXT,
  buyer_document TEXT,
  gateway_response JSONB,
  paid_at TIMESTAMPTZ,
  sale_id UUID REFERENCES public.manual_sales(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_payments_org ON public.payments(organization_id);
CREATE INDEX idx_payments_campaign ON public.payments(campaign_id);
CREATE INDEX idx_payments_reservation ON public.payments(reservation_id);
CREATE INDEX idx_payments_status ON public.payments(campaign_id, status);
CREATE INDEX idx_payments_provider_id ON public.payments(provider, provider_payment_id);
CREATE INDEX idx_payments_sale ON public.payments(sale_id) WHERE sale_id IS NOT NULL;
CREATE TRIGGER payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.payment_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES public.payments(id) ON DELETE CASCADE,
  provider public.payment_gateway_provider NOT NULL,
  event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, event_id)
);
CREATE INDEX idx_payment_webhook_events_org ON public.payment_webhook_events(organization_id);
CREATE INDEX idx_payment_webhook_events_payment ON public.payment_webhook_events(payment_id);
CREATE INDEX idx_payment_webhook_events_provider ON public.payment_webhook_events(provider, event_id);

-- ============ GRANTS ============
GRANT SELECT ON public.payment_gateways TO authenticated;
GRANT SELECT ON public.payments TO authenticated;
GRANT SELECT ON public.payment_webhook_events TO authenticated;
GRANT ALL ON public.payment_gateways, public.payments, public.payment_webhook_events TO service_role;

-- ============ RLS ============
ALTER TABLE public.payment_gateways ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_webhook_events ENABLE ROW LEVEL SECURITY;

-- payment_gateways: members read their org
CREATE POLICY payment_gateways_select_members ON public.payment_gateways FOR SELECT TO authenticated
USING (is_org_member(organization_id) OR is_global_admin());
CREATE POLICY payment_gateways_insert_members ON public.payment_gateways FOR INSERT TO authenticated
WITH CHECK (is_org_member(organization_id));
CREATE POLICY payment_gateways_update_members ON public.payment_gateways FOR UPDATE TO authenticated
USING (is_org_member(organization_id) OR is_global_admin());

-- payments: members read their org; anon read confirmed payments (for public display)
CREATE POLICY payments_select_members ON public.payments FOR SELECT TO authenticated
USING (is_org_member(organization_id) OR is_global_admin());
CREATE POLICY payments_select_public ON public.payments FOR SELECT TO anon
USING (EXISTS (
  SELECT 1 FROM public.campaigns c WHERE c.id = payments.campaign_id
    AND c.status IN ('PUBLISHED','PAUSED','FINISHED')
    AND payments.status = 'CONFIRMED'
));

-- payment_webhook_events: members read their org
CREATE POLICY payment_webhook_events_select ON public.payment_webhook_events FOR SELECT TO authenticated
USING (is_org_member(organization_id) OR is_global_admin());

-- ============ GUARDS ============
CREATE OR REPLACE FUNCTION public.guard_payment_gateways()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _org UUID;
BEGIN
  SELECT organization_id INTO _org FROM public.organizations WHERE id = NEW.organization_id;
  IF _org IS NULL THEN RAISE EXCEPTION 'ORGANIZATION_NOT_FOUND'; END IF;
  NEW.organization_id := _org;
  RETURN NEW;
END; $$;
CREATE TRIGGER payment_gateways_guard BEFORE INSERT OR UPDATE ON public.payment_gateways
FOR EACH ROW EXECUTE FUNCTION public.guard_payment_gateways();

CREATE OR REPLACE FUNCTION public.guard_payments()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _org UUID;
BEGIN
  IF NEW.campaign_id IS NOT NULL THEN
    SELECT organization_id INTO _org FROM public.campaigns WHERE id = NEW.campaign_id;
    IF _org IS NULL THEN RAISE EXCEPTION 'CAMPAIGN_NOT_FOUND'; END IF;
    NEW.organization_id := _org;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER payments_guard BEFORE INSERT OR UPDATE ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.guard_payments();

-- ============ PERMISSIONS SEED ============
INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('OWNER','payments.view'),('OWNER','payments.manage'),
  ('ADMIN','payments.view'),('ADMIN','payments.manage'),
  ('MEMBER','payments.view'),('MEMBER','payments.manage'),
  ('VIEWER','payments.view')
ON CONFLICT (role, permission_key) DO NOTHING;

-- ============ APP SETTINGS ============
INSERT INTO public.app_settings (key, value) VALUES
  ('payment_ttl_minutes', '15'::jsonb),
  ('payment_encryption_key', '"CHANGE_ME_IN_PRODUCTION"'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- ============ HELPER: APP_SETTING_STR ============
CREATE OR REPLACE FUNCTION public.app_setting_str(_key TEXT, _default TEXT)
RETURNS TEXT LANGUAGE sql STABLE AS $$
  SELECT COALESCE((SELECT (value #>> '{}') FROM public.app_settings WHERE key = _key), _default);
$$;

-- ============ HELPER: ENCRYPT/DECRYPT CREDENTIALS ============
CREATE OR REPLACE FUNCTION public.encrypt_gateway_credentials(_gateway_id UUID, _plaintext TEXT)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _key TEXT;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'NOT_AUTHENTICATED'; END IF;
  _key := public.app_setting_str('payment_encryption_key', 'CHANGE_ME_IN_PRODUCTION');
  UPDATE public.payment_gateways
  SET credentials_encrypted = pgp_sym_encrypt(_plaintext, _key)
  WHERE id = _gateway_id;
END; $$;

CREATE OR REPLACE FUNCTION public.decrypt_gateway_credentials(_gateway_id UUID)
RETURNS TEXT LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _enc TEXT; _key TEXT;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'NOT_AUTHENTICATED'; END IF;
  SELECT credentials_encrypted INTO _enc FROM public.payment_gateways WHERE id = _gateway_id;
  IF _enc IS NULL THEN RETURN NULL; END IF;
  _key := public.app_setting_str('payment_encryption_key', 'CHANGE_ME_IN_PRODUCTION');
  RETURN pgp_sym_decrypt(_enc::bytea, _key);
END; $$;

-- ============ RPC: CREATE PAYMENT ============
CREATE OR REPLACE FUNCTION public.create_payment(
  _campaign UUID,
  _reservation UUID DEFAULT NULL,
  _gateway UUID DEFAULT NULL,
  _provider public.payment_gateway_provider DEFAULT 'INFINITY_PAY',
  _method public.payment_method_online DEFAULT 'PIX',
  _amount NUMERIC DEFAULT 0,
  _buyer_name TEXT DEFAULT NULL,
  _buyer_phone TEXT DEFAULT NULL,
  _buyer_email TEXT DEFAULT NULL,
  _buyer_document TEXT DEFAULT NULL
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _org UUID; _id UUID; _ttl INT; _expires TIMESTAMPTZ;
  _pg public.payment_gateways;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'NOT_AUTHENTICATED'; END IF;
  SELECT organization_id INTO _org FROM public.campaigns WHERE id = _campaign;
  IF _org IS NULL THEN RAISE EXCEPTION 'CAMPAIGN_NOT_FOUND'; END IF;
  IF NOT org_is_active(_org) THEN RAISE EXCEPTION 'ORGANIZATION_NOT_ACTIVE'; END IF;

  -- If a reservation is provided, verify it belongs to this user and is active
  IF _reservation IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.number_reservations
      WHERE id = _reservation AND campaign_id = _campaign AND user_id = auth.uid() AND status = 'ACTIVE'
    ) THEN RAISE EXCEPTION 'RESERVATION_NOT_ACTIVE'; END IF;
  END IF;

  -- Verify gateway if provided
  IF _gateway IS NOT NULL THEN
    SELECT * INTO _pg FROM public.payment_gateways WHERE id = _gateway AND organization_id = _org AND enabled = true;
    IF _pg.id IS NULL THEN RAISE EXCEPTION 'GATEWAY_NOT_FOUND'; END IF;
    _provider := _pg.provider;
  END IF;

  -- Default to INFINITY_PAY if no gateway configured
  IF _provider IS NULL THEN _provider := 'INFINITY_PAY'; END IF;

  _ttl := public.app_setting_int('payment_ttl_minutes', 15);
  _expires := now() + (_ttl || ' minutes')::interval;

  INSERT INTO public.payments (
    organization_id, campaign_id, reservation_id, gateway_id, provider,
    method, status, amount, buyer_name, buyer_phone, buyer_email, buyer_document,
    pix_expires_at
  ) VALUES (
    _org, _campaign, _reservation, _gateway, _provider,
    _method, 'PENDING', _amount,
    NULLIF(trim(COALESCE(_buyer_name,'')), ''),
    NULLIF(trim(COALESCE(_buyer_phone,'')), ''),
    NULLIF(trim(COALESCE(_buyer_email,'')), ''),
    NULLIF(trim(COALESCE(_buyer_document,'')), ''),
    _expires
  ) RETURNING id INTO _id;

  PERFORM write_audit(_org, 'PAYMENT_CREATED', 'payment', _id,
    jsonb_build_object('campaign_id', _campaign, 'reservation_id', _reservation,
      'provider', _provider, 'method', _method, 'amount', _amount,
      'buyer_name', _buyer_name));

  RETURN _id;
END; $$;

-- ============ RPC: UPDATE PAYMENT STATUS ============
CREATE OR REPLACE FUNCTION public.update_payment_status(
  _payment UUID,
  _status public.payment_status,
  _provider_payment_id TEXT DEFAULT NULL,
  _pix_code TEXT DEFAULT NULL,
  _pix_qr_base64 TEXT DEFAULT NULL,
  _gateway_response JSONB DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _p public.payments; _old_status public.payment_status;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'NOT_AUTHENTICATED'; END IF;
  SELECT * INTO _p FROM public.payments WHERE id = _payment;
  IF _p.id IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;

  _old_status := _p.status;

  UPDATE public.payments SET
    status = _status,
    provider_payment_id = COALESCE(_provider_payment_id, provider_payment_id),
    pix_code = COALESCE(_pix_code, pix_code),
    pix_qr_base64 = COALESCE(_pix_qr_base64, pix_qr_base64),
    gateway_response = COALESCE(_gateway_response, gateway_response),
    paid_at = CASE WHEN _status = 'CONFIRMED' AND _p.paid_at IS NULL THEN now() ELSE _p.paid_at END
  WHERE id = _payment;

  PERFORM write_audit(_p.organization_id, 'PAYMENT_STATUS_CHANGED', 'payment', _payment,
    jsonb_build_object('from', _old_status, 'to', _status));
END; $$;

-- ============ RPC: CONFIRM PAYMENT (creates Sale + marks numbers SOLD) ============
CREATE OR REPLACE FUNCTION public.confirm_payment(_payment UUID)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _p public.payments; _sale_id UUID; _num INT; _cn record;
  _total NUMERIC := 0; _c public.campaigns;
  _participant_id UUID; _item record;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'NOT_AUTHENTICATED'; END IF;
  SELECT * INTO _p FROM public.payments WHERE id = _payment;
  IF _p.id IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF _p.status <> 'PENDING' AND _p.status <> 'PROCESSING' THEN
    RAISE EXCEPTION 'PAYMENT_NOT_CONFIRMABLE';
  END IF;

  SELECT * INTO _c FROM public.campaigns WHERE id = _p.campaign_id;

  -- Acquire lock per campaign
  PERFORM pg_advisory_xact_lock(hashtext('sale:' || _p.campaign_id::text));

  -- Mark payment as confirmed
  UPDATE public.payments SET status = 'CONFIRMED', paid_at = now() WHERE id = _payment;

  -- Create participant for buyer
  IF _p.buyer_name IS NOT NULL AND length(trim(_p.buyer_name)) > 0 THEN
    _participant_id := public.create_participant(
      _p.campaign_id, _p.buyer_name, _p.buyer_phone, _p.buyer_email, _p.buyer_document, NULL
    );
  END IF;

  IF _participant_id IS NULL THEN
    RAISE EXCEPTION 'BUYER_INFO_REQUIRED';
  END IF;

  -- Create sale
  INSERT INTO public.manual_sales (organization_id, campaign_id, participant_id, created_by, payment_method, amount, notes)
  VALUES (_p.organization_id, _p.campaign_id, _participant_id, auth.uid(), 'OTHER', 0,
    'Payment ' || _payment::text || ' via ' || _p.provider::text)
  RETURNING id INTO _sale_id;

  -- If reservation exists, convert its numbers to SOLD and add to sale
  IF _p.reservation_id IS NOT NULL THEN
    -- Complete the reservation
    UPDATE public.number_reservations SET status = 'COMPLETED' WHERE id = _p.reservation_id AND status = 'ACTIVE';

    FOR _item IN
      SELECT ri.campaign_number_id, cn.number
      FROM public.number_reservation_items ri
      JOIN public.campaign_numbers cn ON cn.id = ri.campaign_number_id
      WHERE ri.reservation_id = _p.reservation_id
    LOOP
      UPDATE public.campaign_numbers SET status = 'SOLD', sold_at = now(),
        reserved_by = NULL, reserved_at = NULL, reservation_expires_at = NULL
      WHERE id = _item.campaign_number_id AND status = 'RESERVED';

      INSERT INTO public.manual_sale_items (sale_id, campaign_number_id, number, unit_price)
      VALUES (_sale_id, _item.campaign_number_id, _item.number, _c.number_price);

      _total := _total + _c.number_price;
    END LOOP;
  END IF;

  UPDATE public.manual_sales SET amount = _total WHERE id = _sale_id;
  UPDATE public.payments SET sale_id = _sale_id WHERE id = _payment;

  PERFORM write_audit(_p.organization_id, 'PAYMENT_CONFIRMED', 'payment', _payment,
    jsonb_build_object('sale_id', _sale_id, 'amount', _total,
      'participant_id', _participant_id, 'reservation_id', _p.reservation_id));

  RETURN _sale_id;
END; $$;

-- ============ RPC: CANCEL PAYMENT ============
CREATE OR REPLACE FUNCTION public.cancel_payment(_payment UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _p public.payments;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'NOT_AUTHENTICATED'; END IF;
  SELECT * INTO _p FROM public.payments WHERE id = _payment;
  IF _p.id IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF _p.status = 'CONFIRMED' THEN RAISE EXCEPTION 'PAYMENT_ALREADY_CONFIRMED'; END IF;
  IF _p.status = 'CANCELLED' THEN RAISE EXCEPTION 'PAYMENT_ALREADY_CANCELLED'; END IF;

  UPDATE public.payments SET status = 'CANCELLED' WHERE id = _payment;

  -- Release reservation if any
  IF _p.reservation_id IS NOT NULL THEN
    UPDATE public.number_reservations SET status = 'CANCELLED' WHERE id = _p.reservation_id AND status = 'ACTIVE';
    UPDATE public.campaign_numbers SET status = 'AVAILABLE', reserved_by = NULL,
      reserved_at = NULL, reservation_expires_at = NULL
    WHERE reserved_by IS NOT NULL AND status = 'RESERVED'
      AND EXISTS (SELECT 1 FROM public.number_reservation_items ri
                   WHERE ri.reservation_id = _p.reservation_id AND ri.campaign_number_id = campaign_numbers.id);
  END IF;

  PERFORM write_audit(_p.organization_id, 'PAYMENT_CANCELLED', 'payment', _payment,
    jsonb_build_object('reservation_id', _p.reservation_id));
END; $$;

-- ============ RPC: EXPIRE PAYMENT ============
CREATE OR REPLACE FUNCTION public.expire_payment(_payment UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _p public.payments;
BEGIN
  SELECT * INTO _p FROM public.payments WHERE id = _payment;
  IF _p.id IS NULL THEN RETURN; END IF;
  IF _p.status <> 'PENDING' THEN RETURN; END IF;

  UPDATE public.payments SET status = 'EXPIRED' WHERE id = _payment AND status = 'PENDING';

  -- Release reservation if any
  IF _p.reservation_id IS NOT NULL THEN
    UPDATE public.number_reservations SET status = 'EXPIRED' WHERE id = _p.reservation_id AND status = 'ACTIVE';
    UPDATE public.campaign_numbers SET status = 'AVAILABLE', reserved_by = NULL,
      reserved_at = NULL, reservation_expires_at = NULL
    WHERE reserved_by IS NOT NULL AND status = 'RESERVED'
      AND EXISTS (SELECT 1 FROM public.number_reservation_items ri
                   WHERE ri.reservation_id = _p.reservation_id AND ri.campaign_number_id = campaign_numbers.id);
  END IF;

  PERFORM write_audit(_p.organization_id, 'PAYMENT_EXPIRED', 'payment', _payment,
    jsonb_build_object('reservation_id', _p.reservation_id));
END; $$;

-- ============ RPC: EXPIRE STALE PAYMENTS (batch) ============
CREATE OR REPLACE FUNCTION public.expire_stale_payments()
RETURNS INT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _r RECORD; _count INT := 0;
BEGIN
  FOR _r IN
    SELECT id FROM public.payments
    WHERE status = 'PENDING' AND pix_expires_at IS NOT NULL AND pix_expires_at <= now()
    LIMIT 100
  LOOP
    PERFORM public.expire_payment(_r.id);
    _count := _count + 1;
  END LOOP;
  RETURN _count;
END; $$;

-- ============ RPC: GET PAYMENT ============
CREATE OR REPLACE FUNCTION public.get_payment(_payment UUID)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _p public.payments; _r jsonb;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'NOT_AUTHENTICATED'; END IF;
  SELECT row_to_json(p.*) INTO _r FROM public.payments p WHERE p.id = _payment;
  IF _r IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;

  -- Check permission via organization
  IF NOT EXISTS (
    SELECT 1 FROM public.payments p
    WHERE p.id = _payment AND (is_org_member(p.organization_id) OR is_global_admin())
  ) THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;

  RETURN _r;
END; $$;

-- ============ RPC: LIST PAYMENTS (admin) ============
CREATE OR REPLACE FUNCTION public.list_payments(
  _campaign UUID DEFAULT NULL,
  _status TEXT DEFAULT NULL,
  _provider TEXT DEFAULT NULL,
  _limit INT DEFAULT 50,
  _offset INT DEFAULT 0
) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _org UUID; _total BIGINT; _items jsonb;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'NOT_AUTHENTICATED'; END IF;

  -- If campaign is provided, use its org; otherwise require org member
  IF _campaign IS NOT NULL THEN
    SELECT organization_id INTO _org FROM public.campaigns WHERE id = _campaign;
    IF _org IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  ELSE
    -- For org-level listing, we need to find any org the user belongs to
    -- This is simplified; in practice, list by campaign is preferred
    RAISE EXCEPTION 'CAMPAIGN_REQUIRED';
  END IF;

  IF NOT has_permission(_org, 'payments.view') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;

  SELECT count(*) INTO _total FROM public.payments pay
  WHERE (_campaign IS NULL OR pay.campaign_id = _campaign)
    AND (_status IS NULL OR pay.status::text = _status)
    AND (_provider IS NULL OR pay.provider::text = _provider);

  SELECT coalesce(jsonb_agg(row_to_json(sub)), '[]'::jsonb) INTO _items
  FROM (
    SELECT pay.id, pay.campaign_id, pay.provider, pay.method, pay.status,
           pay.amount, pay.currency, pay.buyer_name, pay.buyer_phone, pay.buyer_email,
           pay.paid_at, pay.created_at, pay.updated_at,
           (SELECT count(*) FROM public.manual_sale_items msi WHERE msi.sale_id = pay.sale_id) AS numbers_count,
           c.name AS campaign_name
    FROM public.payments pay
    LEFT JOIN public.campaigns c ON c.id = pay.campaign_id
    WHERE (_campaign IS NULL OR pay.campaign_id = _campaign)
      AND (_status IS NULL OR pay.status::text = _status)
      AND (_provider IS NULL OR pay.provider::text = _provider)
    ORDER BY pay.created_at DESC
    LIMIT _limit OFFSET _offset
  ) sub;

  RETURN jsonb_build_object('items', _items, 'total', _total, 'limit', _limit, 'offset', _offset);
END; $$;

-- ============ RPC: CAMPAIGN PAYMENT METRICS ============
CREATE OR REPLACE FUNCTION public.campaign_payment_metrics(_campaign UUID)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _org UUID; _m jsonb;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'NOT_AUTHENTICATED'; END IF;
  SELECT organization_id INTO _org FROM public.campaigns WHERE id = _campaign;
  IF _org IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF NOT has_permission(_org, 'payments.view') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;

  SELECT jsonb_build_object(
    'total_revenue', COALESCE(sum(pay.amount) FILTER (WHERE pay.status = 'CONFIRMED'), 0),
    'confirmed_count', count(*) FILTER (WHERE pay.status = 'CONFIRMED'),
    'pending_count', count(*) FILTER (WHERE pay.status = 'PENDING' OR pay.status = 'PROCESSING'),
    'failed_count', count(*) FILTER (WHERE pay.status = 'FAILED'),
    'cancelled_count', count(*) FILTER (WHERE pay.status = 'CANCELLED' OR pay.status = 'EXPIRED'),
    'refunded_count', count(*) FILTER (WHERE pay.status = 'REFUNDED'),
    'total_count', count(*)
  ) INTO _m
  FROM public.payments pay WHERE pay.campaign_id = _campaign;

  RETURN _m;
END; $$;

-- ============ RPC: CREATE PAYMENT GATEWAY ============
CREATE OR REPLACE FUNCTION public.create_payment_gateway(
  _organization UUID,
  _provider public.payment_gateway_provider,
  _label TEXT,
  _enabled BOOLEAN DEFAULT true,
  _credentials TEXT DEFAULT NULL,
  _settings JSONB DEFAULT '{}'::jsonb
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _id UUID; _key TEXT;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'NOT_AUTHENTICATED'; END IF;
  IF NOT has_permission(_organization, 'payments.manage') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF NOT org_is_active(_organization) THEN RAISE EXCEPTION 'ORGANIZATION_NOT_ACTIVE'; END IF;

  INSERT INTO public.payment_gateways (organization_id, provider, label, enabled, settings, created_by)
  VALUES (_organization, _provider, trim(_label), _enabled, _settings, auth.uid())
  RETURNING id INTO _id;

  -- Encrypt credentials if provided
  IF _credentials IS NOT NULL AND length(_credentials) > 0 THEN
    _key := public.app_setting_str('payment_encryption_key', 'CHANGE_ME_IN_PRODUCTION');
    UPDATE public.payment_gateways SET credentials_encrypted = pgp_sym_encrypt(_credentials, _key) WHERE id = _id;
  END IF;

  PERFORM write_audit(_organization, 'PAYMENT_GATEWAY_CREATED', 'payment_gateway', _id,
    jsonb_build_object('provider', _provider, 'label', _label, 'enabled', _enabled));

  RETURN _id;
END; $$;

-- ============ RPC: UPDATE PAYMENT GATEWAY ============
CREATE OR REPLACE FUNCTION public.update_payment_gateway(
  _gateway UUID,
  _label TEXT DEFAULT NULL,
  _enabled BOOLEAN DEFAULT NULL,
  _credentials TEXT DEFAULT NULL,
  _settings JSONB DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _pg public.payment_gateways; _key TEXT;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'NOT_AUTHENTICATED'; END IF;
  SELECT * INTO _pg FROM public.payment_gateways WHERE id = _gateway;
  IF _pg.id IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF NOT has_permission(_pg.organization_id, 'payments.manage') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;

  UPDATE public.payment_gateways SET
    label = COALESCE(NULLIF(trim(_label),''), label),
    enabled = COALESCE(_enabled, enabled),
    settings = COALESCE(_settings, settings)
  WHERE id = _gateway;

  -- Re-encrypt credentials if provided
  IF _credentials IS NOT NULL AND length(_credentials) > 0 THEN
    _key := public.app_setting_str('payment_encryption_key', 'CHANGE_ME_IN_PRODUCTION');
    UPDATE public.payment_gateways SET credentials_encrypted = pgp_sym_encrypt(_credentials, _key) WHERE id = _gateway;
  END IF;

  PERFORM write_audit(_pg.organization_id, 'PAYMENT_GATEWAY_UPDATED', 'payment_gateway', _gateway,
    jsonb_build_object('provider', _pg.provider, 'label', COALESCE(_label, _pg.label)));
END; $$;

-- ============ RPC: LIST PAYMENT GATEWAYS ============
CREATE OR REPLACE FUNCTION public.list_payment_gateways(_organization UUID)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _items jsonb;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'NOT_AUTHENTICATED'; END IF;
  IF NOT has_permission(_organization, 'payments.view') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;

  SELECT coalesce(jsonb_agg(row_to_json(pg)), '[]'::jsonb) INTO _items
  FROM (
    SELECT id, organization_id, provider, label, enabled, settings, created_by, created_at, updated_at
    FROM public.payment_gateways
    WHERE organization_id = _organization
    ORDER BY provider, label
  ) pg;

  RETURN jsonb_build_object('items', _items);
END; $$;

-- ============ RPC: DELETE PAYMENT GATEWAY ============
CREATE OR REPLACE FUNCTION public.delete_payment_gateway(_gateway UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _pg public.payment_gateways;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'NOT_AUTHENTICATED'; END IF;
  SELECT * INTO _pg FROM public.payment_gateways WHERE id = _gateway;
  IF _pg.id IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF NOT has_permission(_pg.organization_id, 'payments.manage') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;

  -- Cannot delete if there are active payments using this gateway
  IF EXISTS (
    SELECT 1 FROM public.payments WHERE gateway_id = _gateway AND status IN ('PENDING','PROCESSING')
  ) THEN RAISE EXCEPTION 'GATEWAY_HAS_ACTIVE_PAYMENTS'; END IF;

  DELETE FROM public.payment_gateways WHERE id = _gateway;

  PERFORM write_audit(_pg.organization_id, 'PAYMENT_GATEWAY_DELETED', 'payment_gateway', _gateway,
    jsonb_build_object('provider', _pg.provider, 'label', _pg.label));
END; $$;

-- ============ RPC: RECORD WEBHOOK EVENT (idempotent) ============
CREATE OR REPLACE FUNCTION public.record_webhook_event(
  _organization UUID,
  _payment UUID,
  _provider public.payment_gateway_provider,
  _event_id TEXT,
  _event_type TEXT,
  _payload JSONB DEFAULT '{}'::jsonb
) RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.payment_webhook_events (organization_id, payment_id, provider, event_id, event_type, payload)
  VALUES (_organization, _payment, _provider, _event_id, _event_type, _payload)
  ON CONFLICT (provider, event_id) DO NOTHING;

  IF FOUND THEN
    PERFORM write_audit(_organization, 'WEBHOOK_RECEIVED', 'payment', _payment,
      jsonb_build_object('provider', _provider, 'event_id', _event_id, 'event_type', _event_type));
    RETURN true;
  END IF;
  RETURN false;
END; $$;

-- ============ RPC: PUBLIC GET PAYMENT (for checkout page polling) ============
CREATE OR REPLACE FUNCTION public.public_get_payment(_payment UUID)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _p jsonb;
BEGIN
  SELECT jsonb_build_object(
    'id', pay.id,
    'status', pay.status,
    'amount', pay.amount,
    'currency', pay.currency,
    'method', pay.method,
    'pix_code', pay.pix_code,
    'pix_qr_base64', pay.pix_qr_base64,
    'pix_expires_at', pay.pix_expires_at,
    'buyer_name', pay.buyer_name,
    'paid_at', pay.paid_at,
    'sale_id', pay.sale_id
  ) INTO _p
  FROM public.payments pay
  WHERE pay.id = _payment
    AND pay.status IN ('PENDING','PROCESSING','CONFIRMED','EXPIRED');

  IF _p IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  RETURN _p;
END; $$;

-- ============ REVOKE ANON FROM NEW FUNCTIONS ============
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'create_payment','update_payment_status','confirm_payment','cancel_payment',
        'expire_payment','expire_stale_payments','get_payment','list_payments',
        'campaign_payment_metrics','create_payment_gateway','update_payment_gateway',
        'list_payment_gateways','delete_payment_gateway','record_webhook_event',
        'encrypt_gateway_credentials','decrypt_gateway_credentials'
      )
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon, public', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated, service_role', r.sig);
  END LOOP;
END $$;

-- Allow anonymous access to public_get_payment only
REVOKE EXECUTE ON FUNCTION public.public_get_payment(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_get_payment(UUID) TO anon, authenticated, service_role;
