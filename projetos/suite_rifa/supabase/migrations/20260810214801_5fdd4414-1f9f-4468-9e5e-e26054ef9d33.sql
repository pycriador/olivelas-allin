-- ============ ENUMS ============
CREATE TYPE public.campaign_status AS ENUM ('DRAFT','PUBLISHED','PAUSED','FINISHED','ARCHIVED');
CREATE TYPE public.campaign_image_type AS ENUM ('COVER','GALLERY');

-- ============ CAMPAIGNS ============
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  product_name TEXT NOT NULL,
  product_description TEXT,
  cover_image_url TEXT,
  total_numbers INTEGER NOT NULL DEFAULT 100,
  number_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'BRL',
  status public.campaign_status NOT NULL DEFAULT 'DRAFT',
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT campaigns_slug_unique UNIQUE (organization_id, slug),
  CONSTRAINT campaigns_name_len CHECK (char_length(name) BETWEEN 3 AND 120),
  CONSTRAINT campaigns_slug_format CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND char_length(slug) BETWEEN 3 AND 140),
  CONSTRAINT campaigns_total_numbers CHECK (total_numbers >= 1),
  CONSTRAINT campaigns_price CHECK (number_price >= 0),
  CONSTRAINT campaigns_dates CHECK (end_at IS NULL OR start_at IS NULL OR end_at > start_at)
);

CREATE INDEX campaigns_org_idx ON public.campaigns (organization_id);
CREATE INDEX campaigns_org_status_idx ON public.campaigns (organization_id, status);
CREATE INDEX campaigns_org_created_idx ON public.campaigns (organization_id, created_at DESC);
CREATE INDEX campaigns_org_published_idx ON public.campaigns (organization_id, published_at DESC);
CREATE INDEX campaigns_org_slug_idx ON public.campaigns (organization_id, slug);
CREATE INDEX campaigns_public_slug_idx ON public.campaigns (slug) WHERE status IN ('PUBLISHED','PAUSED','FINISHED');

CREATE TRIGGER campaigns_set_updated_at BEFORE UPDATE ON public.campaigns
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ CAMPAIGN IMAGES ============
CREATE TABLE public.campaign_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  url TEXT NOT NULL,
  type public.campaign_image_type NOT NULL DEFAULT 'GALLERY',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX campaign_images_org_idx ON public.campaign_images (organization_id);
CREATE INDEX campaign_images_campaign_idx ON public.campaign_images (campaign_id);
CREATE INDEX campaign_images_sort_idx ON public.campaign_images (campaign_id, sort_order);
CREATE UNIQUE INDEX campaign_images_single_cover ON public.campaign_images (campaign_id) WHERE type = 'COVER';

CREATE TRIGGER campaign_images_set_updated_at BEFORE UPDATE ON public.campaign_images
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- image org must match campaign org (no cross-tenant image)
CREATE OR REPLACE FUNCTION public.guard_campaign_image()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _org UUID;
BEGIN
  SELECT organization_id INTO _org FROM public.campaigns WHERE id = NEW.campaign_id;
  IF _org IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  NEW.organization_id := _org;
  RETURN NEW;
END; $$;

CREATE TRIGGER campaign_images_guard BEFORE INSERT OR UPDATE ON public.campaign_images
FOR EACH ROW EXECUTE FUNCTION public.guard_campaign_image();

-- ============ GRANTS ============
GRANT SELECT ON public.campaigns TO authenticated;
GRANT SELECT ON public.campaigns TO anon;
GRANT ALL ON public.campaigns TO service_role;
GRANT SELECT ON public.campaign_images TO authenticated;
GRANT SELECT ON public.campaign_images TO anon;
GRANT ALL ON public.campaign_images TO service_role;

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_images ENABLE ROW LEVEL SECURITY;

-- Members read their own tenant campaigns; anonymous/public read only live campaigns.
CREATE POLICY campaigns_select_members ON public.campaigns FOR SELECT TO authenticated
USING (is_org_member(organization_id) OR is_global_admin() OR status IN ('PUBLISHED','PAUSED','FINISHED'));

CREATE POLICY campaigns_select_public ON public.campaigns FOR SELECT TO anon
USING (status IN ('PUBLISHED','PAUSED','FINISHED'));

CREATE POLICY campaign_images_select_members ON public.campaign_images FOR SELECT TO authenticated
USING (
  is_org_member(organization_id) OR is_global_admin()
  OR EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id = campaign_id AND c.status IN ('PUBLISHED','PAUSED','FINISHED'))
);

