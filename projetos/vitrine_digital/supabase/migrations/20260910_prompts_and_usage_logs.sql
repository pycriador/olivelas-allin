-- Migration: Prompts Management and AI Usage Logs
-- Date: 2026-09-10

-- 1. Tabela de Prompts Editáveis pelo Administrador Global
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

-- 2. Tabela de Logs de Uso e Telemetria de IA
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

-- 3. Índices para consultas rápidas de métricas
CREATE INDEX IF NOT EXISTS idx_ai_usage_group_id ON public.ai_usage_logs(group_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_created_at ON public.ai_usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_iam_prompts_type ON public.iam_prompts(type, is_active);

-- 4. Habilitar RLS e Políticas Idempotentes
ALTER TABLE public.iam_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acesso público leitura iam_prompts" ON public.iam_prompts;
CREATE POLICY "Acesso público leitura iam_prompts" ON public.iam_prompts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Acesso público escrita iam_prompts" ON public.iam_prompts;
CREATE POLICY "Acesso público escrita iam_prompts" ON public.iam_prompts FOR ALL USING (true);

DROP POLICY IF EXISTS "Acesso público leitura ai_usage_logs" ON public.ai_usage_logs;
CREATE POLICY "Acesso público leitura ai_usage_logs" ON public.ai_usage_logs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Acesso público escrita ai_usage_logs" ON public.ai_usage_logs;
CREATE POLICY "Acesso público escrita ai_usage_logs" ON public.ai_usage_logs FOR ALL USING (true);

-- 5. Prompt padrão inicial do sistema
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
