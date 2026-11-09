
-- ============================================================
-- SPRINT 5: PARTICIPANTS & MANUAL SALES
-- participants, manual_sales, manual_sale_items
-- ============================================================

-- ============ ENUMS ============
DO $$ BEGIN
  CREATE TYPE public.payment_method AS ENUM ('PIX','CASH','CARD','TRANSFER','OTHER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ TABLES ============
CREATE TABLE public.participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  document TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, phone)
);
CREATE INDEX idx_participants_org ON public.participants(organization_id);
CREATE INDEX idx_participants_campaign ON public.participants(campaign_id);
CREATE INDEX idx_participants_phone ON public.participants(campaign_id, phone);
CREATE TRIGGER participants_updated_at BEFORE UPDATE ON public.participants FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.manual_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  payment_method public.payment_method NOT NULL DEFAULT 'OTHER',
  amount NUMERIC NOT NULL DEFAULT 0 CHECK (amount >= 0),
  notes TEXT,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_manual_sales_org ON public.manual_sales(organization_id);
CREATE INDEX idx_manual_sales_campaign ON public.manual_sales(campaign_id);
CREATE INDEX idx_manual_sales_participant ON public.manual_sales(participant_id);
CREATE INDEX idx_manual_sales_created_by ON public.manual_sales(created_by);
CREATE TRIGGER manual_sales_updated_at BEFORE UPDATE ON public.manual_sales FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.manual_sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES public.manual_sales(id) ON DELETE CASCADE,
  campaign_number_id UUID NOT NULL REFERENCES public.campaign_numbers(id) ON DELETE CASCADE,
  number INTEGER NOT NULL,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (sale_id, campaign_number_id)
);
CREATE INDEX idx_manual_sale_items_sale ON public.manual_sale_items(sale_id);
CREATE INDEX idx_manual_sale_items_number ON public.manual_sale_items(campaign_number_id);

-- ============ GRANTS ============
GRANT SELECT ON public.participants TO authenticated;
GRANT SELECT ON public.manual_sales TO authenticated;
GRANT SELECT ON public.manual_sale_items TO authenticated;
GRANT ALL ON public.participants, public.manual_sales, public.manual_sale_items TO service_role;

-- ============ RLS ============
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manual_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manual_sale_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY participants_select_members ON public.participants FOR SELECT TO authenticated
USING (is_org_member(organization_id) OR is_global_admin());
CREATE POLICY participants_insert_members ON public.participants FOR INSERT TO authenticated
WITH CHECK (is_org_member(organization_id));
CREATE POLICY participants_update_members ON public.participants FOR UPDATE TO authenticated
USING (is_org_member(organization_id) OR is_global_admin());

CREATE POLICY manual_sales_select_members ON public.manual_sales FOR SELECT TO authenticated
USING (is_org_member(organization_id) OR is_global_admin());
CREATE POLICY manual_sales_insert_members ON public.manual_sales FOR INSERT TO authenticated
WITH CHECK (is_org_member(organization_id));
CREATE POLICY manual_sales_update_members ON public.manual_sales FOR UPDATE TO authenticated
USING (is_org_member(organization_id) OR is_global_admin());

CREATE POLICY manual_sale_items_select ON public.manual_sale_items FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.manual_sales s WHERE s.id = sale_id AND (is_org_member(s.organization_id) OR is_global_admin())
));

-- ============ GUARDS ============
CREATE OR REPLACE FUNCTION public.guard_participants()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _org UUID;
BEGIN
  SELECT organization_id INTO _org FROM public.campaigns WHERE id = NEW.campaign_id;
  IF _org IS NULL THEN RAISE EXCEPTION 'CAMPAIGN_NOT_FOUND'; END IF;
  NEW.organization_id := _org;
  RETURN NEW;
END; $$;
CREATE TRIGGER participants_guard BEFORE INSERT OR UPDATE ON public.participants
FOR EACH ROW EXECUTE FUNCTION public.guard_participants();

CREATE OR REPLACE FUNCTION public.guard_manual_sales()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _org UUID;
BEGIN
  SELECT organization_id INTO _org FROM public.campaigns WHERE id = NEW.campaign_id;
  IF _org IS NULL THEN RAISE EXCEPTION 'CAMPAIGN_NOT_FOUND'; END IF;
  NEW.organization_id := _org;
  RETURN NEW;
