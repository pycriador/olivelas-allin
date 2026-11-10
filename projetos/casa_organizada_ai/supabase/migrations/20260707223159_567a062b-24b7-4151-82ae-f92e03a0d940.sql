
-- ============================================================
-- SPRINT 4 · FASE 1 — MARKETPLACE FOUNDATION
-- ============================================================

-- --- 1. TEMPLATES: extend for marketplace -------------------
ALTER TABLE public.templates
  ADD COLUMN IF NOT EXISTS author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS version text NOT NULL DEFAULT '1.0.0',
  ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'pt-BR',
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS downloads_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS favorites_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating_avg numeric(3,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS templates_public_idx ON public.templates (is_public, is_hidden);
CREATE INDEX IF NOT EXISTS templates_category_idx ON public.templates (category);
CREATE INDEX IF NOT EXISTS templates_author_idx ON public.templates (author_id);
CREATE INDEX IF NOT EXISTS templates_featured_idx ON public.templates (is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS templates_search_idx ON public.templates USING gin (to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(description,'')));

-- Refresh policies for templates (public discovery + owner/admin control)
DROP POLICY IF EXISTS "templates_public_read" ON public.templates;
DROP POLICY IF EXISTS "Anyone can view templates" ON public.templates;
DROP POLICY IF EXISTS "Templates are publicly readable" ON public.templates;
DROP POLICY IF EXISTS "templates_author_read" ON public.templates;
DROP POLICY IF EXISTS "templates_author_write" ON public.templates;
DROP POLICY IF EXISTS "templates_author_update" ON public.templates;
DROP POLICY IF EXISTS "templates_author_delete" ON public.templates;
DROP POLICY IF EXISTS "templates_admin_all" ON public.templates;

CREATE POLICY "templates_public_read" ON public.templates
  FOR SELECT USING ((is_public = true AND is_hidden = false) OR author_id = auth.uid() OR public.has_role(auth.uid(), 'global_admin'));

CREATE POLICY "templates_author_insert" ON public.templates
  FOR INSERT WITH CHECK (author_id = auth.uid() OR public.has_role(auth.uid(), 'global_admin'));

CREATE POLICY "templates_author_update" ON public.templates
  FOR UPDATE USING (author_id = auth.uid() OR public.has_role(auth.uid(), 'global_admin'))
  WITH CHECK (author_id = auth.uid() OR public.has_role(auth.uid(), 'global_admin'));

CREATE POLICY "templates_author_delete" ON public.templates
  FOR DELETE USING (author_id = auth.uid() OR public.has_role(auth.uid(), 'global_admin'));

GRANT SELECT ON public.templates TO anon;

-- --- 2. THEMES ----------------------------------------------
CREATE TABLE IF NOT EXISTS public.themes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'general',
  tags text[] NOT NULL DEFAULT '{}',
  cover_url text,
  tokens jsonb NOT NULL DEFAULT '{}'::jsonb,
  language text NOT NULL DEFAULT 'pt-BR',
  version text NOT NULL DEFAULT '1.0.0',
  is_public boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  is_hidden boolean NOT NULL DEFAULT false,
  is_system boolean NOT NULL DEFAULT false,
  downloads_count integer NOT NULL DEFAULT 0,
  favorites_count integer NOT NULL DEFAULT 0,
  rating_avg numeric(3,2) NOT NULL DEFAULT 0,
  rating_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.themes TO authenticated;
GRANT SELECT ON public.themes TO anon;
GRANT ALL ON public.themes TO service_role;

ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "themes_public_read" ON public.themes
  FOR SELECT USING ((is_public = true AND is_hidden = false) OR author_id = auth.uid() OR public.has_role(auth.uid(), 'global_admin'));
CREATE POLICY "themes_author_insert" ON public.themes
  FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid() OR public.has_role(auth.uid(), 'global_admin'));
