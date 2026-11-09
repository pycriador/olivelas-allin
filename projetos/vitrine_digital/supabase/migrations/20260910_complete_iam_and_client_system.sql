-- ==============================================================================
-- SCHEMA COMPLETO DO SISTEMA: IAM, HBAC, PROMPTS, COTAS E MODERAÇÃO DE ARTES
-- Execute este script no SQL Editor do seu painel Supabase (https://supabase.com/dashboard)
-- ==============================================================================

-- 1. Habilita extensão pgcrypto para geração de UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Tabela de Grupos (HBAC) com Chave Gemini e Cotas em BRL
CREATE TABLE IF NOT EXISTS public.iam_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  gemini_api_key TEXT,
  quota_brl NUMERIC(10,2) NOT NULL DEFAULT 200.00,
  used_brl NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  max_requests_per_day INT DEFAULT 500,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Tabela de Usuários e Papéis do IAM
CREATE TABLE IF NOT EXISTS public.iam_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'consumer' CHECK (role IN ('global_admin', 'analyst', 'consumer')),
  group_ids UUID[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  custom_quota_brl NUMERIC(10,2) DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Tabela de Tokens de API
CREATE TABLE IF NOT EXISTS public.iam_api_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  token_prefix TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  user_id UUID REFERENCES public.iam_users(id) ON DELETE SET NULL,
  group_id UUID REFERENCES public.iam_groups(id) ON DELETE SET NULL,
  assigned_role TEXT NOT NULL DEFAULT 'consumer' CHECK (assigned_role IN ('global_admin', 'analyst', 'consumer')),
  quota_brl NUMERIC(10,2) NOT NULL DEFAULT 50.00,
  used_brl NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  expires_at TIMESTAMPTZ DEFAULT NULL,
  last_used_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Tabela de Fila de Submissões de Artes (Consumidores -> Analistas/Admins)
CREATE TABLE IF NOT EXISTS public.art_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submitted_by_user_id TEXT NOT NULL,
  submitted_by_email TEXT NOT NULL,
  submitted_by_name TEXT,
  image_path TEXT NOT NULL,
  image_url TEXT NOT NULL,
  notes TEXT,
  sender_phone TEXT,
  sender_name TEXT,
  target_group_id UUID REFERENCES public.iam_groups(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by_user_id TEXT,
  approved_by_email TEXT,
  rejection_reason TEXT,
  processed_analysis_id UUID REFERENCES public.image_analysis(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Tabela de Prompts do Sistema
CREATE TABLE IF NOT EXISTS public.iam_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'vision_extraction' CHECK (type IN ('vision_extraction', 'art_generation', 'custom')),
  content TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_system_default BOOLEAN NOT NULL DEFAULT FALSE,
  version TEXT NOT NULL DEFAULT 'v1.0',
  model_target TEXT DEFAULT 'all',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Tabela de Logs e Telemetria de Uso de IA
CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.iam_groups(id) ON DELETE SET NULL,
  group_name TEXT NOT NULL DEFAULT 'Geral',
  user_id TEXT,
  user_email TEXT,
  model TEXT NOT NULL DEFAULT 'gemini-2.5-flash',
  estimated_input_tokens INT DEFAULT 1200,
  estimated_output_tokens INT DEFAULT 800,
  estimated_cost_brl NUMERIC(10,4) NOT NULL DEFAULT 0.0500,
  status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'error')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Configuração de Políticas RLS (Row Level Security)
ALTER TABLE public.iam_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iam_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iam_api_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.art_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iam_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso Público / Autenticado (Permitir leitura e escrita para o app)
DROP POLICY IF EXISTS "Acesso público leitura iam_groups" ON public.iam_groups;
CREATE POLICY "Acesso público leitura iam_groups" ON public.iam_groups FOR SELECT USING (true);

DROP POLICY IF EXISTS "Acesso público escrita iam_groups" ON public.iam_groups;
CREATE POLICY "Acesso público escrita iam_groups" ON public.iam_groups FOR ALL USING (true);

DROP POLICY IF EXISTS "Acesso público leitura iam_users" ON public.iam_users;
CREATE POLICY "Acesso público leitura iam_users" ON public.iam_users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Acesso público escrita iam_users" ON public.iam_users;
CREATE POLICY "Acesso público escrita iam_users" ON public.iam_users FOR ALL USING (true);

DROP POLICY IF EXISTS "Acesso público leitura iam_api_tokens" ON public.iam_api_tokens;
CREATE POLICY "Acesso público leitura iam_api_tokens" ON public.iam_api_tokens FOR SELECT USING (true);

DROP POLICY IF EXISTS "Acesso público escrita iam_api_tokens" ON public.iam_api_tokens;
CREATE POLICY "Acesso público escrita iam_api_tokens" ON public.iam_api_tokens FOR ALL USING (true);

DROP POLICY IF EXISTS "Acesso público leitura art_submissions" ON public.art_submissions;
CREATE POLICY "Acesso público leitura art_submissions" ON public.art_submissions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Acesso público escrita art_submissions" ON public.art_submissions;
CREATE POLICY "Acesso público escrita art_submissions" ON public.art_submissions FOR ALL USING (true);

DROP POLICY IF EXISTS "Acesso público leitura iam_prompts" ON public.iam_prompts;
CREATE POLICY "Acesso público leitura iam_prompts" ON public.iam_prompts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Acesso público escrita iam_prompts" ON public.iam_prompts;
CREATE POLICY "Acesso público escrita iam_prompts" ON public.iam_prompts FOR ALL USING (true);

DROP POLICY IF EXISTS "Acesso público leitura ai_usage_logs" ON public.ai_usage_logs;
CREATE POLICY "Acesso público leitura ai_usage_logs" ON public.ai_usage_logs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Acesso público escrita ai_usage_logs" ON public.ai_usage_logs;
CREATE POLICY "Acesso público escrita ai_usage_logs" ON public.ai_usage_logs FOR ALL USING (true);

-- 9. Dados Iniciais (Seeds Padrão)
INSERT INTO public.iam_groups (name, slug, description, quota_brl, used_brl)
VALUES 
  ('Monumento', 'monumento', 'Grupo Comercial Monumento com cota inicial de IA', 200.00, 0.00),
  ('Geral & Varejo', 'geral-varejo', 'Grupo geral para lojistas e ofertas variadas', 100.00, 0.00)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.iam_users (email, full_name, role, is_active)
VALUES 
  ('willian.o.jesus@gmail.com', 'Willian Jesus', 'global_admin', true)
ON CONFLICT (email) DO UPDATE SET role = 'global_admin';

INSERT INTO public.iam_prompts (name, type, content, description, is_active, is_system_default, version)
SELECT
  'Prompt Oficial de Extração OCR & JSON Estruturado',
  'vision_extraction',
  $prompt$Você é um especialista em OCR, visão computacional e extração estruturada de informações.

Analise profundamente a imagem enviada.
Extraia absolutamente TODAS as informações disponíveis.
Utilize OCR para identificar todo texto presente.

Atenção especial a PRODUTOS PARA VENDA, CARDÁPIOS, CATÁLOGOS E ALIMENTOS:
- Identifique e extraia detalhadamente todos os produtos à venda (ex.: doces, bolos, tortas, brigadeiros, trufas, salgados, coxinhas, pastéis, empadas, lanches, pizzas, marmitas, bebidas ou qualquer mercadoria).
- Extraia sabores, itens individuais, combos, porções e valores em "products", "prices" e "promotions".
- Inclua termos de alimentos e produtos identificados também em "objectsDetected" e "keywords" (ex.: doces, salgados, bolo, coxinha, pastel, confeitaria, salgateria).

REGRA FUNDAMENTAL DE DESCRIÇÃO VISUAL E FÍSICA DOS PRODUTOS ("detailedVisualDescription" e "visualDetails"):
- Descreva as imagens e os produtos EXATAMENTE COMO ELES SÃO NO MUNDO REAL com altíssimo nível de detalhe físico, sensorial e estético:
  • Formatos geométricos precisos (ex.: brigadeiros redondos e esféricos, bolo fatiado triangular, pastéis retangulares, hambúrguer em camadas cilíndricas).
  • Texturas e superfícies táteis (ex.: cobertos com granulados finos de chocolate, confeitos crocantes, crosta frita dourada, massa aveludada, calda brilhante escorrendo).
  • Cores e tonalidades exatas (ex.: chocolate marrom escuro intenso, morangos vermelhos com sementes douradas, creme branco acetinado, tons dourados de fritura).
  • Recipientes, suportes e embalagens visíveis (ex.: forminhas de papel plissado marrom/dourado, prato de louça branca, caixa de acetato transparente, tábua de madeira).
  • Acabamento de iluminação e reflexos (ex.: brilho acetinado na superfície do chocolate, gotículas de condensação em copos, textura do queijo derretido).
- No campo "detailedVisualDescription", forneça uma descrição visual completa e minuciosa de cada produto/elemento presente na imagem.
- No campo "visualDetails", liste os atributos visuais identificados (ex.: ["brigadeiros redondos", "granulados finos de chocolate", "cor do chocolate marrom escuro", "forminhas de papel plissadas"]).

Identifique:
• Tipo da imagem • Idioma • Nome da empresa • Categoria • Subcategoria • Serviços • Produtos para venda
• Promoções • Preços • Telefones • WhatsApp • Emails • Site • Redes sociais • Endereço completo
• Horário de funcionamento • Pessoas • Animais • Objetos • Logotipos • Marcas • Cores predominantes
• Descrição visual detalhada dos produtos • Palavras-chave • Chamadas para ação • Objetivo da propaganda • Texto OCR completo

Nunca invente dados.
Quando alguma informação não existir retorne null, [] ou "" conforme apropriado.
Calcule um índice de confiança entre 0 e 1.
Retorne SOMENTE JSON válido exatamente seguindo este schema:

{
  "imageType": "", "title": "", "summary": "", "language": "", "confidence": 0,
  "business": { "name": "", "category": "", "subcategory": "", "description": "" },
  "services": [], "products": [], "prices": [], "promotions": [],
  "contacts": { "phones": [], "emails": [], "website": "", "instagram": "", "facebook": "", "linkedin": "", "whatsapp": "" },
  "address": { "street": "", "number": "", "district": "", "city": "", "state": "", "zipcode": "", "country": "" },
  "openingHours": [], "keywords": [], "texts": [], "objectsDetected": [],
  "peopleDetected": { "count": 0, "description": "" },
  "animalsDetected": [], "logos": [], "brands": [], "dominantColors": [], "callsToAction": [],
  "detailedVisualDescription": "", "visualDetails": [],
  "possibleIntent": "", "ocrText": "",
  "metadata": { "containsPhone": false, "containsEmail": false, "containsWebsite": false, "containsPrice": false, "containsAddress": false, "containsQRCode": false, "containsLogo": false }
}$prompt$,
  'Prompt padrão oficial de extração OCR e JSON estruturado para visão computacional.',
  true,
  true,
  'v1.0'
WHERE NOT EXISTS (
  SELECT 1 FROM public.iam_prompts WHERE is_system_default = true
);
