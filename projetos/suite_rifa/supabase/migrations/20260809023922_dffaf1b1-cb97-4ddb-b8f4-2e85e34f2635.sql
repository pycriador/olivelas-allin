
-- ============================================================
-- 1. PLATFORM SETTINGS (no hardcoded business values in the UI)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS app_settings_select ON public.app_settings;
CREATE POLICY app_settings_select ON public.app_settings FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS app_settings_write_global_admin ON public.app_settings;
CREATE POLICY app_settings_write_global_admin ON public.app_settings FOR ALL TO authenticated
  USING (public.is_global_admin()) WITH CHECK (public.is_global_admin());

INSERT INTO public.app_settings (key, value) VALUES
  ('invite_expiry_days', '7'::jsonb),
  ('invite_rate_limit_per_hour', '20'::jsonb)
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.app_setting_int(_key TEXT, _default INT)
RETURNS INT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT (value #>> '{}')::int FROM public.app_settings WHERE key = _key), _default);
$$;

-- ============================================================
-- 2. ORGANIZATION PREFERENCES + CONTACT
-- ============================================================
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  ADD COLUMN IF NOT EXISTS locale TEXT NOT NULL DEFAULT 'pt-BR',
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'BRL',
  ADD COLUMN IF NOT EXISTS date_format TEXT NOT NULL DEFAULT 'dd/MM/yyyy';

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;

ALTER TABLE public.organization_invitations
  ADD COLUMN IF NOT EXISTS message TEXT,
  ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS resend_count INT NOT NULL DEFAULT 0;

-- one pending invitation per email/org
UPDATE public.organization_invitations i SET status = 'REVOKED'
WHERE i.status = 'INVITED' AND EXISTS (
  SELECT 1 FROM public.organization_invitations j
  WHERE j.organization_id = i.organization_id AND lower(j.email) = lower(i.email)
    AND j.status = 'INVITED' AND (j.created_at, j.id) > (i.created_at, i.id)
);
CREATE UNIQUE INDEX IF NOT EXISTS organization_invitations_pending_uidx
  ON public.organization_invitations (organization_id, lower(email))
  WHERE status = 'INVITED';

-- ============================================================
-- 3. INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_memberships_org ON public.organization_memberships (organization_id);
CREATE INDEX IF NOT EXISTS idx_memberships_user ON public.organization_memberships (user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_status ON public.organization_memberships (status);
CREATE INDEX IF NOT EXISTS idx_invitations_org ON public.organization_invitations (organization_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.organization_invitations (lower(email));
CREATE INDEX IF NOT EXISTS idx_invitations_status ON public.organization_invitations (status);
CREATE INDEX IF NOT EXISTS idx_invitations_expires ON public.organization_invitations (expires_at);
CREATE INDEX IF NOT EXISTS idx_audit_org ON public.audit_logs (organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON public.audit_logs (actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON public.audit_logs (created_at DESC);

-- ============================================================
-- 4. PERMISSION MODEL
-- ============================================================
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role public.org_role NOT NULL,
  permission_key TEXT NOT NULL,
  UNIQUE (role, permission_key)
);
GRANT SELECT ON public.role_permissions TO authenticated;
GRANT ALL ON public.role_permissions TO service_role;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS role_permissions_select ON public.role_permissions;
CREATE POLICY role_permissions_select ON public.role_permissions FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS role_permissions_write_global_admin ON public.role_permissions;
CREATE POLICY role_permissions_write_global_admin ON public.role_permissions FOR ALL TO authenticated
  USING (public.is_global_admin()) WITH CHECK (public.is_global_admin());

INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('OWNER','organization.view'),('OWNER','organization.update'),
  ('OWNER','users.view'),('OWNER','users.invite'),('OWNER','users.update'),('OWNER','users.remove'),
  ('OWNER','roles.view'),('OWNER','roles.update'),
  ('OWNER','billing.view'),('OWNER','usage.view'),('OWNER','audit.view'),
  ('OWNER','organization.suspend'),('OWNER','ownership.transfer'),
  ('ADMIN','organization.view'),('ADMIN','organization.update'),
  ('ADMIN','users.view'),('ADMIN','users.invite'),('ADMIN','users.update'),('ADMIN','users.remove'),
  ('ADMIN','roles.view'),('ADMIN','roles.update'),
  ('ADMIN','usage.view'),('ADMIN','audit.view'),
  ('MEMBER','organization.view'),
  ('VIEWER','organization.view'),('VIEWER','usage.view')
ON CONFLICT (role, permission_key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.has_permission(_org UUID, _permission TEXT, _user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_global_admin(_user_id) OR EXISTS (
    SELECT 1 FROM public.organization_memberships m
    JOIN public.role_permissions rp ON rp.role = m.role
    WHERE m.organization_id = _org AND m.user_id = _user_id
      AND m.status = 'ACTIVE' AND rp.permission_key = _permission
  );
$$;

CREATE OR REPLACE FUNCTION public.my_permissions(_org UUID)
RETURNS TEXT[] LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(
    (SELECT array_agg(DISTINCT rp.permission_key)
       FROM public.organization_memberships m
       JOIN public.role_permissions rp ON rp.role = m.role
      WHERE m.organization_id = _org AND m.user_id = auth.uid() AND m.status = 'ACTIVE'),
    ARRAY[]::text[]
  );
$$;

-- ============================================================
-- 5. SESSION BOOTSTRAP (records last access)
-- ============================================================
CREATE OR REPLACE FUNCTION public.bootstrap_session()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $function$
DECLARE
  _uid UUID := auth.uid();
  _claims JSONB := auth.jwt();
  _email TEXT; _name TEXT; _avatar TEXT; _promoted BOOLEAN := false;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'NOT_AUTHENTICATED'; END IF;
  _email := COALESCE(_claims->>'email', _claims->'user_metadata'->>'email');
  _name := COALESCE(_claims->'user_metadata'->>'full_name', _claims->'user_metadata'->>'name', split_part(COALESCE(_email,''), '@', 1));
  _avatar := COALESCE(_claims->'user_metadata'->>'avatar_url', _claims->'user_metadata'->>'picture');

  INSERT INTO public.profiles (id, full_name, avatar_url, email, last_seen_at)
  VALUES (_uid, _name, _avatar, _email, now())
  ON CONFLICT (id) DO UPDATE
    SET email = COALESCE(EXCLUDED.email, public.profiles.email),
        full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
        last_seen_at = now();

  PERFORM pg_advisory_xact_lock(hashtext('rafflehub_first_global_admin'));
  IF NOT EXISTS (SELECT 1 FROM public.platform_roles WHERE role = 'GLOBAL_ADMIN') THEN
    INSERT INTO public.platform_roles (user_id, role) VALUES (_uid, 'GLOBAL_ADMIN') ON CONFLICT DO NOTHING;
    _promoted := true;
    PERFORM public.write_audit(NULL, 'GLOBAL_ADMIN_BOOTSTRAPPED', 'user', _uid, '{}'::jsonb);
  END IF;

  RETURN jsonb_build_object('user_id', _uid, 'is_global_admin', public.is_global_admin(_uid), 'promoted', _promoted);
END; $function$;

-- ============================================================
-- 6. MEMBER LISTING (server-side search + pagination)
-- ============================================================
CREATE OR REPLACE FUNCTION public.list_organization_members(
  _org UUID, _search TEXT DEFAULT NULL, _role TEXT DEFAULT NULL, _status TEXT DEFAULT NULL,
  _limit INT DEFAULT 20, _offset INT DEFAULT 0
) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $function$
DECLARE _total BIGINT; _rows jsonb; _q TEXT := NULLIF(trim(COALESCE(_search,'')), '');
BEGIN
  IF NOT public.has_permission(_org, 'users.view') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  _limit := LEAST(GREATEST(COALESCE(_limit,20), 1), 100);
  _offset := GREATEST(COALESCE(_offset,0), 0);

  SELECT count(*) INTO _total
  FROM public.organization_memberships m LEFT JOIN public.profiles p ON p.id = m.user_id
  WHERE m.organization_id = _org
    AND m.status <> 'REMOVED'
    AND (_role IS NULL OR m.role::text = _role)
    AND (_status IS NULL OR m.status::text = _status)
    AND (_q IS NULL OR p.full_name ILIKE '%'||_q||'%' OR p.email ILIKE '%'||_q||'%');

  SELECT COALESCE(jsonb_agg(r ORDER BY r->>'created_at'), '[]'::jsonb) INTO _rows FROM (
    SELECT jsonb_build_object(
      'id', m.id, 'organization_id', m.organization_id, 'user_id', m.user_id,
      'role', m.role, 'status', m.status, 'created_at', m.created_at,
      'full_name', p.full_name, 'email', p.email, 'avatar_url', p.avatar_url,
      'last_seen_at', p.last_seen_at
    ) AS r
    FROM public.organization_memberships m LEFT JOIN public.profiles p ON p.id = m.user_id
    WHERE m.organization_id = _org
      AND m.status <> 'REMOVED'
      AND (_role IS NULL OR m.role::text = _role)
      AND (_status IS NULL OR m.status::text = _status)
      AND (_q IS NULL OR p.full_name ILIKE '%'||_q||'%' OR p.email ILIKE '%'||_q||'%')
    ORDER BY m.created_at ASC
    LIMIT _limit OFFSET _offset
  ) s;

  RETURN jsonb_build_object('total', _total, 'rows', _rows, 'limit', _limit, 'offset', _offset);
END; $function$;

-- ============================================================
-- 7. INVITATIONS
-- ============================================================
CREATE OR REPLACE FUNCTION public.invite_member(_org UUID, _email TEXT, _role public.org_role DEFAULT 'MEMBER', _message TEXT DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $function$
DECLARE _token TEXT; _limit BIGINT; _used BIGINT; _email_norm TEXT; _days INT; _rate INT; _recent INT; _id UUID;
BEGIN
  IF NOT public.has_permission(_org, 'users.invite') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF NOT public.org_is_active(_org) THEN RAISE EXCEPTION 'ORGANIZATION_NOT_ACTIVE'; END IF;
  IF _role NOT IN ('ADMIN','MEMBER','VIEWER') THEN RAISE EXCEPTION 'ROLE_NOT_INVITABLE'; END IF;

  _email_norm := lower(trim(_email));
  IF _email_norm !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN RAISE EXCEPTION 'INVALID_EMAIL'; END IF;

  _rate := public.app_setting_int('invite_rate_limit_per_hour', 20);
  SELECT count(*) INTO _recent FROM public.audit_logs
   WHERE organization_id = _org AND action IN ('USER_INVITED','INVITE_RESENT') AND created_at > now() - interval '1 hour';
  IF _recent >= _rate THEN RAISE EXCEPTION 'INVITE_RATE_LIMIT'; END IF;

  IF EXISTS (
    SELECT 1 FROM public.organization_memberships m JOIN public.profiles p ON p.id = m.user_id
    WHERE m.organization_id = _org AND lower(p.email) = _email_norm AND m.status IN ('ACTIVE','SUSPENDED')
  ) THEN RAISE EXCEPTION 'ALREADY_MEMBER'; END IF;

  IF EXISTS (
    SELECT 1 FROM public.organization_invitations
    WHERE organization_id = _org AND lower(email) = _email_norm AND status = 'INVITED' AND expires_at > now()
  ) THEN RAISE EXCEPTION 'INVITE_ALREADY_PENDING'; END IF;

  PERFORM pg_advisory_xact_lock(hashtext('org_users_limit_' || _org::text));
  SELECT public.org_limit(_org, 'max_users') INTO _limit;
  SELECT count(*) INTO _used FROM public.organization_memberships
   WHERE organization_id = _org AND status IN ('ACTIVE','INVITED','SUSPENDED');
  _used := _used + (SELECT count(*) FROM public.organization_invitations
                     WHERE organization_id = _org AND status = 'INVITED' AND expires_at > now());
  IF _limit IS NOT NULL AND _limit >= 0 AND _used >= _limit THEN
    RAISE EXCEPTION 'PLAN_LIMIT_REACHED_max_users';
  END IF;

  UPDATE public.organization_invitations SET status = 'EXPIRED'
   WHERE organization_id = _org AND lower(email) = _email_norm AND status = 'INVITED' AND expires_at <= now();

  _days := public.app_setting_int('invite_expiry_days', 7);
  _token := encode(extensions.gen_random_bytes(24), 'hex');
  INSERT INTO public.organization_invitations (organization_id, email, role, token_hash, expires_at, created_by, message, last_sent_at)
  VALUES (_org, _email_norm, _role, encode(extensions.digest(_token, 'sha256'), 'hex'),
          now() + make_interval(days => _days), auth.uid(), NULLIF(trim(COALESCE(_message,'')),''), now())
  RETURNING id INTO _id;

  PERFORM public.write_audit(_org, 'USER_INVITED', 'invitation', _id, jsonb_build_object('email', _email_norm, 'role', _role));
  RETURN jsonb_build_object('invitation_id', _id, 'token', _token, 'expires_in_days', _days);
END; $function$;

CREATE OR REPLACE FUNCTION public.resend_invitation(_invitation_id UUID)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $function$
DECLARE _inv RECORD; _token TEXT; _days INT; _rate INT; _recent INT;
BEGIN
  SELECT * INTO _inv FROM public.organization_invitations WHERE id = _invitation_id;
  IF _inv.id IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF NOT public.has_permission(_inv.organization_id, 'users.invite') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF NOT public.org_is_active(_inv.organization_id) THEN RAISE EXCEPTION 'ORGANIZATION_NOT_ACTIVE'; END IF;
  IF _inv.status NOT IN ('INVITED','EXPIRED') THEN RAISE EXCEPTION 'INVITATION_NOT_AVAILABLE'; END IF;

  _rate := public.app_setting_int('invite_rate_limit_per_hour', 20);
  SELECT count(*) INTO _recent FROM public.audit_logs
   WHERE organization_id = _inv.organization_id AND action IN ('USER_INVITED','INVITE_RESENT')
     AND created_at > now() - interval '1 hour';
  IF _recent >= _rate THEN RAISE EXCEPTION 'INVITE_RATE_LIMIT'; END IF;

  _days := public.app_setting_int('invite_expiry_days', 7);
  _token := encode(extensions.gen_random_bytes(24), 'hex');
  UPDATE public.organization_invitations
     SET token_hash = encode(extensions.digest(_token, 'sha256'), 'hex'),
         expires_at = now() + make_interval(days => _days),
         status = 'INVITED', last_sent_at = now(), resend_count = resend_count + 1
   WHERE id = _invitation_id;

  PERFORM public.write_audit(_inv.organization_id, 'INVITE_RESENT', 'invitation', _invitation_id,
    jsonb_build_object('email', _inv.email));
  RETURN jsonb_build_object('invitation_id', _invitation_id, 'token', _token, 'expires_in_days', _days);
END; $function$;

CREATE OR REPLACE FUNCTION public.revoke_invitation(_invitation_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $function$
DECLARE _inv RECORD;
BEGIN
  SELECT * INTO _inv FROM public.organization_invitations WHERE id = _invitation_id;
  IF _inv.id IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF NOT public.has_permission(_inv.organization_id, 'users.invite') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  UPDATE public.organization_invitations SET status = 'REVOKED' WHERE id = _invitation_id;
  PERFORM public.write_audit(_inv.organization_id, 'INVITE_REVOKED', 'invitation', _invitation_id,
    jsonb_build_object('email', _inv.email));
END; $function$;

CREATE OR REPLACE FUNCTION public.preview_invitation(_token TEXT)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $function$
DECLARE _inv RECORD; _org RECORD; _state TEXT;
BEGIN
  SELECT * INTO _inv FROM public.organization_invitations
   WHERE token_hash = encode(extensions.digest(trim(_token), 'sha256'), 'hex');
  IF _inv.id IS NULL THEN RETURN jsonb_build_object('state', 'NOT_FOUND'); END IF;
  SELECT name, slug, logo_url INTO _org FROM public.organizations WHERE id = _inv.organization_id;
  _state := CASE
    WHEN _inv.status = 'ACCEPTED' THEN 'ACCEPTED'
    WHEN _inv.status <> 'INVITED' THEN 'REVOKED'
    WHEN _inv.expires_at <= now() THEN 'EXPIRED'
    ELSE 'VALID' END;
  RETURN jsonb_build_object(
    'state', _state, 'email', _inv.email, 'role', _inv.role, 'message', _inv.message,
    'expires_at', _inv.expires_at, 'organization_name', _org.name, 'organization_slug', _org.slug
  );
END; $function$;

CREATE OR REPLACE FUNCTION public.accept_invitation(_token TEXT)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $function$
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

  UPDATE public.organization_invitations SET status = 'ACCEPTED', accepted_at = now() WHERE id = _inv.id;

  INSERT INTO public.organization_usage (organization_id, usage_key, usage_value)
  VALUES (_inv.organization_id, 'users', 1)
  ON CONFLICT (organization_id, usage_key) DO UPDATE SET usage_value = public.organization_usage.usage_value + 1;

  PERFORM public.write_audit(_inv.organization_id, 'INVITE_ACCEPTED', 'membership', NULL, jsonb_build_object('email', _email, 'role', _inv.role));
  RETURN _inv.organization_id;
END; $function$;

-- ============================================================
-- 8. MEMBERSHIP LIFECYCLE
-- ============================================================
CREATE OR REPLACE FUNCTION public.change_member_role(_membership_id UUID, _role public.org_role)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $function$
DECLARE _m RECORD; _owners INT; _is_owner BOOLEAN;
BEGIN
  SELECT * INTO _m FROM public.organization_memberships WHERE id = _membership_id;
  IF _m.id IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF NOT public.has_permission(_m.organization_id, 'roles.update') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF NOT public.org_is_active(_m.organization_id) AND NOT public.is_global_admin() THEN
    RAISE EXCEPTION 'ORGANIZATION_NOT_ACTIVE';
  END IF;

  _is_owner := public.has_org_role(_m.organization_id, ARRAY['OWNER']::public.org_role[]) OR public.is_global_admin();
  IF (_m.role = 'OWNER' OR _role = 'OWNER') AND NOT _is_owner THEN RAISE EXCEPTION 'OWNER_PROTECTED'; END IF;
  IF _role = 'OWNER' THEN RAISE EXCEPTION 'USE_OWNERSHIP_TRANSFER'; END IF;

  IF _m.role = 'OWNER' THEN
    SELECT count(*) INTO _owners FROM public.organization_memberships
     WHERE organization_id = _m.organization_id AND role = 'OWNER' AND status = 'ACTIVE';
    IF _owners <= 1 THEN RAISE EXCEPTION 'LAST_OWNER'; END IF;
  END IF;

  UPDATE public.organization_memberships SET role = _role WHERE id = _membership_id;
  PERFORM public.write_audit(_m.organization_id, 'USER_ROLE_CHANGED', 'membership', _membership_id,
    jsonb_build_object('user_id', _m.user_id, 'previous_role', _m.role, 'new_role', _role));
END; $function$;

CREATE OR REPLACE FUNCTION public.set_member_status(_membership_id UUID, _status public.membership_status)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $function$
DECLARE _m RECORD; _owners INT; _is_owner BOOLEAN;
BEGIN
  IF _status NOT IN ('ACTIVE','SUSPENDED') THEN RAISE EXCEPTION 'INVALID_STATUS'; END IF;
  SELECT * INTO _m FROM public.organization_memberships WHERE id = _membership_id;
  IF _m.id IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF NOT public.has_permission(_m.organization_id, 'users.update') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF NOT public.org_is_active(_m.organization_id) AND NOT public.is_global_admin() THEN
    RAISE EXCEPTION 'ORGANIZATION_NOT_ACTIVE';
  END IF;

  _is_owner := public.has_org_role(_m.organization_id, ARRAY['OWNER']::public.org_role[]) OR public.is_global_admin();
  IF _m.role = 'OWNER' AND NOT _is_owner THEN RAISE EXCEPTION 'OWNER_PROTECTED'; END IF;
  IF _m.user_id = auth.uid() AND _status = 'SUSPENDED' THEN RAISE EXCEPTION 'CANNOT_SUSPEND_SELF'; END IF;

  IF _m.role = 'OWNER' AND _status = 'SUSPENDED' THEN
    SELECT count(*) INTO _owners FROM public.organization_memberships
     WHERE organization_id = _m.organization_id AND role = 'OWNER' AND status = 'ACTIVE';
    IF _owners <= 1 THEN RAISE EXCEPTION 'LAST_OWNER'; END IF;
  END IF;

  UPDATE public.organization_memberships SET status = _status WHERE id = _membership_id;

  UPDATE public.organization_usage SET usage_value = GREATEST(
      (SELECT count(*) FROM public.organization_memberships
        WHERE organization_id = _m.organization_id AND status = 'ACTIVE'), 0)
   WHERE organization_id = _m.organization_id AND usage_key = 'users';

  PERFORM public.write_audit(_m.organization_id,
    CASE WHEN _status = 'SUSPENDED' THEN 'USER_SUSPENDED' ELSE 'USER_REACTIVATED' END,
    'membership', _membership_id, jsonb_build_object('user_id', _m.user_id, 'previous_status', _m.status, 'new_status', _status));
END; $function$;

CREATE OR REPLACE FUNCTION public.remove_member(_membership_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $function$
DECLARE _m RECORD; _owners INT; _is_owner BOOLEAN;
BEGIN
  SELECT * INTO _m FROM public.organization_memberships WHERE id = _membership_id;
  IF _m.id IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF NOT public.has_permission(_m.organization_id, 'users.remove') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF NOT public.org_is_active(_m.organization_id) AND NOT public.is_global_admin() THEN
    RAISE EXCEPTION 'ORGANIZATION_NOT_ACTIVE';
  END IF;

  _is_owner := public.has_org_role(_m.organization_id, ARRAY['OWNER']::public.org_role[]) OR public.is_global_admin();
  IF _m.role = 'OWNER' AND NOT _is_owner THEN RAISE EXCEPTION 'OWNER_PROTECTED'; END IF;

  IF _m.role = 'OWNER' THEN
    SELECT count(*) INTO _owners FROM public.organization_memberships
     WHERE organization_id = _m.organization_id AND role = 'OWNER' AND status = 'ACTIVE';
    IF _owners <= 1 THEN RAISE EXCEPTION 'LAST_OWNER'; END IF;
  END IF;

  UPDATE public.organization_memberships SET status = 'REMOVED' WHERE id = _membership_id;
  UPDATE public.organization_usage SET usage_value = GREATEST(
      (SELECT count(*) FROM public.organization_memberships
        WHERE organization_id = _m.organization_id AND status = 'ACTIVE'), 0)
   WHERE organization_id = _m.organization_id AND usage_key = 'users';

  PERFORM public.write_audit(_m.organization_id, 'USER_REMOVED', 'membership', _membership_id,
    jsonb_build_object('user_id', _m.user_id, 'previous_role', _m.role));
END; $function$;

CREATE OR REPLACE FUNCTION public.transfer_ownership(_membership_id UUID, _confirmation TEXT)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $function$
DECLARE _m RECORD; _org RECORD; _current UUID := auth.uid();
BEGIN
  SELECT * INTO _m FROM public.organization_memberships WHERE id = _membership_id;
  IF _m.id IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF NOT public.has_org_role(_m.organization_id, ARRAY['OWNER']::public.org_role[]) AND NOT public.is_global_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;
  IF NOT public.org_is_active(_m.organization_id) AND NOT public.is_global_admin() THEN
    RAISE EXCEPTION 'ORGANIZATION_NOT_ACTIVE';
  END IF;
  IF _m.status <> 'ACTIVE' THEN RAISE EXCEPTION 'MEMBER_NOT_ACTIVE'; END IF;

  SELECT * INTO _org FROM public.organizations WHERE id = _m.organization_id;
  IF lower(trim(COALESCE(_confirmation,''))) <> lower(_org.name) THEN RAISE EXCEPTION 'CONFIRMATION_MISMATCH'; END IF;
  IF _m.user_id = _current THEN RAISE EXCEPTION 'ALREADY_OWNER'; END IF;

  UPDATE public.organization_memberships SET role = 'OWNER' WHERE id = _membership_id;
  UPDATE public.organization_memberships SET role = 'ADMIN'
   WHERE organization_id = _m.organization_id AND user_id = _current AND role = 'OWNER';

  PERFORM public.write_audit(_m.organization_id, 'OWNERSHIP_TRANSFERRED', 'membership', _membership_id,
    jsonb_build_object('previous_owner', _current, 'new_owner', _m.user_id));
END; $function$;

-- ============================================================
-- 9. ORGANIZATION UPDATE / SUSPENSION / LOGO
-- ============================================================
DROP POLICY IF EXISTS orgs_update_admins ON public.organizations;
CREATE POLICY orgs_update_admins ON public.organizations FOR UPDATE TO authenticated
  USING (public.is_global_admin() OR (public.has_permission(id, 'organization.update') AND status = 'ACTIVE'))
  WITH CHECK (public.is_global_admin() OR (public.has_permission(id, 'organization.update') AND status = 'ACTIVE'));

CREATE OR REPLACE FUNCTION public.guard_organization_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $function$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NOT public.is_global_admin() THEN
      IF NOT (OLD.status = 'ACTIVE' AND NEW.status = 'SUSPENDED'
              AND public.has_org_role(NEW.id, ARRAY['OWNER']::public.org_role[])) THEN
        RAISE EXCEPTION 'ONLY_GLOBAL_ADMIN_CAN_CHANGE_STATUS';
      END IF;
    END IF;
  END IF;
  IF NEW.slug IS DISTINCT FROM OLD.slug THEN
    NEW.slug := public.normalize_slug(NEW.slug);
    IF NOT public.has_org_role(NEW.id, ARRAY['OWNER']::public.org_role[]) AND NOT public.is_global_admin() THEN
      RAISE EXCEPTION 'ONLY_OWNER_CAN_CHANGE_SLUG';
    END IF;
  END IF;
  NEW.created_by := OLD.created_by;
  RETURN NEW;
END; $function$;

CREATE OR REPLACE FUNCTION public.suspend_own_organization(_org UUID, _confirmation TEXT)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $function$
DECLARE _o RECORD;
BEGIN
  SELECT * INTO _o FROM public.organizations WHERE id = _org;
  IF _o.id IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF NOT public.has_org_role(_org, ARRAY['OWNER']::public.org_role[]) AND NOT public.is_global_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;
  IF lower(trim(COALESCE(_confirmation,''))) <> lower(_o.name) THEN RAISE EXCEPTION 'CONFIRMATION_MISMATCH'; END IF;
  UPDATE public.organizations SET status = 'SUSPENDED' WHERE id = _org;
END; $function$;

CREATE OR REPLACE FUNCTION public.set_organization_logo(_org UUID, _path TEXT)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $function$
DECLARE _old TEXT;
BEGIN
  IF NOT public.has_permission(_org, 'organization.update') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF NOT public.org_is_active(_org) AND NOT public.is_global_admin() THEN RAISE EXCEPTION 'ORGANIZATION_NOT_ACTIVE'; END IF;
  SELECT logo_url INTO _old FROM public.organizations WHERE id = _org;
  UPDATE public.organizations SET logo_url = NULLIF(trim(COALESCE(_path,'')),'') WHERE id = _org;
  PERFORM public.write_audit(_org, 'LOGO_UPDATED', 'organization', _org,
    jsonb_build_object('had_logo', _old IS NOT NULL, 'has_logo', NULLIF(trim(COALESCE(_path,'')),'') IS NOT NULL));
END; $function$;

-- ============================================================
-- 10. AUDIT SEARCH
-- ============================================================
CREATE OR REPLACE FUNCTION public.list_audit_logs(
  _org UUID, _action TEXT DEFAULT NULL, _actor UUID DEFAULT NULL, _entity TEXT DEFAULT NULL,
  _from TIMESTAMPTZ DEFAULT NULL, _to TIMESTAMPTZ DEFAULT NULL, _limit INT DEFAULT 25, _offset INT DEFAULT 0
) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $function$
DECLARE _total BIGINT; _rows jsonb;
BEGIN
  IF NOT public.has_permission(_org, 'audit.view') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  _limit := LEAST(GREATEST(COALESCE(_limit,25), 1), 100);
  _offset := GREATEST(COALESCE(_offset,0), 0);

  SELECT count(*) INTO _total FROM public.audit_logs a
   WHERE a.organization_id = _org
     AND (_action IS NULL OR a.action = _action)
     AND (_actor IS NULL OR a.actor_user_id = _actor)
     AND (_entity IS NULL OR a.entity_type = _entity)
     AND (_from IS NULL OR a.created_at >= _from)
     AND (_to IS NULL OR a.created_at <= _to);

  SELECT COALESCE(jsonb_agg(r), '[]'::jsonb) INTO _rows FROM (
    SELECT jsonb_build_object(
      'id', a.id, 'action', a.action, 'entity_type', a.entity_type, 'entity_id', a.entity_id,
      'metadata', a.metadata, 'created_at', a.created_at, 'actor_user_id', a.actor_user_id,
      'actor_name', p.full_name, 'actor_email', p.email
    ) AS r
    FROM public.audit_logs a LEFT JOIN public.profiles p ON p.id = a.actor_user_id
    WHERE a.organization_id = _org
      AND (_action IS NULL OR a.action = _action)
      AND (_actor IS NULL OR a.actor_user_id = _actor)
      AND (_entity IS NULL OR a.entity_type = _entity)
      AND (_from IS NULL OR a.created_at >= _from)
      AND (_to IS NULL OR a.created_at <= _to)
    ORDER BY a.created_at DESC
    LIMIT _limit OFFSET _offset
  ) s;

  RETURN jsonb_build_object('total', _total, 'rows', _rows, 'limit', _limit, 'offset', _offset);
END; $function$;

-- ============================================================
-- 11. PLATFORM ADMIN
-- ============================================================
CREATE OR REPLACE FUNCTION public.platform_list_organizations(
  _search TEXT DEFAULT NULL, _status TEXT DEFAULT NULL, _limit INT DEFAULT 20, _offset INT DEFAULT 0
) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $function$
DECLARE _total BIGINT; _rows jsonb; _q TEXT := NULLIF(trim(COALESCE(_search,'')), '');
BEGIN
  IF NOT public.is_global_admin() THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  _limit := LEAST(GREATEST(COALESCE(_limit,20),1),100); _offset := GREATEST(COALESCE(_offset,0),0);

  SELECT count(*) INTO _total FROM public.organizations o
   WHERE (_status IS NULL OR o.status::text = _status)
     AND (_q IS NULL OR o.name ILIKE '%'||_q||'%' OR o.slug ILIKE '%'||_q||'%');

  SELECT COALESCE(jsonb_agg(r), '[]'::jsonb) INTO _rows FROM (
    SELECT jsonb_build_object(
      'id', o.id, 'name', o.name, 'slug', o.slug, 'status', o.status, 'created_at', o.created_at,
      'owner_name', op.full_name, 'owner_email', op.email,
      'plan_name', pl.name,
      'users', (SELECT count(*) FROM public.organization_memberships m WHERE m.organization_id = o.id AND m.status = 'ACTIVE'),
      'campaigns', 0
    ) AS r
    FROM public.organizations o
    LEFT JOIN LATERAL (
      SELECT p.full_name, p.email FROM public.organization_memberships m
      JOIN public.profiles p ON p.id = m.user_id
      WHERE m.organization_id = o.id AND m.role = 'OWNER' AND m.status = 'ACTIVE'
      ORDER BY m.created_at ASC LIMIT 1
    ) op ON true
    LEFT JOIN public.subscriptions s ON s.organization_id = o.id
    LEFT JOIN public.plans pl ON pl.id = s.plan_id
    WHERE (_status IS NULL OR o.status::text = _status)
      AND (_q IS NULL OR o.name ILIKE '%'||_q||'%' OR o.slug ILIKE '%'||_q||'%')
    ORDER BY o.created_at DESC
    LIMIT _limit OFFSET _offset
  ) t;

  RETURN jsonb_build_object('total', _total, 'rows', _rows);
END; $function$;

CREATE OR REPLACE FUNCTION public.platform_list_users(
  _search TEXT DEFAULT NULL, _limit INT DEFAULT 20, _offset INT DEFAULT 0
) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $function$
DECLARE _total BIGINT; _rows jsonb; _q TEXT := NULLIF(trim(COALESCE(_search,'')), '');
BEGIN
  IF NOT public.is_global_admin() THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  _limit := LEAST(GREATEST(COALESCE(_limit,20),1),100); _offset := GREATEST(COALESCE(_offset,0),0);

  SELECT count(*) INTO _total FROM public.profiles p
   WHERE (_q IS NULL OR p.full_name ILIKE '%'||_q||'%' OR p.email ILIKE '%'||_q||'%');

  SELECT COALESCE(jsonb_agg(r), '[]'::jsonb) INTO _rows FROM (
    SELECT jsonb_build_object(
      'id', p.id, 'full_name', p.full_name, 'email', p.email, 'avatar_url', p.avatar_url,
      'created_at', p.created_at, 'last_seen_at', p.last_seen_at,
      'is_global_admin', public.is_global_admin(p.id),
      'organizations', (SELECT count(*) FROM public.organization_memberships m WHERE m.user_id = p.id AND m.status = 'ACTIVE')
    ) AS r
    FROM public.profiles p
    WHERE (_q IS NULL OR p.full_name ILIKE '%'||_q||'%' OR p.email ILIKE '%'||_q||'%')
    ORDER BY p.created_at DESC
    LIMIT _limit OFFSET _offset
  ) t;

  RETURN jsonb_build_object('total', _total, 'rows', _rows);
END; $function$;

CREATE OR REPLACE FUNCTION public.platform_organization_detail(_org UUID)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $function$
DECLARE _result jsonb;
BEGIN
  IF NOT public.is_global_admin() THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  SELECT jsonb_build_object(
    'organization', to_jsonb(o),
    'members', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('id', m.id, 'role', m.role, 'status', m.status,
             'full_name', p.full_name, 'email', p.email, 'created_at', m.created_at) ORDER BY m.created_at)
      FROM public.organization_memberships m LEFT JOIN public.profiles p ON p.id = m.user_id
      WHERE m.organization_id = o.id AND m.status <> 'REMOVED'), '[]'::jsonb),
    'subscription', (
      SELECT jsonb_build_object('status', s.status, 'billing_interval', s.billing_interval,
             'current_period_end', s.current_period_end, 'trial_end', s.trial_end,
             'plan_name', pl.name, 'plan_slug', pl.slug)
      FROM public.subscriptions s JOIN public.plans pl ON pl.id = s.plan_id
      WHERE s.organization_id = o.id LIMIT 1),
    'usage', COALESCE((SELECT jsonb_object_agg(u.usage_key, u.usage_value)
      FROM public.organization_usage u WHERE u.organization_id = o.id), '{}'::jsonb),
    'audit', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('id', a.id, 'action', a.action, 'created_at', a.created_at,
             'actor_name', p.full_name, 'metadata', a.metadata) ORDER BY a.created_at DESC)
      FROM (SELECT * FROM public.audit_logs WHERE organization_id = o.id ORDER BY created_at DESC LIMIT 25) a
      LEFT JOIN public.profiles p ON p.id = a.actor_user_id), '[]'::jsonb)
  ) INTO _result
  FROM public.organizations o WHERE o.id = _org;

  IF _result IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  RETURN _result;
END; $function$;

REVOKE EXECUTE ON FUNCTION public.app_setting_int(TEXT, INT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_permission(UUID, TEXT, UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.my_permissions(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.list_organization_members(UUID, TEXT, TEXT, TEXT, INT, INT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.list_audit_logs(UUID, TEXT, UUID, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, INT, INT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.platform_list_organizations(TEXT, TEXT, INT, INT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.platform_list_users(TEXT, INT, INT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.platform_organization_detail(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.set_member_status(UUID, public.membership_status) FROM anon;
REVOKE EXECUTE ON FUNCTION public.transfer_ownership(UUID, TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.suspend_own_organization(UUID, TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.set_organization_logo(UUID, TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.resend_invitation(UUID) FROM anon;
