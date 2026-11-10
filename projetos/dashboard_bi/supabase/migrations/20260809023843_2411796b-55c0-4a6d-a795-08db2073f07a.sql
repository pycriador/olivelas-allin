-- Visibility + status enums as text with validation triggers avoided; use CHECK on static values (immutable)
CREATE TABLE public.saved_queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE SET NULL,
  data_source_id uuid REFERENCES public.data_sources(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  sql text NOT NULL,
  schema_name text,
  tags text[] NOT NULL DEFAULT '{}',
  visibility text NOT NULL DEFAULT 'private' CHECK (visibility IN ('private','workspace','organization')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived')),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_queries TO authenticated;
GRANT ALL ON public.saved_queries TO service_role;
ALTER TABLE public.saved_queries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saved_queries_select" ON public.saved_queries FOR SELECT TO authenticated
USING (
  public.is_org_member(auth.uid(), organization_id)
  AND (owner_id = auth.uid() OR visibility IN ('workspace','organization'))
);
CREATE POLICY "saved_queries_insert" ON public.saved_queries FOR INSERT TO authenticated
WITH CHECK (owner_id = auth.uid() AND public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "saved_queries_update" ON public.saved_queries FOR UPDATE TO authenticated
USING (public.is_org_member(auth.uid(), organization_id) AND (owner_id = auth.uid() OR public.has_role(auth.uid(), organization_id, 'administrator')))
WITH CHECK (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "saved_queries_delete" ON public.saved_queries FOR DELETE TO authenticated
USING (public.is_org_member(auth.uid(), organization_id) AND (owner_id = auth.uid() OR public.has_role(auth.uid(), organization_id, 'administrator')));

CREATE TRIGGER trg_saved_queries_updated_at BEFORE UPDATE ON public.saved_queries
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_saved_queries_org ON public.saved_queries(organization_id, status);
CREATE INDEX idx_saved_queries_owner ON public.saved_queries(owner_id);

CREATE TABLE public.saved_query_favorites (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  saved_query_id uuid NOT NULL REFERENCES public.saved_queries(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, saved_query_id)
);

GRANT SELECT, INSERT, DELETE ON public.saved_query_favorites TO authenticated;
GRANT ALL ON public.saved_query_favorites TO service_role;
ALTER TABLE public.saved_query_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sqf_select" ON public.saved_query_favorites FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "sqf_insert" ON public.saved_query_favorites FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "sqf_delete" ON public.saved_query_favorites FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.query_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE SET NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data_source_id uuid REFERENCES public.data_sources(id) ON DELETE SET NULL,
  data_source_name text,
  database_name text,
  schema_name text,
  sql text NOT NULL,
  status text NOT NULL DEFAULT 'success' CHECK (status IN ('success','error','cancelled','blocked')),
  duration_ms integer,
  row_count integer,
  column_count integer,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, DELETE ON public.query_history TO authenticated;
GRANT ALL ON public.query_history TO service_role;
ALTER TABLE public.query_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "query_history_select_own" ON public.query_history FOR SELECT TO authenticated
USING (user_id = auth.uid());
CREATE POLICY "query_history_select_admin" ON public.query_history FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), organization_id, 'administrator') OR public.has_role(auth.uid(), organization_id, 'dba'));
CREATE POLICY "query_history_insert_own" ON public.query_history FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "query_history_delete_own" ON public.query_history FOR DELETE TO authenticated
USING (user_id = auth.uid());

CREATE INDEX idx_query_history_user ON public.query_history(user_id, created_at DESC);
CREATE INDEX idx_query_history_org ON public.query_history(organization_id, created_at DESC);

-- Permissions catalog for SQL Studio
INSERT INTO public.permissions_catalog (key, resource, action, label, description) VALUES
  ('sql.execute', 'sql', 'execute', 'Executar consultas SQL', 'Executar consultas somente-leitura no SQL Studio'),
  ('sql.explain', 'sql', 'explain', 'Explicar consultas', 'Ver o plano de execução de uma consulta'),
  ('sql.save', 'sql', 'save', 'Salvar consultas', 'Criar e manter consultas salvas'),
  ('sql.history', 'sql', 'history', 'Ver histórico de consultas', 'Consultar o histórico de execuções'),
  ('sql.export', 'sql', 'export', 'Exportar resultados', 'Exportar resultados em CSV, XLSX ou JSON')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.role_permissions (role, permission_key)
SELECT r.role, p.key
FROM (VALUES ('administrator'::app_role), ('dba'::app_role), ('developer'::app_role), ('analyst'::app_role)) AS r(role)
CROSS JOIN (VALUES ('sql.execute'), ('sql.explain'), ('sql.save'), ('sql.history'), ('sql.export')) AS p(key)
ON CONFLICT DO NOTHING;