
-- 1. ai_settings (singleton)
CREATE TABLE public.ai_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  singleton BOOLEAN NOT NULL DEFAULT true UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  auto_process_on_upload BOOLEAN NOT NULL DEFAULT true,
  language TEXT NOT NULL DEFAULT 'pt-BR',
  max_words INTEGER NOT NULL DEFAULT 180,
  temperature NUMERIC(3,2) NOT NULL DEFAULT 0.4,
  max_retries INTEGER NOT NULL DEFAULT 3,
  timeout_ms INTEGER NOT NULL DEFAULT 60000,
  chat_model TEXT NOT NULL DEFAULT 'google/gemini-2.5-flash',
  embedding_model TEXT NOT NULL DEFAULT 'google/gemini-embedding-2',
  active_prompt_slug TEXT NOT NULL DEFAULT 'artwork_analysis',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ai_settings TO anon, authenticated;
GRANT ALL ON public.ai_settings TO service_role;
ALTER TABLE public.ai_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_settings public read" ON public.ai_settings FOR SELECT USING (true);
CREATE POLICY "ai_settings admin manage" ON public.ai_settings FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER ai_settings_updated_at BEFORE UPDATE ON public.ai_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. ai_prompts
CREATE TABLE public.ai_prompts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  default_content TEXT NOT NULL,
  current_version INTEGER NOT NULL DEFAULT 1,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_prompts TO authenticated;
GRANT ALL ON public.ai_prompts TO service_role;
ALTER TABLE public.ai_prompts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_prompts admin manage" ON public.ai_prompts FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER ai_prompts_updated_at BEFORE UPDATE ON public.ai_prompts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. ai_prompt_versions
CREATE TABLE public.ai_prompt_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt_id UUID NOT NULL REFERENCES public.ai_prompts(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  content TEXT NOT NULL,
  note TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (prompt_id, version)
);
GRANT SELECT, INSERT, DELETE ON public.ai_prompt_versions TO authenticated;
GRANT ALL ON public.ai_prompt_versions TO service_role;
ALTER TABLE public.ai_prompt_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_prompt_versions admin manage" ON public.ai_prompt_versions FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE INDEX ai_prompt_versions_prompt_idx ON public.ai_prompt_versions(prompt_id, version DESC);

-- 4. artwork_ai_metadata
CREATE TABLE public.artwork_ai_metadata (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artwork_id UUID NOT NULL UNIQUE REFERENCES public.artworks(id) ON DELETE CASCADE,
  title_suggested TEXT,
  description TEXT,
  short_summary TEXT,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  tags TEXT[] NOT NULL DEFAULT '{}',
  theme TEXT,
  occasion TEXT,
  style TEXT,
  illustration_type TEXT,
  predominant_colors TEXT[] NOT NULL DEFAULT '{}',
  objects TEXT[] NOT NULL DEFAULT '{}',
  has_people BOOLEAN,
  has_animals BOOLEAN,
  decorative_elements TEXT[] NOT NULL DEFAULT '{}',
  typography_type TEXT,
  emotion TEXT,
  target_audience TEXT,
  commemorative_date TEXT,
  compatible_products TEXT[] NOT NULL DEFAULT '{}',
  suggested_category TEXT,
  suggested_collection TEXT,
  raw_json JSONB,
  manually_edited JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_generated_at TIMESTAMPTZ,
  model TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.artwork_ai_metadata TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.artwork_ai_metadata TO authenticated;
GRANT ALL ON public.artwork_ai_metadata TO service_role;
ALTER TABLE public.artwork_ai_metadata ENABLE ROW LEVEL SECURITY;
CREATE POLICY "artwork_ai_metadata public read for active artworks" ON public.artwork_ai_metadata FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.artworks a WHERE a.id = artwork_id AND (a.status = 'active'::content_status OR has_role(auth.uid(), 'admin'::app_role))));
CREATE POLICY "artwork_ai_metadata admin manage" ON public.artwork_ai_metadata FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER artwork_ai_metadata_updated_at BEFORE UPDATE ON public.artwork_ai_metadata FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX artwork_ai_metadata_artwork_idx ON public.artwork_ai_metadata(artwork_id);
CREATE INDEX artwork_ai_metadata_keywords_gin ON public.artwork_ai_metadata USING gin(keywords);
CREATE INDEX artwork_ai_metadata_tags_gin ON public.artwork_ai_metadata USING gin(tags);