CREATE POLICY "themes_author_update" ON public.themes
  FOR UPDATE TO authenticated USING (author_id = auth.uid() OR public.has_role(auth.uid(), 'global_admin'))
  WITH CHECK (author_id = auth.uid() OR public.has_role(auth.uid(), 'global_admin'));
CREATE POLICY "themes_author_delete" ON public.themes
  FOR DELETE TO authenticated USING (author_id = auth.uid() OR public.has_role(auth.uid(), 'global_admin'));

CREATE INDEX IF NOT EXISTS themes_public_idx ON public.themes (is_public, is_hidden);
CREATE INDEX IF NOT EXISTS themes_search_idx ON public.themes USING gin (to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(description,'')));

CREATE TRIGGER themes_set_updated_at BEFORE UPDATE ON public.themes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- --- 3. THEME FAVORITES -------------------------------------
CREATE TABLE IF NOT EXISTS public.theme_favorites (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  theme_id uuid NOT NULL REFERENCES public.themes(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, theme_id)
);

GRANT SELECT, INSERT, DELETE ON public.theme_favorites TO authenticated;
GRANT ALL ON public.theme_favorites TO service_role;

ALTER TABLE public.theme_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "theme_favorites_self" ON public.theme_favorites
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- --- 4. RATINGS (templates + themes) ------------------------
CREATE TABLE IF NOT EXISTS public.template_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.templates(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (template_id, user_id)
);
GRANT SELECT ON public.template_ratings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.template_ratings TO authenticated;
GRANT ALL ON public.template_ratings TO service_role;
ALTER TABLE public.template_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "template_ratings_read" ON public.template_ratings FOR SELECT USING (true);
CREATE POLICY "template_ratings_insert" ON public.template_ratings FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "template_ratings_update" ON public.template_ratings FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "template_ratings_delete" ON public.template_ratings FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'global_admin'));
CREATE TRIGGER template_ratings_set_updated_at BEFORE UPDATE ON public.template_ratings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.theme_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  theme_id uuid NOT NULL REFERENCES public.themes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (theme_id, user_id)
);
GRANT SELECT ON public.theme_ratings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.theme_ratings TO authenticated;
GRANT ALL ON public.theme_ratings TO service_role;
ALTER TABLE public.theme_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "theme_ratings_read" ON public.theme_ratings FOR SELECT USING (true);
CREATE POLICY "theme_ratings_insert" ON public.theme_ratings FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "theme_ratings_update" ON public.theme_ratings FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "theme_ratings_delete" ON public.theme_ratings FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'global_admin'));
CREATE TRIGGER theme_ratings_set_updated_at BEFORE UPDATE ON public.theme_ratings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- --- 5. TEMPLATE DOWNLOADS ----------------------------------
CREATE TABLE IF NOT EXISTS public.template_downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.templates(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.template_downloads TO anon;
GRANT SELECT, INSERT ON public.template_downloads TO authenticated;
GRANT ALL ON public.template_downloads TO service_role;
ALTER TABLE public.template_downloads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "template_downloads_read" ON public.template_downloads FOR SELECT USING (true);
CREATE POLICY "template_downloads_insert" ON public.template_downloads FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR user_id IS NULL);
CREATE INDEX IF NOT EXISTS template_downloads_template_idx ON public.template_downloads (template_id);

-- --- 6. COUNTER TRIGGERS ------------------------------------
CREATE OR REPLACE FUNCTION public.tpl_fav_counter() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.templates SET favorites_count = favorites_count + 1 WHERE id = NEW.template_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.templates SET favorites_count = GREATEST(favorites_count - 1, 0) WHERE id = OLD.template_id;
  END IF;
  RETURN NULL;
END; $$;
DROP TRIGGER IF EXISTS user_template_favorites_counter ON public.user_template_favorites;
CREATE TRIGGER user_template_favorites_counter
AFTER INSERT OR DELETE ON public.user_template_favorites
FOR EACH ROW EXECUTE FUNCTION public.tpl_fav_counter();

