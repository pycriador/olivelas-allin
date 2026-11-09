
CREATE OR REPLACE FUNCTION public.write_audit(_org UUID, _action TEXT, _entity_type TEXT, _entity_id UUID, _metadata JSONB DEFAULT '{}'::jsonb)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.audit_logs (organization_id, actor_user_id, action, entity_type, entity_id, metadata)
  VALUES (_org, auth.uid(), _action, _entity_type, _entity_id, COALESCE(_metadata, '{}'::jsonb));
END; $$;
REVOKE EXECUTE ON FUNCTION public.write_audit(UUID, TEXT, TEXT, UUID, JSONB) FROM anon, authenticated, PUBLIC;

CREATE OR REPLACE FUNCTION public.unaccent_fallback(_input TEXT)
RETURNS TEXT LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT translate(_input,
    'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ',
    'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC');
$$;

CREATE OR REPLACE FUNCTION public.normalize_slug(_input TEXT)
RETURNS TEXT LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT trim(both '-' from regexp_replace(lower(public.unaccent_fallback(_input)), '[^a-z0-9]+', '-', 'g'));
$$;

CREATE OR REPLACE FUNCTION public.bootstrap_session()
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid UUID := auth.uid();
  _claims JSONB := auth.jwt();
  _email TEXT;
  _name TEXT;
  _avatar TEXT;
  _promoted BOOLEAN := false;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'NOT_AUTHENTICATED'; END IF;
  _email := COALESCE(_claims->>'email', _claims->'user_metadata'->>'email');
  _name := COALESCE(_claims->'user_metadata'->>'full_name', _claims->'user_metadata'->>'name', split_part(COALESCE(_email,''), '@', 1));
  _avatar := COALESCE(_claims->'user_metadata'->>'avatar_url', _claims->'user_metadata'->>'picture');

  INSERT INTO public.profiles (id, full_name, avatar_url, email)
  VALUES (_uid, _name, _avatar, _email)
  ON CONFLICT (id) DO UPDATE
    SET email = COALESCE(EXCLUDED.email, public.profiles.email),
        full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url);

  PERFORM pg_advisory_xact_lock(hashtext('rafflehub_first_global_admin'));
  IF NOT EXISTS (SELECT 1 FROM public.platform_roles WHERE role = 'GLOBAL_ADMIN') THEN
    INSERT INTO public.platform_roles (user_id, role) VALUES (_uid, 'GLOBAL_ADMIN') ON CONFLICT DO NOTHING;
    _promoted := true;
    PERFORM public.write_audit(NULL, 'GLOBAL_ADMIN_BOOTSTRAPPED', 'user', _uid, '{}'::jsonb);
  END IF;

  RETURN jsonb_build_object('user_id', _uid, 'is_global_admin', public.is_global_admin(_uid), 'promoted', _promoted);
END; $$;

CREATE OR REPLACE FUNCTION public.org_limit(_org UUID, _key TEXT)
RETURNS BIGINT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT pl.limit_value FROM public.subscriptions s
  JOIN public.plan_limits pl ON pl.plan_id = s.plan_id AND pl.limit_key = _key
  WHERE s.organization_id = _org;
$$;