-- 5. ai_processing_status enum + history
DO $$ BEGIN
  CREATE TYPE public.ai_job_status AS ENUM ('queued','sending','processing','completed','error','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE public.ai_processing_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artwork_id UUID REFERENCES public.artworks(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  prompt_slug TEXT,
  prompt_content TEXT,
  model TEXT,
  status public.ai_job_status NOT NULL DEFAULT 'queued',
  result_json JSONB,
  error_message TEXT,
  duration_ms INTEGER,
  tokens_prompt INTEGER,
  tokens_completion INTEGER,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_processing_history TO authenticated;
GRANT ALL ON public.ai_processing_history TO service_role;
ALTER TABLE public.ai_processing_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_processing_history admin manage" ON public.ai_processing_history FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE INDEX ai_processing_history_created_idx ON public.ai_processing_history(created_at DESC);
CREATE INDEX ai_processing_history_artwork_idx ON public.ai_processing_history(artwork_id, created_at DESC);
CREATE INDEX ai_processing_history_status_idx ON public.ai_processing_history(status);

-- 6. ai_queue
CREATE TABLE public.ai_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artwork_id UUID NOT NULL REFERENCES public.artworks(id) ON DELETE CASCADE,
  status public.ai_job_status NOT NULL DEFAULT 'queued',
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  priority INTEGER NOT NULL DEFAULT 100,
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  locked_at TIMESTAMPTZ,
  locked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  last_error TEXT,
  history_id UUID REFERENCES public.ai_processing_history(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_queue TO authenticated;
GRANT ALL ON public.ai_queue TO service_role;
ALTER TABLE public.ai_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_queue admin manage" ON public.ai_queue FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER ai_queue_updated_at BEFORE UPDATE ON public.ai_queue FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX ai_queue_status_priority_idx ON public.ai_queue(status, priority, scheduled_at);
CREATE INDEX ai_queue_artwork_idx ON public.ai_queue(artwork_id);

-- 7. pgvector + embeddings (best-effort)
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE public.artwork_embeddings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artwork_id UUID NOT NULL UNIQUE REFERENCES public.artworks(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding vector(3072),
  model TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.artwork_embeddings TO authenticated;
GRANT ALL ON public.artwork_embeddings TO service_role;
ALTER TABLE public.artwork_embeddings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "artwork_embeddings admin manage" ON public.artwork_embeddings FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER artwork_embeddings_updated_at BEFORE UPDATE ON public.artwork_embeddings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- HNSW index over halfvec cast (3072 dims > 2000 vector cap)
DO $$ BEGIN
  EXECUTE 'CREATE INDEX artwork_embeddings_hnsw_idx ON public.artwork_embeddings USING hnsw ((embedding::halfvec(3072)) halfvec_cosine_ops)';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipping HNSW index (halfvec unavailable): %', SQLERRM;
END $$;

-- 8. Seed default prompt + settings singleton
INSERT INTO public.ai_prompts (slug, name, content, default_content) VALUES (
  'artwork_analysis',
  'Análise de Arte',
  $prompt$Você é um especialista em catalogação de artes para canecas personalizadas.

Analise a imagem fornecida e retorne um objeto JSON válido (sem texto adicional, sem markdown) com EXATAMENTE os seguintes campos:

{
  "title_suggested": "título curto e comercial (máx. 60 caracteres)",
  "description": "descrição completa e envolvente (máx. {{max_words}} palavras)",
  "short_summary": "resumo de 1 a 2 frases",
  "keywords": ["palavra-chave", "..."],
  "tags": ["tag", "..."],
  "theme": "tema principal (ex: família, natureza, romance)",
  "occasion": "ocasião ideal (ex: Dia dos Pais, Aniversário)",
  "style": "estilo artístico (ex: aquarela, cartoon, minimalista)",
  "illustration_type": "tipo (vetorial, pintura, foto)",
  "predominant_colors": ["azul", "..."],
  "objects": ["objeto1", "..."],
  "has_people": true,
  "has_animals": false,
  "decorative_elements": ["flores", "..."],
  "typography_type": "descrição da tipografia (ex: manuscrita, moderna, ou null)",
  "emotion": "emoção transmitida (ex: alegria, afeto)",
  "target_audience": "público sugerido (ex: pais, crianças, casais)",
  "commemorative_date": "data comemorativa (ex: Dia dos Pais) ou null",
  "compatible_products": ["caneca cerâmica 325ml", "..."],
  "suggested_category": "categoria sugerida",
  "suggested_collection": "coleção sugerida"
}

Responda no idioma: {{language}}.
Todos os campos devem estar presentes; use null quando não aplicável e arrays vazios quando nada for identificado.$prompt$,
  $prompt$Você é um especialista em catalogação de artes para canecas personalizadas.

Analise a imagem fornecida e retorne um objeto JSON válido (sem texto adicional, sem markdown) com EXATAMENTE os seguintes campos:

{
  "title_suggested": "título curto e comercial (máx. 60 caracteres)",
  "description": "descrição completa e envolvente (máx. {{max_words}} palavras)",
  "short_summary": "resumo de 1 a 2 frases",
  "keywords": ["palavra-chave", "..."],
  "tags": ["tag", "..."],
  "theme": "tema principal (ex: família, natureza, romance)",
  "occasion": "ocasião ideal (ex: Dia dos Pais, Aniversário)",
  "style": "estilo artístico (ex: aquarela, cartoon, minimalista)",
  "illustration_type": "tipo (vetorial, pintura, foto)",
  "predominant_colors": ["azul", "..."],
  "objects": ["objeto1", "..."],
  "has_people": true,
  "has_animals": false,
  "decorative_elements": ["flores", "..."],
  "typography_type": "descrição da tipografia (ex: manuscrita, moderna, ou null)",
  "emotion": "emoção transmitida (ex: alegria, afeto)",
  "target_audience": "público sugerido (ex: pais, crianças, casais)",
  "commemorative_date": "data comemorativa (ex: Dia dos Pais) ou null",
  "compatible_products": ["caneca cerâmica 325ml", "..."],
  "suggested_category": "categoria sugerida",
  "suggested_collection": "coleção sugerida"
}

Responda no idioma: {{language}}.
Todos os campos devem estar presentes; use null quando não aplicável e arrays vazios quando nada for identificado.$prompt$
);

INSERT INTO public.ai_prompt_versions (prompt_id, version, content, note)
  SELECT id, 1, content, 'Versão inicial (padrão)' FROM public.ai_prompts WHERE slug = 'artwork_analysis';

INSERT INTO public.ai_settings (singleton) VALUES (true);

-- 9. Semantic search function (skipped gracefully if halfvec unavailable at query time)
CREATE OR REPLACE FUNCTION public.search_artworks_semantic(
  query_embedding vector(3072),
  match_count INTEGER DEFAULT 20
) RETURNS TABLE (
  artwork_id UUID,
  similarity FLOAT
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT e.artwork_id,
         1 - (e.embedding::halfvec(3072) <=> query_embedding::halfvec(3072)) AS similarity
  FROM public.artwork_embeddings e
  JOIN public.artworks a ON a.id = e.artwork_id
  WHERE a.status = 'active'::content_status AND e.embedding IS NOT NULL
  ORDER BY e.embedding::halfvec(3072) <=> query_embedding::halfvec(3072)
  LIMIT match_count;
$$;

GRANT EXECUTE ON FUNCTION public.search_artworks_semantic(vector, INTEGER) TO anon, authenticated;