CREATE POLICY campaign_images_select_public ON public.campaign_images FOR SELECT TO anon
USING (EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id = campaign_id AND c.status IN ('PUBLISHED','PAUSED','FINISHED')));

-- All writes go through security-definer RPCs (no direct INSERT/UPDATE/DELETE grants).

-- ============ PERMISSIONS MATRIX ============
INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('OWNER','campaigns.view'),('OWNER','campaigns.create'),('OWNER','campaigns.update'),
  ('OWNER','campaigns.publish'),('OWNER','campaigns.pause'),('OWNER','campaigns.finish'),
  ('OWNER','campaigns.archive'),('OWNER','campaigns.restore'),('OWNER','campaigns.manage_images'),
  ('ADMIN','campaigns.view'),('ADMIN','campaigns.create'),('ADMIN','campaigns.update'),
  ('ADMIN','campaigns.publish'),('ADMIN','campaigns.pause'),('ADMIN','campaigns.finish'),
  ('ADMIN','campaigns.archive'),('ADMIN','campaigns.restore'),('ADMIN','campaigns.manage_images'),
  ('MEMBER','campaigns.view'),('MEMBER','campaigns.create'),('MEMBER','campaigns.update'),
  ('VIEWER','campaigns.view')
ON CONFLICT DO NOTHING;

-- ============ PLAN LIMIT: images per campaign ============
INSERT INTO public.plan_limits (plan_id, limit_key, limit_value)
SELECT id, 'max_campaign_images', CASE WHEN slug = 'pro' THEN 30 ELSE 10 END FROM public.plans
ON CONFLICT DO NOTHING;

