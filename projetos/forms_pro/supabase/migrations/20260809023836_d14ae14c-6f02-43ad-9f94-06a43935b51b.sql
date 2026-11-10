-- ============ ENUMS ============
CREATE TYPE public.org_role AS ENUM ('owner','admin','manager','editor','viewer');
CREATE TYPE public.member_status AS ENUM ('active','invited','suspended');
CREATE TYPE public.invitation_status AS ENUM ('pending','accepted','cancelled','expired');
CREATE TYPE public.org_permission AS ENUM (
  'manage_organization','manage_members','manage_roles','manage_forms','publish_forms',
  'view_responses','export_responses','view_analytics','manage_templates',
  'manage_integrations','manage_api_keys','manage_webhooks','manage_automations','view_audit_logs'
);
CREATE TYPE public.api_key_status AS ENUM ('active','revoked','expired');
CREATE TYPE public.webhook_status AS ENUM ('active','paused','disabled');
CREATE TYPE public.delivery_status AS ENUM ('pending','success','failed','retrying');
CREATE TYPE public.automation_status AS ENUM ('active','paused','draft');
CREATE TYPE public.execution_status AS ENUM ('success','failed','skipped');
CREATE TYPE public.integration_status AS ENUM ('connected','disconnected','error');
CREATE TYPE public.plan_tier AS ENUM ('free','pro','business','enterprise');
CREATE TYPE public.severity AS ENUM ('info','success','warning','error');

-- ============ ORGANIZATIONS ============
CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  legal_name text NOT NULL DEFAULT '',
  status entity_status NOT NULL DEFAULT 'active',
  logo_url text,
  plan plan_tier NOT NULL DEFAULT 'free',
  response_retention_days integer NOT NULL DEFAULT 365,
  audit_retention_days integer NOT NULL DEFAULT 365,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizations TO authenticated;
GRANT ALL ON public.organizations TO service_role;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role org_role NOT NULL DEFAULT 'viewer',
  status member_status NOT NULL DEFAULT 'active',
  joined_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_members TO authenticated;
GRANT ALL ON public.organization_members TO service_role;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.org_role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role org_role NOT NULL,
  permission org_permission NOT NULL,
  UNIQUE (role, permission)
);
GRANT SELECT ON public.org_role_permissions TO authenticated;
GRANT ALL ON public.org_role_permissions TO service_role;
ALTER TABLE public.org_role_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org role perms read" ON public.org_role_permissions FOR SELECT TO authenticated USING (true);

INSERT INTO public.org_role_permissions (role, permission)
SELECT 'owner'::org_role, p FROM unnest(enum_range(NULL::org_permission)) p
UNION ALL
SELECT 'admin'::org_role, p FROM unnest(enum_range(NULL::org_permission)) p
  WHERE p <> 'manage_organization'
UNION ALL
SELECT 'manager'::org_role, p FROM unnest(ARRAY[
  'manage_members','manage_forms','publish_forms','view_responses','export_responses',
  'view_analytics','manage_templates','view_audit_logs']::org_permission[]) p
UNION ALL
SELECT 'editor'::org_role, p FROM unnest(ARRAY[
  'manage_forms','publish_forms','view_responses','view_analytics']::org_permission[]) p
UNION ALL
SELECT 'viewer'::org_role, p FROM unnest(ARRAY[
  'view_responses','view_analytics']::org_permission[]) p;

-- ============ HELPER FUNCTIONS ============
CREATE OR REPLACE FUNCTION public.org_member_role(_user_id uuid, _org_id uuid)
RETURNS org_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.organization_members
  WHERE user_id = _user_id AND organization_id = _org_id AND status = 'active';
$$;

CREATE OR REPLACE FUNCTION public.is_org_member(_user_id uuid, _org_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = _user_id AND organization_id = _org_id AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.has_org_permission(_user_id uuid, _org_id uuid, _perm org_permission)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members m
    JOIN public.org_role_permissions rp ON rp.role = m.role
    WHERE m.user_id = _user_id AND m.organization_id = _org_id
      AND m.status = 'active' AND rp.permission = _perm
  );
$$;

CREATE OR REPLACE FUNCTION public.shares_org(_a uuid, _b uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members x
    JOIN public.organization_members y ON y.organization_id = x.organization_id
    WHERE x.user_id = _a AND y.user_id = _b AND x.status = 'active' AND y.status = 'active'
  );
$$;