CREATE OR REPLACE FUNCTION public.org_feature_enabled(_org UUID, _key TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((
    SELECT pf.enabled FROM public.subscriptions s
    JOIN public.plan_features pf ON pf.plan_id = s.plan_id AND pf.feature_key = _key
    WHERE s.organization_id = _org
  ), false);
$$;

CREATE OR REPLACE FUNCTION public.create_organization(_name TEXT, _slug TEXT, _email TEXT DEFAULT NULL, _phone TEXT DEFAULT NULL)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid UUID := auth.uid();
  _org UUID;
  _slug_norm TEXT;
  _plan RECORD;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'NOT_AUTHENTICATED'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = _uid) THEN
    PERFORM public.bootstrap_session();
  END IF;
  _slug_norm := public.normalize_slug(COALESCE(NULLIF(trim(_slug), ''), _name));
  IF char_length(_slug_norm) < 3 THEN RAISE EXCEPTION 'INVALID_SLUG'; END IF;
  IF EXISTS (SELECT 1 FROM public.organizations WHERE slug = _slug_norm) THEN
    RAISE EXCEPTION 'SLUG_TAKEN';
  END IF;

  INSERT INTO public.organizations (name, slug, email, phone, created_by)
  VALUES (trim(_name), _slug_norm, NULLIF(trim(COALESCE(_email,'')),''), NULLIF(trim(COALESCE(_phone,'')),''), _uid)
  RETURNING id INTO _org;

  INSERT INTO public.organization_memberships (organization_id, user_id, role, status)
  VALUES (_org, _uid, 'OWNER', 'ACTIVE');

  SELECT * INTO _plan FROM public.plans WHERE slug = 'free' AND status = 'ACTIVE' LIMIT 1;
  IF _plan.id IS NULL THEN
    SELECT * INTO _plan FROM public.plans WHERE status = 'ACTIVE' ORDER BY price_monthly ASC LIMIT 1;
  END IF;
  IF _plan.id IS NOT NULL THEN
    INSERT INTO public.subscriptions (organization_id, plan_id, status, billing_interval, trial_start, trial_end, current_period_start, current_period_end)
    VALUES (
      _org, _plan.id,
      CASE WHEN _plan.trial_days > 0 THEN 'TRIALING'::public.subscription_status ELSE 'ACTIVE'::public.subscription_status END,
      'MONTHLY', now(),
      CASE WHEN _plan.trial_days > 0 THEN now() + make_interval(days => _plan.trial_days) ELSE NULL END,
      now(), now() + interval '1 month'
    );
  END IF;

  INSERT INTO public.organization_usage (organization_id, usage_key, usage_value)
  SELECT _org, k, 0 FROM unnest(ARRAY['campaigns','active_campaigns','users','participants','numbers','storage','exports']) AS k
  ON CONFLICT DO NOTHING;
  UPDATE public.organization_usage SET usage_value = 1 WHERE organization_id = _org AND usage_key = 'users';

  PERFORM public.write_audit(_org, 'ORGANIZATION_CREATED', 'organization', _org, jsonb_build_object('name', _name, 'slug', _slug_norm));
  RETURN _org;
END; $$;

CREATE OR REPLACE FUNCTION public.audit_organization_update()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    PERFORM public.write_audit(NEW.id,
      CASE NEW.status WHEN 'SUSPENDED' THEN 'ORGANIZATION_SUSPENDED'
                      WHEN 'ACTIVE' THEN 'ORGANIZATION_REACTIVATED'
                      ELSE 'ORGANIZATION_UPDATED' END,
      'organization', NEW.id, jsonb_build_object('from', OLD.status, 'to', NEW.status));
  ELSE
    PERFORM public.write_audit(NEW.id, 'ORGANIZATION_UPDATED', 'organization', NEW.id, '{}'::jsonb);
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER organizations_audit AFTER UPDATE ON public.organizations
FOR EACH ROW EXECUTE FUNCTION public.audit_organization_update();

CREATE OR REPLACE FUNCTION public.guard_organization_update()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NOT public.is_global_admin() THEN
    RAISE EXCEPTION 'ONLY_GLOBAL_ADMIN_CAN_CHANGE_STATUS';
  END IF;
  IF NEW.slug IS DISTINCT FROM OLD.slug THEN
    NEW.slug := public.normalize_slug(NEW.slug);
    IF NOT public.has_org_role(NEW.id, ARRAY['OWNER']::public.org_role[]) AND NOT public.is_global_admin() THEN
      RAISE EXCEPTION 'ONLY_OWNER_CAN_CHANGE_SLUG';
    END IF;
  END IF;
  NEW.created_by := OLD.created_by;
  RETURN NEW;
END; $$;
CREATE TRIGGER organizations_guard BEFORE UPDATE ON public.organizations
FOR EACH ROW EXECUTE FUNCTION public.guard_organization_update();

CREATE OR REPLACE FUNCTION public.set_organization_status(_org UUID, _status public.org_status)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_global_admin() THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  UPDATE public.organizations SET status = _status WHERE id = _org;
END; $$;

CREATE OR REPLACE FUNCTION public.change_member_role(_membership_id UUID, _role public.org_role)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _m RECORD; _owners INT;
BEGIN
  SELECT * INTO _m FROM public.organization_memberships WHERE id = _membership_id;
  IF _m.id IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF NOT public.is_global_admin() AND NOT public.has_org_role(_m.organization_id, ARRAY['OWNER']::public.org_role[]) THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;
  IF NOT public.org_is_active(_m.organization_id) AND NOT public.is_global_admin() THEN
    RAISE EXCEPTION 'ORGANIZATION_NOT_ACTIVE';
  END IF;
  IF _m.role = 'OWNER' AND _role <> 'OWNER' THEN
    SELECT count(*) INTO _owners FROM public.organization_memberships
     WHERE organization_id = _m.organization_id AND role = 'OWNER' AND status = 'ACTIVE';
    IF _owners <= 1 THEN RAISE EXCEPTION 'LAST_OWNER'; END IF;
  END IF;
  UPDATE public.organization_memberships SET role = _role WHERE id = _membership_id;
  PERFORM public.write_audit(_m.organization_id, 'MEMBER_ROLE_CHANGED', 'membership', _membership_id,
    jsonb_build_object('user_id', _m.user_id, 'from', _m.role, 'to', _role));
  IF _role = 'OWNER' THEN
    PERFORM public.write_audit(_m.organization_id, 'OWNER_TRANSFERRED', 'membership', _membership_id,
      jsonb_build_object('user_id', _m.user_id));
  END IF;
