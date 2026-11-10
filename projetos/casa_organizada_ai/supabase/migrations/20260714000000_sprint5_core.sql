-- ============================================================
-- SPRINT 5 — AI Assistant, Personalização Avançada e
--              Inteligência da Plataforma
-- ============================================================

-- ============================================================
-- 1. AI PROVIDERS — multi-provedor configurável pelo admin
-- ============================================================
CREATE TABLE public.ai_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  provider_type TEXT NOT NULL CHECK (provider_type IN (
    'openai','openai-compatible','gemini','anthropic','azure','ollama'))
    DEFAULT 'openai-compatible',
  base_url TEXT,
  api_key TEXT,
  models JSONB NOT NULL DEFAULT '[]'::jsonb,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ai_providers TO authenticated;
GRANT ALL ON public.ai_providers TO service_role;
ALTER TABLE public.ai_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_providers_read" ON public.ai_providers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "ai_providers_admin_all" ON public.ai_providers
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'global_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'global_admin'));

CREATE TRIGGER ai_providers_set_updated_at BEFORE UPDATE ON public.ai_providers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.ai_providers (slug, name, provider_type, base_url, models, is_system) VALUES
  ('lovable', 'Lovable AI Gateway', 'openai-compatible',
   'https://ai.gateway.lovable.dev/v1',
   '[
     {"id":"google/gemini-2.5-flash","label":"Gemini 2.5 Flash (rápido)"},
     {"id":"google/gemini-2.5-flash-lite","label":"Gemini 2.5 Flash Lite (mais rápido)"},
     {"id":"google/gemini-2.5-pro","label":"Gemini 2.5 Pro (avançado)"},
     {"id":"openai/gpt-5-mini","label":"GPT-5 Mini"},
     {"id":"openai/gpt-5","label":"GPT-5 (top)"}
   ]'::jsonb, true),
  ('openai', 'OpenAI', 'openai',
   'https://api.openai.com/v1',
   '[
     {"id":"gpt-5","label":"GPT-5"},
     {"id":"gpt-5-mini","label":"GPT-5 Mini"},
     {"id":"gpt-4o","label":"GPT-4o"},
     {"id":"gpt-4o-mini","label":"GPT-4o Mini"}
   ]'::jsonb, true),
  ('google-gemini', 'Google Gemini', 'gemini',
   'https://generativelanguage.googleapis.com/v1beta',
   '[
     {"id":"gemini-2.5-flash","label":"Gemini 2.5 Flash"},
     {"id":"gemini-2.5-flash-lite","label":"Gemini 2.5 Flash Lite"},
     {"id":"gemini-2.5-pro","label":"Gemini 2.5 Pro"}
   ]'::jsonb, true),
  ('anthropic', 'Anthropic Claude', 'anthropic',
   'https://api.anthropic.com/v1',
   '[
     {"id":"claude-sonnet-5","label":"Claude Sonnet 5"},
     {"id":"claude-haiku-5","label":"Claude Haiku 5"}
   ]'::jsonb, true),
  ('ollama', 'Ollama (Local)', 'ollama',
   'http://localhost:11434/v1',
   '[
     {"id":"llama3","label":"Llama 3"},
     {"id":"mistral","label":"Mistral"},
     {"id":"phi","label":"Phi"}
   ]'::jsonb, true),
  ('azure-openai', 'Azure OpenAI', 'azure',
   NULL,
   '[
     {"id":"gpt-4o","label":"GPT-4o"},
     {"id":"gpt-4o-mini","label":"GPT-4o Mini"}
   ]'::jsonb, true)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 2. PROMPT MANAGEMENT — prompts do sistema e personalizados
-- ============================================================
CREATE TABLE public.ai_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN (
    'system','personal','template','action','insight','general')),
  language TEXT NOT NULL DEFAULT 'pt-BR',
  version INT NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_system BOOLEAN NOT NULL DEFAULT false,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (slug, language, version)
);

GRANT SELECT ON public.ai_prompts TO authenticated;
GRANT ALL ON public.ai_prompts TO service_role;
ALTER TABLE public.ai_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_prompts_read" ON public.ai_prompts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "ai_prompts_admin_all" ON public.ai_prompts
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'global_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'global_admin'));

CREATE TRIGGER ai_prompts_set_updated_at BEFORE UPDATE ON public.ai_prompts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 3. AI ACTIONS LOG — rastreamento de ações geradas pela IA
-- ============================================================
CREATE TABLE public.user_ai_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'assistant' CHECK (source IN (
    'assistant','suggestion','auto','insight','action')),
  input_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  output_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  model_used TEXT,
  provider_slug TEXT,
  tokens_used INT,
  execution_time_ms INT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX user_ai_actions_user_idx ON public.user_ai_actions(user_id, created_at DESC);
