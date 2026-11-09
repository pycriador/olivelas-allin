-- Criação opcional da extensão pgvector para suporte futuro a embeddings (se disponível)
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;

-- Adiciona coluna de embedding para buscas semânticas futuras se suportado
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vector') THEN
    ALTER TABLE public.image_analysis ADD COLUMN IF NOT EXISTS embedding vector(1536);
  END IF;
END $$;

-- Índice para busca em texto completo (Full Text Search) em português
CREATE INDEX IF NOT EXISTS image_analysis_searchable_idx ON public.image_analysis USING gin(to_tsvector('portuguese', coalesce(searchable_text, '')));

-- Índice por empresa e categoria para filtros rápidos
CREATE INDEX IF NOT EXISTS image_analysis_business_idx ON public.image_analysis (business_name);
CREATE INDEX IF NOT EXISTS image_analysis_category_idx ON public.image_analysis (category);
CREATE INDEX IF NOT EXISTS image_analysis_status_idx ON public.image_analysis (status);