END; $$;

CREATE OR REPLACE FUNCTION public.remove_member(_membership_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _m RECORD; _owners INT;
BEGIN
  SELECT * INTO _m FROM public.organization_memberships WHERE id = _membership_id;
  IF _m.id IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF NOT public.is_global_admin() AND NOT public.has_org_role(_m.organization_id, ARRAY['OWNER','ADMIN']::public.org_role[]) THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;
  IF _m.role = 'OWNER' AND NOT public.is_global_admin() AND NOT public.has_org_role(_m.organization_id, ARRAY['OWNER']::public.org_role[]) THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;
  IF NOT public.org_is_active(_m.organization_id) AND NOT public.is_global_admin() THEN
    RAISE EXCEPTION 'ORGANIZATION_NOT_ACTIVE';
  END IF;
  IF _m.role = 'OWNER' THEN
    SELECT count(*) INTO _owners FROM public.organization_memberships
     WHERE organization_id = _m.organization_id AND role = 'OWNER' AND status = 'ACTIVE';
    IF _owners <= 1 THEN RAISE EXCEPTION 'LAST_OWNER'; END IF;
  END IF;
  UPDATE public.organization_memberships SET status = 'REMOVED' WHERE id = _membership_id;
  UPDATE public.organization_usage SET usage_value = GREATEST(usage_value - 1, 0)
   WHERE organization_id = _m.organization_id AND usage_key = 'users';
  PERFORM public.write_audit(_m.organization_id, 'MEMBER_REMOVED', 'membership', _membership_id,
    jsonb_build_object('user_id', _m.user_id));
END; $$;

CREATE OR REPLACE FUNCTION public.invite_member(_org UUID, _email TEXT, _role public.org_role DEFAULT 'MEMBER')
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _token TEXT; _limit BIGINT; _used BIGINT; _email_norm TEXT;
BEGIN
  IF NOT public.has_org_role(_org, ARRAY['OWNER','ADMIN']::public.org_role[]) AND NOT public.is_global_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;
  IF NOT public.org_is_active(_org) THEN RAISE EXCEPTION 'ORGANIZATION_NOT_ACTIVE'; END IF;
  IF _role = 'OWNER' AND NOT public.has_org_role(_org, ARRAY['OWNER']::public.org_role[]) AND NOT public.is_global_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;
  _email_norm := lower(trim(_email));
  IF _email_norm !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN RAISE EXCEPTION 'INVALID_EMAIL'; END IF;

  PERFORM pg_advisory_xact_lock(hashtext('org_users_limit_' || _org::text));
  SELECT public.org_limit(_org, 'max_users') INTO _limit;
  SELECT count(*) INTO _used FROM public.organization_memberships
   WHERE organization_id = _org AND status IN ('ACTIVE','INVITED');
  _used := _used + (SELECT count(*) FROM public.organization_invitations
                     WHERE organization_id = _org AND status = 'INVITED' AND expires_at > now());
  IF _limit IS NOT NULL AND _limit >= 0 AND _used >= _limit THEN
    RAISE EXCEPTION 'PLAN_LIMIT_REACHED_max_users';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.organization_memberships m
    JOIN public.profiles p ON p.id = m.user_id
    WHERE m.organization_id = _org AND lower(p.email) = _email_norm AND m.status = 'ACTIVE'
  ) THEN RAISE EXCEPTION 'ALREADY_MEMBER'; END IF;

  UPDATE public.organization_invitations SET status = 'REVOKED'
   WHERE organization_id = _org AND lower(email) = _email_norm AND status = 'INVITED';

  _token := encode(extensions.gen_random_bytes(24), 'hex');
  INSERT INTO public.organization_invitations (organization_id, email, role, token_hash, expires_at, created_by)
  VALUES (_org, _email_norm, _role, encode(extensions.digest(_token, 'sha256'), 'hex'), now() + interval '7 days', auth.uid());

  PERFORM public.write_audit(_org, 'MEMBER_INVITED', 'invitation', NULL, jsonb_build_object('email', _email_norm, 'role', _role));
  RETURN _token;
