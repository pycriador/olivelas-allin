
-- =========================================================
-- 1. EXPAND EXISTING TABLES
-- =========================================================

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS primary_color text DEFAULT '#6366f1',
  ADD COLUMN IF NOT EXISTS default_locale text NOT NULL DEFAULT 'pt-BR',
  ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'America/Sao_Paulo',
  ADD COLUMN IF NOT EXISTS date_format text NOT NULL DEFAULT 'DD/MM/YYYY',
  ADD COLUMN IF NOT EXISTS currency_format text NOT NULL DEFAULT 'BRL',
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS color text DEFAULT '#6366f1',
  ADD COLUMN IF NOT EXISTS icon text DEFAULT 'folder',
  ADD COLUMN IF NOT EXISTS cover_url text,
  ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS job_title text,
  ADD COLUMN IF NOT EXISTS department text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'America/Sao_Paulo',
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

ALTER TABLE public.groups
  ADD COLUMN IF NOT EXISTS color text DEFAULT '#6366f1',
  ADD COLUMN IF NOT EXISTS icon text DEFAULT 'users',
  ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- =========================================================
-- 2. NEW TABLES
-- =========================================================

-- Invitations
CREATE TABLE IF NOT EXISTS public.invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email text NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending',
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invitations TO authenticated;
GRANT SELECT ON public.invitations TO anon;
GRANT ALL ON public.invitations TO service_role;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Permissions catalog
CREATE TABLE IF NOT EXISTS public.permissions_catalog (
  key text PRIMARY KEY,
  resource text NOT NULL,
  action text NOT NULL,
  label text NOT NULL,
  description text
);
GRANT SELECT ON public.permissions_catalog TO authenticated;
GRANT ALL ON public.permissions_catalog TO service_role;
ALTER TABLE public.permissions_catalog ENABLE ROW LEVEL SECURITY;

-- Role permissions (defaults per role)
CREATE TABLE IF NOT EXISTS public.role_permissions (
  role app_role NOT NULL,
  permission_key text NOT NULL REFERENCES public.permissions_catalog(key) ON DELETE CASCADE,
  PRIMARY KEY (role, permission_key)
);
GRANT SELECT ON public.role_permissions TO authenticated;
GRANT ALL ON public.role_permissions TO service_role;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Group permissions (per-group overrides)
CREATE TABLE IF NOT EXISTS public.group_permissions (
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  permission_key text NOT NULL REFERENCES public.permissions_catalog(key) ON DELETE CASCADE,
  PRIMARY KEY (group_id, permission_key)
);
GRANT SELECT, INSERT, DELETE ON public.group_permissions TO authenticated;
GRANT ALL ON public.group_permissions TO service_role;
ALTER TABLE public.group_permissions ENABLE ROW LEVEL SECURITY;

-- Audit logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource text,
  resource_id text,
  ip text,
  user_agent text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_logs_org_created_idx ON public.audit_logs (organization_id, created_at DESC);
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- 3. FUNCTIONS
-- =========================================================

CREATE OR REPLACE FUNCTION public.current_org_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT current_organization_id FROM public.profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _org_id uuid, _key text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    -- Administrator always has all permissions
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND organization_id = _org_id AND role = 'administrator')
    OR
    -- Role default permission
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.role_permissions rp ON rp.role = ur.role
      WHERE ur.user_id = _user_id AND ur.organization_id = _org_id AND rp.permission_key = _key
    )
    OR
    -- Group override permission
    EXISTS (
      SELECT 1
      FROM public.group_members gm
      JOIN public.groups g ON g.id = gm.group_id
      JOIN public.group_permissions gp ON gp.group_id = g.id
      WHERE gm.user_id = _user_id AND g.organization_id = _org_id AND gp.permission_key = _key
    )
$$;

-- updated_at triggers
DROP TRIGGER IF EXISTS trg_organizations_updated_at ON public.organizations;
CREATE TRIGGER trg_organizations_updated_at BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_workspaces_updated_at ON public.workspaces;
CREATE TRIGGER trg_workspaces_updated_at BEFORE UPDATE ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_groups_updated_at ON public.groups;
CREATE TRIGGER trg_groups_updated_at BEFORE UPDATE ON public.groups
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- 4. RLS POLICIES
-- =========================================================

