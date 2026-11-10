-- ============ ENUMS ============
CREATE TYPE public.ds_type AS ENUM (
  'postgresql','mysql','mariadb','sqlite',
  'sqlserver','oracle','duckdb','snowflake','bigquery','redshift','clickhouse'
);
CREATE TYPE public.ds_environment AS ENUM ('production','staging','development');
CREATE TYPE public.ds_health AS ENUM ('unknown','online','offline','unstable','timeout','invalid_credentials');
CREATE TYPE public.ds_sync_mode AS ENUM ('manual','automatic','scheduled');
CREATE TYPE public.ds_sync_frequency AS ENUM ('manual','every_5_min','every_15_min','hourly','daily');
CREATE TYPE public.ds_object_type AS ENUM ('table','view','materialized_view','function','procedure');
CREATE TYPE public.ds_access_level AS ENUM ('none','read','manage','full');
CREATE TYPE public.ds_sync_status AS ENUM ('running','success','failed');

-- ============ DATA SOURCES ============
CREATE TABLE public.data_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  type public.ds_type NOT NULL,
  environment public.ds_environment NOT NULL DEFAULT 'development',
  host text,
  port integer,
  database_name text,
  default_schema text,
  username text,
  secret_ciphertext text,
  ssl_enabled boolean NOT NULL DEFAULT true,
  ssl_ca_certificate text,
  ssl_client_certificate text,
  ssl_client_key text,
  timeout_ms integer NOT NULL DEFAULT 15000,
  extra_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  tags text[] NOT NULL DEFAULT '{}',
  active boolean NOT NULL DEFAULT true,
  health public.ds_health NOT NULL DEFAULT 'unknown',
  health_message text,
  health_checked_at timestamptz,
  latency_ms integer,
  server_version text,
  sync_mode public.ds_sync_mode NOT NULL DEFAULT 'manual',
  sync_frequency public.ds_sync_frequency NOT NULL DEFAULT 'manual',
  last_synced_at timestamptz,
  schema_count integer NOT NULL DEFAULT 0,
  table_count integer NOT NULL DEFAULT 0,
  view_count integer NOT NULL DEFAULT 0,
  column_count integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, name)
);
CREATE INDEX idx_data_sources_org ON public.data_sources(organization_id);
CREATE INDEX idx_data_sources_ws ON public.data_sources(workspace_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.data_sources TO authenticated;
GRANT ALL ON public.data_sources TO service_role;
ALTER TABLE public.data_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ds_select_members" ON public.data_sources FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "ds_insert_dba" ON public.data_sources FOR INSERT TO authenticated
  WITH CHECK (public.is_org_member(auth.uid(), organization_id)
    AND (public.has_role(auth.uid(), organization_id, 'administrator')
      OR public.has_role(auth.uid(), organization_id, 'dba')));
CREATE POLICY "ds_update_dba" ON public.data_sources FOR UPDATE TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id)
    AND (public.has_role(auth.uid(), organization_id, 'administrator')
      OR public.has_role(auth.uid(), organization_id, 'dba')));
CREATE POLICY "ds_delete_dba" ON public.data_sources FOR DELETE TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id)
    AND (public.has_role(auth.uid(), organization_id, 'administrator')
      OR public.has_role(auth.uid(), organization_id, 'dba')));

CREATE TRIGGER trg_data_sources_updated_at BEFORE UPDATE ON public.data_sources
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- helper: is the current user allowed to manage metadata of this org?
CREATE OR REPLACE FUNCTION public.can_manage_datasources(_user_id uuid, _org_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_user_id, _org_id, 'administrator')
      OR public.has_role(_user_id, _org_id, 'dba');
$$;

