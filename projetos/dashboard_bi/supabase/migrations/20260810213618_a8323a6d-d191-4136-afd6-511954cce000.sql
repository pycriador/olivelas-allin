-- =========================================================
-- FASE 2 — Datasets, Reports, Self-Service Reporting
-- =========================================================

CREATE TYPE public.dataset_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE public.dataset_source_kind AS ENUM ('sql', 'table', 'view', 'saved_query');
CREATE TYPE public.report_status AS ENUM ('draft', 'review', 'published', 'archived');
CREATE TYPE public.report_visibility AS ENUM ('private', 'workspace', 'organization', 'groups', 'users');
CREATE TYPE public.column_visual_type AS ENUM ('text','number','integer','decimal','currency','percentage','date','datetime','boolean','json');
CREATE TYPE public.report_filter_type AS ENUM ('text','number','date','datetime','boolean','select','multiselect');
CREATE TYPE public.report_exec_kind AS ENUM ('view','run','export');

-- ---------------------------------------------------------
-- datasets
-- ---------------------------------------------------------
CREATE TABLE public.datasets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE SET NULL,
  data_source_id uuid REFERENCES public.data_sources(id) ON DELETE SET NULL,
  saved_query_id uuid REFERENCES public.saved_queries(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  source_kind public.dataset_source_kind NOT NULL DEFAULT 'sql',
  database_name text,
  schema_name text,
  object_name text,
  sql text NOT NULL,
  tags text[] NOT NULL DEFAULT '{}',
  status public.dataset_status NOT NULL DEFAULT 'draft',
  cache_ttl_seconds integer NOT NULL DEFAULT 0,
  row_limit integer NOT NULL DEFAULT 1000,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  duplicated_from uuid REFERENCES public.datasets(id) ON DELETE SET NULL,
  last_run_at timestamptz,
  last_row_count integer,
  last_duration_ms integer,
  execution_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.datasets TO authenticated;
GRANT ALL ON public.datasets TO service_role;
ALTER TABLE public.datasets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "datasets_select_members" ON public.datasets FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "datasets_insert" ON public.datasets FOR INSERT TO authenticated
  WITH CHECK (
    owner_id = auth.uid()
    AND public.is_org_member(auth.uid(), organization_id)
    AND (public.has_permission(auth.uid(), organization_id, 'datasets.create')
         OR public.has_role(auth.uid(), organization_id, 'administrator'))
  );
CREATE POLICY "datasets_update" ON public.datasets FOR UPDATE TO authenticated
  USING (
    public.is_org_member(auth.uid(), organization_id)
    AND (owner_id = auth.uid()
         OR public.has_permission(auth.uid(), organization_id, 'datasets.update')
         OR public.has_role(auth.uid(), organization_id, 'administrator'))
  )
  WITH CHECK (
    public.is_org_member(auth.uid(), organization_id)
    AND (owner_id = auth.uid()
         OR public.has_permission(auth.uid(), organization_id, 'datasets.update')
         OR public.has_role(auth.uid(), organization_id, 'administrator'))
  );
CREATE POLICY "datasets_delete" ON public.datasets FOR DELETE TO authenticated
  USING (
    public.is_org_member(auth.uid(), organization_id)
    AND (owner_id = auth.uid()
         OR public.has_permission(auth.uid(), organization_id, 'datasets.delete')
         OR public.has_role(auth.uid(), organization_id, 'administrator'))
  );

CREATE TRIGGER trg_datasets_updated_at BEFORE UPDATE ON public.datasets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_datasets_org ON public.datasets(organization_id, status);
CREATE INDEX idx_datasets_owner ON public.datasets(owner_id);

-- helper: can the user edit this dataset
CREATE OR REPLACE FUNCTION public.can_edit_dataset(_user_id uuid, _dataset_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.datasets d
    WHERE d.id = _dataset_id
      AND public.is_org_member(_user_id, d.organization_id)
      AND (d.owner_id = _user_id
           OR public.has_permission(_user_id, d.organization_id, 'datasets.update')
           OR public.has_role(_user_id, d.organization_id, 'administrator'))
  );
$$;
REVOKE EXECUTE ON FUNCTION public.can_edit_dataset(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_edit_dataset(uuid, uuid) TO authenticated;

-- ---------------------------------------------------------
-- dataset_columns
-- ---------------------------------------------------------
CREATE TABLE public.dataset_columns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  dataset_id uuid NOT NULL REFERENCES public.datasets(id) ON DELETE CASCADE,
  name text NOT NULL,
  friendly_name text,
  description text,
  data_type text,
  visual_type public.column_visual_type NOT NULL DEFAULT 'text',
  nullable boolean NOT NULL DEFAULT true,
  visible boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  format jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (dataset_id, name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dataset_columns TO authenticated;
GRANT ALL ON public.dataset_columns TO service_role;
ALTER TABLE public.dataset_columns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dataset_columns_select" ON public.dataset_columns FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "dataset_columns_write" ON public.dataset_columns FOR INSERT TO authenticated
  WITH CHECK (public.can_edit_dataset(auth.uid(), dataset_id));
CREATE POLICY "dataset_columns_update" ON public.dataset_columns FOR UPDATE TO authenticated
  USING (public.can_edit_dataset(auth.uid(), dataset_id))
  WITH CHECK (public.can_edit_dataset(auth.uid(), dataset_id));
CREATE POLICY "dataset_columns_delete" ON public.dataset_columns FOR DELETE TO authenticated
  USING (public.can_edit_dataset(auth.uid(), dataset_id));

CREATE TRIGGER trg_dataset_columns_updated_at BEFORE UPDATE ON public.dataset_columns
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_dataset_columns_dataset ON public.dataset_columns(dataset_id, sort_order);

-- ---------------------------------------------------------
-- reports (extend existing table)
-- ---------------------------------------------------------
ALTER TABLE public.reports
  ADD COLUMN dataset_id uuid REFERENCES public.datasets(id) ON DELETE SET NULL,
  ADD COLUMN workspace_id uuid REFERENCES public.workspaces(id) ON DELETE SET NULL,
  ADD COLUMN owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN status public.report_status NOT NULL DEFAULT 'draft',
  ADD COLUMN visibility public.report_visibility NOT NULL DEFAULT 'organization',
  ADD COLUMN config jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN version integer NOT NULL DEFAULT 1,
  ADD COLUMN cache_ttl_seconds integer NOT NULL DEFAULT 0,
  ADD COLUMN published_at timestamptz,
  ADD COLUMN archived_at timestamptz,
  ADD COLUMN last_run_at timestamptz,
  ADD COLUMN last_error text,
  ADD COLUMN view_count integer NOT NULL DEFAULT 0,
  ADD COLUMN execution_count integer NOT NULL DEFAULT 0,
  ADD COLUMN export_count integer NOT NULL DEFAULT 0,
  ADD COLUMN avg_duration_ms integer,
  ADD COLUMN duplicated_from uuid REFERENCES public.reports(id) ON DELETE SET NULL;

UPDATE public.reports SET owner_id = created_by WHERE owner_id IS NULL;
-- legacy placeholder rows have no dataset: archive them so the new viewer never opens them
UPDATE public.reports SET status = 'archived', archived_at = now() WHERE dataset_id IS NULL;

CREATE INDEX idx_reports_org_status ON public.reports(organization_id, status);
CREATE INDEX idx_reports_dataset ON public.reports(dataset_id);

-- ---------------------------------------------------------
-- report_permissions (created before the helpers that reference it)
-- ---------------------------------------------------------
CREATE TABLE public.report_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  access text NOT NULL DEFAULT 'view' CHECK (access IN ('view','edit')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((group_id IS NULL) <> (user_id IS NULL))
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.report_permissions TO authenticated;
GRANT ALL ON public.report_permissions TO service_role;
ALTER TABLE public.report_permissions ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------
-- visibility helpers
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION public.can_edit_report(_user_id uuid, _report_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.reports r
    WHERE r.id = _report_id
      AND public.is_org_member(_user_id, r.organization_id)
      AND (
        r.owner_id = _user_id
        OR public.has_role(_user_id, r.organization_id, 'administrator')
        OR public.has_permission(_user_id, r.organization_id, 'reports.update')
        OR EXISTS (
          SELECT 1 FROM public.report_permissions p
          WHERE p.report_id = r.id AND p.access = 'edit'
            AND (p.user_id = _user_id
                 OR p.group_id IN (SELECT group_id FROM public.group_members WHERE user_id = _user_id))
        )
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.can_view_report(_user_id uuid, _report_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.reports r
    WHERE r.id = _report_id
      AND public.is_org_member(_user_id, r.organization_id)
      AND (
        public.can_edit_report(_user_id, _report_id)
        OR (
          r.status = 'published'
          AND (
            (r.visibility = 'organization')
            OR (r.visibility = 'workspace' AND r.workspace_id IS NOT NULL)
            OR (r.visibility IN ('groups','users') AND EXISTS (
                  SELECT 1 FROM public.report_permissions p
                  WHERE p.report_id = r.id
                    AND (p.user_id = _user_id
                         OR p.group_id IN (SELECT group_id FROM public.group_members WHERE user_id = _user_id))
               ))
          )
        )
      )
  );
$$;

REVOKE EXECUTE ON FUNCTION public.can_edit_report(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.can_view_report(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_edit_report(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_view_report(uuid, uuid) TO authenticated;

-- replace the old broad reports policies with visibility-aware ones
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'reports'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.reports', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "reports_select" ON public.reports FOR SELECT TO authenticated
  USING (public.can_view_report(auth.uid(), id));
CREATE POLICY "reports_insert" ON public.reports FOR INSERT TO authenticated
  WITH CHECK (
    owner_id = auth.uid()
    AND public.is_org_member(auth.uid(), organization_id)
    AND (public.has_permission(auth.uid(), organization_id, 'reports.create')
         OR public.has_role(auth.uid(), organization_id, 'administrator'))
  );
CREATE POLICY "reports_update" ON public.reports FOR UPDATE TO authenticated
  USING (public.can_edit_report(auth.uid(), id))
  WITH CHECK (public.can_edit_report(auth.uid(), id) AND public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "reports_delete" ON public.reports FOR DELETE TO authenticated
  USING (
    public.is_org_member(auth.uid(), organization_id)
    AND (owner_id = auth.uid()
         OR public.has_permission(auth.uid(), organization_id, 'reports.delete')
         OR public.has_role(auth.uid(), organization_id, 'administrator'))
  );

-- ---------------------------------------------------------
-- report_filters
-- ---------------------------------------------------------
CREATE TABLE public.report_filters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  key text NOT NULL,
  label text NOT NULL,
  column_name text NOT NULL,
  filter_type public.report_filter_type NOT NULL DEFAULT 'text',
  operator text NOT NULL DEFAULT 'eq',
  required boolean NOT NULL DEFAULT false,
  default_value jsonb,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (report_id, key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.report_filters TO authenticated;
GRANT ALL ON public.report_filters TO service_role;
ALTER TABLE public.report_filters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "report_filters_select" ON public.report_filters FOR SELECT TO authenticated
  USING (public.can_view_report(auth.uid(), report_id));
CREATE POLICY "report_filters_insert" ON public.report_filters FOR INSERT TO authenticated
  WITH CHECK (public.can_edit_report(auth.uid(), report_id));
CREATE POLICY "report_filters_update" ON public.report_filters FOR UPDATE TO authenticated
  USING (public.can_edit_report(auth.uid(), report_id))
  WITH CHECK (public.can_edit_report(auth.uid(), report_id));
CREATE POLICY "report_filters_delete" ON public.report_filters FOR DELETE TO authenticated
  USING (public.can_edit_report(auth.uid(), report_id));
CREATE TRIGGER trg_report_filters_updated_at BEFORE UPDATE ON public.report_filters
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------
-- report_versions
-- ---------------------------------------------------------
CREATE TABLE public.report_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  version integer NOT NULL,
  name text NOT NULL,
  description text,
  dataset_id uuid,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  filters jsonb NOT NULL DEFAULT '[]'::jsonb,
  note text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (report_id, version)
);
GRANT SELECT, INSERT ON public.report_versions TO authenticated;
GRANT ALL ON public.report_versions TO service_role;
ALTER TABLE public.report_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "report_versions_select" ON public.report_versions FOR SELECT TO authenticated
  USING (public.can_view_report(auth.uid(), report_id));
CREATE POLICY "report_versions_insert" ON public.report_versions FOR INSERT TO authenticated
  WITH CHECK (public.can_edit_report(auth.uid(), report_id));

-- ---------------------------------------------------------
-- report_tags
-- ---------------------------------------------------------
CREATE TABLE public.report_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  tag text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (report_id, tag)
);
GRANT SELECT, INSERT, DELETE ON public.report_tags TO authenticated;
GRANT ALL ON public.report_tags TO service_role;
ALTER TABLE public.report_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "report_tags_select" ON public.report_tags FOR SELECT TO authenticated
  USING (public.can_view_report(auth.uid(), report_id));
CREATE POLICY "report_tags_insert" ON public.report_tags FOR INSERT TO authenticated
  WITH CHECK (public.can_edit_report(auth.uid(), report_id));
CREATE POLICY "report_tags_delete" ON public.report_tags FOR DELETE TO authenticated
  USING (public.can_edit_report(auth.uid(), report_id));

-- ---------------------------------------------------------
-- report_permissions policies
-- ---------------------------------------------------------
CREATE POLICY "report_permissions_select" ON public.report_permissions FOR SELECT TO authenticated
  USING (
    public.is_org_member(auth.uid(), organization_id)
    AND (user_id = auth.uid()
         OR group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
         OR public.can_edit_report(auth.uid(), report_id))
  );
CREATE POLICY "report_permissions_insert" ON public.report_permissions FOR INSERT TO authenticated
  WITH CHECK (public.can_edit_report(auth.uid(), report_id) AND public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "report_permissions_update" ON public.report_permissions FOR UPDATE TO authenticated
  USING (public.can_edit_report(auth.uid(), report_id))
  WITH CHECK (public.can_edit_report(auth.uid(), report_id));
CREATE POLICY "report_permissions_delete" ON public.report_permissions FOR DELETE TO authenticated
  USING (public.can_edit_report(auth.uid(), report_id));

-- ---------------------------------------------------------
-- favorites
-- ---------------------------------------------------------
CREATE TABLE public.report_favorites (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, report_id)
);
GRANT SELECT, INSERT, DELETE ON public.report_favorites TO authenticated;
GRANT ALL ON public.report_favorites TO service_role;
ALTER TABLE public.report_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "report_favorites_select" ON public.report_favorites FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "report_favorites_insert" ON public.report_favorites FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.can_view_report(auth.uid(), report_id));
CREATE POLICY "report_favorites_delete" ON public.report_favorites FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE TABLE public.dataset_favorites (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dataset_id uuid NOT NULL REFERENCES public.datasets(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, dataset_id)
);
GRANT SELECT, INSERT, DELETE ON public.dataset_favorites TO authenticated;
GRANT ALL ON public.dataset_favorites TO service_role;
ALTER TABLE public.dataset_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dataset_favorites_select" ON public.dataset_favorites FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "dataset_favorites_insert" ON public.dataset_favorites FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "dataset_favorites_delete" ON public.dataset_favorites FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ---------------------------------------------------------
-- report_executions (metrics)
-- ---------------------------------------------------------
CREATE TABLE public.report_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  report_id uuid REFERENCES public.reports(id) ON DELETE CASCADE,
  dataset_id uuid REFERENCES public.datasets(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  kind public.report_exec_kind NOT NULL DEFAULT 'run',
  export_format text,
  filters jsonb NOT NULL DEFAULT '[]'::jsonb,
  row_count integer,
  duration_ms integer,
  status text NOT NULL DEFAULT 'success',
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.report_executions TO authenticated;
GRANT ALL ON public.report_executions TO service_role;
ALTER TABLE public.report_executions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "report_executions_select" ON public.report_executions FOR SELECT TO authenticated
  USING (
    public.is_org_member(auth.uid(), organization_id)
    AND (user_id = auth.uid()
         OR public.has_permission(auth.uid(), organization_id, 'audit.view')
         OR public.has_role(auth.uid(), organization_id, 'administrator'))
  );
CREATE POLICY "report_executions_insert" ON public.report_executions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_org_member(auth.uid(), organization_id));
CREATE INDEX idx_report_executions_report ON public.report_executions(report_id, created_at DESC);

-- ---------------------------------------------------------
-- permissions catalog additions
-- ---------------------------------------------------------
INSERT INTO public.permissions_catalog (key, resource, action, label, description) VALUES
  ('reports.publish', 'reports', 'publish', 'Publicar relatórios', 'Publicar e arquivar relatórios')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('administrator', 'reports.publish'),
  ('dba', 'reports.publish'),
  ('analyst', 'reports.publish')
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------
-- internal demo data source (platform database, credentials from server env)
-- ---------------------------------------------------------
INSERT INTO public.data_sources (
  organization_id, name, description, type, environment,
  host, port, database_name, default_schema, username,
  ssl_enabled, timeout_ms, extra_config, tags, active, health, sync_mode, sync_frequency
)
SELECT o.id, 'Plataforma (interna)',
  'Banco de dados da própria plataforma, usado pelos datasets e relatórios de demonstração.',
  'postgresql', 'production',
  'internal', 5432, 'postgres', 'public', 'postgres',
  true, 20000, '{"internal": true}'::jsonb, ARRAY['demo','interno'], true, 'unknown', 'manual', 'manual'
FROM public.organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM public.data_sources d
  WHERE d.organization_id = o.id AND d.extra_config->>'internal' = 'true'
);