CREATE OR REPLACE FUNCTION public.theme_fav_counter() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.themes SET favorites_count = favorites_count + 1 WHERE id = NEW.theme_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.themes SET favorites_count = GREATEST(favorites_count - 1, 0) WHERE id = OLD.theme_id;
  END IF;
  RETURN NULL;
END; $$;
DROP TRIGGER IF EXISTS theme_favorites_counter ON public.theme_favorites;
CREATE TRIGGER theme_favorites_counter
AFTER INSERT OR DELETE ON public.theme_favorites
FOR EACH ROW EXECUTE FUNCTION public.theme_fav_counter();

CREATE OR REPLACE FUNCTION public.tpl_downloads_counter() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  UPDATE public.templates SET downloads_count = downloads_count + 1 WHERE id = NEW.template_id;
  RETURN NULL;
END; $$;
DROP TRIGGER IF EXISTS template_downloads_counter ON public.template_downloads;
CREATE TRIGGER template_downloads_counter
AFTER INSERT ON public.template_downloads
FOR EACH ROW EXECUTE FUNCTION public.tpl_downloads_counter();

CREATE OR REPLACE FUNCTION public.tpl_rating_counter() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE tid uuid;
BEGIN
  tid := COALESCE(NEW.template_id, OLD.template_id);
  UPDATE public.templates t SET
    rating_count = COALESCE((SELECT count(*) FROM public.template_ratings WHERE template_id = tid),0),
    rating_avg = COALESCE((SELECT round(avg(rating)::numeric, 2) FROM public.template_ratings WHERE template_id = tid),0)
  WHERE t.id = tid;
  RETURN NULL;
END; $$;
DROP TRIGGER IF EXISTS template_ratings_counter ON public.template_ratings;
CREATE TRIGGER template_ratings_counter
AFTER INSERT OR UPDATE OR DELETE ON public.template_ratings
FOR EACH ROW EXECUTE FUNCTION public.tpl_rating_counter();

CREATE OR REPLACE FUNCTION public.theme_rating_counter() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE tid uuid;
BEGIN
  tid := COALESCE(NEW.theme_id, OLD.theme_id);
  UPDATE public.themes t SET
    rating_count = COALESCE((SELECT count(*) FROM public.theme_ratings WHERE theme_id = tid),0),
    rating_avg = COALESCE((SELECT round(avg(rating)::numeric, 2) FROM public.theme_ratings WHERE theme_id = tid),0)
  WHERE t.id = tid;
  RETURN NULL;
END; $$;
DROP TRIGGER IF EXISTS theme_ratings_counter ON public.theme_ratings;
CREATE TRIGGER theme_ratings_counter
AFTER INSERT OR UPDATE OR DELETE ON public.theme_ratings
FOR EACH ROW EXECUTE FUNCTION public.theme_rating_counter();