END; $$;
CREATE TRIGGER manual_sales_guard BEFORE INSERT OR UPDATE ON public.manual_sales
FOR EACH ROW EXECUTE FUNCTION public.guard_manual_sales();

-- ============ PERMISSIONS SEED ============
INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('OWNER','participants.view'),('OWNER','participants.manage'),
  ('OWNER','sales.view'),('OWNER','sales.manage'),
  ('ADMIN','participants.view'),('ADMIN','participants.manage'),
  ('ADMIN','sales.view'),('ADMIN','sales.manage'),
  ('MEMBER','participants.view'),('MEMBER','participants.manage'),
  ('MEMBER','sales.view'),('MEMBER','sales.manage'),
  ('VIEWER','participants.view'),('VIEWER','sales.view')
ON CONFLICT (role, permission_key) DO NOTHING;

-- ============ RPC: CREATE PARTICIPANT (with dedup) ============
CREATE OR REPLACE FUNCTION public.create_participant(
  _campaign UUID,
  _name TEXT,
  _phone TEXT DEFAULT NULL,
  _email TEXT DEFAULT NULL,
  _document TEXT DEFAULT NULL,
  _notes TEXT DEFAULT NULL
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _org UUID; _id UUID; _norm_phone TEXT;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'NOT_AUTHENTICATED'; END IF;
  SELECT organization_id INTO _org FROM public.campaigns WHERE id = _campaign;
  IF _org IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF NOT has_permission(_org, 'participants.manage') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF NOT org_is_active(_org) THEN RAISE EXCEPTION 'ORGANIZATION_NOT_ACTIVE'; END IF;
  IF _name IS NULL OR length(trim(_name)) = 0 THEN RAISE EXCEPTION 'INVALID_NAME'; END IF;

  _norm_phone := NULLIF(trim(regexp_replace(COALESCE(_phone,''), '[^0-9+]', '', 'g')), '');

  -- Dedup: reuse existing participant with same phone+campaign
  IF _norm_phone IS NOT NULL THEN
    SELECT id INTO _id FROM public.participants
    WHERE campaign_id = _campaign AND phone = _norm_phone LIMIT 1;
    IF _id IS NOT NULL THEN
      UPDATE public.participants SET
        name = COALESCE(NULLIF(trim(_name),''), name),
        email = COALESCE(NULLIF(trim(COALESCE(_email,'')),''), email),
        document = COALESCE(NULLIF(trim(COALESCE(_document,'')),''), document),
        notes = CASE WHEN _notes IS NULL THEN notes ELSE NULLIF(trim(_notes),'') END
      WHERE id = _id;
      RETURN _id;
    END IF;
  END IF;

  INSERT INTO public.participants (campaign_id, name, phone, email, document, notes)
  VALUES (_campaign, trim(_name), _norm_phone, NULLIF(trim(COALESCE(_email,'')),''),
    NULLIF(trim(COALESCE(_document,'')),''), NULLIF(trim(COALESCE(_notes,'')),''))
  RETURNING id INTO _id;

  PERFORM write_audit(_org, 'PARTICIPANT_CREATED', 'participant', _id,
    jsonb_build_object('name', trim(_name), 'phone', _norm_phone));
  RETURN _id;
END; $$;

-- ============ RPC: UPDATE PARTICIPANT ============
CREATE OR REPLACE FUNCTION public.update_participant(
  _participant UUID,
  _name TEXT DEFAULT NULL,
  _phone TEXT DEFAULT NULL,
  _email TEXT DEFAULT NULL,
  _document TEXT DEFAULT NULL,
  _notes TEXT DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _p public.participants; _norm_phone TEXT;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'NOT_AUTHENTICATED'; END IF;
  SELECT * INTO _p FROM public.participants WHERE id = _participant;
  IF _p.id IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF NOT has_permission(_p.organization_id, 'participants.manage') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;

  _norm_phone := NULLIF(trim(regexp_replace(COALESCE(_phone, _p.phone), '[^0-9+]', '', 'g')), '');

  UPDATE public.participants SET
    name = COALESCE(NULLIF(trim(COALESCE(_name,'')),''), name),
    phone = _norm_phone,
    email = CASE WHEN _email IS NULL THEN email ELSE NULLIF(trim(_email),'') END,
    document = CASE WHEN _document IS NULL THEN document ELSE NULLIF(trim(_document),'') END,
    notes = CASE WHEN _notes IS NULL THEN notes ELSE NULLIF(trim(_notes),'') END
  WHERE id = _participant;

  PERFORM write_audit(_p.organization_id, 'PARTICIPANT_UPDATED', 'participant', _participant, '{}'::jsonb);
END; $$;

-- ============ RPC: LIST PARTICIPANTS (with aggregates) ============
CREATE OR REPLACE FUNCTION public.list_participants(
  _campaign UUID,
  _search TEXT DEFAULT NULL,
  _limit INT DEFAULT 50,
  _offset INT DEFAULT 0
) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _org UUID; _total BIGINT; _items jsonb;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'NOT_AUTHENTICATED'; END IF;
  SELECT organization_id INTO _org FROM public.campaigns WHERE id = _campaign;
  IF _org IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF NOT has_permission(_org, 'participants.view') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;

  SELECT count(*) INTO _total FROM public.participants p
  WHERE p.campaign_id = _campaign
    AND (_search IS NULL OR p.name ILIKE '%' || _search || '%'
      OR p.phone ILIKE '%' || _search || '%'
      OR p.email ILIKE '%' || _search || '%');

  SELECT coalesce(jsonb_agg(row_to_json(sub)), '[]'::jsonb) INTO _items
  FROM (
    SELECT p.id, p.name, p.phone, p.email, p.document, p.notes, p.created_at,
      (SELECT count(*) FROM public.manual_sale_items msi
       JOIN public.manual_sales ms ON ms.id = msi.sale_id
       WHERE ms.participant_id = p.id AND ms.campaign_id = _campaign AND ms.cancelled_at IS NULL) AS numbers_count,
      COALESCE((SELECT sum(ms.amount) FROM public.manual_sales ms
       WHERE ms.participant_id = p.id AND ms.campaign_id = _campaign AND ms.cancelled_at IS NULL), 0) AS total_spent,
      (SELECT ms.created_at FROM public.manual_sales ms
       WHERE ms.participant_id = p.id AND ms.campaign_id = _campaign AND ms.cancelled_at IS NULL
       ORDER BY ms.created_at DESC LIMIT 1) AS last_purchase
    FROM public.participants p
    WHERE p.campaign_id = _campaign
      AND (_search IS NULL OR p.name ILIKE '%' || _search || '%'
        OR p.phone ILIKE '%' || _search || '%'
        OR p.email ILIKE '%' || _search || '%')
    ORDER BY p.created_at DESC
    LIMIT _limit OFFSET _offset
  ) sub;

  RETURN jsonb_build_object('items', _items, 'total', _total, 'limit', _limit, 'offset', _offset);
END; $$;

-- ============ RPC: GET PARTICIPANT HISTORY ============
CREATE OR REPLACE FUNCTION public.get_participant_history(_participant UUID)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _p public.participants; _sales jsonb;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'NOT_AUTHENTICATED'; END IF;
  SELECT * INTO _p FROM public.participants WHERE id = _participant;
  IF _p.id IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF NOT has_permission(_p.organization_id, 'participants.view') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;

  SELECT coalesce(jsonb_agg(row_to_json(ms) ORDER BY ms.created_at DESC), '[]'::jsonb) INTO _sales
  FROM public.manual_sales ms WHERE ms.participant_id = _participant AND ms.cancelled_at IS NULL;

  RETURN jsonb_build_object(
    'participant', jsonb_build_object('id', _p.id, 'name', _p.name, 'phone', _p.phone, 'email', _p.email),
    'sales', _sales
  );
END; $$;

-- ============ RPC: QUICK SALE (participant dedup + sale + numbers → SOLD) ============
CREATE OR REPLACE FUNCTION public.quick_sale(
  _campaign UUID,
  _name TEXT,
  _phone TEXT,
  _numbers INT[],
  _payment_method public.payment_method DEFAULT 'OTHER',
  _notes TEXT DEFAULT NULL
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _org UUID; _c public.campaigns; _participant_id UUID; _sale_id UUID;
  _total NUMERIC := 0; _num INT; _cn record;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'NOT_AUTHENTICATED'; END IF;
  SELECT * INTO _c FROM public.campaigns WHERE id = _campaign;
  IF _c.id IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  _org := _c.organization_id;
  IF NOT has_permission(_org, 'sales.manage') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF NOT org_is_active(_org) THEN RAISE EXCEPTION 'ORGANIZATION_NOT_ACTIVE'; END IF;

  IF _numbers IS NULL OR array_length(_numbers, 1) IS NULL THEN RAISE EXCEPTION 'NO_NUMBERS_SELECTED'; END IF;

  -- Create or find participant (dedup by phone+campaign)
  _participant_id := public.create_participant(_campaign, _name, _phone, NULL, NULL, _notes);

  -- Acquire lock per campaign to prevent concurrent sales
  PERFORM pg_advisory_xact_lock(hashtext('sale:' || _campaign::text));

  -- Create sale header
  INSERT INTO public.manual_sales (organization_id, campaign_id, participant_id, created_by, payment_method, amount, notes)
  VALUES (_org, _campaign, _participant_id, auth.uid(), _payment_method, 0, NULLIF(trim(COALESCE(_notes,'')),''))
  RETURNING id INTO _sale_id;

  -- Assign each number
  FOREACH _num IN ARRAY _numbers LOOP
    SELECT * INTO _cn FROM public.campaign_numbers
    WHERE campaign_id = _campaign AND number = _num AND status IN ('AVAILABLE','RESERVED');

    IF _cn.id IS NULL THEN
      RAISE EXCEPTION 'NUMBER_NOT_AVAILABLE';
    END IF;

    -- Release any active reservation for this number
    UPDATE public.number_reservations SET status = 'COMPLETED'
    WHERE campaign_id = _campaign AND status = 'ACTIVE'
      AND EXISTS (SELECT 1 FROM public.number_reservation_items ri
                   WHERE ri.reservation_id = number_reservations.id AND ri.campaign_number_id = _cn.id);

    UPDATE public.campaign_numbers SET status = 'SOLD', sold_at = now(),
      reserved_by = NULL, reserved_at = NULL, reservation_expires_at = NULL
    WHERE id = _cn.id;

    INSERT INTO public.manual_sale_items (sale_id, campaign_number_id, number, unit_price)
    VALUES (_sale_id, _cn.id, _num, _c.number_price);

    _total := _total + _c.number_price;
  END LOOP;

  UPDATE public.manual_sales SET amount = _total WHERE id = _sale_id;

  PERFORM write_audit(_org, 'SALE_CREATED', 'sale', _sale_id,
    jsonb_build_object('participant_id', _participant_id, 'numbers', to_jsonb(_numbers), 'amount', _total, 'method', _payment_method));

  RETURN _sale_id;
END; $$;

-- ============ RPC: CREATE MANUAL SALE (with existing participant) ============
CREATE OR REPLACE FUNCTION public.create_manual_sale(
  _campaign UUID,
  _participant_id UUID,
  _numbers INT[],
  _payment_method public.payment_method DEFAULT 'OTHER',
  _amount NUMERIC DEFAULT NULL,
  _notes TEXT DEFAULT NULL
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _org UUID; _c public.campaigns; _sale_id UUID;
  _total NUMERIC := 0; _num INT; _cn record;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'NOT_AUTHENTICATED'; END IF;
  SELECT * INTO _c FROM public.campaigns WHERE id = _campaign;
  IF _c.id IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  _org := _c.organization_id;
  IF NOT has_permission(_org, 'sales.manage') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF NOT org_is_active(_org) THEN RAISE EXCEPTION 'ORGANIZATION_NOT_ACTIVE'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.participants WHERE id = _participant_id AND campaign_id = _campaign) THEN
    RAISE EXCEPTION 'PARTICIPANT_NOT_FOUND';
  END IF;

  IF _numbers IS NULL OR array_length(_numbers, 1) IS NULL THEN RAISE EXCEPTION 'NO_NUMBERS_SELECTED'; END IF;

  PERFORM pg_advisory_xact_lock(hashtext('sale:' || _campaign::text));

  INSERT INTO public.manual_sales (organization_id, campaign_id, participant_id, created_by, payment_method, amount, notes)
  VALUES (_org, _campaign, _participant_id, auth.uid(), _payment_method, 0, NULLIF(trim(COALESCE(_notes,'')),''))
  RETURNING id INTO _sale_id;

  FOREACH _num IN ARRAY _numbers LOOP
    SELECT * INTO _cn FROM public.campaign_numbers
    WHERE campaign_id = _campaign AND number = _num AND status IN ('AVAILABLE','RESERVED');

    IF _cn.id IS NULL THEN
      RAISE EXCEPTION 'NUMBER_NOT_AVAILABLE';
    END IF;

    UPDATE public.number_reservations SET status = 'COMPLETED'
    WHERE campaign_id = _campaign AND status = 'ACTIVE'
      AND EXISTS (SELECT 1 FROM public.number_reservation_items ri
                   WHERE ri.reservation_id = number_reservations.id AND ri.campaign_number_id = _cn.id);

    UPDATE public.campaign_numbers SET status = 'SOLD', sold_at = now(),
      reserved_by = NULL, reserved_at = NULL, reservation_expires_at = NULL
    WHERE id = _cn.id;

    INSERT INTO public.manual_sale_items (sale_id, campaign_number_id, number, unit_price)
    VALUES (_sale_id, _cn.id, _num, _c.number_price);

    _total := _total + _c.number_price;
  END LOOP;

  UPDATE public.manual_sales SET amount = COALESCE(_amount, _total) WHERE id = _sale_id;

  PERFORM write_audit(_org, 'SALE_CREATED', 'sale', _sale_id,
    jsonb_build_object('participant_id', _participant_id, 'numbers', to_jsonb(_numbers), 'amount', COALESCE(_amount, _total)));

  RETURN _sale_id;
END; $$;

-- ============ RPC: UPDATE MANUAL SALE (add/remove numbers) ============
CREATE OR REPLACE FUNCTION public.update_manual_sale(
  _sale_id UUID,
  _add_numbers INT[] DEFAULT NULL,
  _remove_numbers INT[] DEFAULT NULL,
  _payment_method public.payment_method DEFAULT NULL,
  _amount NUMERIC DEFAULT NULL,
  _notes TEXT DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _s public.manual_sales; _c public.campaigns; _num INT; _cn record;
  _new_total NUMERIC;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'NOT_AUTHENTICATED'; END IF;
  SELECT * INTO _s FROM public.manual_sales WHERE id = _sale_id;
  IF _s.id IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF NOT has_permission(_s.organization_id, 'sales.manage') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF _s.cancelled_at IS NOT NULL THEN RAISE EXCEPTION 'SALE_CANCELLED'; END IF;

  SELECT * INTO _c FROM public.campaigns WHERE id = _s.campaign_id;

  -- Remove numbers
  IF _remove_numbers IS NOT NULL AND array_length(_remove_numbers, 1) > 0 THEN
    FOREACH _num IN ARRAY _remove_numbers LOOP
      UPDATE public.campaign_numbers SET status = 'AVAILABLE', sold_at = NULL
      WHERE id IN (SELECT msi.campaign_number_id FROM public.manual_sale_items msi
                   WHERE msi.sale_id = _sale_id AND msi.number = _num)
        AND status = 'SOLD';
      DELETE FROM public.manual_sale_items WHERE sale_id = _sale_id AND number = _num;
    END LOOP;
  END IF;

  -- Add numbers
  IF _add_numbers IS NOT NULL AND array_length(_add_numbers, 1) > 0 THEN
    PERFORM pg_advisory_xact_lock(hashtext('sale:' || _s.campaign_id::text));
    FOREACH _num IN ARRAY _add_numbers LOOP
      SELECT * INTO _cn FROM public.campaign_numbers
      WHERE campaign_id = _s.campaign_id AND number = _num AND status = 'AVAILABLE';
      IF _cn.id IS NULL THEN RAISE EXCEPTION 'NUMBER_NOT_AVAILABLE'; END IF;

      UPDATE public.campaign_numbers SET status = 'SOLD', sold_at = now()
      WHERE id = _cn.id;
      INSERT INTO public.manual_sale_items (sale_id, campaign_number_id, number, unit_price)
      VALUES (_sale_id, _cn.id, _num, _c.number_price);
    END LOOP;
  END IF;

  -- Recalculate total
  SELECT COALESCE(sum(unit_price), 0) INTO _new_total
  FROM public.manual_sale_items WHERE sale_id = _sale_id;

  UPDATE public.manual_sales SET
    amount = COALESCE(_amount, _new_total),
    payment_method = COALESCE(_payment_method, payment_method),
    notes = CASE WHEN _notes IS NULL THEN notes ELSE NULLIF(trim(_notes),'') END
  WHERE id = _sale_id;

  PERFORM write_audit(_s.organization_id, 'SALE_UPDATED', 'sale', _sale_id,
    jsonb_build_object('add_numbers', to_jsonb(COALESCE(_add_numbers, ARRAY[]::int[])),
                       'remove_numbers', to_jsonb(COALESCE(_remove_numbers, ARRAY[]::int[]))));
END; $$;

-- ============ RPC: CANCEL MANUAL SALE ============
CREATE OR REPLACE FUNCTION public.cancel_manual_sale(_sale_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _s public.manual_sales; _item record;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'NOT_AUTHENTICATED'; END IF;
  SELECT * INTO _s FROM public.manual_sales WHERE id = _sale_id;
  IF _s.id IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF NOT has_permission(_s.organization_id, 'sales.manage') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF _s.cancelled_at IS NOT NULL THEN RAISE EXCEPTION 'SALE_ALREADY_CANCELLED'; END IF;

  -- Release numbers back to AVAILABLE
  FOR _item IN SELECT campaign_number_id FROM public.manual_sale_items WHERE sale_id = _sale_id LOOP
    UPDATE public.campaign_numbers SET status = 'AVAILABLE', sold_at = NULL
    WHERE id = _item.campaign_number_id AND status = 'SOLD';
  END LOOP;

  UPDATE public.manual_sales SET cancelled_at = now() WHERE id = _sale_id;

  PERFORM write_audit(_s.organization_id, 'SALE_CANCELLED', 'sale', _sale_id,
    jsonb_build_object('participant_id', _s.participant_id, 'amount', _s.amount));
END; $$;

-- ============ RPC: TRANSFER NUMBERS BETWEEN PARTICIPANTS ============
CREATE OR REPLACE FUNCTION public.transfer_numbers(
  _sale_id UUID,
  _to_participant UUID,
  _numbers INT[]
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _s public.manual_sales; _c public.campaigns; _new_sale_id UUID;
  _total NUMERIC := 0; _num INT; _cn record;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'NOT_AUTHENTICATED'; END IF;
  SELECT * INTO _s FROM public.manual_sales WHERE id = _sale_id;
  IF _s.id IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF NOT has_permission(_s.organization_id, 'sales.manage') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF _s.cancelled_at IS NOT NULL THEN RAISE EXCEPTION 'SALE_CANCELLED'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.participants WHERE id = _to_participant AND campaign_id = _s.campaign_id) THEN
    RAISE EXCEPTION 'PARTICIPANT_NOT_FOUND';
  END IF;

  SELECT * INTO _c FROM public.campaigns WHERE id = _s.campaign_id;
  PERFORM pg_advisory_xact_lock(hashtext('sale:' || _s.campaign_id::text));

  -- Create new sale for the target participant (original sale untouched)
  INSERT INTO public.manual_sales (organization_id, campaign_id, participant_id, created_by, payment_method, amount, notes)
  VALUES (_s.organization_id, _s.campaign_id, _to_participant, auth.uid(), _s.payment_method, 0,
    'Transfer from sale ' || _sale_id::text)
  RETURNING id INTO _new_sale_id;

  FOREACH _num IN ARRAY _numbers LOOP
    -- Verify number belongs to original sale
    IF NOT EXISTS (SELECT 1 FROM public.manual_sale_items WHERE sale_id = _sale_id AND number = _num) THEN
      RAISE EXCEPTION 'NUMBER_NOT_IN_SALE';
    END IF;

    -- Move number ownership
    UPDATE public.manual_sale_items SET sale_id = _new_sale_id WHERE sale_id = _sale_id AND number = _num;
    SELECT unit_price INTO _cn FROM public.manual_sale_items WHERE sale_id = _new_sale_id AND number = _num;
    _total := _total + COALESCE(_cn, 0);
  END LOOP;

  UPDATE public.manual_sales SET amount = _total WHERE id = _new_sale_id;

  -- Recalculate original sale total
  UPDATE public.manual_sales SET amount = GREATEST(0, (
    SELECT COALESCE(sum(unit_price), 0) FROM public.manual_sale_items WHERE sale_id = _sale_id
  )) WHERE id = _sale_id;

  PERFORM write_audit(_s.organization_id, 'NUMBERS_TRANSFERRED', 'sale', _sale_id,
    jsonb_build_object('to_participant', _to_participant, 'numbers', to_jsonb(_numbers), 'new_sale_id', _new_sale_id));
END; $$;

-- ============ RPC: LIST MANUAL SALES ============
CREATE OR REPLACE FUNCTION public.list_manual_sales(
  _campaign UUID,
  _search TEXT DEFAULT NULL,
  _limit INT DEFAULT 50,
  _offset INT DEFAULT 0
) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _org UUID; _total BIGINT; _items jsonb;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'NOT_AUTHENTICATED'; END IF;
  SELECT organization_id INTO _org FROM public.campaigns WHERE id = _campaign;
  IF _org IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF NOT has_permission(_org, 'sales.view') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;

  SELECT count(*) INTO _total FROM public.manual_sales ms
  JOIN public.participants p ON p.id = ms.participant_id
  WHERE ms.campaign_id = _campaign AND ms.cancelled_at IS NULL
    AND (_search IS NULL OR p.name ILIKE '%' || _search || '%'
      OR p.phone ILIKE '%' || _search || '%');

  SELECT coalesce(jsonb_agg(row_to_json(sub)), '[]'::jsonb) INTO _items
  FROM (
    SELECT ms.id, ms.amount, ms.payment_method, ms.notes, ms.cancelled_at, ms.created_at,
      p.name AS participant_name, p.phone AS participant_phone,
      (SELECT count(*) FROM public.manual_sale_items WHERE sale_id = ms.id) AS numbers_count,
      (SELECT coalesce(jsonb_agg(number ORDER BY number), '[]'::jsonb)
       FROM public.manual_sale_items WHERE sale_id = ms.id) AS numbers
    FROM public.manual_sales ms
    JOIN public.participants p ON p.id = ms.participant_id
    WHERE ms.campaign_id = _campaign AND ms.cancelled_at IS NULL
      AND (_search IS NULL OR p.name ILIKE '%' || _search || '%'
        OR p.phone ILIKE '%' || _search || '%')
    ORDER BY ms.created_at DESC
    LIMIT _limit OFFSET _offset
  ) sub;

  RETURN jsonb_build_object('items', _items, 'total', _total, 'limit', _limit, 'offset', _offset);
END; $$;

-- ============ RPC: CAMPAIGN SALES METRICS ============
CREATE OR REPLACE FUNCTION public.campaign_sales_metrics(_campaign UUID)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _org UUID; _m jsonb;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'NOT_AUTHENTICATED'; END IF;
  SELECT organization_id INTO _org FROM public.campaigns WHERE id = _campaign;
  IF _org IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF NOT has_permission(_org, 'sales.view') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;

  SELECT jsonb_build_object(
    'revenue', COALESCE(sum(ms.amount), 0),
    'average_ticket', CASE WHEN count(*) > 0 THEN sum(ms.amount) / count(*) ELSE 0 END,
    'participants_count', count(DISTINCT ms.participant_id),
    'numbers_sold', (SELECT count(*) FROM public.campaign_numbers WHERE campaign_id = _campaign AND status = 'SOLD'),
    'total_sales', count(*)
  ) INTO _m
  FROM public.manual_sales ms WHERE ms.campaign_id = _campaign AND ms.cancelled_at IS NULL;

  RETURN _m;
END; $$;

-- ============ RPC: LIST CAMPAIGN NUMBERS WITH PARTICIPANT ============
CREATE OR REPLACE FUNCTION public.list_campaign_numbers_with_participant(
  _campaign UUID,
  _status TEXT DEFAULT NULL,
  _search TEXT DEFAULT NULL,
  _limit INT DEFAULT 50,
  _offset INT DEFAULT 0
) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _org UUID; _total BIGINT; _items jsonb;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'NOT_AUTHENTICATED'; END IF;
  SELECT organization_id INTO _org FROM public.campaigns WHERE id = _campaign;
  IF _org IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF NOT has_permission(_org, 'numbers.view') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;

  SELECT count(*) INTO _total FROM public.campaign_numbers cn
  WHERE cn.campaign_id = _campaign
    AND (_status IS NULL OR cn.status::text = _status);

  SELECT coalesce(jsonb_agg(row_to_json(cn)), '[]'::jsonb) INTO _items
  FROM (
    SELECT cn.id, cn.number, cn.status, cn.sold_at, cn.created_at,
      p.name AS participant_name, p.phone AS participant_phone, p.email AS participant_email,
      ms.payment_method, ms.amount AS sale_amount
    FROM public.campaign_numbers cn
    LEFT JOIN public.manual_sale_items msi ON msi.campaign_number_id = cn.id
    LEFT JOIN public.manual_sales ms ON ms.id = msi.sale_id AND ms.cancelled_at IS NULL
    LEFT JOIN public.participants p ON p.id = ms.participant_id
    WHERE cn.campaign_id = _campaign
      AND (_status IS NULL OR cn.status::text = _status)
    ORDER BY cn.number
    LIMIT _limit OFFSET _offset
  ) cn;

  RETURN jsonb_build_object('items', _items, 'total', _total, 'limit', _limit, 'offset', _offset);
END; $$;

-- ============ RPC: EXPORT PARTICIPANTS CSV ============
CREATE OR REPLACE FUNCTION public.export_participants_csv(_campaign UUID)
RETURNS TEXT LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _org UUID; _lines TEXT; _line TEXT; _p record;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'NOT_AUTHENTICATED'; END IF;
  SELECT organization_id INTO _org FROM public.campaigns WHERE id = _campaign;
  IF _org IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF NOT has_permission(_org, 'participants.view') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;

  _lines := 'Name,Phone,Email,Document,Numbers,Total Spent,Created At' || E'\n';

  FOR _p IN
    SELECT p.name, p.phone, p.email, p.document, p.created_at,
      (SELECT count(*) FROM public.manual_sale_items msi
       JOIN public.manual_sales ms ON ms.id = msi.sale_id
       WHERE ms.participant_id = p.id AND ms.campaign_id = _campaign AND ms.cancelled_at IS NULL) AS numbers_count,
      COALESCE((SELECT sum(ms.amount) FROM public.manual_sales ms
       WHERE ms.participant_id = p.id AND ms.campaign_id = _campaign AND ms.cancelled_at IS NULL), 0) AS total_spent
    FROM public.participants p WHERE p.campaign_id = _campaign ORDER BY p.name
  LOOP
    _line := '"' || replace(COALESCE(_p.name,''), '"', '""') || '",'
      || '"' || replace(COALESCE(_p.phone,''), '"', '""') || '",'
      || '"' || replace(COALESCE(_p.email,''), '"', '""') || '",'
      || '"' || replace(COALESCE(_p.document,''), '"', '""') || '",'
      || _p.numbers_count || ','
      || _p.total_spent || ','
      || to_char(_p.created_at, 'YYYY-MM-DD HH24:MI:SS');
    _lines := _lines || _line || E'\n';
  END LOOP;

  RETURN _lines;
END; $$;

-- ============ RPC: EXPORT SALES CSV ============
CREATE OR REPLACE FUNCTION public.export_sales_csv(_campaign UUID)
RETURNS TEXT LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _org UUID; _lines TEXT; _line TEXT; _s record;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'NOT_AUTHENTICATED'; END IF;
  SELECT organization_id INTO _org FROM public.campaigns WHERE id = _campaign;
  IF _org IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF NOT has_permission(_org, 'sales.view') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;

  _lines := 'Participant,Phone,Numbers,Amount,Payment Method,Created At' || E'\n';

  FOR _s IN
    SELECT p.name, p.phone, ms.amount, ms.payment_method, ms.created_at,
      (SELECT coalesce(string_agg(number::text, ',' ORDER BY number), '') FROM public.manual_sale_items WHERE sale_id = ms.id) AS numbers
    FROM public.manual_sales ms
    JOIN public.participants p ON p.id = ms.participant_id
    WHERE ms.campaign_id = _campaign AND ms.cancelled_at IS NULL
    ORDER BY ms.created_at DESC
  LOOP
    _line := '"' || replace(COALESCE(_s.name,''), '"', '""') || '",'
      || '"' || replace(COALESCE(_s.phone,''), '"', '""') || '",'
      || '"' || _s.numbers || '",'
      || _s.amount || ','
      || _s.payment_method || ','
      || to_char(_s.created_at, 'YYYY-MM-DD HH24:MI:SS');
    _lines := _lines || _line || E'\n';
  END LOOP;

  RETURN _lines;
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
        'create_participant','update_participant','list_participants','get_participant_history',
        'quick_sale','create_manual_sale','update_manual_sale','cancel_manual_sale','transfer_numbers',
        'list_manual_sales','campaign_sales_metrics','list_campaign_numbers_with_participant',
        'export_participants_csv','export_sales_csv',
        'generate_campaign_numbers','list_campaign_numbers_admin','campaign_number_metrics',
        'public_campaign_numbers','reserve_numbers','cancel_reservation','expire_reservation',
        'expire_stale_reservations','get_active_reservation','admin_cancel_reservation',
        'admin_block_numbers','admin_unblock_numbers'
      )
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon, public', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated, service_role', r.sig);
  END LOOP;
END $$;

-- Allow anonymous access to public_campaign_numbers only
REVOKE EXECUTE ON FUNCTION public.public_campaign_numbers(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_campaign_numbers(TEXT) TO anon, authenticated, service_role;