-- ============ SCHEMAS ============
CREATE TABLE public.ds_schemas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  data_source_id uuid NOT NULL REFERENCES public.data_sources(id) ON DELETE CASCADE,
  name text NOT NULL,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (data_source_id, name)
);
CREATE INDEX idx_ds_schemas_ds ON public.ds_schemas(data_source_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ds_schemas TO authenticated;
GRANT ALL ON public.ds_schemas TO service_role;
ALTER TABLE public.ds_schemas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dss_select" ON public.ds_schemas FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "dss_write" ON public.ds_schemas FOR ALL TO authenticated
  USING (public.can_manage_datasources(auth.uid(), organization_id))
  WITH CHECK (public.can_manage_datasources(auth.uid(), organization_id));
CREATE TRIGGER trg_ds_schemas_updated_at BEFORE UPDATE ON public.ds_schemas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ OBJECTS (tables / views) ============
CREATE TABLE public.ds_objects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  data_source_id uuid NOT NULL REFERENCES public.data_sources(id) ON DELETE CASCADE,
  schema_id uuid NOT NULL REFERENCES public.ds_schemas(id) ON DELETE CASCADE,
  name text NOT NULL,
  object_type public.ds_object_type NOT NULL DEFAULT 'table',
  estimated_rows bigint,
  size_bytes bigint,
  comment text,
  definition text,
  -- catalog curation
  friendly_name text,
  description text,
  tags text[] NOT NULL DEFAULT '{}',
  owner_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (schema_id, name, object_type)
);
CREATE INDEX idx_ds_objects_ds ON public.ds_objects(data_source_id);
CREATE INDEX idx_ds_objects_schema ON public.ds_objects(schema_id);
CREATE INDEX idx_ds_objects_tags ON public.ds_objects USING gin(tags);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ds_objects TO authenticated;
GRANT ALL ON public.ds_objects TO service_role;
ALTER TABLE public.ds_objects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dso_select" ON public.ds_objects FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "dso_insert" ON public.ds_objects FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_datasources(auth.uid(), organization_id));
CREATE POLICY "dso_update" ON public.ds_objects FOR UPDATE TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id)
    AND (public.can_manage_datasources(auth.uid(), organization_id)
      OR public.has_permission(auth.uid(), organization_id, 'catalog.curate')));
CREATE POLICY "dso_delete" ON public.ds_objects FOR DELETE TO authenticated
  USING (public.can_manage_datasources(auth.uid(), organization_id));
CREATE TRIGGER trg_ds_objects_updated_at BEFORE UPDATE ON public.ds_objects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ COLUMNS ============
CREATE TABLE public.ds_columns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  data_source_id uuid NOT NULL REFERENCES public.data_sources(id) ON DELETE CASCADE,
  object_id uuid NOT NULL REFERENCES public.ds_objects(id) ON DELETE CASCADE,
  name text NOT NULL,
  ordinal_position integer NOT NULL DEFAULT 0,
  data_type text NOT NULL,
  is_nullable boolean NOT NULL DEFAULT true,
  is_primary_key boolean NOT NULL DEFAULT false,
  is_foreign_key boolean NOT NULL DEFAULT false,
  is_unique boolean NOT NULL DEFAULT false,
  references_schema text,
  references_table text,
  references_column text,
  default_value text,
  numeric_precision integer,
  numeric_scale integer,
  character_max_length integer,
  comment text,
  friendly_name text,
  description text,
  tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (object_id, name)
);
CREATE INDEX idx_ds_columns_obj ON public.ds_columns(object_id);
CREATE INDEX idx_ds_columns_ds ON public.ds_columns(data_source_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ds_columns TO authenticated;
GRANT ALL ON public.ds_columns TO service_role;
ALTER TABLE public.ds_columns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dsc_select" ON public.ds_columns FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "dsc_insert" ON public.ds_columns FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_datasources(auth.uid(), organization_id));
CREATE POLICY "dsc_update" ON public.ds_columns FOR UPDATE TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id)
    AND (public.can_manage_datasources(auth.uid(), organization_id)
      OR public.has_permission(auth.uid(), organization_id, 'catalog.curate')));
