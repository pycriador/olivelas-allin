-- template_categories
CREATE TABLE public.template_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  sort int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.template_categories TO anon, authenticated;
GRANT ALL ON public.template_categories TO service_role;
ALTER TABLE public.template_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "template_categories: public read" ON public.template_categories FOR SELECT TO anon, authenticated USING (true);

INSERT INTO public.template_categories (slug, name, sort) VALUES
  ('casa','Casa',1),('pets','Pets',2),('criancas','Crianças',3),
  ('estudos','Estudos',4),('trabalho','Trabalho',5),
  ('saude','Saúde',6),('viagens','Viagens',7);

-- Expand templates
ALTER TABLE public.templates
  ADD COLUMN IF NOT EXISTS cover_url text,
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS planner_view text NOT NULL DEFAULT 'checklist',
  ADD COLUMN IF NOT EXISTS schema jsonb NOT NULL DEFAULT '{"pages":[]}'::jsonb,
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.template_categories(id) ON DELETE SET NULL;

-- forms
CREATE TABLE public.forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Sem título',
  description text,
  category text,
  icon text,
  emoji text,
  cover_url text,
  banner_url text,
  tags text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'draft',
  privacy text NOT NULL DEFAULT 'private',
  planner_view text NOT NULL DEFAULT 'checklist',
  theme_overrides jsonb NOT NULL DEFAULT '{}'::jsonb,
  schema jsonb NOT NULL DEFAULT '{"pages":[{"id":"p1","title":"Página 1","fields":[]}],"logic":[],"settings":{}}'::jsonb,
  current_version_id uuid,
  base_template_id uuid REFERENCES public.templates(id) ON DELETE SET NULL,
  is_favorite boolean NOT NULL DEFAULT false,
  is_archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.forms TO authenticated;
GRANT ALL ON public.forms TO service_role;
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "forms: owner all" ON public.forms FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE INDEX forms_owner_idx ON public.forms(owner_id, updated_at DESC);
CREATE TRIGGER forms_set_updated BEFORE UPDATE ON public.forms FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- form_versions
CREATE TABLE public.form_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  version text NOT NULL,
  schema jsonb NOT NULL,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.form_versions TO authenticated;
GRANT ALL ON public.form_versions TO service_role;
ALTER TABLE public.form_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "form_versions: owner all" ON public.form_versions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.forms f WHERE f.id = form_id AND f.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.forms f WHERE f.id = form_id AND f.owner_id = auth.uid()));
CREATE INDEX form_versions_form_idx ON public.form_versions(form_id, created_at DESC);

-- form_shares
CREATE TABLE public.form_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  mode text NOT NULL,
  token text UNIQUE,
  target_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  permission text NOT NULL DEFAULT 'view',
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.form_shares TO authenticated;
GRANT ALL ON public.form_shares TO service_role;
ALTER TABLE public.form_shares ENABLE ROW LEVEL SECURITY;
CREATE POLICY "form_shares: owner manage" ON public.form_shares FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.forms f WHERE f.id = form_id AND f.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.forms f WHERE f.id = form_id AND f.owner_id = auth.uid()));
CREATE POLICY "form_shares: target user read" ON public.form_shares FOR SELECT TO authenticated
  USING (target_user_id = auth.uid());
CREATE INDEX form_shares_form_idx ON public.form_shares(form_id);
CREATE INDEX form_shares_token_idx ON public.form_shares(token);

-- form_submissions
CREATE TABLE public.form_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  version_id uuid REFERENCES public.form_versions(id) ON DELETE SET NULL,
  submitter_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.form_submissions TO authenticated;
GRANT INSERT ON public.form_submissions TO anon;
GRANT ALL ON public.form_submissions TO service_role;
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "form_submissions: owner read" ON public.form_submissions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.forms f WHERE f.id = form_id AND f.owner_id = auth.uid()));
CREATE POLICY "form_submissions: submitter read own" ON public.form_submissions FOR SELECT TO authenticated
  USING (submitter_id = auth.uid());
CREATE POLICY "form_submissions: auth insert on shared forms" ON public.form_submissions FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.forms f WHERE f.id = form_id AND f.privacy IN ('public','link','users')));
CREATE POLICY "form_submissions: anon insert on public forms" ON public.form_submissions FOR INSERT TO anon
  WITH CHECK (EXISTS (SELECT 1 FROM public.forms f WHERE f.id = form_id AND f.privacy IN ('public','link')));
CREATE INDEX form_submissions_form_idx ON public.form_submissions(form_id, created_at DESC);

-- user_template_favorites
CREATE TABLE public.user_template_favorites (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id uuid NOT NULL REFERENCES public.templates(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, template_id)
);
GRANT SELECT, INSERT, DELETE ON public.user_template_favorites TO authenticated;
GRANT ALL ON public.user_template_favorites TO service_role;
ALTER TABLE public.user_template_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "favorites: own" ON public.user_template_favorites FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());