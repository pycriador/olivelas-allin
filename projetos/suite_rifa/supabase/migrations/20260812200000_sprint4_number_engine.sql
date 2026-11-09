
-- ============================================================
-- SPRINT 4: NUMBER ENGINE
-- campaign_numbers, number_reservations, number_reservation_items
-- ============================================================

-- ============ ENUMS ============
DO $$ BEGIN
  CREATE TYPE public.number_status AS ENUM ('AVAILABLE','RESERVED','SOLD','BLOCKED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.reservation_status AS ENUM ('ACTIVE','EXPIRED','CANCELLED','COMPLETED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ TABLES ============
CREATE TABLE public.campaign_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  number INTEGER NOT NULL CHECK (number > 0),
  status public.number_status NOT NULL DEFAULT 'AVAILABLE',
  reserved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reserved_at TIMESTAMPTZ,
  reservation_expires_at TIMESTAMPTZ,
  sold_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, number)
);
CREATE INDEX idx_campaign_numbers_org ON public.campaign_numbers(organization_id);
CREATE INDEX idx_campaign_numbers_campaign ON public.campaign_numbers(campaign_id);
CREATE INDEX idx_campaign_numbers_status ON public.campaign_numbers(campaign_id, status);
CREATE INDEX idx_campaign_numbers_reserved_by ON public.campaign_numbers(reserved_by);
CREATE INDEX idx_campaign_numbers_expires ON public.campaign_numbers(reservation_expires_at) WHERE status = 'RESERVED';
CREATE TRIGGER campaign_numbers_updated_at BEFORE UPDATE ON public.campaign_numbers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.number_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status public.reservation_status NOT NULL DEFAULT 'ACTIVE',
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_number_reservations_org ON public.number_reservations(organization_id);
CREATE INDEX idx_number_reservations_campaign ON public.number_reservations(campaign_id);
CREATE INDEX idx_number_reservations_user ON public.number_reservations(user_id);
CREATE INDEX idx_number_reservations_status ON public.number_reservations(campaign_id, status);
CREATE INDEX idx_number_reservations_expires ON public.number_reservations(expires_at) WHERE status = 'ACTIVE';
CREATE TRIGGER number_reservations_updated_at BEFORE UPDATE ON public.number_reservations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.number_reservation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES public.number_reservations(id) ON DELETE CASCADE,
  campaign_number_id UUID NOT NULL REFERENCES public.campaign_numbers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (reservation_id, campaign_number_id)
);
CREATE INDEX idx_number_reservation_items_reservation ON public.number_reservation_items(reservation_id);
CREATE INDEX idx_number_reservation_items_number ON public.number_reservation_items(campaign_number_id);

-- ============ GRANTS ============
GRANT SELECT ON public.campaign_numbers TO authenticated;
GRANT SELECT ON public.number_reservations TO authenticated;
GRANT SELECT ON public.number_reservation_items TO authenticated;
GRANT ALL ON public.campaign_numbers, public.number_reservations, public.number_reservation_items TO service_role;

-- ============ RLS ============
ALTER TABLE public.campaign_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.number_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.number_reservation_items ENABLE ROW LEVEL SECURITY;

-- campaign_numbers: members read; admins write (writes go through RPCs)
CREATE POLICY campaign_numbers_select_members ON public.campaign_numbers FOR SELECT TO authenticated
USING (is_org_member(organization_id) OR is_global_admin());
CREATE POLICY campaign_numbers_select_public ON public.campaign_numbers FOR SELECT TO anon
USING (EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id = campaign_id AND c.status IN ('PUBLISHED','PAUSED','FINISHED')));

-- number_reservations: members read their org; users read their own
CREATE POLICY number_reservations_select_members ON public.number_reservations FOR SELECT TO authenticated
USING (is_org_member(organization_id) OR is_global_admin() OR user_id = auth.uid());
CREATE POLICY number_reservations_insert_auth ON public.number_reservations FOR INSERT TO authenticated
WITH CHECK (is_org_member(organization_id) AND user_id = auth.uid());
CREATE POLICY number_reservations_update_members ON public.number_reservations FOR UPDATE TO authenticated
USING (is_org_member(organization_id) OR is_global_admin() OR user_id = auth.uid());

-- number_reservation_items: cascade via parent reservation
CREATE POLICY number_reservation_items_select ON public.number_reservation_items FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.number_reservations r
  WHERE r.id = reservation_id AND (is_org_member(r.organization_id) OR is_global_admin() OR r.user_id = auth.uid())
));