END; $$;

CREATE OR REPLACE FUNCTION public.revoke_invitation(_invitation_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _inv RECORD;
BEGIN
  SELECT * INTO _inv FROM public.organization_invitations WHERE id = _invitation_id;
  IF _inv.id IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF NOT public.has_org_role(_inv.organization_id, ARRAY['OWNER','ADMIN']::public.org_role[]) AND NOT public.is_global_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;
  UPDATE public.organization_invitations SET status = 'REVOKED' WHERE id = _invitation_id;
END; $$;

CREATE OR REPLACE FUNCTION public.accept_invitation(_token TEXT)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid UUID := auth.uid(); _inv RECORD; _email TEXT;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'NOT_AUTHENTICATED'; END IF;
  PERFORM public.bootstrap_session();
  SELECT lower(email) INTO _email FROM public.profiles WHERE id = _uid;

  SELECT * INTO _inv FROM public.organization_invitations
   WHERE token_hash = encode(extensions.digest(trim(_token), 'sha256'), 'hex');
  IF _inv.id IS NULL THEN RAISE EXCEPTION 'INVITATION_NOT_FOUND'; END IF;
  IF _inv.status <> 'INVITED' THEN RAISE EXCEPTION 'INVITATION_NOT_AVAILABLE'; END IF;
  IF _inv.expires_at <= now() THEN
    UPDATE public.organization_invitations SET status = 'EXPIRED' WHERE id = _inv.id;
    RAISE EXCEPTION 'INVITATION_EXPIRED';
  END IF;
  IF _email IS NULL OR lower(_inv.email) <> _email THEN RAISE EXCEPTION 'INVITATION_EMAIL_MISMATCH'; END IF;

  INSERT INTO public.organization_memberships (organization_id, user_id, role, status)
  VALUES (_inv.organization_id, _uid, _inv.role, 'ACTIVE')
  ON CONFLICT (organization_id, user_id)
  DO UPDATE SET status = 'ACTIVE', role = EXCLUDED.role;

  UPDATE public.organization_invitations SET status = 'ACCEPTED' WHERE id = _inv.id;

  INSERT INTO public.organization_usage (organization_id, usage_key, usage_value)
  VALUES (_inv.organization_id, 'users', 1)
  ON CONFLICT (organization_id, usage_key) DO UPDATE SET usage_value = public.organization_usage.usage_value + 1;

  PERFORM public.write_audit(_inv.organization_id, 'MEMBER_ACCEPTED', 'membership', NULL, jsonb_build_object('email', _email));
  RETURN _inv.organization_id;
END; $$;

CREATE OR REPLACE FUNCTION public.platform_metrics()
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_global_admin() THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  RETURN jsonb_build_object(
    'organizations', (SELECT count(*) FROM public.organizations),
    'organizations_active', (SELECT count(*) FROM public.organizations WHERE status = 'ACTIVE'),
    'organizations_suspended', (SELECT count(*) FROM public.organizations WHERE status = 'SUSPENDED'),
    'users', (SELECT count(*) FROM public.profiles),
    'plans', (SELECT count(*) FROM public.plans WHERE status = 'ACTIVE'),
    'subscriptions', (SELECT count(*) FROM public.subscriptions),
    'subscriptions_trialing', (SELECT count(*) FROM public.subscriptions WHERE status = 'TRIALING')
  );
END; $$;

REVOKE EXECUTE ON FUNCTION public.bootstrap_session() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_organization(TEXT, TEXT, TEXT, TEXT) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_organization_status(UUID, public.org_status) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.change_member_role(UUID, public.org_role) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.remove_member(UUID) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.invite_member(UUID, TEXT, public.org_role) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.revoke_invitation(UUID) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.accept_invitation(TEXT) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.org_limit(UUID, TEXT) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.org_feature_enabled(UUID, TEXT) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.platform_metrics() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.normalize_slug(TEXT) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.unaccent_fallback(TEXT) FROM anon, PUBLIC;

GRANT EXECUTE ON FUNCTION public.bootstrap_session() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_organization(TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_organization_status(UUID, public.org_status) TO authenticated;
GRANT EXECUTE ON FUNCTION public.change_member_role(UUID, public.org_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.invite_member(UUID, TEXT, public.org_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_invitation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_invitation(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.org_limit(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.org_feature_enabled(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.platform_metrics() TO authenticated;
