-- ============ enum-ish helpers ============
CREATE TABLE public.roles (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  system boolean NOT NULL DEFAULT false,
  permissions text[] NOT NULL DEFAULT '{}'
);

CREATE TABLE public.profiles (
  id text PRIMARY KEY,
  name text NOT NULL DEFAULT '',
  email text NOT NULL,
  avatar text,
  status text NOT NULL DEFAULT 'pending',
  role_id text NOT NULL DEFAULT 'role-viewer',
  group_ids text[] NOT NULL DEFAULT '{}',
  failed_attempts integer NOT NULL DEFAULT 0,
  locked_until bigint,
  mfa_enabled boolean NOT NULL DEFAULT false,
  last_login bigint,
  created_at bigint NOT NULL DEFAULT (extract(epoch from now())*1000)::bigint,
  updated_at bigint NOT NULL DEFAULT (extract(epoch from now())*1000)::bigint
);
CREATE UNIQUE INDEX profiles_email_key ON public.profiles (lower(email));

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  role text NOT NULL,
  UNIQUE (user_id, role)
);

CREATE TABLE public.workspaces (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  created_at bigint NOT NULL DEFAULT (extract(epoch from now())*1000)::bigint,
  updated_at bigint NOT NULL DEFAULT (extract(epoch from now())*1000)::bigint
);

CREATE TABLE public.groups (
  id text PRIMARY KEY,
  workspace_id text,
  name text NOT NULL,
  description text,
  system boolean NOT NULL DEFAULT false,
  role_id text
);

CREATE TABLE public.memberships (
  id text PRIMARY KEY,
  workspace_id text NOT NULL,
  user_id text NOT NULL,
  role_id text NOT NULL
);

CREATE TABLE public.acl (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  resource text NOT NULL,
  resource_id text NOT NULL,
  actions text[] NOT NULL DEFAULT '{}',
  effect text NOT NULL DEFAULT 'allow'
);

CREATE TABLE public.audit_logs (
  id text PRIMARY KEY,
  at bigint NOT NULL,
  user_id text,
  user_name text NOT NULL DEFAULT 'system',
  ip text,
  event text NOT NULL,
  entity text NOT NULL,
  entity_id text,
  result text NOT NULL DEFAULT 'success',
  duration_ms integer NOT NULL DEFAULT 0,
  detail text
);
CREATE INDEX audit_logs_at_idx ON public.audit_logs (at DESC);

CREATE TABLE public.projects (
  id text PRIMARY KEY,
  workspace_id text NOT NULL,
  name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'active',
  color text,
  created_at bigint NOT NULL DEFAULT (extract(epoch from now())*1000)::bigint,
  updated_at bigint NOT NULL DEFAULT (extract(epoch from now())*1000)::bigint
);

CREATE TABLE public.roadmaps (
  id text PRIMARY KEY,
  project_id text NOT NULL,
  name text NOT NULL,
  "order" integer NOT NULL DEFAULT 0
);

CREATE TABLE public.sprints (
  id text PRIMARY KEY,
  roadmap_id text NOT NULL,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'planned',
  start_date bigint,
  end_date bigint,
  "order" integer NOT NULL DEFAULT 0
);

CREATE TABLE public.deliveries (
  id text PRIMARY KEY,
  sprint_id text NOT NULL,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'todo',
  "order" integer NOT NULL DEFAULT 0
);

CREATE TABLE public.specifications (
  id text PRIMARY KEY,
  delivery_id text NOT NULL,
  title text NOT NULL,
  description text,
  type text NOT NULL DEFAULT 'sprint',
  status text NOT NULL DEFAULT 'draft',
  version integer NOT NULL DEFAULT 1,
  tags text[] NOT NULL DEFAULT '{}',
  favorite boolean NOT NULL DEFAULT false,
  created_by text NOT NULL DEFAULT '',
  deleted boolean NOT NULL DEFAULT false,
  created_at bigint NOT NULL DEFAULT (extract(epoch from now())*1000)::bigint,
  updated_at bigint NOT NULL DEFAULT (extract(epoch from now())*1000)::bigint
);

CREATE TABLE public.documents (
  id text PRIMARY KEY,
  specification_id text NOT NULL,
  blocks jsonb NOT NULL DEFAULT '[]'
);

CREATE TABLE public.spec_versions (
  id text PRIMARY KEY,
  specification_id text NOT NULL,
  version integer NOT NULL,
  blocks jsonb NOT NULL DEFAULT '[]',
  title text NOT NULL,
  author_id text,
  author_name text NOT NULL DEFAULT '',
  comment text,
  created_at bigint NOT NULL DEFAULT (extract(epoch from now())*1000)::bigint
);

CREATE TABLE public.tags (
  id text PRIMARY KEY,
  name text NOT NULL,
  color text
);

CREATE TABLE public.templates (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT 'sprint',
  blocks jsonb NOT NULL DEFAULT '[]'
);

CREATE TABLE public.snippets (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  language text NOT NULL DEFAULT 'typescript',
  content text NOT NULL DEFAULT '',
  tags text[] NOT NULL DEFAULT '{}',
  created_at bigint NOT NULL DEFAULT (extract(epoch from now())*1000)::bigint,
  updated_at bigint NOT NULL DEFAULT (extract(epoch from now())*1000)::bigint
);

CREATE TABLE public.activities (
  id text PRIMARY KEY,
  at bigint NOT NULL,
  actor text NOT NULL DEFAULT '',
  action text NOT NULL,
  target_type text NOT NULL,
  target_id text NOT NULL,
  summary text NOT NULL DEFAULT ''
);
CREATE INDEX activities_at_idx ON public.activities (at DESC);

