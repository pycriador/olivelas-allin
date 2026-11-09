-- ============ 1. WORKSPACES ============
ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS avatar text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS owner_id text;

UPDATE public.workspaces
  SET slug = COALESCE(slug, NULLIF(lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g')), '') || '-' || left(md5(id), 6));

CREATE UNIQUE INDEX IF NOT EXISTS workspaces_slug_key ON public.workspaces(slug);

-- ============ 2. MEMBERSHIPS (workspace members) ============
ALTER TABLE public.memberships
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS joined_at bigint NOT NULL DEFAULT ((EXTRACT(epoch FROM now()) * 1000))::bigint,
  ADD COLUMN IF NOT EXISTS created_at bigint NOT NULL DEFAULT ((EXTRACT(epoch FROM now()) * 1000))::bigint,
  ADD COLUMN IF NOT EXISTS updated_at bigint NOT NULL DEFAULT ((EXTRACT(epoch FROM now()) * 1000))::bigint;

DELETE FROM public.memberships a USING public.memberships b
  WHERE a.ctid < b.ctid AND a.workspace_id = b.workspace_id AND a.user_id = b.user_id;
CREATE UNIQUE INDEX IF NOT EXISTS memberships_ws_user_key ON public.memberships(workspace_id, user_id);

-- ============ 3. GROUPS ============
ALTER TABLE public.groups
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS created_at bigint NOT NULL DEFAULT ((EXTRACT(epoch FROM now()) * 1000))::bigint,
  ADD COLUMN IF NOT EXISTS updated_at bigint NOT NULL DEFAULT ((EXTRACT(epoch FROM now()) * 1000))::bigint;

CREATE TABLE IF NOT EXISTS public.group_members (
  id text PRIMARY KEY,
  group_id text NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  created_at bigint NOT NULL DEFAULT ((EXTRACT(epoch FROM now()) * 1000))::bigint
);
CREATE UNIQUE INDEX IF NOT EXISTS group_members_group_user_key ON public.group_members(group_id, user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.group_members TO authenticated;
GRANT ALL ON public.group_members TO service_role;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- ============ 4. PROJECTS / NODES ============
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS owner_id text;
UPDATE public.projects
  SET slug = COALESCE(slug, NULLIF(lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g')), '') || '-' || left(md5(id), 6));

ALTER TABLE public.nodes ADD COLUMN IF NOT EXISTS created_by text;

-- ============ 5. ACCESS HELPERS ============
CREATE OR REPLACE FUNCTION public.is_workspace_member(_workspace_id text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships m
    JOIN public.profiles p ON p.id = m.user_id
    WHERE m.workspace_id = _workspace_id
      AND m.user_id = (auth.uid())::text
      AND m.status = 'active'
      AND p.status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_project_member(_project_id text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects pr
    WHERE pr.id = _project_id AND public.is_workspace_member(pr.workspace_id)
  );
$$;

CREATE OR REPLACE FUNCTION public.is_group_visible(_group_id text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.groups g
    WHERE g.id = _group_id
      AND (g.workspace_id IS NULL OR public.is_workspace_member(g.workspace_id))
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_workspace_member(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_project_member(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_group_visible(text) FROM PUBLIC, anon;

-- ============ 6. IMMUTABILITY GUARDS ============
CREATE OR REPLACE FUNCTION public.workspaces_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_global_admin() THEN
    NEW.owner_id := OLD.owner_id;
    NEW.status := OLD.status;
  END IF;
  NEW.updated_at := ((EXTRACT(epoch FROM now()) * 1000))::bigint;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS workspaces_guard_t ON public.workspaces;
CREATE TRIGGER workspaces_guard_t BEFORE UPDATE ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.workspaces_guard();

CREATE OR REPLACE FUNCTION public.projects_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_global_admin() THEN
    NEW.workspace_id := OLD.workspace_id;
    NEW.owner_id := OLD.owner_id;
  END IF;
  NEW.updated_at := ((EXTRACT(epoch FROM now()) * 1000))::bigint;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS projects_guard_t ON public.projects;
CREATE TRIGGER projects_guard_t BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.projects_guard();

-- ============ 7. WORKSPACE-SCOPED RLS ============
DROP POLICY IF EXISTS "approved members full access" ON public.workspaces;
CREATE POLICY "workspaces read members" ON public.workspaces FOR SELECT TO authenticated
  USING (public.is_workspace_member(id) OR public.is_global_admin());
CREATE POLICY "workspaces insert admin" ON public.workspaces FOR INSERT TO authenticated
  WITH CHECK (public.is_global_admin());
CREATE POLICY "workspaces update owner" ON public.workspaces FOR UPDATE TO authenticated
  USING (public.is_global_admin() OR (owner_id = (auth.uid())::text AND public.is_workspace_member(id)))
  WITH CHECK (public.is_global_admin() OR (owner_id = (auth.uid())::text AND public.is_workspace_member(id)));
CREATE POLICY "workspaces delete admin" ON public.workspaces FOR DELETE TO authenticated
  USING (public.is_global_admin());

DROP POLICY IF EXISTS "approved members full access" ON public.memberships;
CREATE POLICY "memberships read" ON public.memberships FOR SELECT TO authenticated
  USING (user_id = (auth.uid())::text OR public.is_workspace_member(workspace_id) OR public.is_global_admin());
CREATE POLICY "memberships write admin" ON public.memberships FOR INSERT TO authenticated
  WITH CHECK (public.is_global_admin());
CREATE POLICY "memberships update admin" ON public.memberships FOR UPDATE TO authenticated
  USING (public.is_global_admin()) WITH CHECK (public.is_global_admin());
CREATE POLICY "memberships delete admin" ON public.memberships FOR DELETE TO authenticated
  USING (public.is_global_admin());

DROP POLICY IF EXISTS "approved members full access" ON public.groups;
CREATE POLICY "groups read members" ON public.groups FOR SELECT TO authenticated
  USING (workspace_id IS NULL OR public.is_workspace_member(workspace_id) OR public.is_global_admin());
CREATE POLICY "groups write admin" ON public.groups FOR INSERT TO authenticated
  WITH CHECK (public.is_global_admin());
CREATE POLICY "groups update admin" ON public.groups FOR UPDATE TO authenticated
  USING (public.is_global_admin()) WITH CHECK (public.is_global_admin());
CREATE POLICY "groups delete admin" ON public.groups FOR DELETE TO authenticated
  USING (public.is_global_admin());

CREATE POLICY "group_members read" ON public.group_members FOR SELECT TO authenticated
  USING (public.is_group_visible(group_id) OR public.is_global_admin());
CREATE POLICY "group_members insert admin" ON public.group_members FOR INSERT TO authenticated
  WITH CHECK (public.is_global_admin());
CREATE POLICY "group_members update admin" ON public.group_members FOR UPDATE TO authenticated
  USING (public.is_global_admin()) WITH CHECK (public.is_global_admin());
CREATE POLICY "group_members delete admin" ON public.group_members FOR DELETE TO authenticated
  USING (public.is_global_admin());

DROP POLICY IF EXISTS "approved members full access" ON public.projects;
CREATE POLICY "projects read members" ON public.projects FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id) OR public.is_global_admin());
CREATE POLICY "projects insert members" ON public.projects FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_member(workspace_id) AND owner_id = (auth.uid())::text);
CREATE POLICY "projects update members" ON public.projects FOR UPDATE TO authenticated
  USING (public.is_workspace_member(workspace_id) OR public.is_global_admin())
  WITH CHECK (public.is_workspace_member(workspace_id) OR public.is_global_admin());
CREATE POLICY "projects delete members" ON public.projects FOR DELETE TO authenticated
  USING (public.is_workspace_member(workspace_id) OR public.is_global_admin());

DROP POLICY IF EXISTS "approved members full access" ON public.nodes;
CREATE POLICY "nodes read members" ON public.nodes FOR SELECT TO authenticated
  USING (public.is_project_member(project_id));
CREATE POLICY "nodes insert members" ON public.nodes FOR INSERT TO authenticated
  WITH CHECK (public.is_project_member(project_id));
CREATE POLICY "nodes update members" ON public.nodes FOR UPDATE TO authenticated
  USING (public.is_project_member(project_id)) WITH CHECK (public.is_project_member(project_id));
CREATE POLICY "nodes delete members" ON public.nodes FOR DELETE TO authenticated
  USING (public.is_project_member(project_id));

-- ============ 8. BOOTSTRAP ============
CREATE OR REPLACE FUNCTION public.register_or_bootstrap(_name text, _email text, _avatar text)
RETURNS public.profiles LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid text := (auth.uid())::text;
  _p public.profiles;
  _total int;
  _ws_id text;
  _grp_id text := 'group-administrators';
  _now bigint := ((EXTRACT(epoch FROM now()) * 1000))::bigint;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT * INTO _p FROM public.profiles WHERE id = _uid;
  IF FOUND THEN
    UPDATE public.profiles
      SET last_login = _now,
          avatar = COALESCE(_avatar, avatar),
          name = CASE WHEN name = '' THEN COALESCE(_name, '') ELSE name END,
          updated_at = _now
      WHERE id = _uid RETURNING * INTO _p;
    RETURN _p;
  END IF;

  SELECT count(*) INTO _total FROM public.profiles;

  IF _total = 0 THEN
    INSERT INTO public.profiles (id, name, email, avatar, status, role_id, group_ids, last_login)
    VALUES (_uid, COALESCE(_name,''), _email, _avatar, 'active', 'role-admin-global',
            ARRAY[_grp_id], _now)
    RETURNING * INTO _p;

    INSERT INTO public.user_roles (user_id, role) VALUES (_uid, 'admin') ON CONFLICT DO NOTHING;

    _ws_id := gen_random_uuid()::text;
    INSERT INTO public.workspaces (id, name, slug, description, status, owner_id)
    VALUES (_ws_id, 'Workspace Principal', 'workspace-principal',
            'Workspace criado automaticamente no primeiro acesso', 'active', _uid);

    INSERT INTO public.memberships (id, workspace_id, user_id, role_id, status, joined_at)
    VALUES (gen_random_uuid()::text, _ws_id, _uid, 'role-admin-global', 'active', _now);

    INSERT INTO public.groups (id, workspace_id, name, description, system, role_id, status)
    VALUES (_grp_id, _ws_id, 'Administradores', 'Administradores globais do workspace', true, 'role-admin-global', 'active')
    ON CONFLICT (id) DO UPDATE SET workspace_id = EXCLUDED.workspace_id, status = 'active';

    INSERT INTO public.group_members (id, group_id, user_id)
    VALUES (gen_random_uuid()::text, _grp_id, _uid) ON CONFLICT DO NOTHING;

    UPDATE public.groups SET workspace_id = _ws_id WHERE workspace_id IS NULL;
  ELSE
    INSERT INTO public.profiles (id, name, email, avatar, status, role_id, last_login)
    VALUES (_uid, COALESCE(_name,''), _email, _avatar, 'pending', 'role-viewer', _now)
    RETURNING * INTO _p;
  END IF;

  RETURN _p;
END $$;

-- Approving a user attaches them to a workspace as a regular member.
CREATE OR REPLACE FUNCTION public.approve_user(_user_id text, _role_id text DEFAULT 'role-editor')
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _ws_id text;
  _now bigint := ((EXTRACT(epoch FROM now()) * 1000))::bigint;
BEGIN
  IF NOT public.is_global_admin() THEN RAISE EXCEPTION 'Only global admins can approve users'; END IF;

  UPDATE public.profiles SET status = 'active', role_id = _role_id, updated_at = _now WHERE id = _user_id;

  SELECT id INTO _ws_id FROM public.workspaces ORDER BY created_at ASC LIMIT 1;
  IF _ws_id IS NOT NULL THEN
    INSERT INTO public.memberships (id, workspace_id, user_id, role_id, status, joined_at)
    VALUES (gen_random_uuid()::text, _ws_id, _user_id, _role_id, 'active', _now)
    ON CONFLICT (workspace_id, user_id) DO UPDATE SET status = 'active', role_id = EXCLUDED.role_id;
  END IF;
END $$;

REVOKE EXECUTE ON FUNCTION public.approve_user(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_user(text, text) TO authenticated;