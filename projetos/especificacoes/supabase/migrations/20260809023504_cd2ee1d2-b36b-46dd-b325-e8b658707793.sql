ALTER TABLE public.nodes
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS document_type text,
  ADD COLUMN IF NOT EXISTS updated_by text;

CREATE TABLE IF NOT EXISTS public.document_relations (
  id text PRIMARY KEY,
  project_id text NOT NULL,
  source_id text NOT NULL REFERENCES public.nodes(id) ON DELETE CASCADE,
  target_id text NOT NULL REFERENCES public.nodes(id) ON DELETE CASCADE,
  relationship_type text NOT NULL DEFAULT 'related',
  created_by text,
  created_at bigint NOT NULL DEFAULT ((EXTRACT(epoch FROM now()) * 1000))::bigint,
  UNIQUE (source_id, target_id, relationship_type)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.document_relations TO authenticated;
GRANT ALL ON public.document_relations TO service_role;
ALTER TABLE public.document_relations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "relations read members" ON public.document_relations
  FOR SELECT TO authenticated USING (public.is_project_member(project_id));
CREATE POLICY "relations insert members" ON public.document_relations
  FOR INSERT TO authenticated WITH CHECK (public.is_project_member(project_id));
CREATE POLICY "relations update members" ON public.document_relations
  FOR UPDATE TO authenticated USING (public.is_project_member(project_id)) WITH CHECK (public.is_project_member(project_id));
CREATE POLICY "relations delete members" ON public.document_relations
  FOR DELETE TO authenticated USING (public.is_project_member(project_id));

CREATE INDEX IF NOT EXISTS document_relations_source_idx ON public.document_relations (source_id);
CREATE INDEX IF NOT EXISTS document_relations_target_idx ON public.document_relations (target_id);

CREATE TABLE IF NOT EXISTS public.document_history (
  id text PRIMARY KEY,
  project_id text NOT NULL,
  node_id text NOT NULL,
  version integer NOT NULL DEFAULT 1,
  change_type text NOT NULL DEFAULT 'updated',
  changed_by text,
  changed_by_name text NOT NULL DEFAULT '',
  summary text NOT NULL DEFAULT '',
  changed_at bigint NOT NULL DEFAULT ((EXTRACT(epoch FROM now()) * 1000))::bigint
);

GRANT SELECT, INSERT ON public.document_history TO authenticated;
GRANT ALL ON public.document_history TO service_role;
ALTER TABLE public.document_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "history read members" ON public.document_history
  FOR SELECT TO authenticated USING (public.is_project_member(project_id));
CREATE POLICY "history insert members" ON public.document_history
  FOR INSERT TO authenticated WITH CHECK (public.is_project_member(project_id));

CREATE INDEX IF NOT EXISTS document_history_node_idx ON public.document_history (node_id, changed_at DESC);