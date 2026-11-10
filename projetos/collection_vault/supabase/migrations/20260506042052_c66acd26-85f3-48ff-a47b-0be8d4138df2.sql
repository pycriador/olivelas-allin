
-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Trigger to auto-create profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)), NEW.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Generic updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Enums via CHECK in tables (kept inline)

-- Empresas
CREATE TABLE public.empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT CHECK (tipo IN ('Desenvolvedora','Publicadora','Ambos')),
  pais TEXT,
  website TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Plataformas
CREATE TABLE public.plataformas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  fabricante TEXT,
  geracao INTEGER,
  ano_lancamento INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Series
CREATE TABLE public.series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Generos
CREATE TABLE public.generos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Subgeneros
CREATE TABLE public.subgeneros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  genero_id UUID REFERENCES public.generos(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Jogos
CREATE TABLE public.jogos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  titulo_alternativo TEXT,
  serie_id UUID REFERENCES public.series(id) ON DELETE SET NULL,
  ano_lancamento INTEGER,
  genero_id UUID REFERENCES public.generos(id) ON DELETE SET NULL,
  subgenero_id UUID REFERENCES public.subgeneros(id) ON DELETE SET NULL,
  desenvolvedora_id UUID REFERENCES public.empresas(id) ON DELETE SET NULL,
  publicadora_id UUID REFERENCES public.empresas(id) ON DELETE SET NULL,
  classificacao_indicativa TEXT,
  numero_jogadores TEXT,
  possui_online BOOLEAN DEFAULT false,
  tempo_medio_jogo INTEGER,
  idiomas TEXT[],
  nota_metacritic INTEGER,
  descricao TEXT,
  link_wikipedia TEXT,
  id_externo_igdb TEXT,
  capa_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Itens
CREATE TABLE public.itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT CHECK (tipo IN ('Console','Controle','Acessório')),
  plataforma_id UUID REFERENCES public.plataformas(id) ON DELETE SET NULL,
  marca TEXT,
  modelo TEXT,
  descricao TEXT,
  ano_lancamento INTEGER,
  imagem_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Colecao
CREATE TABLE public.colecao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo_item TEXT NOT NULL CHECK (tipo_item IN ('Jogo','Item')),
  jogo_id UUID REFERENCES public.jogos(id) ON DELETE CASCADE,
  item_id UUID REFERENCES public.itens(id) ON DELETE CASCADE,
  plataforma_id UUID REFERENCES public.plataformas(id) ON DELETE SET NULL,
  formato TEXT CHECK (formato IN ('Físico','Digital')),
  regiao TEXT,
  edicao TEXT,
  midia TEXT,
  completo BOOLEAN DEFAULT false,
  condicao TEXT,
  data_compra DATE,
  preco_pago DECIMAL(10,2),
  local_compra TEXT,
  status TEXT CHECK (status IN ('Backlog','Jogando','Finalizado')),
  nota_pessoal INTEGER CHECK (nota_pessoal BETWEEN 0 AND 10),
  localizacao_fisica TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Lojas
CREATE TABLE public.lojas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  url_base TEXT,
  tipo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Links de compra
CREATE TABLE public.links_compra (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  jogo_id UUID REFERENCES public.jogos(id) ON DELETE CASCADE,
  item_id UUID REFERENCES public.itens(id) ON DELETE CASCADE,
  loja_id UUID REFERENCES public.lojas(id) ON DELETE SET NULL,
  url TEXT NOT NULL,
  preco DECIMAL(10,2) NOT NULL,
  frete DECIMAL(10,2) DEFAULT 0,
  disponibilidade BOOLEAN DEFAULT true,
  data_verificacao TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Cupons
CREATE TABLE public.cupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  codigo TEXT NOT NULL,
  loja_id UUID REFERENCES public.lojas(id) ON DELETE SET NULL,
  tipo_desconto TEXT NOT NULL CHECK (tipo_desconto IN ('Porcentagem','Valor')),
  valor_desconto DECIMAL(10,2) NOT NULL,
  valor_minimo DECIMAL(10,2) DEFAULT 0,
  data_inicio TIMESTAMPTZ,
  data_fim TIMESTAMPTZ,
  ativo BOOLEAN DEFAULT true,
  descricao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all + owner-only policies
DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY['empresas','plataformas','series','generos','subgeneros','jogos','itens','colecao','lojas','links_compra','cupons']) LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "%s_select_own" ON public.%I FOR SELECT USING (auth.uid() = user_id)', t, t);
    EXECUTE format('CREATE POLICY "%s_insert_own" ON public.%I FOR INSERT WITH CHECK (auth.uid() = user_id)', t, t);
    EXECUTE format('CREATE POLICY "%s_update_own" ON public.%I FOR UPDATE USING (auth.uid() = user_id)', t, t);
    EXECUTE format('CREATE POLICY "%s_delete_own" ON public.%I FOR DELETE USING (auth.uid() = user_id)', t, t);
  END LOOP;
END $$;

-- Indices
CREATE INDEX idx_colecao_user ON public.colecao(user_id);
CREATE INDEX idx_jogos_user ON public.jogos(user_id);
CREATE INDEX idx_itens_user ON public.itens(user_id);
CREATE INDEX idx_links_user ON public.links_compra(user_id);
CREATE INDEX idx_cupons_user ON public.cupons(user_id);