-- ============ USAGE SYNC ============
CREATE OR REPLACE FUNCTION public.sync_campaign_usage(_org uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.organization_usage (organization_id, usage_key, usage_value)
  SELECT _org, 'campaigns', count(*) FROM public.campaigns WHERE organization_id = _org AND status <> 'ARCHIVED'
  ON CONFLICT (organization_id, usage_key) DO UPDATE SET usage_value = EXCLUDED.usage_value, updated_at = now();

  INSERT INTO public.organization_usage (organization_id, usage_key, usage_value)
  SELECT _org, 'active_campaigns', count(*) FROM public.campaigns WHERE organization_id = _org AND status IN ('PUBLISHED','PAUSED')
  ON CONFLICT (organization_id, usage_key) DO UPDATE SET usage_value = EXCLUDED.usage_value, updated_at = now();
END; $$;

-- ============ CREATE CAMPAIGN ============
CREATE OR REPLACE FUNCTION public.create_campaign(
  _org uuid,
  _name text,
  _slug text,
  _product_name text,
  _total_numbers integer,
  _number_price numeric,
  _description text DEFAULT NULL,
  _product_description text DEFAULT NULL,
  _currency text DEFAULT NULL,
  _start_at timestamptz DEFAULT NULL,
  _end_at timestamptz DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _id UUID; _final_slug TEXT; _limit BIGINT; _count BIGINT; _max_numbers BIGINT; _cur TEXT;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'NOT_AUTHENTICATED'; END IF;
  IF NOT has_permission(_org, 'campaigns.create') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF NOT org_is_active(_org) THEN RAISE EXCEPTION 'ORGANIZATION_NOT_ACTIVE'; END IF;

  -- serialize concurrent creation per organization (race condition guard)
  PERFORM pg_advisory_xact_lock(hashtext('campaigns:' || _org::text));

  _limit := org_limit(_org, 'max_campaigns');
  IF _limit IS NOT NULL THEN
    SELECT count(*) INTO _count FROM public.campaigns WHERE organization_id = _org AND status <> 'ARCHIVED';
    IF _count >= _limit THEN RAISE EXCEPTION 'PLAN_LIMIT_REACHED_max_campaigns'; END IF;
  END IF;

  _final_slug := normalize_slug(COALESCE(NULLIF(trim(_slug), ''), _name));
  IF char_length(_final_slug) < 3 THEN RAISE EXCEPTION 'INVALID_SLUG'; END IF;
  IF EXISTS (SELECT 1 FROM public.campaigns WHERE organization_id = _org AND slug = _final_slug) THEN
    RAISE EXCEPTION 'CAMPAIGN_SLUG_TAKEN';
  END IF;

  IF _total_numbers IS NULL OR _total_numbers < 1 THEN RAISE EXCEPTION 'INVALID_TOTAL_NUMBERS'; END IF;
  _max_numbers := org_limit(_org, 'max_numbers_per_campaign');
  IF _max_numbers IS NOT NULL AND _total_numbers > _max_numbers THEN
    RAISE EXCEPTION 'PLAN_LIMIT_REACHED_max_numbers_per_campaign';
  END IF;
  IF _number_price IS NULL OR _number_price < 0 THEN RAISE EXCEPTION 'INVALID_PRICE'; END IF;
  IF _end_at IS NOT NULL AND _start_at IS NOT NULL AND _end_at <= _start_at THEN RAISE EXCEPTION 'INVALID_DATE_RANGE'; END IF;

  SELECT COALESCE(NULLIF(_currency,''), currency, 'BRL') INTO _cur FROM public.organizations WHERE id = _org;

  INSERT INTO public.campaigns (organization_id, created_by, name, slug, description, product_name,
    product_description, total_numbers, number_price, currency, start_at, end_at)
  VALUES (_org, auth.uid(), trim(_name), _final_slug, NULLIF(trim(COALESCE(_description,'')),''), trim(_product_name),
    NULLIF(trim(COALESCE(_product_description,'')),''), _total_numbers, _number_price, COALESCE(_cur,'BRL'), _start_at, _end_at)
  RETURNING id INTO _id;

  PERFORM sync_campaign_usage(_org);
  PERFORM write_audit(_org, 'CAMPAIGN_CREATED', 'campaign', _id, jsonb_build_object('name', trim(_name), 'slug', _final_slug));
  RETURN _id;
END; $$;

-- ============ UPDATE CAMPAIGN ============
CREATE OR REPLACE FUNCTION public.update_campaign(
  _campaign uuid,
  _name text DEFAULT NULL,
  _slug text DEFAULT NULL,
  _description text DEFAULT NULL,
  _product_name text DEFAULT NULL,
  _product_description text DEFAULT NULL,
  _total_numbers integer DEFAULT NULL,
  _number_price numeric DEFAULT NULL,
  _start_at timestamptz DEFAULT NULL,
  _end_at timestamptz DEFAULT NULL,
  _clear_end_at boolean DEFAULT false,
  _clear_start_at boolean DEFAULT false
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _c public.campaigns; _changed TEXT[] := '{}'; _new_slug TEXT; _max_numbers BIGINT;
        _start TIMESTAMPTZ; _end TIMESTAMPTZ;
BEGIN
  SELECT * INTO _c FROM public.campaigns WHERE id = _campaign;
  IF _c.id IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF NOT has_permission(_c.organization_id, 'campaigns.update') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF NOT org_is_active(_c.organization_id) THEN RAISE EXCEPTION 'ORGANIZATION_NOT_ACTIVE'; END IF;
  IF _c.status = 'ARCHIVED' THEN RAISE EXCEPTION 'CAMPAIGN_ARCHIVED_READONLY'; END IF;

  _start := CASE WHEN _clear_start_at THEN NULL ELSE COALESCE(_start_at, _c.start_at) END;
  _end := CASE WHEN _clear_end_at THEN NULL ELSE COALESCE(_end_at, _c.end_at) END;
  IF _start IS NOT NULL AND _end IS NOT NULL AND _end <= _start THEN RAISE EXCEPTION 'INVALID_DATE_RANGE'; END IF;

  IF _name IS NOT NULL AND trim(_name) <> _c.name THEN _changed := _changed || 'name'; END IF;
  IF _description IS NOT NULL AND _description IS DISTINCT FROM COALESCE(_c.description,'') THEN _changed := _changed || 'description'; END IF;
  IF _product_name IS NOT NULL AND trim(_product_name) <> _c.product_name THEN _changed := _changed || 'product_name'; END IF;
  IF _product_description IS NOT NULL AND _product_description IS DISTINCT FROM COALESCE(_c.product_description,'') THEN _changed := _changed || 'product_description'; END IF;
  IF _start IS DISTINCT FROM _c.start_at THEN _changed := _changed || 'start_at'; END IF;
  IF _end IS DISTINCT FROM _c.end_at THEN _changed := _changed || 'end_at'; END IF;

  -- slug: only while the campaign was never published (public links must stay stable)
  _new_slug := _c.slug;
  IF _slug IS NOT NULL AND normalize_slug(_slug) <> _c.slug THEN
    IF _c.published_at IS NOT NULL THEN RAISE EXCEPTION 'SLUG_LOCKED_AFTER_PUBLISH'; END IF;
    _new_slug := normalize_slug(_slug);
    IF char_length(_new_slug) < 3 THEN RAISE EXCEPTION 'INVALID_SLUG'; END IF;
    IF EXISTS (SELECT 1 FROM public.campaigns WHERE organization_id = _c.organization_id AND slug = _new_slug AND id <> _campaign) THEN
      RAISE EXCEPTION 'CAMPAIGN_SLUG_TAKEN';
    END IF;
    _changed := _changed || 'slug';
  END IF;

  -- critical fields: locked once the campaign is live (future: locked when numbers are sold)
  IF _total_numbers IS NOT NULL AND _total_numbers <> _c.total_numbers THEN
    IF _c.status <> 'DRAFT' THEN RAISE EXCEPTION 'CRITICAL_FIELD_LOCKED'; END IF;
    IF _total_numbers < 1 THEN RAISE EXCEPTION 'INVALID_TOTAL_NUMBERS'; END IF;
    _max_numbers := org_limit(_c.organization_id, 'max_numbers_per_campaign');
    IF _max_numbers IS NOT NULL AND _total_numbers > _max_numbers THEN RAISE EXCEPTION 'PLAN_LIMIT_REACHED_max_numbers_per_campaign'; END IF;
    _changed := _changed || 'total_numbers';
  END IF;
  IF _number_price IS NOT NULL AND _number_price <> _c.number_price THEN
    IF _c.status NOT IN ('DRAFT','PAUSED') THEN RAISE EXCEPTION 'CRITICAL_FIELD_LOCKED'; END IF;
    IF _number_price < 0 THEN RAISE EXCEPTION 'INVALID_PRICE'; END IF;
    _changed := _changed || 'number_price';
  END IF;

  IF array_length(_changed, 1) IS NULL THEN RETURN; END IF;

  UPDATE public.campaigns SET
    name = COALESCE(NULLIF(trim(COALESCE(_name,'')),''), name),
    slug = _new_slug,
    description = CASE WHEN _description IS NULL THEN description ELSE NULLIF(trim(_description),'') END,
    product_name = COALESCE(NULLIF(trim(COALESCE(_product_name,'')),''), product_name),
    product_description = CASE WHEN _product_description IS NULL THEN product_description ELSE NULLIF(trim(_product_description),'') END,
    total_numbers = CASE WHEN 'total_numbers' = ANY(_changed) THEN _total_numbers ELSE total_numbers END,
    number_price = CASE WHEN 'number_price' = ANY(_changed) THEN _number_price ELSE number_price END,
    start_at = _start,
    end_at = _end
  WHERE id = _campaign;

  PERFORM write_audit(_c.organization_id, 'CAMPAIGN_UPDATED', 'campaign', _campaign, jsonb_build_object('changed_fields', to_jsonb(_changed)));
END; $$;

-- ============ STATUS TRANSITIONS ============
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
    -- publish validation
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
  END IF;

  UPDATE public.campaigns SET
    status = _status,
    published_at = CASE WHEN _status = 'PUBLISHED' AND published_at IS NULL THEN now() ELSE published_at END,
    archived_at = CASE WHEN _status = 'ARCHIVED' THEN now() WHEN _status = 'DRAFT' THEN NULL ELSE archived_at END
  WHERE id = _campaign;

  PERFORM sync_campaign_usage(_c.organization_id);
  PERFORM write_audit(_c.organization_id, _action, 'campaign', _campaign, jsonb_build_object('from', _c.status, 'to', _status));
END; $$;

-- ============ LIST (server-side search / filter / sort / pagination) ============
CREATE OR REPLACE FUNCTION public.list_campaigns(
  _org uuid,
  _search text DEFAULT NULL,
  _status text DEFAULT NULL,
  _created_from timestamptz DEFAULT NULL,
  _created_to timestamptz DEFAULT NULL,
  _published_from timestamptz DEFAULT NULL,
  _published_to timestamptz DEFAULT NULL,
  _include_archived boolean DEFAULT false,
  _sort text DEFAULT 'created_at',
  _direction text DEFAULT 'desc',
  _limit integer DEFAULT 12,
  _offset integer DEFAULT 0
) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _total BIGINT; _rows JSONB; _q TEXT; _sort_key TEXT; _dir TEXT;
BEGIN
  IF NOT has_permission(_org, 'campaigns.view') AND NOT is_global_admin() THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  _q := NULLIF(trim(COALESCE(_search,'')), '');
  _sort_key := CASE WHEN _sort IN ('name','created_at','updated_at','published_at','status') THEN _sort ELSE 'created_at' END;
  _dir := CASE WHEN lower(COALESCE(_direction,'desc')) = 'asc' THEN 'asc' ELSE 'desc' END;

  WITH filtered AS (
    SELECT c.* FROM public.campaigns c
    WHERE c.organization_id = _org
      AND (_include_archived OR c.status <> 'ARCHIVED')
      AND (_status IS NULL OR c.status::text = _status)
      AND (_created_from IS NULL OR c.created_at >= _created_from)
      AND (_created_to IS NULL OR c.created_at <= _created_to)
      AND (_published_from IS NULL OR c.published_at >= _published_from)
      AND (_published_to IS NULL OR c.published_at <= _published_to)
      AND (_q IS NULL OR (
        unaccent_fallback(c.name) ILIKE '%' || unaccent_fallback(_q) || '%'
        OR c.slug ILIKE '%' || _q || '%'
        OR unaccent_fallback(c.product_name) ILIKE '%' || unaccent_fallback(_q) || '%'))
  )
  SELECT count(*) INTO _total FROM filtered;

  WITH filtered AS (
    SELECT c.* FROM public.campaigns c
    WHERE c.organization_id = _org
      AND (_include_archived OR c.status <> 'ARCHIVED')
      AND (_status IS NULL OR c.status::text = _status)
      AND (_created_from IS NULL OR c.created_at >= _created_from)
      AND (_created_to IS NULL OR c.created_at <= _created_to)
      AND (_published_from IS NULL OR c.published_at >= _published_from)
      AND (_published_to IS NULL OR c.published_at <= _published_to)
      AND (_q IS NULL OR (
        unaccent_fallback(c.name) ILIKE '%' || unaccent_fallback(_q) || '%'
        OR c.slug ILIKE '%' || _q || '%'
        OR unaccent_fallback(c.product_name) ILIKE '%' || unaccent_fallback(_q) || '%'))
    ORDER BY
      CASE WHEN _sort_key = 'name' AND _dir = 'asc' THEN c.name END ASC,
      CASE WHEN _sort_key = 'name' AND _dir = 'desc' THEN c.name END DESC,
      CASE WHEN _sort_key = 'status' AND _dir = 'asc' THEN c.status::text END ASC,
      CASE WHEN _sort_key = 'status' AND _dir = 'desc' THEN c.status::text END DESC,
      CASE WHEN _sort_key = 'updated_at' AND _dir = 'asc' THEN c.updated_at END ASC,
      CASE WHEN _sort_key = 'updated_at' AND _dir = 'desc' THEN c.updated_at END DESC,
      CASE WHEN _sort_key = 'published_at' AND _dir = 'asc' THEN c.published_at END ASC,
      CASE WHEN _sort_key = 'published_at' AND _dir = 'desc' THEN c.published_at END DESC,
      CASE WHEN _sort_key = 'created_at' AND _dir = 'asc' THEN c.created_at END ASC,
      c.created_at DESC
    LIMIT GREATEST(COALESCE(_limit,12), 1) OFFSET GREATEST(COALESCE(_offset,0), 0)
  )
  SELECT COALESCE(jsonb_agg(to_jsonb(f)), '[]'::jsonb) INTO _rows FROM filtered f;

  RETURN jsonb_build_object('total', _total, 'rows', _rows);
END; $$;

-- ============ METRICS ============
CREATE OR REPLACE FUNCTION public.campaign_metrics(_org uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _r JSONB;
BEGIN
  IF NOT has_permission(_org, 'campaigns.view') AND NOT is_global_admin() THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  SELECT jsonb_build_object(
    'total', count(*) FILTER (WHERE status <> 'ARCHIVED'),
    'published', count(*) FILTER (WHERE status = 'PUBLISHED'),
    'draft', count(*) FILTER (WHERE status = 'DRAFT'),
    'paused', count(*) FILTER (WHERE status = 'PAUSED'),
    'finished', count(*) FILTER (WHERE status = 'FINISHED'),
    'archived', count(*) FILTER (WHERE status = 'ARCHIVED')
  ) INTO _r FROM public.campaigns WHERE organization_id = _org;
  RETURN _r;
END; $$;

-- ============ PUBLIC VIEW (slug only, safe columns) ============
CREATE OR REPLACE FUNCTION public.public_campaign(_slug text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _c public.campaigns; _images JSONB;
BEGIN
  SELECT * INTO _c FROM public.campaigns
  WHERE slug = normalize_slug(_slug) AND status IN ('PUBLISHED','PAUSED','FINISHED')
  ORDER BY published_at ASC LIMIT 1;
  IF _c.id IS NULL THEN RETURN NULL; END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object('id', i.id, 'url', i.url, 'type', i.type, 'sort_order', i.sort_order)
    ORDER BY i.type DESC, i.sort_order ASC), '[]'::jsonb)
  INTO _images FROM public.campaign_images i WHERE i.campaign_id = _c.id;

  RETURN jsonb_build_object(
    'id', _c.id, 'slug', _c.slug, 'name', _c.name, 'description', _c.description,
    'product_name', _c.product_name, 'product_description', _c.product_description,
    'cover_image_url', _c.cover_image_url, 'total_numbers', _c.total_numbers,
    'number_price', _c.number_price, 'currency', _c.currency, 'status', _c.status,
    'start_at', _c.start_at, 'end_at', _c.end_at, 'images', _images
  );
END; $$;

-- ============ IMAGES ============
CREATE OR REPLACE FUNCTION public.add_campaign_image(_campaign uuid, _path text, _url text, _as_cover boolean DEFAULT false)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _c public.campaigns; _id UUID; _limit BIGINT; _count BIGINT; _next INTEGER;
BEGIN
  SELECT * INTO _c FROM public.campaigns WHERE id = _campaign;
  IF _c.id IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF NOT has_permission(_c.organization_id, 'campaigns.manage_images') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF NOT org_is_active(_c.organization_id) THEN RAISE EXCEPTION 'ORGANIZATION_NOT_ACTIVE'; END IF;
  IF _c.status = 'ARCHIVED' THEN RAISE EXCEPTION 'CAMPAIGN_ARCHIVED_READONLY'; END IF;

  PERFORM pg_advisory_xact_lock(hashtext('campaign-images:' || _campaign::text));
  _limit := org_limit(_c.organization_id, 'max_campaign_images');
  SELECT count(*) INTO _count FROM public.campaign_images WHERE campaign_id = _campaign;
  IF _limit IS NOT NULL AND _count >= _limit THEN RAISE EXCEPTION 'PLAN_LIMIT_REACHED_max_campaign_images'; END IF;

  SELECT COALESCE(max(sort_order), 0) + 1 INTO _next FROM public.campaign_images WHERE campaign_id = _campaign;

  IF _as_cover OR _count = 0 THEN
    UPDATE public.campaign_images SET type = 'GALLERY' WHERE campaign_id = _campaign AND type = 'COVER';
    INSERT INTO public.campaign_images (campaign_id, organization_id, storage_path, url, type, sort_order)
    VALUES (_campaign, _c.organization_id, _path, _url, 'COVER', 0) RETURNING id INTO _id;
    UPDATE public.campaigns SET cover_image_url = _url WHERE id = _campaign;
    PERFORM write_audit(_c.organization_id, 'CAMPAIGN_COVER_UPDATED', 'campaign', _campaign, '{}'::jsonb);
  ELSE
    INSERT INTO public.campaign_images (campaign_id, organization_id, storage_path, url, type, sort_order)
    VALUES (_campaign, _c.organization_id, _path, _url, 'GALLERY', _next) RETURNING id INTO _id;
    PERFORM write_audit(_c.organization_id, 'CAMPAIGN_GALLERY_UPDATED', 'campaign', _campaign, jsonb_build_object('added', 1));
  END IF;
  RETURN _id;
END; $$;

CREATE OR REPLACE FUNCTION public.set_campaign_cover(_image uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _img public.campaign_images; _c public.campaigns;
BEGIN
  SELECT * INTO _img FROM public.campaign_images WHERE id = _image;
  IF _img.id IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  SELECT * INTO _c FROM public.campaigns WHERE id = _img.campaign_id;
  IF NOT has_permission(_c.organization_id, 'campaigns.manage_images') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF NOT org_is_active(_c.organization_id) THEN RAISE EXCEPTION 'ORGANIZATION_NOT_ACTIVE'; END IF;

  UPDATE public.campaign_images SET type = 'GALLERY' WHERE campaign_id = _img.campaign_id AND type = 'COVER';
  UPDATE public.campaign_images SET type = 'COVER', sort_order = 0 WHERE id = _image;
  UPDATE public.campaigns SET cover_image_url = _img.url WHERE id = _img.campaign_id;
  PERFORM write_audit(_c.organization_id, 'CAMPAIGN_COVER_UPDATED', 'campaign', _img.campaign_id, '{}'::jsonb);
END; $$;

CREATE OR REPLACE FUNCTION public.delete_campaign_image(_image uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _img public.campaign_images; _c public.campaigns; _next public.campaign_images;
BEGIN
  SELECT * INTO _img FROM public.campaign_images WHERE id = _image;
  IF _img.id IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  SELECT * INTO _c FROM public.campaigns WHERE id = _img.campaign_id;
  IF NOT has_permission(_c.organization_id, 'campaigns.manage_images') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF NOT org_is_active(_c.organization_id) THEN RAISE EXCEPTION 'ORGANIZATION_NOT_ACTIVE'; END IF;

  DELETE FROM public.campaign_images WHERE id = _image;

  IF _img.type = 'COVER' THEN
    SELECT * INTO _next FROM public.campaign_images WHERE campaign_id = _img.campaign_id ORDER BY sort_order ASC LIMIT 1;
    IF _next.id IS NOT NULL THEN
      UPDATE public.campaign_images SET type = 'COVER', sort_order = 0 WHERE id = _next.id;
      UPDATE public.campaigns SET cover_image_url = _next.url WHERE id = _img.campaign_id;
    ELSE
      UPDATE public.campaigns SET cover_image_url = NULL WHERE id = _img.campaign_id;
    END IF;
  END IF;

  PERFORM write_audit(_c.organization_id, 'CAMPAIGN_GALLERY_UPDATED', 'campaign', _img.campaign_id, jsonb_build_object('removed', 1));
  RETURN _img.storage_path;
END; $$;

CREATE OR REPLACE FUNCTION public.reorder_campaign_images(_campaign uuid, _ids uuid[])
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _c public.campaigns; _i INTEGER;
BEGIN
  SELECT * INTO _c FROM public.campaigns WHERE id = _campaign;
  IF _c.id IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF NOT has_permission(_c.organization_id, 'campaigns.manage_images') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF NOT org_is_active(_c.organization_id) THEN RAISE EXCEPTION 'ORGANIZATION_NOT_ACTIVE'; END IF;

  FOR _i IN 1 .. COALESCE(array_length(_ids, 1), 0) LOOP
    UPDATE public.campaign_images SET sort_order = _i WHERE id = _ids[_i] AND campaign_id = _campaign AND type <> 'COVER';
  END LOOP;
  PERFORM write_audit(_c.organization_id, 'CAMPAIGN_GALLERY_UPDATED', 'campaign', _campaign, jsonb_build_object('reordered', true));
END; $$;

-- ============ EXECUTION GRANTS ============
REVOKE EXECUTE ON FUNCTION public.create_campaign(uuid,text,text,text,integer,numeric,text,text,text,timestamptz,timestamptz) FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.update_campaign(uuid,text,text,text,text,text,integer,numeric,timestamptz,timestamptz,boolean,boolean) FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.set_campaign_status(uuid, public.campaign_status) FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.list_campaigns(uuid,text,text,timestamptz,timestamptz,timestamptz,timestamptz,boolean,text,text,integer,integer) FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.campaign_metrics(uuid) FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.add_campaign_image(uuid,text,text,boolean) FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.set_campaign_cover(uuid) FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.delete_campaign_image(uuid) FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.reorder_campaign_images(uuid,uuid[]) FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.sync_campaign_usage(uuid) FROM public, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.create_campaign(uuid,text,text,text,integer,numeric,text,text,text,timestamptz,timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_campaign(uuid,text,text,text,text,text,integer,numeric,timestamptz,timestamptz,boolean,boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_campaign_status(uuid, public.campaign_status) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_campaigns(uuid,text,text,timestamptz,timestamptz,timestamptz,timestamptz,boolean,text,text,integer,integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.campaign_metrics(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_campaign_image(uuid,text,text,boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_campaign_cover(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_campaign_image(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reorder_campaign_images(uuid,uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.public_campaign(text) TO anon, authenticated;