REVOKE EXECUTE ON FUNCTION public.org_member_role(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_org_member(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_org_permission(uuid, uuid, org_permission) FROM anon;
REVOKE EXECUTE ON FUNCTION public.shares_org(uuid, uuid) FROM anon;

CREATE POLICY "orgs read" ON public.organizations FOR SELECT TO authenticated
  USING (is_org_member(auth.uid(), id) OR is_admin(auth.uid()));
CREATE POLICY "orgs create" ON public.organizations FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());
CREATE POLICY "orgs update" ON public.organizations FOR UPDATE TO authenticated
  USING (has_org_permission(auth.uid(), id, 'manage_organization') OR is_admin(auth.uid()))
  WITH CHECK (has_org_permission(auth.uid(), id, 'manage_organization') OR is_admin(auth.uid()));
CREATE POLICY "orgs delete" ON public.organizations FOR DELETE TO authenticated
  USING (org_member_role(auth.uid(), id) = 'owner' OR is_admin(auth.uid()));

CREATE POLICY "members read" ON public.organization_members FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_org_member(auth.uid(), organization_id) OR is_admin(auth.uid()));
CREATE POLICY "members insert" ON public.organization_members FOR INSERT TO authenticated
  WITH CHECK (
    has_org_permission(auth.uid(), organization_id, 'manage_members')
    OR is_admin(auth.uid())
    OR (user_id = auth.uid() AND EXISTS (
      SELECT 1 FROM public.organizations o WHERE o.id = organization_id AND o.created_by = auth.uid()
    ))
  );
CREATE POLICY "members update" ON public.organization_members FOR UPDATE TO authenticated
  USING (has_org_permission(auth.uid(), organization_id, 'manage_members') OR is_admin(auth.uid()))
  WITH CHECK (has_org_permission(auth.uid(), organization_id, 'manage_members') OR is_admin(auth.uid()));
CREATE POLICY "members delete" ON public.organization_members FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR has_org_permission(auth.uid(), organization_id, 'manage_members') OR is_admin(auth.uid()));

-- ============ INVITATIONS ============
CREATE TABLE public.organization_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email text NOT NULL,
  role org_role NOT NULL DEFAULT 'viewer',
  status invitation_status NOT NULL DEFAULT 'pending',
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_invitations TO authenticated;
GRANT ALL ON public.organization_invitations TO service_role;
ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invites read" ON public.organization_invitations FOR SELECT TO authenticated
  USING (
    has_org_permission(auth.uid(), organization_id, 'manage_members')
    OR lower(email) = lower(COALESCE((auth.jwt() ->> 'email'), ''))
  );
CREATE POLICY "invites write" ON public.organization_invitations FOR INSERT TO authenticated
  WITH CHECK (has_org_permission(auth.uid(), organization_id, 'manage_members'));
CREATE POLICY "invites update" ON public.organization_invitations FOR UPDATE TO authenticated
  USING (
    has_org_permission(auth.uid(), organization_id, 'manage_members')
    OR lower(email) = lower(COALESCE((auth.jwt() ->> 'email'), ''))
  )
  WITH CHECK (
    has_org_permission(auth.uid(), organization_id, 'manage_members')
    OR lower(email) = lower(COALESCE((auth.jwt() ->> 'email'), ''))
  );
CREATE POLICY "invites delete" ON public.organization_invitations FOR DELETE TO authenticated
  USING (has_org_permission(auth.uid(), organization_id, 'manage_members'));

-- ============ API KEYS ============
CREATE TABLE public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  key_hash text NOT NULL,
  prefix text NOT NULL,
  status api_key_status NOT NULL DEFAULT 'active',
  scopes text[] NOT NULL DEFAULT ARRAY['read']::text[],
  last_used_at timestamptz,
  expires_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.api_keys TO authenticated;
GRANT ALL ON public.api_keys TO service_role;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "api keys manage" ON public.api_keys FOR ALL TO authenticated
  USING (has_org_permission(auth.uid(), organization_id, 'manage_api_keys'))
  WITH CHECK (has_org_permission(auth.uid(), organization_id, 'manage_api_keys'));

-- ============ WEBHOOKS ============
CREATE TABLE public.webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  url text NOT NULL,
  events text[] NOT NULL DEFAULT ARRAY[]::text[],
  status webhook_status NOT NULL DEFAULT 'active',
  secret text NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  max_retries integer NOT NULL DEFAULT 3,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.webhooks TO authenticated;
GRANT ALL ON public.webhooks TO service_role;
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "webhooks manage" ON public.webhooks FOR ALL TO authenticated
  USING (has_org_permission(auth.uid(), organization_id, 'manage_webhooks'))
  WITH CHECK (has_org_permission(auth.uid(), organization_id, 'manage_webhooks'));

