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

-- 8. Funções Auxiliares de Verificação de Autorização (SECURITY INVOKER)
CREATE OR REPLACE FUNCTION public.is_global_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.iam_users 
    WHERE (id = auth.uid() OR email = (auth.jwt() ->> 'email'))
      AND role = 'global_admin'
      AND is_active = true
  ) OR ((auth.jwt() ->> 'email') = 'willian.o.jesus@gmail.com');
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_analyst()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.iam_users 
    WHERE (id = auth.uid() OR email = (auth.jwt() ->> 'email'))
      AND role IN ('global_admin', 'analyst')
      AND is_active = true
  ) OR ((auth.jwt() ->> 'email') = 'willian.o.jesus@gmail.com');
$$;

REVOKE EXECUTE ON FUNCTION public.is_global_admin() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.is_global_admin() TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.is_admin_or_analyst() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.is_admin_or_analyst() TO authenticated, service_role;

-- 9. Configuração de Políticas RLS Seguras (Row Level Security)
ALTER TABLE public.iam_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iam_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iam_api_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.art_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iam_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.image_analysis ENABLE ROW LEVEL SECURITY;

-- iam_groups
DROP POLICY IF EXISTS "Acesso público leitura iam_groups" ON public.iam_groups;
DROP POLICY IF EXISTS "Acesso público escrita iam_groups" ON public.iam_groups;
DROP POLICY IF EXISTS "iam_groups_select_policy" ON public.iam_groups;
DROP POLICY IF EXISTS "iam_groups_admin_all_policy" ON public.iam_groups;

CREATE POLICY "iam_groups_select_policy" ON public.iam_groups FOR SELECT TO authenticated USING (true);
CREATE POLICY "iam_groups_admin_all_policy" ON public.iam_groups FOR ALL TO authenticated USING (public.is_global_admin()) WITH CHECK (public.is_global_admin());

-- iam_users
DROP POLICY IF EXISTS "Acesso público leitura iam_users" ON public.iam_users;
DROP POLICY IF EXISTS "Acesso público escrita iam_users" ON public.iam_users;
DROP POLICY IF EXISTS "iam_users_select_policy" ON public.iam_users;
DROP POLICY IF EXISTS "iam_users_insert_policy" ON public.iam_users;
DROP POLICY IF EXISTS "iam_users_update_policy" ON public.iam_users;
DROP POLICY IF EXISTS "iam_users_delete_policy" ON public.iam_users;

CREATE POLICY "iam_users_select_policy" ON public.iam_users FOR SELECT TO authenticated USING ((auth.uid() = id) OR (email = (auth.jwt() ->> 'email')) OR public.is_admin_or_analyst());
CREATE POLICY "iam_users_insert_policy" ON public.iam_users FOR INSERT TO authenticated WITH CHECK ((auth.uid() = id AND role = 'consumer') OR public.is_global_admin());
CREATE POLICY "iam_users_update_policy" ON public.iam_users FOR UPDATE TO authenticated USING ((auth.uid() = id) OR public.is_global_admin()) WITH CHECK (public.is_global_admin() OR (auth.uid() = id AND role = (SELECT role FROM public.iam_users WHERE id = auth.uid())));
CREATE POLICY "iam_users_delete_policy" ON public.iam_users FOR DELETE TO authenticated USING (public.is_global_admin());

-- iam_api_tokens
DROP POLICY IF EXISTS "Acesso público leitura iam_api_tokens" ON public.iam_api_tokens;
DROP POLICY IF EXISTS "Acesso público escrita iam_api_tokens" ON public.iam_api_tokens;
DROP POLICY IF EXISTS "iam_api_tokens_select_policy" ON public.iam_api_tokens;
DROP POLICY IF EXISTS "iam_api_tokens_all_policy" ON public.iam_api_tokens;

CREATE POLICY "iam_api_tokens_select_policy" ON public.iam_api_tokens FOR SELECT TO authenticated USING ((auth.uid() = user_id) OR public.is_global_admin());
CREATE POLICY "iam_api_tokens_all_policy" ON public.iam_api_tokens FOR ALL TO authenticated USING ((auth.uid() = user_id) OR public.is_global_admin()) WITH CHECK ((auth.uid() = user_id) OR public.is_global_admin());