CREATE TRIGGER templates_set_updated_at BEFORE UPDATE ON public.templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- --- 7. SEED (5 templates + 3 themes) -----------------------
INSERT INTO public.templates (title, description, category, tags, is_system, is_public, planner_view, schema, content, language)
SELECT * FROM (VALUES
  ('Rotina Familiar Semanal', 'Organize a semana da família com blocos por período do dia.', 'casa', ARRAY['familia','semana','rotina'], true, true, 'weekly',
    '{"pages":[{"id":"p1","title":"Semana","fields":[{"id":"f1","type":"heading","name":"h","label":"Rotina da Família"},{"id":"f2","type":"short_text","name":"resp","label":"Responsável"},{"id":"f3","type":"long_text","name":"obs","label":"Observações"}]}],"logic":[],"settings":{"autosave":true}}'::jsonb,
    '{}'::jsonb, 'pt-BR'),
  ('Checklist Pet', 'Cuidados diários com seu pet — comida, remédios, passeios.', 'pets', ARRAY['pet','saude','rotina'], true, true, 'checklist',
    '{"pages":[{"id":"p1","title":"Checklist","fields":[{"id":"f1","type":"checkbox","name":"comida","label":"Alimentação"},{"id":"f2","type":"checkbox","name":"agua","label":"Trocar água"},{"id":"f3","type":"checkbox","name":"passeio","label":"Passeio"}]}],"logic":[],"settings":{"autosave":true}}'::jsonb,
    '{}'::jsonb, 'pt-BR'),
  ('Planner de Estudos', 'Blocos de estudo por matéria com metas semanais.', 'estudos', ARRAY['estudo','faculdade','provas'], true, true, 'weekly',
    '{"pages":[{"id":"p1","title":"Estudos","fields":[{"id":"f1","type":"short_text","name":"materia","label":"Matéria"},{"id":"f2","type":"number","name":"horas","label":"Horas planejadas"},{"id":"f3","type":"long_text","name":"conteudo","label":"Conteúdo"}]}],"logic":[],"settings":{"autosave":true}}'::jsonb,
    '{}'::jsonb, 'pt-BR'),
  ('Lista de Compras', 'Lista rápida por categoria com quantidades.', 'compras', ARRAY['compras','mercado'], true, true, 'shopping',
    '{"pages":[{"id":"p1","title":"Compras","fields":[{"id":"f1","type":"short_text","name":"item","label":"Item"},{"id":"f2","type":"number","name":"qtd","label":"Quantidade"},{"id":"f3","type":"checkbox","name":"comprado","label":"Comprado"}]}],"logic":[],"settings":{"autosave":true}}'::jsonb,
    '{}'::jsonb, 'pt-BR'),
  ('Rotina de Academia', 'Divisão semanal de treinos com séries e cargas.', 'academia', ARRAY['treino','fitness','saude'], true, true, 'weekly',
    '{"pages":[{"id":"p1","title":"Treino","fields":[{"id":"f1","type":"short_text","name":"exercicio","label":"Exercício"},{"id":"f2","type":"number","name":"series","label":"Séries"},{"id":"f3","type":"number","name":"reps","label":"Repetições"}]}],"logic":[],"settings":{"autosave":true}}'::jsonb,
    '{}'::jsonb, 'pt-BR')
) AS v(title, description, category, tags, is_system, is_public, planner_view, schema, content, language)
WHERE NOT EXISTS (SELECT 1 FROM public.templates WHERE is_system = true AND title = v.title);

INSERT INTO public.themes (title, description, category, tags, tokens, is_system, is_public, is_featured, language)
SELECT * FROM (VALUES
  ('Aurora', 'Tema claro e acolhedor com tons pastel.', 'geral', ARRAY['claro','pastel','minimalista'],
    '{"mode":"light","colors":{"primary":"#7C5CFF","accent":"#F7A5A5","background":"#FDF7FF","foreground":"#1A1033"},"typography":{"heading":"Outfit","body":"Inter"}}'::jsonb,
    true, true, true, 'pt-BR'),
  ('Midnight', 'Tema escuro elegante para foco noturno.', 'geral', ARRAY['escuro','dark','elegante'],
    '{"mode":"dark","colors":{"primary":"#8AB4FF","accent":"#F0B7FF","background":"#0B0D1A","foreground":"#EDEEFF"},"typography":{"heading":"Outfit","body":"Inter"}}'::jsonb,
    true, true, true, 'pt-BR'),
  ('Natureza', 'Verdes suaves inspirados em plantas.', 'geral', ARRAY['verde','natureza','organico'],
    '{"mode":"light","colors":{"primary":"#3E8E5A","accent":"#C8E6C9","background":"#F4F9F3","foreground":"#1F3A24"},"typography":{"heading":"Outfit","body":"Inter"}}'::jsonb,
    true, true, false, 'pt-BR')
) AS v(title, description, category, tags, tokens, is_system, is_public, is_featured, language)
WHERE NOT EXISTS (SELECT 1 FROM public.themes WHERE is_system = true AND title = v.title);