CREATE TABLE public.webhook_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id uuid NOT NULL REFERENCES public.webhooks(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  event text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status delivery_status NOT NULL DEFAULT 'pending',
  http_status integer,
  attempt integer NOT NULL DEFAULT 1,
  duration_ms integer,
  response_body text,
  error text,
  next_retry_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.webhook_deliveries TO authenticated;
GRANT ALL ON public.webhook_deliveries TO service_role;
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deliveries manage" ON public.webhook_deliveries FOR ALL TO authenticated
  USING (has_org_permission(auth.uid(), organization_id, 'manage_webhooks'))
  WITH CHECK (has_org_permission(auth.uid(), organization_id, 'manage_webhooks'));
CREATE INDEX idx_deliveries_webhook ON public.webhook_deliveries (webhook_id, created_at DESC);

-- ============ INTEGRATIONS ============
CREATE TABLE public.integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  provider text NOT NULL,
  category text NOT NULL DEFAULT 'other',
  status integration_status NOT NULL DEFAULT 'disconnected',
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  secret_ref text,
  connected_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  connected_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, provider)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.integrations TO authenticated;
GRANT ALL ON public.integrations TO service_role;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "integrations read" ON public.integrations FOR SELECT TO authenticated
  USING (is_org_member(auth.uid(), organization_id));
CREATE POLICY "integrations write" ON public.integrations FOR ALL TO authenticated
  USING (has_org_permission(auth.uid(), organization_id, 'manage_integrations'))
  WITH CHECK (has_org_permission(auth.uid(), organization_id, 'manage_integrations'));

-- ============ AUTOMATIONS ============
CREATE TABLE public.automation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  trigger_type text NOT NULL,
  form_id uuid REFERENCES public.forms(id) ON DELETE CASCADE,
  conditions jsonb NOT NULL DEFAULT '[]'::jsonb,
  actions jsonb NOT NULL DEFAULT '[]'::jsonb,
  status automation_status NOT NULL DEFAULT 'active',
  last_run_at timestamptz,
  run_count integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.automation_rules TO authenticated;
GRANT ALL ON public.automation_rules TO service_role;
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "automations read" ON public.automation_rules FOR SELECT TO authenticated
  USING (is_org_member(auth.uid(), organization_id));
CREATE POLICY "automations write" ON public.automation_rules FOR ALL TO authenticated
  USING (has_org_permission(auth.uid(), organization_id, 'manage_automations'))
  WITH CHECK (has_org_permission(auth.uid(), organization_id, 'manage_automations'));

