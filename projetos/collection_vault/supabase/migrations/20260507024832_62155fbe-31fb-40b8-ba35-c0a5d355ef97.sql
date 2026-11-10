
-- Coluna thumb em jogos
ALTER TABLE public.jogos ADD COLUMN IF NOT EXISTS thumb_url text;

-- Tabela de tokens de API
CREATE TABLE public.api_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  prefix text NOT NULL,
  token_hash text NOT NULL UNIQUE,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_api_tokens_hash ON public.api_tokens(token_hash) WHERE revoked_at IS NULL;
ALTER TABLE public.api_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY api_tokens_select_own ON public.api_tokens FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY api_tokens_insert_own ON public.api_tokens FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY api_tokens_update_own ON public.api_tokens FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY api_tokens_delete_own ON public.api_tokens FOR DELETE USING (auth.uid() = user_id);

-- Filtros salvos
CREATE TABLE public.filtros_salvos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tabela text NOT NULL,
  nome text NOT NULL,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_last boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_filtros_user_tabela ON public.filtros_salvos(user_id, tabela);
ALTER TABLE public.filtros_salvos ENABLE ROW LEVEL SECURITY;
CREATE POLICY filtros_select_own ON public.filtros_salvos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY filtros_insert_own ON public.filtros_salvos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY filtros_update_own ON public.filtros_salvos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY filtros_delete_own ON public.filtros_salvos FOR DELETE USING (auth.uid() = user_id);

-- Galeria de imagens por jogo
CREATE TABLE public.jogo_imagens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  jogo_id uuid NOT NULL REFERENCES public.jogos(id) ON DELETE CASCADE,
  url text NOT NULL,
  storage_path text,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_jogo_imagens_jogo ON public.jogo_imagens(jogo_id);
ALTER TABLE public.jogo_imagens ENABLE ROW LEVEL SECURITY;
CREATE POLICY jogo_imagens_select_own ON public.jogo_imagens FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY jogo_imagens_insert_own ON public.jogo_imagens FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY jogo_imagens_update_own ON public.jogo_imagens FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY jogo_imagens_delete_own ON public.jogo_imagens FOR DELETE USING (auth.uid() = user_id);

-- Bucket público para imagens dos jogos
INSERT INTO storage.buckets (id, name, public) VALUES ('jogo-imagens','jogo-imagens', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "jogo_imagens_public_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'jogo-imagens');
CREATE POLICY "jogo_imagens_owner_insert" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'jogo-imagens' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "jogo_imagens_owner_update" ON storage.objects FOR UPDATE
  USING (bucket_id = 'jogo-imagens' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "jogo_imagens_owner_delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'jogo-imagens' AND auth.uid()::text = (storage.foldername(name))[1]);