CREATE INDEX user_ai_actions_type_idx ON public.user_ai_actions(action_type, created_at DESC);

GRANT SELECT, INSERT ON public.user_ai_actions TO authenticated;
GRANT ALL ON public.user_ai_actions TO service_role;
ALTER TABLE public.user_ai_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_ai_actions_own" ON public.user_ai_actions
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 4. INSIGHTS — resumos diários/semanais/mensais gerados pela IA
-- ============================================================
CREATE TYPE public.insight_period AS ENUM ('daily','weekly','monthly');

CREATE TABLE public.user_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period public.insight_period NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  summary TEXT NOT NULL,
  indicators JSONB NOT NULL DEFAULT '{}'::jsonb,
  suggestions TEXT[] NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, period, period_start)
);

GRANT SELECT ON public.user_insights TO authenticated;
GRANT ALL ON public.user_insights TO service_role;
ALTER TABLE public.user_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_insights_own" ON public.user_insights
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 5. USER MEMORY — preparação para memória de longo prazo
-- ============================================================
CREATE TABLE public.user_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  memory_type TEXT NOT NULL CHECK (memory_type IN (
    'preference','project','planner','category','style','fact','routine','note')),
  key TEXT NOT NULL,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  confidence NUMERIC(3,2) NOT NULL DEFAULT 1.0 CHECK (confidence BETWEEN 0 AND 1),
  source TEXT NOT NULL DEFAULT 'manual',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, memory_type, key)
);

CREATE INDEX user_memory_user_idx ON public.user_memory(user_id, memory_type);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_memory TO authenticated;
GRANT ALL ON public.user_memory TO service_role;
ALTER TABLE public.user_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_memory_own" ON public.user_memory
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TRIGGER user_memory_set_updated_at BEFORE UPDATE ON public.user_memory
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 6. AVATAR SYSTEM — biblioteca de avatares + uploads
-- ============================================================
CREATE TABLE public.avatars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'illustration' CHECK (category IN (
    'illustration','animal','nature','abstract','emoji','character')),
  style TEXT NOT NULL DEFAULT 'flat' CHECK (style IN (
    'flat','outline','filled','gradient','pixel','minimal')),
  svg_content TEXT,
  png_url TEXT,
  colors JSONB NOT NULL DEFAULT '[]'::jsonb,
  tags TEXT[] NOT NULL DEFAULT '{}',
  is_system BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.avatars TO anon, authenticated;
GRANT ALL ON public.avatars TO service_role;
ALTER TABLE public.avatars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "avatars_read" ON public.avatars FOR SELECT USING (true);
CREATE POLICY "avatars_admin_all" ON public.avatars
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'global_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'global_admin'));

-- Avatar library seed
INSERT INTO public.avatars (slug, name, category, style, tags, sort, is_system) VALUES
  ('avatar-calm','Calm','illustration','flat',ARRAY['calmo','azul','sereno'],1,true),
  ('avatar-focus','Focus','illustration','flat',ARRAY['foco','roxo','determinado'],2,true),
  ('avatar-sunny','Sunny','illustration','flat',ARRAY['sol','alegre','amarelo'],3,true),
  ('avatar-nature','Nature','nature','flat',ARRAY['natureza','verde','folha'],4,true),
  ('avatar-ocean','Ocean','animal','filled',ARRAY['oceano','azul','onda'],5,true),
  ('avatar-star','Star','abstract','gradient',ARRAY['estrela','roxo','cosmos'],6,true),
  ('avatar-heart','Heart','abstract','gradient',ARRAY['coração','rosa','amor'],7,true),
  ('avatar-pixel-cat','Pixel Cat','animal','pixel',ARRAY['gato','pixel','retro'],8,true),
  ('avatar-pixel-dog','Pixel Dog','animal','pixel',ARRAY['cachorro','pixel','retro'],9,true),
  ('avatar-smile','Smile','emoji','outline',ARRAY['sorriso','feliz','rosto'],10,true),
  ('avatar-zen','Zen','illustration','minimal',ARRAY['zen','meditação','calma'],11,true),
  ('avatar-rocket','Rocket','abstract','filled',ARRAY['foguete','espaço','aventura'],12,true),
  ('avatar-plant','Plant','nature','flat',ARRAY['planta','natureza','cuidado'],13,true),
  ('avatar-moon','Moon','abstract','gradient',ARRAY['lua','noite','sonho'],14,true),
  ('avatar-paw','Paw','animal','outline',ARRAY['pata','animal','amigo'],15,true),
  ('avatar-books','Books','illustration','flat',ARRAY['livro','estudo','conhecimento'],16,true),
  ('avatar-music','Music','abstract','filled',ARRAY['música','nota','arte'],17,true),
  ('avatar-sport','Sport','character','flat',ARRAY['esporte','movimento','energia'],18,true),
  ('avatar-flower','Flower','nature','minimal',ARRAY['flor','primavera','beleza'],19,true),
  ('avatar-rainbow','Rainbow','abstract','gradient',ARRAY['arco-íris','alegria','cor'],20,true)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 7. EXPAND PROFILE — adicionar campos do perfil expandido