CREATE TABLE public.nodes (
  id text PRIMARY KEY,
  project_id text NOT NULL,
  parent_id text,
  kind text NOT NULL DEFAULT 'file',
  name text NOT NULL,
  extension text,
  content text DEFAULT '',
  description text,
  tags text[] NOT NULL DEFAULT '{}',
  "order" bigint NOT NULL DEFAULT 0,
  archived boolean NOT NULL DEFAULT false,
  deleted boolean NOT NULL DEFAULT false,
  url text,
  target_id text,
  links text[] NOT NULL DEFAULT '{}',
  storage_path text,
  size_bytes bigint,
  mime_type text,
  created_at bigint NOT NULL DEFAULT (extract(epoch from now())*1000)::bigint,
  updated_at bigint NOT NULL DEFAULT (extract(epoch from now())*1000)::bigint
);
CREATE INDEX nodes_project_idx ON public.nodes (project_id);
CREATE INDEX nodes_parent_idx ON public.nodes (parent_id);

CREATE TABLE public.app_settings (
  key text PRIMARY KEY,
  value text NOT NULL
);

-- ============ grants ============
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['roles','profiles','user_roles','workspaces','groups','memberships','acl',
    'audit_logs','projects','roadmaps','sprints','deliveries','specifications','documents',
    'spec_versions','tags','templates','snippets','activities','nodes','app_settings']
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;

-- ============ security definer helpers ============
CREATE OR REPLACE FUNCTION public.has_app_role(_user_id text, _role text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_global_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()::text AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_approved()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()::text AND status = 'active'
  );
$$;

-- ============ policies ============
-- Reference data every signed-in user may read
CREATE POLICY "roles readable" ON public.roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "roles admin write" ON public.roles FOR ALL TO authenticated
  USING (public.is_global_admin()) WITH CHECK (public.is_global_admin());

CREATE POLICY "profiles self read" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid()::text OR public.is_approved());
CREATE POLICY "profiles self insert" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid()::text);
CREATE POLICY "profiles update" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()::text OR public.is_global_admin())
  WITH CHECK (id = auth.uid()::text OR public.is_global_admin());
CREATE POLICY "profiles admin delete" ON public.profiles FOR DELETE TO authenticated
  USING (public.is_global_admin());

CREATE POLICY "user_roles read" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid()::text OR public.is_approved());
CREATE POLICY "user_roles admin write" ON public.user_roles FOR ALL TO authenticated
  USING (public.is_global_admin()) WITH CHECK (public.is_global_admin());

-- Everything else: approved members only
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['workspaces','groups','memberships','acl','audit_logs','projects',
    'roadmaps','sprints','deliveries','specifications','documents','spec_versions','tags',
    'templates','snippets','activities','nodes','app_settings']
  LOOP
    EXECUTE format(
      'CREATE POLICY "approved members full access" ON public.%I FOR ALL TO authenticated USING (public.is_approved()) WITH CHECK (public.is_approved())', t);
  END LOOP;
END $$;

-- Prevent privilege escalation: only admins may change role/status/groups
CREATE OR REPLACE FUNCTION public.profiles_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_global_admin() THEN
    NEW.role_id := OLD.role_id;
    NEW.status := OLD.status;
    NEW.group_ids := OLD.group_ids;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER profiles_guard_privileged
BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.profiles_guard();

-- ============ bootstrap / registration ============
CREATE OR REPLACE FUNCTION public.register_or_bootstrap(_name text, _email text, _avatar text)
RETURNS public.profiles LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid text := auth.uid()::text;
  _p public.profiles;
  _total int;
  _ws_id text;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT * INTO _p FROM public.profiles WHERE id = _uid;
  IF FOUND THEN
    UPDATE public.profiles
      SET last_login = (extract(epoch from now())*1000)::bigint,
          avatar = COALESCE(_avatar, avatar),
          name = CASE WHEN name = '' THEN COALESCE(_name, '') ELSE name END,
          updated_at = (extract(epoch from now())*1000)::bigint
      WHERE id = _uid RETURNING * INTO _p;
    RETURN _p;
  END IF;

  SELECT count(*) INTO _total FROM public.profiles;

  IF _total = 0 THEN
    INSERT INTO public.profiles (id, name, email, avatar, status, role_id, group_ids, last_login)
    VALUES (_uid, COALESCE(_name,''), _email, _avatar, 'active', 'role-admin-global',
            ARRAY['group-administrators'], (extract(epoch from now())*1000)::bigint)
    RETURNING * INTO _p;

    INSERT INTO public.user_roles (user_id, role) VALUES (_uid, 'admin')
      ON CONFLICT DO NOTHING;

    _ws_id := gen_random_uuid()::text;
    INSERT INTO public.workspaces (id, name, description)
    VALUES (_ws_id, 'Workspace Principal', 'Workspace padrão criado na configuração inicial');

    INSERT INTO public.memberships (id, workspace_id, user_id, role_id)
    VALUES (gen_random_uuid()::text, _ws_id, _uid, 'role-admin-global');

    UPDATE public.groups SET workspace_id = _ws_id WHERE workspace_id IS NULL;
  ELSE
    INSERT INTO public.profiles (id, name, email, avatar, status, role_id, last_login)
    VALUES (_uid, COALESCE(_name,''), _email, 'pending', 'role-viewer',
            (extract(epoch from now())*1000)::bigint)
    RETURNING * INTO _p;
  END IF;

  RETURN _p;
END $$;