CREATE POLICY "dsc_delete" ON public.ds_columns FOR DELETE TO authenticated
  USING (public.can_manage_datasources(auth.uid(), organization_id));
CREATE TRIGGER trg_ds_columns_updated_at BEFORE UPDATE ON public.ds_columns
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ INDEXES ============
CREATE TABLE public.ds_indexes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  data_source_id uuid NOT NULL REFERENCES public.data_sources(id) ON DELETE CASCADE,
  object_id uuid NOT NULL REFERENCES public.ds_objects(id) ON DELETE CASCADE,
  name text NOT NULL,
  is_unique boolean NOT NULL DEFAULT false,
  is_primary boolean NOT NULL DEFAULT false,
  method text,
  columns text[] NOT NULL DEFAULT '{}',
  definition text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (object_id, name)
);
CREATE INDEX idx_ds_indexes_obj ON public.ds_indexes(object_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ds_indexes TO authenticated;
GRANT ALL ON public.ds_indexes TO service_role;
ALTER TABLE public.ds_indexes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dsi_select" ON public.ds_indexes FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "dsi_write" ON public.ds_indexes FOR ALL TO authenticated
  USING (public.can_manage_datasources(auth.uid(), organization_id))
  WITH CHECK (public.can_manage_datasources(auth.uid(), organization_id));

-- ============ CONSTRAINTS ============
CREATE TABLE public.ds_constraints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  data_source_id uuid NOT NULL REFERENCES public.data_sources(id) ON DELETE CASCADE,
  object_id uuid NOT NULL REFERENCES public.ds_objects(id) ON DELETE CASCADE,
  name text NOT NULL,
  constraint_type text NOT NULL,
  columns text[] NOT NULL DEFAULT '{}',
  referenced_schema text,
  referenced_table text,
  referenced_columns text[] NOT NULL DEFAULT '{}',
  definition text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (object_id, name)
);
CREATE INDEX idx_ds_constraints_obj ON public.ds_constraints(object_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ds_constraints TO authenticated;
GRANT ALL ON public.ds_constraints TO service_role;
ALTER TABLE public.ds_constraints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dsk_select" ON public.ds_constraints FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "dsk_write" ON public.ds_constraints FOR ALL TO authenticated
  USING (public.can_manage_datasources(auth.uid(), organization_id))
  WITH CHECK (public.can_manage_datasources(auth.uid(), organization_id));

-- ============ CATALOG TAGS ============
CREATE TABLE public.catalog_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#64748b',
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.catalog_tags TO authenticated;
GRANT ALL ON public.catalog_tags TO service_role;
ALTER TABLE public.catalog_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ctag_select" ON public.catalog_tags FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "ctag_write" ON public.catalog_tags FOR ALL TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id)
    AND (public.can_manage_datasources(auth.uid(), organization_id)
      OR public.has_permission(auth.uid(), organization_id, 'catalog.curate')))
  WITH CHECK (public.is_org_member(auth.uid(), organization_id)
    AND (public.can_manage_datasources(auth.uid(), organization_id)
      OR public.has_permission(auth.uid(), organization_id, 'catalog.curate')));