-- Invitations: admins manage; invitee can read via token (anon select by token handled in server fn)
DROP POLICY IF EXISTS "invitations_admin_all" ON public.invitations;
CREATE POLICY "invitations_admin_all" ON public.invitations
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), organization_id, 'administrator'))
  WITH CHECK (public.has_role(auth.uid(), organization_id, 'administrator'));

DROP POLICY IF EXISTS "invitations_member_read" ON public.invitations;
CREATE POLICY "invitations_member_read" ON public.invitations
  FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id));

-- Permissions catalog: readable by all authenticated
DROP POLICY IF EXISTS "permissions_catalog_read" ON public.permissions_catalog;
CREATE POLICY "permissions_catalog_read" ON public.permissions_catalog
  FOR SELECT TO authenticated USING (true);

-- Role permissions: readable by all authenticated; managed by service_role (via server fn with admin check)
DROP POLICY IF EXISTS "role_permissions_read" ON public.role_permissions;
CREATE POLICY "role_permissions_read" ON public.role_permissions
  FOR SELECT TO authenticated USING (true);

-- Group permissions: read by org members; write by administrator
DROP POLICY IF EXISTS "group_permissions_read" ON public.group_permissions;
CREATE POLICY "group_permissions_read" ON public.group_permissions
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.groups g
    WHERE g.id = group_permissions.group_id
      AND public.is_org_member(auth.uid(), g.organization_id)
  ));

DROP POLICY IF EXISTS "group_permissions_admin_write" ON public.group_permissions;
CREATE POLICY "group_permissions_admin_write" ON public.group_permissions
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.groups g
    WHERE g.id = group_permissions.group_id
      AND public.has_role(auth.uid(), g.organization_id, 'administrator')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.groups g
    WHERE g.id = group_permissions.group_id
      AND public.has_role(auth.uid(), g.organization_id, 'administrator')
  ));

-- Audit logs: read by administrators of org; insert by any member (server fn scoped)
DROP POLICY IF EXISTS "audit_logs_admin_read" ON public.audit_logs;
CREATE POLICY "audit_logs_admin_read" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), organization_id, 'administrator'));

DROP POLICY IF EXISTS "audit_logs_member_insert" ON public.audit_logs;
CREATE POLICY "audit_logs_member_insert" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (public.is_org_member(auth.uid(), organization_id));

-- =========================================================
-- 5. SEED PERMISSIONS CATALOG + ROLE DEFAULTS
-- =========================================================

INSERT INTO public.permissions_catalog (key, resource, action, label) VALUES
  ('org.view','organization','view','View organization'),
  ('org.update','organization','update','Update organization'),
  ('users.view','users','view','View users'),
  ('users.invite','users','invite','Invite users'),
  ('users.update','users','update','Update users'),
  ('users.remove','users','remove','Remove users'),
  ('groups.view','groups','view','View groups'),
  ('groups.manage','groups','manage','Manage groups'),
  ('permissions.manage','permissions','manage','Manage permissions'),
  ('workspaces.view','workspaces','view','View workspaces'),
  ('workspaces.manage','workspaces','manage','Manage workspaces'),
  ('audit.view','audit','view','View audit logs'),
  ('reports.view','reports','view','View reports'),
  ('reports.create','reports','create','Create reports'),
  ('reports.update','reports','update','Update reports'),
  ('reports.delete','reports','delete','Delete reports'),
  ('reports.share','reports','share','Share reports'),
  ('reports.export','reports','export','Export reports'),
  ('dashboards.view','dashboards','view','View dashboards'),
  ('dashboards.create','dashboards','create','Create dashboards'),
  ('dashboards.update','dashboards','update','Update dashboards'),
  ('dashboards.delete','dashboards','delete','Delete dashboards'),
  ('datasets.view','datasets','view','View datasets'),
  ('datasets.create','datasets','create','Create datasets'),
  ('datasets.update','datasets','update','Update datasets'),
  ('datasets.delete','datasets','delete','Delete datasets'),
  ('datasets.publish','datasets','publish','Publish datasets'),
  ('connections.view','connections','view','View connections'),
  ('connections.manage','connections','manage','Manage connections'),
  ('sql.execute','sql','execute','Execute SQL'),
  ('favorites.manage','favorites','manage','Manage favorites'),
  ('integrations.manage','integrations','manage','Manage integrations')
ON CONFLICT (key) DO NOTHING;