-- ============ GUARD: organization_id must match campaign ============
CREATE OR REPLACE FUNCTION public.guard_campaign_numbers()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _org UUID;
BEGIN
  SELECT organization_id INTO _org FROM public.campaigns WHERE id = NEW.campaign_id;
  IF _org IS NULL THEN RAISE EXCEPTION 'CAMPAIGN_NOT_FOUND'; END IF;
  NEW.organization_id := _org;
  RETURN NEW;
END; $$;
CREATE TRIGGER campaign_numbers_guard BEFORE INSERT OR UPDATE ON public.campaign_numbers
FOR EACH ROW EXECUTE FUNCTION public.guard_campaign_numbers();

CREATE OR REPLACE FUNCTION public.guard_number_reservations()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _org UUID;
BEGIN
  SELECT organization_id INTO _org FROM public.campaigns WHERE id = NEW.campaign_id;
  IF _org IS NULL THEN RAISE EXCEPTION 'CAMPAIGN_NOT_FOUND'; END IF;
  NEW.organization_id := _org;
  RETURN NEW;
END; $$;
CREATE TRIGGER number_reservations_guard BEFORE INSERT OR UPDATE ON public.number_reservations
FOR EACH ROW EXECUTE FUNCTION public.guard_number_reservations();

-- ============ APP SETTINGS ============
INSERT INTO public.app_settings (key, value) VALUES
  ('reservation_ttl_minutes', '10'::jsonb),
  ('max_numbers_per_reservation', '10'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- ============ PERMISSIONS SEED ============
INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('OWNER','numbers.view'),('OWNER','numbers.manage'),
  ('OWNER','reservations.view'),('OWNER','reservations.manage'),
  ('ADMIN','numbers.view'),('ADMIN','numbers.manage'),
  ('ADMIN','reservations.view'),('ADMIN','reservations.manage'),
  ('MEMBER','numbers.view'),('MEMBER','numbers.manage'),
  ('MEMBER','reservations.view'),
  ('VIEWER','numbers.view'),('VIEWER','reservations.view')
ON CONFLICT (role, permission_key) DO NOTHING;

-- ============ RPC: GENERATE CAMPAIGN NUMBERS ============
CREATE OR REPLACE FUNCTION public.generate_campaign_numbers(_campaign UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _c public.campaigns; _i INT; _exists INT;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'NOT_AUTHENTICATED'; END IF;
  SELECT * INTO _c FROM public.campaigns WHERE id = _campaign;
  IF _c.id IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF NOT has_permission(_c.organization_id, 'numbers.manage') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF NOT org_is_active(_c.organization_id) THEN RAISE EXCEPTION 'ORGANIZATION_NOT_ACTIVE'; END IF;

  SELECT count(*) INTO _exists FROM public.campaign_numbers WHERE campaign_id = _campaign;
  IF _exists > 0 THEN RETURN; END IF;

  FOR _i IN 1.._c.total_numbers LOOP
    INSERT INTO public.campaign_numbers (campaign_id, number)
    VALUES (_campaign, _i) ON CONFLICT DO NOTHING;
  END LOOP;

  PERFORM write_audit(_c.organization_id, 'NUMBERS_GENERATED', 'campaign', _campaign,
    jsonb_build_object('count', _c.total_numbers));
END; $$;

-- ============ RPC: LIST CAMPAIGN NUMBERS (admin) ============
CREATE OR REPLACE FUNCTION public.list_campaign_numbers_admin(
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
    AND (_status IS NULL OR cn.status::text = _status)
    AND (_search IS NULL OR cn.number::text LIKE '%' || _search || '%');

  SELECT coalesce(jsonb_agg(row_to_json(cn)), '[]'::jsonb) INTO _items
  FROM (
    SELECT cn.id, cn.number, cn.status, cn.reserved_by, cn.reserved_at,
           cn.reservation_expires_at, cn.sold_at, cn.created_at,
           p.full_name AS reserved_by_name
    FROM public.campaign_numbers cn
    LEFT JOIN public.profiles p ON p.id = cn.reserved_by
    WHERE cn.campaign_id = _campaign
      AND (_status IS NULL OR cn.status::text = _status)
      AND (_search IS NULL OR cn.number::text LIKE '%' || _search || '%')
    ORDER BY cn.number
    LIMIT _limit OFFSET _offset
  ) cn;

  RETURN jsonb_build_object('items', _items, 'total', _total, 'limit', _limit, 'offset', _offset);
END; $$;

-- ============ RPC: CAMPAIGN NUMBER METRICS ============
CREATE OR REPLACE FUNCTION public.campaign_number_metrics(_campaign UUID)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _org UUID; _m jsonb;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'NOT_AUTHENTICATED'; END IF;
  SELECT organization_id INTO _org FROM public.campaigns WHERE id = _campaign;
  IF _org IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF NOT has_permission(_org, 'numbers.view') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;

  SELECT jsonb_build_object(
    'sold', count(*) FILTER (WHERE status = 'SOLD'),
    'reserved', count(*) FILTER (WHERE status = 'RESERVED'),
    'blocked', count(*) FILTER (WHERE status = 'BLOCKED'),
    'available', count(*) FILTER (WHERE status = 'AVAILABLE'),
    'total', count(*)
  ) INTO _m FROM public.campaign_numbers WHERE campaign_id = _campaign;

  RETURN _m;
END; $$;

-- ============ RPC: PUBLIC CAMPAIGN NUMBERS ============
CREATE OR REPLACE FUNCTION public.public_campaign_numbers(_slug TEXT)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _c public.campaigns; _numbers jsonb;
BEGIN
  SELECT * INTO _c FROM public.campaigns WHERE slug = _slug;
  IF _c.id IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF _c.status NOT IN ('PUBLISHED','PAUSED','FINISHED') THEN RAISE EXCEPTION 'CAMPAIGN_NOT_LIVE'; END IF;

  SELECT coalesce(jsonb_agg(jsonb_build_object('number', cn.number, 'status', cn.status) ORDER BY cn.number), '[]'::jsonb)
  INTO _numbers
  FROM public.campaign_numbers cn
  WHERE cn.campaign_id = _c.id;

  RETURN jsonb_build_object(
    'campaign_id', _c.id,
    'name', _c.name,
    'total_numbers', _c.total_numbers,
    'number_price', _c.number_price,
    'currency', _c.currency,
    'numbers', _numbers
  );
END; $$;

-- ============ RPC: RESERVE NUMBERS (transactional, all-or-nothing) ============
CREATE OR REPLACE FUNCTION public.reserve_numbers(
  _campaign UUID,
  _numbers INT[]
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _c public.campaigns; _uid UUID; _reservation_id UUID;
  _ttl INT; _expires TIMESTAMPTZ; _num INT; _cn_id UUID;
  _max INT; _count INT;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'NOT_AUTHENTICATED'; END IF;
  _uid := auth.uid();
  SELECT * INTO _c FROM public.campaigns WHERE id = _campaign;
  IF _c.id IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF NOT org_is_active(_c.organization_id) THEN RAISE EXCEPTION 'ORGANIZATION_NOT_ACTIVE'; END IF;

  IF _numbers IS NULL OR array_length(_numbers, 1) IS NULL THEN RAISE EXCEPTION 'NO_NUMBERS_SELECTED'; END IF;

  _max := public.app_setting_int('max_numbers_per_reservation', 10);
  IF array_length(_numbers, 1) > _max THEN RAISE EXCEPTION 'TOO_MANY_NUMBERS'; END IF;

  _ttl := public.app_setting_int('reservation_ttl_minutes', 10);
  _expires := now() + (_ttl || ' minutes')::interval;

  -- Acquire advisory lock per user per campaign (serialization)
  PERFORM pg_advisory_xact_lock(hashtext('reservation:' || _campaign::text || ':' || _uid::text));

  -- Cancel any existing active reservation for this user+campaign
  UPDATE public.number_reservations SET status = 'CANCELLED'
  WHERE campaign_id = _campaign AND user_id = _uid AND status = 'ACTIVE';

  -- Release any previously reserved numbers
  UPDATE public.campaign_numbers SET status = 'AVAILABLE', reserved_by = NULL,
    reserved_at = NULL, reservation_expires_at = NULL
  WHERE campaign_id = _campaign AND reserved_by = _uid AND status = 'RESERVED';

  -- Create reservation header
  INSERT INTO public.number_reservations (organization_id, campaign_id, user_id, expires_at)
  VALUES (_c.organization_id, _campaign, _uid, _expires)
  RETURNING id INTO _reservation_id;

  -- Try to reserve each number (all-or-nothing)
  FOREACH _num IN ARRAY _numbers LOOP
    UPDATE public.campaign_numbers
    SET status = 'RESERVED', reserved_by = _uid, reserved_at = now(), reservation_expires_at = _expires,
        sold_at = NULL
    WHERE campaign_id = _campaign AND number = _num AND status = 'AVAILABLE'
    RETURNING id INTO _cn_id;

    IF _cn_id IS NULL THEN
      RAISE EXCEPTION 'NUMBER_NOT_AVAILABLE';
    END IF;

    INSERT INTO public.number_reservation_items (reservation_id, campaign_number_id)
    VALUES (_reservation_id, _cn_id);
  END LOOP;

  PERFORM write_audit(_c.organization_id, 'NUMBERS_RESERVED', 'reservation', _reservation_id,
    jsonb_build_object('numbers', to_jsonb(_numbers), 'expires_at', _expires));

  RETURN _reservation_id;
END; $$;

-- ============ RPC: CANCEL RESERVATION ============
CREATE OR REPLACE FUNCTION public.cancel_reservation(_reservation_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _r public.number_reservations; _c public.campaigns;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'NOT_AUTHENTICATED'; END IF;
  SELECT * INTO _r FROM public.number_reservations WHERE id = _reservation_id;
  IF _r.id IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF _r.user_id <> auth.uid() AND NOT has_permission(_r.organization_id, 'reservations.manage') THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;
  IF _r.status <> 'ACTIVE' THEN RAISE EXCEPTION 'RESERVATION_NOT_ACTIVE'; END IF;

  UPDATE public.number_reservations SET status = 'CANCELLED' WHERE id = _reservation_id;
  UPDATE public.campaign_numbers SET status = 'AVAILABLE', reserved_by = NULL,
    reserved_at = NULL, reservation_expires_at = NULL
  WHERE campaign_id = _r.campaign_id AND reserved_by = _r.user_id AND status = 'RESERVED'
    AND EXISTS (SELECT 1 FROM public.number_reservation_items ri WHERE ri.reservation_id = _reservation_id AND ri.campaign_number_id = campaign_numbers.id);

  SELECT * INTO _c FROM public.campaigns WHERE id = _r.campaign_id;
  PERFORM write_audit(_r.organization_id, 'RESERVATION_CANCELLED', 'reservation', _reservation_id,
    jsonb_build_object('user_id', _r.user_id));
END; $$;

-- ============ RPC: EXPIRE RESERVATION (called by cron or lazy) ============
CREATE OR REPLACE FUNCTION public.expire_reservation(_reservation_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _r public.number_reservations;
BEGIN
  SELECT * INTO _r FROM public.number_reservations WHERE id = _reservation_id;
  IF _r.id IS NULL THEN RETURN; END IF;
  IF _r.status <> 'ACTIVE' THEN RETURN; END IF;

  UPDATE public.number_reservations SET status = 'EXPIRED' WHERE id = _reservation_id AND status = 'ACTIVE';
  UPDATE public.campaign_numbers SET status = 'AVAILABLE', reserved_by = NULL,
    reserved_at = NULL, reservation_expires_at = NULL
  WHERE campaign_id = _r.campaign_id AND reserved_by = _r.user_id AND status = 'RESERVED'
    AND reservation_expires_at <= now()
    AND EXISTS (SELECT 1 FROM public.number_reservation_items ri WHERE ri.reservation_id = _reservation_id AND ri.campaign_number_id = campaign_numbers.id);

  PERFORM write_audit(_r.organization_id, 'RESERVATION_EXPIRED', 'reservation', _reservation_id,
    jsonb_build_object('user_id', _r.user_id));
END; $$;

-- ============ RPC: EXPIRE STALE RESERVATIONS (batch) ============
CREATE OR REPLACE FUNCTION public.expire_stale_reservations()
RETURNS INT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _r RECORD; _count INT := 0;
BEGIN
  FOR _r IN
    SELECT id FROM public.number_reservations
    WHERE status = 'ACTIVE' AND expires_at <= now()
    LIMIT 100
  LOOP
    PERFORM public.expire_reservation(_r.id);
    _count := _count + 1;
  END LOOP;
  RETURN _count;
END; $$;

-- ============ RPC: GET ACTIVE RESERVATION ============
CREATE OR REPLACE FUNCTION public.get_active_reservation(_campaign UUID)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid UUID; _r public.number_reservations; _items jsonb;
BEGIN
  IF auth.uid() IS NULL THEN RETURN NULL; END IF;
  _uid := auth.uid();

  -- Lazy expire before returning
  UPDATE public.number_reservations SET status = 'EXPIRED'
  WHERE campaign_id = _campaign AND user_id = _uid AND status = 'ACTIVE' AND expires_at <= now();
  UPDATE public.campaign_numbers SET status = 'AVAILABLE', reserved_by = NULL,
    reserved_at = NULL, reservation_expires_at = NULL
  WHERE campaign_id = _campaign AND reserved_by = _uid AND status = 'RESERVED' AND reservation_expires_at <= now();

  SELECT * INTO _r FROM public.number_reservations
  WHERE campaign_id = _campaign AND user_id = _uid AND status = 'ACTIVE'
  ORDER BY created_at DESC LIMIT 1;

  IF _r.id IS NULL THEN RETURN NULL; END IF;

  SELECT coalesce(jsonb_agg(cn.number ORDER BY cn.number), '[]'::jsonb) INTO _items
  FROM public.number_reservation_items ri
  JOIN public.campaign_numbers cn ON cn.id = ri.campaign_number_id
  WHERE ri.reservation_id = _r.id;

  RETURN jsonb_build_object(
    'id', _r.id,
    'status', _r.status,
    'expires_at', _r.expires_at,
    'numbers', _items
  );
END; $$;

-- ============ RPC: ADMIN CANCEL RESERVATION ============
CREATE OR REPLACE FUNCTION public.admin_cancel_reservation(_reservation_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _r public.number_reservations;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'NOT_AUTHENTICATED'; END IF;
  SELECT * INTO _r FROM public.number_reservations WHERE id = _reservation_id;
  IF _r.id IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF NOT has_permission(_r.organization_id, 'reservations.manage') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;

  UPDATE public.number_reservations SET status = 'CANCELLED' WHERE id = _reservation_id AND status = 'ACTIVE';
  UPDATE public.campaign_numbers SET status = 'AVAILABLE', reserved_by = NULL,
    reserved_at = NULL, reservation_expires_at = NULL
  WHERE campaign_id = _r.campaign_id AND status = 'RESERVED'
    AND EXISTS (SELECT 1 FROM public.number_reservation_items ri WHERE ri.reservation_id = _reservation_id AND ri.campaign_number_id = campaign_numbers.id);

  PERFORM write_audit(_r.organization_id, 'ADMIN_RESERVATION_CANCELLED', 'reservation', _reservation_id,
    jsonb_build_object('cancelled_by', auth.uid()));
END; $$;

-- ============ RPC: ADMIN BLOCK NUMBERS ============
CREATE OR REPLACE FUNCTION public.admin_block_numbers(_campaign UUID, _numbers INT[])
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _c public.campaigns; _num INT; _blocked INT := 0;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'NOT_AUTHENTICATED'; END IF;
  SELECT * INTO _c FROM public.campaigns WHERE id = _campaign;
  IF _c.id IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF NOT has_permission(_c.organization_id, 'numbers.manage') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF NOT org_is_active(_c.organization_id) THEN RAISE EXCEPTION 'ORGANIZATION_NOT_ACTIVE'; END IF;

  FOREACH _num IN ARRAY _numbers LOOP
    UPDATE public.campaign_numbers SET status = 'BLOCKED', reserved_by = NULL,
      reserved_at = NULL, reservation_expires_at = NULL, sold_at = NULL
    WHERE campaign_id = _campaign AND number = _num AND status = 'AVAILABLE';
    IF FOUND THEN _blocked := _blocked + 1; END IF;
  END LOOP;

  PERFORM write_audit(_c.organization_id, 'NUMBERS_BLOCKED', 'campaign', _campaign,
    jsonb_build_object('count', _blocked));
END; $$;

-- ============ RPC: ADMIN UNBLOCK NUMBERS ============
CREATE OR REPLACE FUNCTION public.admin_unblock_numbers(_campaign UUID, _numbers INT[])
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _c public.campaigns; _num INT; _unblocked INT := 0;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'NOT_AUTHENTICATED'; END IF;
  SELECT * INTO _c FROM public.campaigns WHERE id = _campaign;
  IF _c.id IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF NOT has_permission(_c.organization_id, 'numbers.manage') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;

  FOREACH _num IN ARRAY _numbers LOOP
    UPDATE public.campaign_numbers SET status = 'AVAILABLE'
    WHERE campaign_id = _campaign AND number = _num AND status = 'BLOCKED';
    IF FOUND THEN _unblocked := _unblocked + 1; END IF;
  END LOOP;

  PERFORM write_audit(_c.organization_id, 'NUMBERS_UNBLOCKED', 'campaign', _campaign,
    jsonb_build_object('count', _unblocked));
END; $$;

-- ============ AUTO-GENERATE NUMBERS ON PUBLISH ============
-- Modify set_campaign_status to auto-generate numbers when transitioning to PUBLISHED
CREATE OR REPLACE FUNCTION public.set_campaign_status(_campaign uuid, _status public.campaign_status)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _c public.campaigns; _perm TEXT; _action TEXT; _limit BIGINT; _count BIGINT;
BEGIN
  SELECT * INTO _c FROM public.campaigns WHERE id = _campaign;
  IF _c.id IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF NOT org_is_active(_c.organization_id) THEN RAISE EXCEPTION 'ORGANIZATION_NOT_ACTIVE'; END IF;

  -- allowed transitions only
  IF _status = 'PUBLISHED' AND _c.status IN ('DRAFT','PAUSED') THEN
    _perm := CASE WHEN _c.status = 'PAUSED' THEN 'campaigns.pause' ELSE 'campaigns.publish' END;
    _action := CASE WHEN _c.status = 'PAUSED' THEN 'CAMPAIGN_RESUMED' ELSE 'CAMPAIGN_PUBLISHED' END;
  ELSIF _status = 'PAUSED' AND _c.status = 'PUBLISHED' THEN
    _perm := 'campaigns.pause'; _action := 'CAMPAIGN_PAUSED';
  ELSIF _status = 'FINISHED' AND _c.status IN ('PUBLISHED','PAUSED') THEN
    _perm := 'campaigns.finish'; _action := 'CAMPAIGN_FINISHED';
  ELSIF _status = 'ARCHIVED' AND _c.status IN ('DRAFT','FINISHED','PAUSED') THEN
    _perm := 'campaigns.archive'; _action := 'CAMPAIGN_ARCHIVED';
  ELSIF _status = 'DRAFT' AND _c.status = 'ARCHIVED' THEN
    _perm := 'campaigns.restore'; _action := 'CAMPAIGN_RESTORED';
  ELSE
    RAISE EXCEPTION 'INVALID_STATUS_TRANSITION';
  END IF;

  IF NOT has_permission(_c.organization_id, _perm) THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;

  IF _status = 'PUBLISHED' THEN
    IF _c.product_name IS NULL OR char_length(trim(_c.product_name)) = 0 THEN RAISE EXCEPTION 'CAMPAIGN_PRODUCT_REQUIRED'; END IF;
    IF _c.total_numbers < 1 THEN RAISE EXCEPTION 'INVALID_TOTAL_NUMBERS'; END IF;
    IF _c.number_price <= 0 THEN RAISE EXCEPTION 'INVALID_PRICE'; END IF;
    IF NOT EXISTS (SELECT 1 FROM public.subscriptions s WHERE s.organization_id = _c.organization_id
      AND s.status IN ('TRIALING','ACTIVE','PAST_DUE')) THEN RAISE EXCEPTION 'SUBSCRIPTION_NOT_ACTIVE'; END IF;

    PERFORM pg_advisory_xact_lock(hashtext('campaigns-active:' || _c.organization_id::text));
    _limit := org_limit(_c.organization_id, 'max_active_campaigns');
    IF _limit IS NOT NULL THEN
      SELECT count(*) INTO _count FROM public.campaigns
      WHERE organization_id = _c.organization_id AND status IN ('PUBLISHED','PAUSED') AND id <> _campaign;
      IF _count >= _limit THEN RAISE EXCEPTION 'PLAN_LIMIT_REACHED_max_active_campaigns'; END IF;
    END IF;

    -- Auto-generate numbers if not yet generated
    PERFORM public.generate_campaign_numbers(_campaign);
  END IF;

  UPDATE public.campaigns SET
    status = _status,
    published_at = CASE WHEN _status = 'PUBLISHED' AND published_at IS NULL THEN now() ELSE published_at END,
    archived_at = CASE WHEN _status = 'ARCHIVED' THEN now() WHEN _status = 'DRAFT' THEN NULL ELSE archived_at END
  WHERE id = _campaign;

  PERFORM sync_campaign_usage(_c.organization_id);
  PERFORM write_audit(_c.organization_id, _action, 'campaign', _campaign, jsonb_build_object('from', _c.status, 'to', _status));
END; $$;