-- ============ SYNC RUNS ============
CREATE TABLE public.ds_sync_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  data_source_id uuid NOT NULL REFERENCES public.data_sources(id) ON DELETE CASCADE,
  triggered_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  trigger_source text NOT NULL DEFAULT 'manual',
  status public.ds_sync_status NOT NULL DEFAULT 'running',
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  duration_ms integer,
  objects_added integer NOT NULL DEFAULT 0,
  objects_changed integer NOT NULL DEFAULT 0,
  objects_removed integer NOT NULL DEFAULT 0,
  error_message text
);
CREATE INDEX idx_ds_sync_runs_ds ON public.ds_sync_runs(data_source_id, started_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ds_sync_runs TO authenticated;
GRANT ALL ON public.ds_sync_runs TO service_role;
ALTER TABLE public.ds_sync_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dsr_select" ON public.ds_sync_runs FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "dsr_write" ON public.ds_sync_runs FOR ALL TO authenticated
  USING (public.can_manage_datasources(auth.uid(), organization_id))
  WITH CHECK (public.can_manage_datasources(auth.uid(), organization_id));

-- ============ PER-DATASOURCE PERMISSIONS ============
CREATE TABLE public.data_source_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  data_source_id uuid NOT NULL REFERENCES public.data_sources(id) ON DELETE CASCADE,
  role public.app_role,
  group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE,
  access_level public.ds_access_level NOT NULL DEFAULT 'read',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT dsp_target_check CHECK (
    (role IS NOT NULL AND group_id IS NULL) OR (role IS NULL AND group_id IS NOT NULL)
  )
);
CREATE UNIQUE INDEX idx_dsp_role ON public.data_source_permissions(data_source_id, role) WHERE role IS NOT NULL;
CREATE UNIQUE INDEX idx_dsp_group ON public.data_source_permissions(data_source_id, group_id) WHERE group_id IS NOT NULL;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.data_source_permissions TO authenticated;
GRANT ALL ON public.data_source_permissions TO service_role;
ALTER TABLE public.data_source_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dsp_select" ON public.data_source_permissions FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "dsp_write" ON public.data_source_permissions FOR ALL TO authenticated
  USING (public.can_manage_datasources(auth.uid(), organization_id))
  WITH CHECK (public.can_manage_datasources(auth.uid(), organization_id));

-- ============ PERMISSION CATALOG ADDITIONS ============
INSERT INTO public.permissions_catalog (key, resource, action, label, description) VALUES
  ('datasources.view',   'datasources', 'view',   'Ver fontes de dados',        'Visualizar conexões cadastradas'),
  ('datasources.create', 'datasources', 'create', 'Criar fontes de dados',      'Cadastrar novas conexões'),
  ('datasources.update', 'datasources', 'update', 'Editar fontes de dados',     'Alterar conexões existentes'),
  ('datasources.delete', 'datasources', 'delete', 'Excluir fontes de dados',    'Remover conexões'),
  ('datasources.test',   'datasources', 'test',   'Testar conexão',             'Executar teste de conectividade'),
  ('datasources.sync',   'datasources', 'sync',   'Sincronizar metadados',      'Disparar descoberta de schema'),
  ('catalog.view',       'catalog',     'view',   'Ver catálogo de dados',      'Consultar o catálogo corporativo'),
  ('catalog.curate',     'catalog',     'curate', 'Curar catálogo',             'Editar nomes amigáveis, descrições e etiquetas'),
  ('explorer.browse',    'explorer',    'browse', 'Navegar no explorador',      'Explorar estrutura dos bancos conectados')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('dba','datasources.view'),('dba','datasources.create'),('dba','datasources.update'),
  ('dba','datasources.delete'),('dba','datasources.test'),('dba','datasources.sync'),
  ('dba','catalog.view'),('dba','catalog.curate'),('dba','explorer.browse'),
  ('developer','datasources.view'),('developer','catalog.view'),('developer','catalog.curate'),('developer','explorer.browse'),
  ('analyst','datasources.view'),('analyst','catalog.view'),('analyst','explorer.browse')
ON CONFLICT DO NOTHING;

-- ============ SEED TAGS FOR EXISTING ORGS ============
INSERT INTO public.catalog_tags (organization_id, name, color)
SELECT o.id, t.name, t.color
FROM public.organizations o
CROSS JOIN (VALUES
  ('RH','#0ea5e9'),('Financeiro','#22c55e'),('TI','#6366f1'),('Operações','#f59e0b'),
  ('Produção','#ef4444'),('Crítico','#dc2626'),('LGPD','#a855f7'),('PII','#ec4899'),('Auditoria','#64748b')
) AS t(name,color)
ON CONFLICT DO NOTHING;