-- Default role permissions
INSERT INTO public.role_permissions (role, permission_key)
SELECT 'administrator', key FROM public.permissions_catalog
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('dba','org.view'),('dba','workspaces.view'),
  ('dba','connections.view'),('dba','connections.manage'),
  ('dba','datasets.view'),('dba','datasets.create'),('dba','datasets.update'),('dba','datasets.delete'),('dba','datasets.publish'),
  ('dba','sql.execute'),
  ('dba','reports.view'),('dba','dashboards.view'),
  ('dba','favorites.manage')
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('developer','org.view'),('developer','workspaces.view'),
  ('developer','datasets.view'),('developer','datasets.create'),('developer','datasets.update'),
  ('developer','connections.view'),
  ('developer','reports.view'),('developer','reports.create'),('developer','reports.update'),
  ('developer','dashboards.view'),
  ('developer','favorites.manage')
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('analyst','org.view'),('analyst','workspaces.view'),
  ('analyst','reports.view'),('analyst','reports.create'),('analyst','reports.update'),('analyst','reports.share'),('analyst','reports.export'),
  ('analyst','dashboards.view'),('analyst','dashboards.create'),('analyst','dashboards.update'),
  ('analyst','datasets.view'),
  ('analyst','favorites.manage')
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('user','org.view'),('user','workspaces.view'),
  ('user','reports.view'),('user','reports.export'),
  ('user','dashboards.view'),
  ('user','favorites.manage')
ON CONFLICT DO NOTHING;

-- =========================================================
-- 6. SEED DEMO DATA (idempotent)
-- =========================================================

DO $$
DECLARE
  v_org uuid;
  v_ws_rh uuid; v_ws_fin uuid; v_ws_ops uuid; v_ws_ti uuid; v_ws_com uuid;
BEGIN
  SELECT id INTO v_org FROM public.organizations WHERE slug = 'acme-demo';
  IF v_org IS NULL THEN RETURN; END IF;

  UPDATE public.organizations SET
    description = 'Organização demonstrativa da plataforma corporativa',
    primary_color = '#6366f1',
    default_locale = 'pt-BR',
    timezone = 'America/Sao_Paulo',
    date_format = 'DD/MM/YYYY',
    currency_format = 'BRL',
    status = 'active'
  WHERE id = v_org;

  -- Workspaces
  INSERT INTO public.workspaces (organization_id, name, description, color, icon)
  VALUES
    (v_org, 'Recursos Humanos', 'Gestão de pessoas', '#ec4899', 'users'),
    (v_org, 'Financeiro', 'Controle financeiro', '#10b981', 'wallet'),
    (v_org, 'Operações', 'Operações e logística', '#f59e0b', 'settings'),
    (v_org, 'TI', 'Tecnologia da informação', '#3b82f6', 'server'),
    (v_org, 'Comercial', 'Vendas e clientes', '#8b5cf6', 'briefcase')
  ON CONFLICT DO NOTHING;

  SELECT id INTO v_ws_rh  FROM public.workspaces WHERE organization_id = v_org AND name = 'Recursos Humanos';
  SELECT id INTO v_ws_fin FROM public.workspaces WHERE organization_id = v_org AND name = 'Financeiro';
  SELECT id INTO v_ws_ops FROM public.workspaces WHERE organization_id = v_org AND name = 'Operações';
  SELECT id INTO v_ws_ti  FROM public.workspaces WHERE organization_id = v_org AND name = 'TI';
  SELECT id INTO v_ws_com FROM public.workspaces WHERE organization_id = v_org AND name = 'Comercial';

  -- Groups
  INSERT INTO public.groups (organization_id, workspace_id, name, description, color, icon) VALUES
    (v_org, v_ws_rh,  'RH - Analistas',       'Analistas de RH',        '#ec4899','users'),
    (v_org, v_ws_fin, 'Financeiro - Controle','Time de controladoria',  '#10b981','wallet'),
    (v_org, v_ws_fin, 'Financeiro - Diretoria','Diretoria financeira',  '#059669','crown'),
    (v_org, v_ws_ops, 'Ops - Supervisores',   'Supervisores de operações','#f59e0b','shield'),
    (v_org, v_ws_ti,  'TI - DBAs',            'Administradores de banco','#3b82f6','database'),
    (v_org, v_ws_ti,  'TI - Desenvolvedores', 'Time de desenvolvimento','#6366f1','code'),
    (v_org, v_ws_com, 'Comercial - Vendedores','Time de vendas',        '#8b5cf6','briefcase'),
    (v_org, NULL,     'Diretoria Executiva',  'C-level',                '#dc2626','star')
  ON CONFLICT DO NOTHING;
END $$;