CREATE TABLE public.automation_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id uuid NOT NULL REFERENCES public.automation_rules(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  status execution_status NOT NULL DEFAULT 'success',
  trigger_type text NOT NULL,
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  result jsonb NOT NULL DEFAULT '{}'::jsonb,
  error text,
  duration_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.automation_executions TO authenticated;
GRANT ALL ON public.automation_executions TO service_role;
ALTER TABLE public.automation_executions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "executions read" ON public.automation_executions FOR SELECT TO authenticated
  USING (is_org_member(auth.uid(), organization_id));
CREATE POLICY "executions insert" ON public.automation_executions FOR INSERT TO authenticated
  WITH CHECK (is_org_member(auth.uid(), organization_id));

-- ============ LIMITS, PLANS, FLAGS, EVENTS ============
CREATE TABLE public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tier plan_tier NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  limits jsonb NOT NULL DEFAULT '{}'::jsonb,
  features text[] NOT NULL DEFAULT ARRAY[]::text[],
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.plans TO authenticated;
GRANT ALL ON public.plans TO service_role;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plans read" ON public.plans FOR SELECT TO authenticated USING (true);

INSERT INTO public.plans (tier, name, description, limits, features) VALUES
 ('free','Free','Para começar','{"max_users":3,"max_forms":5,"max_responses":500,"max_storage_mb":100,"max_api_calls":1000,"max_webhooks":1,"max_automations":1}','{}'),
 ('pro','Pro','Times em crescimento','{"max_users":15,"max_forms":50,"max_responses":25000,"max_storage_mb":5000,"max_api_calls":100000,"max_webhooks":10,"max_automations":20}','{api_access,webhooks}'),
 ('business','Business','Operações completas','{"max_users":100,"max_forms":500,"max_responses":250000,"max_storage_mb":50000,"max_api_calls":1000000,"max_webhooks":50,"max_automations":200}','{api_access,webhooks,automations,advanced_analytics}'),
 ('enterprise','Enterprise','Governança avançada','{"max_users":100000,"max_forms":100000,"max_responses":100000000,"max_storage_mb":1000000,"max_api_calls":100000000,"max_webhooks":1000,"max_automations":5000}','{api_access,webhooks,automations,advanced_analytics,enterprise_features}');

CREATE TABLE public.organization_limits (
  organization_id uuid PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
  max_users integer NOT NULL DEFAULT 3,
  max_forms integer NOT NULL DEFAULT 5,
  max_responses integer NOT NULL DEFAULT 500,
  max_storage_mb integer NOT NULL DEFAULT 100,
  max_api_calls integer NOT NULL DEFAULT 1000,
  max_webhooks integer NOT NULL DEFAULT 1,
  max_automations integer NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_limits TO authenticated;
GRANT ALL ON public.organization_limits TO service_role;
ALTER TABLE public.organization_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "limits read" ON public.organization_limits FOR SELECT TO authenticated
  USING (is_org_member(auth.uid(), organization_id));
CREATE POLICY "limits write" ON public.organization_limits FOR ALL TO authenticated
  USING (has_org_permission(auth.uid(), organization_id, 'manage_organization') OR is_admin(auth.uid()))
  WITH CHECK (has_org_permission(auth.uid(), organization_id, 'manage_organization') OR is_admin(auth.uid()));

CREATE TABLE public.feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL,
  description text NOT NULL DEFAULT '',
  enabled boolean NOT NULL DEFAULT false,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_flag_scope ON public.feature_flags (key, COALESCE(organization_id, '00000000-0000-0000-0000-000000000000'::uuid), COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.feature_flags TO authenticated;
GRANT ALL ON public.feature_flags TO service_role;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "flags read" ON public.feature_flags FOR SELECT TO authenticated
  USING (organization_id IS NULL OR is_org_member(auth.uid(), organization_id));
CREATE POLICY "flags write" ON public.feature_flags FOR ALL TO authenticated
  USING (is_admin(auth.uid()) OR (organization_id IS NOT NULL AND has_org_permission(auth.uid(), organization_id, 'manage_organization')))
  WITH CHECK (is_admin(auth.uid()) OR (organization_id IS NOT NULL AND has_org_permission(auth.uid(), organization_id, 'manage_organization')));

INSERT INTO public.feature_flags (key, description, enabled) VALUES
 ('api_access','Acesso à API pública', true),
 ('webhooks','Webhooks de eventos', true),
 ('automations','Motor de automações', true),
 ('advanced_analytics','Analytics avançado', true),
 ('enterprise_features','Recursos enterprise', false);

CREATE TABLE public.system_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  source text NOT NULL,
  severity severity NOT NULL DEFAULT 'error',
  message text NOT NULL,
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.system_events TO authenticated;
GRANT ALL ON public.system_events TO service_role;
ALTER TABLE public.system_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events read" ON public.system_events FOR SELECT TO authenticated
  USING (organization_id IS NULL OR is_org_member(auth.uid(), organization_id));
CREATE POLICY "events insert" ON public.system_events FOR INSERT TO authenticated
  WITH CHECK (organization_id IS NULL OR is_org_member(auth.uid(), organization_id));

CREATE TABLE public.api_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  api_key_id uuid REFERENCES public.api_keys(id) ON DELETE SET NULL,
  endpoint text NOT NULL,
  method text NOT NULL DEFAULT 'GET',
  status_code integer NOT NULL DEFAULT 200,
  duration_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.api_usage TO authenticated;
GRANT ALL ON public.api_usage TO service_role;
ALTER TABLE public.api_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "usage read" ON public.api_usage FOR SELECT TO authenticated
  USING (is_org_member(auth.uid(), organization_id));
CREATE INDEX idx_usage_org_time ON public.api_usage (organization_id, created_at DESC);

-- ============ TENANT COLUMNS ON EXISTING TABLES ============
ALTER TABLE public.forms ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.groups ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.form_templates ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.audit_logs ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.notifications ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.form_responses ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

-- ============ BACKFILL DEFAULT ORG ============
DO $$
DECLARE org uuid; owner_uid uuid;
BEGIN
  IF EXISTS (SELECT 1 FROM public.profiles) THEN
    SELECT ur.user_id INTO owner_uid FROM public.user_roles ur WHERE ur.role = 'admin' ORDER BY ur.created_at LIMIT 1;
    IF owner_uid IS NULL THEN SELECT id INTO owner_uid FROM public.profiles ORDER BY created_at LIMIT 1; END IF;

    INSERT INTO public.organizations (name, slug, legal_name, created_by)
    VALUES ('Minha Organização', 'minha-organizacao', 'Minha Organização', owner_uid)
    RETURNING id INTO org;

    INSERT INTO public.organization_members (organization_id, user_id, role)
    SELECT org, p.id, CASE WHEN p.id = owner_uid THEN 'owner'::org_role
      WHEN public.has_role(p.id, 'admin') THEN 'admin'::org_role
      WHEN public.has_role(p.id, 'manager') THEN 'manager'::org_role
      ELSE 'editor'::org_role END
    FROM public.profiles p;

    INSERT INTO public.organization_limits (organization_id) VALUES (org);

    UPDATE public.forms SET organization_id = org WHERE organization_id IS NULL;
    UPDATE public.groups SET organization_id = org WHERE organization_id IS NULL;
    UPDATE public.audit_logs SET organization_id = org WHERE organization_id IS NULL;
    UPDATE public.notifications SET organization_id = org WHERE organization_id IS NULL;
    UPDATE public.form_responses r SET organization_id = f.organization_id FROM public.forms f WHERE f.id = r.form_id AND r.organization_id IS NULL;
  END IF;
END $$;

-- ============ TENANT-AWARE POLICIES ============
CREATE OR REPLACE FUNCTION public.can_manage_form(_user_id uuid, _form_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.forms f
    WHERE f.id = _form_id AND (
      f.owner_id = _user_id
      OR public.has_role(_user_id, 'admin')
      OR (f.organization_id IS NOT NULL AND public.has_org_permission(_user_id, f.organization_id, 'manage_forms'))
    )
  );
$$;

DROP POLICY IF EXISTS "forms scoped read" ON public.forms;
CREATE POLICY "forms scoped read" ON public.forms FOR SELECT TO authenticated
  USING (
    owner_id = auth.uid()
    OR is_admin(auth.uid())
    OR (status = 'published' AND visibility = 'public')
    OR (organization_id IS NOT NULL AND is_org_member(auth.uid(), organization_id))
  );

DROP POLICY IF EXISTS "forms insert own" ON public.forms;
CREATE POLICY "forms insert own" ON public.forms FOR INSERT TO authenticated
  WITH CHECK (
    owner_id = auth.uid()
    AND (organization_id IS NULL OR is_org_member(auth.uid(), organization_id))
  );

DROP POLICY IF EXISTS "groups read" ON public.groups;
CREATE POLICY "groups read" ON public.groups FOR SELECT TO authenticated
  USING (organization_id IS NULL OR is_org_member(auth.uid(), organization_id) OR is_admin(auth.uid()));
DROP POLICY IF EXISTS "groups admin write" ON public.groups;
CREATE POLICY "groups write" ON public.groups FOR ALL TO authenticated
  USING (is_admin(auth.uid()) OR (organization_id IS NOT NULL AND has_org_permission(auth.uid(), organization_id, 'manage_members')))
  WITH CHECK (is_admin(auth.uid()) OR (organization_id IS NOT NULL AND has_org_permission(auth.uid(), organization_id, 'manage_members')));

DROP POLICY IF EXISTS "templates read" ON public.form_templates;
CREATE POLICY "templates read" ON public.form_templates FOR SELECT TO authenticated
  USING ((active AND organization_id IS NULL) OR (organization_id IS NOT NULL AND is_org_member(auth.uid(), organization_id)) OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "audit read" ON public.audit_logs;
CREATE POLICY "audit read" ON public.audit_logs FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR has_permission(auth.uid(), 'view_audit_logs')
    OR (organization_id IS NOT NULL AND has_org_permission(auth.uid(), organization_id, 'view_audit_logs'))
  );

DROP POLICY IF EXISTS "profiles self read" ON public.profiles;
CREATE POLICY "profiles self read" ON public.profiles FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR is_admin(auth.uid())
    OR shares_org(auth.uid(), id)
  );

CREATE TRIGGER organizations_updated BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER org_members_updated BEFORE UPDATE ON public.organization_members FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER invitations_updated BEFORE UPDATE ON public.organization_invitations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER webhooks_updated BEFORE UPDATE ON public.webhooks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER integrations_updated BEFORE UPDATE ON public.integrations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER automations_updated BEFORE UPDATE ON public.automation_rules FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER flags_updated BEFORE UPDATE ON public.feature_flags FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();