-- ============================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS avatar_id UUID REFERENCES public.avatars(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS avatar_type TEXT NOT NULL DEFAULT 'none' CHECK (avatar_type IN ('none','library','upload')),
  ADD COLUMN IF NOT EXISTS photo_url TEXT,
  ADD COLUMN IF NOT EXISTS favorite_categories TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS favorite_templates UUID[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS linked_providers JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS social_links JSONB NOT NULL DEFAULT '{}'::jsonb;

-- ============================================================
-- 8. EXPAND AI SETTINGS — novas configurações do assistente
-- ============================================================
ALTER TABLE public.ai_settings
  ADD COLUMN IF NOT EXISTS provider_slug TEXT DEFAULT 'lovable',
  ADD COLUMN IF NOT EXISTS creativity NUMERIC NOT NULL DEFAULT 0.7 CHECK (creativity >= 0 AND creativity <= 2),
  ADD COLUMN IF NOT EXISTS max_tokens INT NOT NULL DEFAULT 4096,
  ADD COLUMN IF NOT EXISTS memory_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_suggestions BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS daily_insights BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS weekly_summary BOOLEAN NOT NULL DEFAULT true;

-- ============================================================
-- 9. RAG PREPARATION — conectores para busca semântica futura
-- ============================================================
CREATE TABLE public.rag_connectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  source_table TEXT NOT NULL,
  source_query TEXT NOT NULL DEFAULT 'SELECT id, title AS title, description AS content, owner_id AS user_id FROM %TABLE%',
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_system BOOLEAN NOT NULL DEFAULT false,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.rag_connectors TO authenticated;
GRANT ALL ON public.rag_connectors TO service_role;
ALTER TABLE public.rag_connectors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rag_connectors_read" ON public.rag_connectors
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "rag_connectors_admin_all" ON public.rag_connectors
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'global_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'global_admin'));

INSERT INTO public.rag_connectors (slug, name, description, source_table, is_system) VALUES
  ('forms', 'Formulários', 'Planejamentos e formulários criados pelo usuário', 'forms', true),
  ('templates', 'Templates', 'Templates do marketplace', 'templates', true),
  ('ai_threads', 'Conversas', 'Histórico de conversas com o assistente', 'ai_threads', true),
  ('profiles', 'Perfis', 'Informações dos usuários', 'profiles', true)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 10. USER FAVORITE CATEGORIES — categorias favoritas do usuário
-- ============================================================
CREATE TABLE public.user_favorite_categories (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_slug TEXT NOT NULL,
  sort INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, category_slug)
);

GRANT SELECT, INSERT, DELETE ON public.user_favorite_categories TO authenticated;
GRANT ALL ON public.user_favorite_categories TO service_role;
ALTER TABLE public.user_favorite_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fav_categories_own" ON public.user_favorite_categories
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 11. USER AI USAGE STATS — métricas de uso para admins
-- ============================================================
CREATE TABLE public.ai_usage_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  provider_slug TEXT NOT NULL,
  model_used TEXT NOT NULL,
  requests_count INT NOT NULL DEFAULT 0,
  total_tokens INT NOT NULL DEFAULT 0,
  total_execution_ms INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, date, provider_slug, model_used)
);

GRANT SELECT, INSERT, UPDATE ON public.ai_usage_stats TO authenticated;
GRANT ALL ON public.ai_usage_stats TO service_role;
ALTER TABLE public.ai_usage_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_usage_stats_own" ON public.ai_usage_stats
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'global_admin'));
CREATE POLICY "ai_usage_stats_insert_own" ON public.ai_usage_stats
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "ai_usage_stats_update_own" ON public.ai_usage_stats
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 12. VIEWS — views públicas para o sistema de avatares
-- ============================================================
CREATE OR REPLACE VIEW public.public_avatars AS
SELECT id, slug, name, category, style, svg_content, png_url, colors, tags, sort
FROM public.avatars
WHERE is_active = true
ORDER BY sort ASC;

GRANT SELECT ON public.public_avatars TO anon, authenticated;