-- art_submissions
DROP POLICY IF EXISTS "Acesso público leitura art_submissions" ON public.art_submissions;
DROP POLICY IF EXISTS "Acesso público escrita art_submissions" ON public.art_submissions;
DROP POLICY IF EXISTS "art_submissions_select_policy" ON public.art_submissions;
DROP POLICY IF EXISTS "art_submissions_insert_policy" ON public.art_submissions;
DROP POLICY IF EXISTS "art_submissions_update_policy" ON public.art_submissions;
DROP POLICY IF EXISTS "art_submissions_delete_policy" ON public.art_submissions;

CREATE POLICY "art_submissions_select_policy" ON public.art_submissions FOR SELECT TO authenticated USING ((auth.uid()::text = submitted_by_user_id) OR (submitted_by_email = (auth.jwt() ->> 'email')) OR public.is_admin_or_analyst());
CREATE POLICY "art_submissions_insert_policy" ON public.art_submissions FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL AND auth.uid()::text = submitted_by_user_id);
CREATE POLICY "art_submissions_update_policy" ON public.art_submissions FOR UPDATE TO authenticated USING (public.is_admin_or_analyst() OR (auth.uid()::text = submitted_by_user_id AND status = 'pending')) WITH CHECK (public.is_admin_or_analyst() OR (auth.uid()::text = submitted_by_user_id AND status = 'pending'));
CREATE POLICY "art_submissions_delete_policy" ON public.art_submissions FOR DELETE TO authenticated USING (public.is_global_admin() OR (auth.uid()::text = submitted_by_user_id AND status = 'pending'));

-- iam_prompts
DROP POLICY IF EXISTS "Acesso público leitura iam_prompts" ON public.iam_prompts;
DROP POLICY IF EXISTS "Acesso público escrita iam_prompts" ON public.iam_prompts;
DROP POLICY IF EXISTS "iam_prompts_select_policy" ON public.iam_prompts;
DROP POLICY IF EXISTS "iam_prompts_admin_all_policy" ON public.iam_prompts;

CREATE POLICY "iam_prompts_select_policy" ON public.iam_prompts FOR SELECT USING (is_active = true OR public.is_admin_or_analyst());
CREATE POLICY "iam_prompts_admin_all_policy" ON public.iam_prompts FOR ALL TO authenticated USING (public.is_global_admin()) WITH CHECK (public.is_global_admin());

-- ai_usage_logs
DROP POLICY IF EXISTS "Acesso público leitura ai_usage_logs" ON public.ai_usage_logs;
DROP POLICY IF EXISTS "Acesso público escrita ai_usage_logs" ON public.ai_usage_logs;
DROP POLICY IF EXISTS "ai_usage_logs_select_policy" ON public.ai_usage_logs;
DROP POLICY IF EXISTS "ai_usage_logs_insert_policy" ON public.ai_usage_logs;
DROP POLICY IF EXISTS "ai_usage_logs_admin_modify_policy" ON public.ai_usage_logs;

CREATE POLICY "ai_usage_logs_select_policy" ON public.ai_usage_logs FOR SELECT TO authenticated USING (public.is_admin_or_analyst() OR (user_id = auth.uid()::text) OR (user_email = (auth.jwt() ->> 'email')));
CREATE POLICY "ai_usage_logs_insert_policy" ON public.ai_usage_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "ai_usage_logs_admin_modify_policy" ON public.ai_usage_logs FOR ALL TO authenticated USING (public.is_global_admin()) WITH CHECK (public.is_global_admin());

-- image_analysis
DROP POLICY IF EXISTS "Permitir leitura pública" ON public.image_analysis;
DROP POLICY IF EXISTS "Permitir inserção pública" ON public.image_analysis;
DROP POLICY IF EXISTS "Permitir atualização pública" ON public.image_analysis;
DROP POLICY IF EXISTS "Permitir exclusão pública" ON public.image_analysis;
DROP POLICY IF EXISTS "image_analysis_public_select_policy" ON public.image_analysis;
DROP POLICY IF EXISTS "image_analysis_staff_all_policy" ON public.image_analysis;

CREATE POLICY "image_analysis_public_select_policy" ON public.image_analysis FOR SELECT USING (COALESCE((analysis ->> 'is_visible_in_store')::boolean, (analysis ->> 'isVisibleInStore')::boolean, true) = true OR status = 'completed' OR public.is_admin_or_analyst());
CREATE POLICY "image_analysis_staff_all_policy" ON public.image_analysis FOR ALL TO authenticated USING (public.is_admin_or_analyst()) WITH CHECK (public.is_admin_or_analyst());


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
