-- =============================================================================
-- OLIVELAS ALL IN - MIGRATION 03: REAL SUPABASE AUTH, GRANULAR HBAC, RAG & API
-- =============================================================================
-- 1. Autenticação Real Unificada em public.profiles + auth.users (pgcrypto bcrypt)
-- 2. RPCs seguras: authenticate_olivelas_user, register_olivelas_account, change_olivelas_password
-- 3. Espelhamento em Tempo Real de Entidades (public.allin_entity_store)
-- 4. Motor RAG Completo por Módulo e Empresa (public.allin_rag_documents, public.allin_ai_chat_messages, public.allin_ai_providers)
-- 5. Padronização de Colunas de Governança (archive_metadata, updated_at) em todas as tabelas dos 16 schemas
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. EVOLUÇÃO DE SEGURANÇA NA TABELA ÚNICA DE LOGIN (public.profiles)
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS password_hash TEXT,
  ADD COLUMN IF NOT EXISTS pin_hash TEXT,
  ADD COLUMN IF NOT EXISTS require_password_reset BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS granular_permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS job_title TEXT,
  ADD COLUMN IF NOT EXISTS department TEXT;

-- Define senha padrão criptografada (bcrypt: 'Olivelas@2026') para todos os perfis sem hash
UPDATE public.profiles
SET password_hash = crypt('Olivelas@2026', gen_salt('bf')),
    pin_hash = crypt('2026', gen_salt('bf'))
WHERE password_hash IS NULL;

-- Remove eventuais duplicidades de e-mail para permitir upsert determinístico por id
DELETE FROM public.profiles
WHERE email IN (
  'helena.vasconcelos@olivelasallin.com.br',
  'marcos.tavares@olivelasallin.com.br',
  'camila.rocha@olivelasallin.com.br',
  'lucas.andrade@olivelasallin.com.br',
  'ricardo.almeida@olivelas.com.br',
  'fernanda.lima@olivelas.com.br',
  'bruno.santos@olivelas.com.br'
)
AND id NOT IN (
  'usr-super-admin',
  'usr-admin',
  'usr-financeiro',
  'usr-suporte',
  'usr-cliente',
  'usr-gerente',
  'usr-funcionario'
);

-- Garante que todos os 7 usuários oficiais do ecossistema estejam em public.profiles com senha real
INSERT INTO public.profiles (
  id, email, full_name, phone, is_global_admin, status, language, role_ids, company_ids, individual_permissions, granular_permissions, password_hash, pin_hash, job_title, department
)
VALUES
  (
    'usr-super-admin',
    'helena.vasconcelos@olivelasallin.com.br',
    'Helena Vasconcelos',
    '+55 11 99800-1001',
    TRUE,
    'active',
    'pt-BR',
    '["role-super-admin"]'::jsonb,
    '["emp-olivelas-matriz", "emp-aurora-log", "emp-vega-retail", "emp-solaris-bio"]'::jsonb,
    '[]'::jsonb,
    '["*"]'::jsonb,
    crypt('Olivelas@2026', gen_salt('bf')),
    crypt('2026', gen_salt('bf')),
    'Chief Executive Officer (Super Admin)',
    'Diretoria Global Olivelas'
  ),
  (
    'usr-admin',
    'marcos.tavares@olivelasallin.com.br',
    'Marcos Tavares',
    '+55 11 99800-1002',
    TRUE,
    'active',
    'pt-BR',
    '["role-admin"]'::jsonb,
    '["emp-olivelas-matriz", "emp-aurora-log", "emp-vega-retail"]'::jsonb,
    '[]'::jsonb,
    '["companies.manage", "users.manage", "modules.manage", "contracts.manage", "api.manage", "rag.manage"]'::jsonb,
    crypt('Olivelas@2026', gen_salt('bf')),
    crypt('2026', gen_salt('bf')),
    'Diretor de Operações SaaS',
    'Operações Globais'
  ),
  (
    'usr-financeiro',
    'camila.rocha@olivelasallin.com.br',
    'Camila Rocha',
    '+55 11 99800-1003',
    TRUE,
    'active',
    'pt-BR',
    '["role-financeiro"]'::jsonb,
    '["emp-olivelas-matriz", "emp-aurora-log", "emp-vega-retail"]'::jsonb,
    '[]'::jsonb,
    '["finance.read", "finance.write", "finance.approve", "contracts.read", "reports.export"]'::jsonb,
    crypt('Olivelas@2026', gen_salt('bf')),
    crypt('2026', gen_salt('bf')),
    'Controller Financeiro Global',
    'Finanças & Faturamento'
  ),
  (
    'usr-suporte',
    'lucas.andrade@olivelasallin.com.br',
    'Lucas Andrade',
    '+55 11 99800-1004',
    TRUE,
    'active',
    'pt-BR',
    '["role-suporte"]'::jsonb,
    '["emp-olivelas-matriz", "emp-aurora-log", "emp-vega-retail"]'::jsonb,
    '[]'::jsonb,
    '["tickets.read", "tickets.write", "audit.read", "rag.read"]'::jsonb,
    crypt('Olivelas@2026', gen_salt('bf')),
    crypt('2026', gen_salt('bf')),
    'Engenheiro de Suporte N3',
    'Suporte & Confiabilidade'
  ),
  (
    'usr-cliente',
    'ricardo.almeida@olivelas.com.br',
    'Ricardo Almeida',
    '+55 11 99123-4501',
    FALSE,
    'active',
    'pt-BR',
    '["role-cliente"]'::jsonb,
    '["emp-olivelas-matriz", "emp-vega-retail"]'::jsonb,
    '[]'::jsonb,
    '["company.admin", "users.manage", "roles.manage", "modules.subscribe", "inventory.approve_writeoff", "rag.manage", "api.manage"]'::jsonb,
    crypt('Olivelas@2026', gen_salt('bf')),
    crypt('2026', gen_salt('bf')),
    'Diretor Geral da Empresa',
    'Administração Matriz'
  ),
  (
    'usr-gerente',
    'fernanda.lima@olivelas.com.br',
    'Fernanda Lima',
    '+55 11 99123-4502',
    FALSE,
    'active',
    'pt-BR',
    '["role-gerente"]'::jsonb,
    '["emp-olivelas-matriz"]'::jsonb,
    '[{"id":"ovr-gerente-contracts","resource":"contracts","action":"view","effect":"allow","scope":"company","companyId":"emp-olivelas-matriz","reason":"Autorização para conferência de aditivos"}]'::jsonb,
    '["inventory.read", "inventory.receive", "inventory.adjust", "sales.pos", "sales.apply_discount", "orders.manage", "rag.read"]'::jsonb,
    crypt('Olivelas@2026', gen_salt('bf')),
    crypt('2026', gen_salt('bf')),
    'Gerente Operacional',
    'Operações de Loja'
  ),
  (
    'usr-funcionario',
    'bruno.santos@olivelas.com.br',
    'Bruno Santos',
    '+55 11 99123-4503',
    FALSE,
    'active',
    'pt-BR',
    '["role-funcionario"]'::jsonb,
    '["emp-olivelas-matriz"]'::jsonb,
    '[{"id":"ovr-func-export-deny","resource":"orders","action":"export","effect":"deny","scope":"company","companyId":"emp-olivelas-matriz","reason":"Restrição LGPD para operador de balcão"}]'::jsonb,
    '["inventory.read", "sales.pos", "orders.read", "customers.read"]'::jsonb,
    crypt('Olivelas@2026', gen_salt('bf')),
    crypt('2026', gen_salt('bf')),
    'Operador Especialista PDV',
    'Atendimento & Frente de Caixa'
  )
ON CONFLICT (id) DO UPDATE
SET email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    is_global_admin = EXCLUDED.is_global_admin,
    role_ids = EXCLUDED.role_ids,
    company_ids = EXCLUDED.company_ids,
    granular_permissions = EXCLUDED.granular_permissions,
    job_title = COALESCE(public.profiles.job_title, EXCLUDED.job_title),
    department = COALESCE(public.profiles.department, EXCLUDED.department),
    password_hash = COALESCE(public.profiles.password_hash, EXCLUDED.password_hash),
    updated_at = now();

-- -----------------------------------------------------------------------------
-- 2. FUNÇÕES RPC DE AUTENTICAÇÃO REAL E GESTÃO DE CREDENCIAIS NO SUPABASE
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.authenticate_olivelas_user(
  p_email TEXT,
  p_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile public.profiles%ROWTYPE;
  v_clean_email TEXT := lower(trim(COALESCE(p_email, '')));
BEGIN
  IF v_clean_email = '' OR COALESCE(p_password, '') = '' THEN
    RETURN jsonb_build_object(
      'ok', FALSE,
      'code', 'MISSING_CREDENTIALS',
      'message', 'Informe o e-mail corporativo e a senha para autenticar.'
    );
  END IF;

  SELECT * INTO v_profile
  FROM public.profiles
  WHERE lower(email) = v_clean_email
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'ok', FALSE,
      'code', 'INVALID_CREDENTIALS',
      'message', 'E-mail ou senha inválidos na base unificada public.profiles.'
    );
  END IF;

  IF v_profile.status IN ('blocked', 'archived') THEN
    RETURN jsonb_build_object(
      'ok', FALSE,
      'code', 'ACCOUNT_BLOCKED',
      'message', 'Esta conta encontra-se bloqueada ou arquivada pela governança HBAC.'
    );
  END IF;

  IF v_profile.locked_until IS NOT NULL AND v_profile.locked_until > now() THEN
    RETURN jsonb_build_object(
      'ok', FALSE,
      'code', 'ACCOUNT_LOCKED',
      'message', 'Conta temporariamente bloqueada por tentativas inválidas. Tente novamente em alguns minutos.'
    );
  END IF;

  -- Verifica o hash bcrypt da senha
  IF v_profile.password_hash IS NULL OR v_profile.password_hash <> crypt(p_password, v_profile.password_hash) THEN
    UPDATE public.profiles
    SET failed_login_attempts = failed_login_attempts + 1,
        locked_until = CASE WHEN failed_login_attempts + 1 >= 5 THEN now() + interval '15 minutes' ELSE NULL END,
        updated_at = now()
    WHERE id = v_profile.id;

    RETURN jsonb_build_object(
      'ok', FALSE,
      'code', 'INVALID_CREDENTIALS',
      'message', 'Credenciais inválidas. Verifique seu e-mail e senha (padrão inicial: Olivelas@2026).'
    );
  END IF;

  -- Sucesso: zera tentativas e atualiza last_login_at
  UPDATE public.profiles
  SET failed_login_attempts = 0,
      locked_until = NULL,
      last_login_at = now(),
      updated_at = now()
  WHERE id = v_profile.id;

  -- Registra evento de auditoria real no Supabase
  INSERT INTO public.allin_audit_events (
    id, company_id, actor_user_id, actor_name, actor_email, action, module, target_type, target_id, target_label, reason, severity
  ) VALUES (
    'aud_login_' || extract(epoch from now())::bigint::text || '_' || substr(md5(random()::text), 1, 4),
    NULL,
    v_profile.id,
    v_profile.full_name,
    v_profile.email,
    'login',
    'allin_core',
    'UserSession',
    v_profile.id,
    v_profile.email,
    'Autenticação real via Supabase (public.profiles)',
    'info'
  );

  RETURN jsonb_build_object(
    'ok', TRUE,
    'user', jsonb_build_object(
      'id', v_profile.id,
      'email', v_profile.email,
      'full_name', v_profile.full_name,
      'phone', v_profile.phone,
      'is_global_admin', v_profile.is_global_admin,
      'status', v_profile.status,
      'language', v_profile.language,
      'role_ids', v_profile.role_ids,
      'company_ids', v_profile.company_ids,
      'individual_permissions', v_profile.individual_permissions,
      'granular_permissions', v_profile.granular_permissions,
      'job_title', v_profile.job_title,
      'department', v_profile.department,
      'last_login_at', now()
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.change_olivelas_password(
  p_user_id TEXT,
  p_new_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF length(COALESCE(p_new_password, '')) < 6 THEN
    RETURN jsonb_build_object(
      'ok', FALSE,
      'message', 'A nova senha deve possuir no mínimo 6 caracteres.'
    );
  END IF;

  UPDATE public.profiles
  SET password_hash = crypt(p_new_password, gen_salt('bf')),
      require_password_reset = FALSE,
      failed_login_attempts = 0,
      locked_until = NULL,
      updated_at = now()
  WHERE id = p_user_id OR lower(email) = lower(p_user_id);

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'ok', FALSE,
      'message', 'Usuário não localizado em public.profiles.'
    );
  END IF;

  RETURN jsonb_build_object(
    'ok', TRUE,
    'message', 'Senha atualizada com criptografia bcrypt em public.profiles.'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.register_olivelas_account(
  p_email TEXT,
  p_password TEXT,
  p_full_name TEXT,
  p_phone TEXT,
  p_company_trade_name TEXT,
  p_company_legal_name TEXT,
  p_cnpj TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clean_email TEXT := lower(trim(COALESCE(p_email, '')));
  v_company_id TEXT := 'emp-' || substr(md5(random()::text || clock_timestamp()::text), 1, 8);
  v_user_id TEXT := 'usr-' || substr(md5(random()::text || clock_timestamp()::text), 1, 8);
  v_cnpj TEXT := COALESCE(NULLIF(trim(p_cnpj), ''), '00.' || (100 + floor(random()*899))::int || '.' || (100 + floor(random()*899))::int || '/0001-99');
BEGIN
  IF v_clean_email = '' OR length(COALESCE(p_password, '')) < 6 THEN
    RETURN jsonb_build_object(
      'ok', FALSE,
      'message', 'Informe um e-mail válido e uma senha com no mínimo 6 caracteres.'
    );
  END IF;

  IF EXISTS (SELECT 1 FROM public.profiles WHERE lower(email) = v_clean_email) THEN
    RETURN jsonb_build_object(
      'ok', FALSE,
      'message', 'Já existe um usuário cadastrado com este e-mail em public.profiles.'
    );
  END IF;

  INSERT INTO public.allin_companies (
    id, trade_name, legal_name, cnpj, status, theme_id, primary_color
  ) VALUES (
    v_company_id,
    COALESCE(NULLIF(trim(p_company_trade_name), ''), 'Nova Empresa Olivelas'),
    COALESCE(NULLIF(trim(p_company_legal_name), ''), COALESCE(NULLIF(trim(p_company_trade_name), ''), 'Nova Empresa Olivelas Ltda.')),
    v_cnpj,
    'active',
    'light-notarial-slate',
    '#0D9488'
  );

  INSERT INTO public.profiles (
    id, email, full_name, phone, is_global_admin, status, language, role_ids, company_ids, granular_permissions, password_hash, job_title, department
  ) VALUES (
    v_user_id,
    v_clean_email,
    COALESCE(NULLIF(trim(p_full_name), ''), split_part(v_clean_email, '@', 1)),
    COALESCE(NULLIF(trim(p_phone), ''), '+55 11 99999-0000'),
    FALSE,
    'active',
    'pt-BR',
    '["role-cliente"]'::jsonb,
    jsonb_build_array(v_company_id),
    '["company.admin", "users.manage", "roles.manage", "modules.subscribe", "inventory.approve_writeoff", "rag.manage", "api.manage"]'::jsonb,
    crypt(p_password, gen_salt('bf')),
    'Administrador Titular',
    'Diretoria'
  );

  INSERT INTO public.company_users (company_id, user_id, role, is_active)
  VALUES (v_company_id, v_user_id, 'COMPANY_ADMIN', TRUE)
  ON CONFLICT DO NOTHING;

  RETURN jsonb_build_object(
    'ok', TRUE,
    'company_id', v_company_id,
    'user_id', v_user_id,
    'email', v_clean_email
  );
END;
$$;

-- -----------------------------------------------------------------------------
-- 3. TABELA DE PERSISTÊNCIA EM TEMPO REAL DE ENTIDADES (public.allin_entity_store)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.allin_entity_store (
  store_name TEXT NOT NULL,
  id TEXT NOT NULL,
  company_id TEXT,
  payload JSONB NOT NULL,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (store_name, id)
);

CREATE INDEX IF NOT EXISTS idx_allin_entity_store_name ON public.allin_entity_store(store_name);
CREATE INDEX IF NOT EXISTS idx_allin_entity_store_company ON public.allin_entity_store(company_id);

-- -----------------------------------------------------------------------------
-- 4. MOTOR RAG COMPLETO E ORQUESTRADOR DE IA POR MÓDULO (public.allin_rag_documents)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.allin_rag_documents (
  id TEXT PRIMARY KEY DEFAULT 'rag_' || substr(md5(random()::text || clock_timestamp()::text), 1, 10),
  company_id TEXT NOT NULL DEFAULT 'emp-olivelas-matriz',
  module_slug TEXT NOT NULL,
  db_schema TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Procedimento Operacional (SOP)',
  content TEXT NOT NULL,
  keywords TEXT NOT NULL DEFAULT '',
  source_table TEXT,
  chunk_tokens INTEGER NOT NULL DEFAULT 180,
  similarity_boost NUMERIC(5,2) NOT NULL DEFAULT 1.00,
  archive_metadata JSONB NOT NULL DEFAULT '{"isArchived": false}'::jsonb,
  created_by TEXT DEFAULT 'helena.vasconcelos@olivelasallin.com.br',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_allin_rag_module ON public.allin_rag_documents(module_slug, db_schema);
CREATE INDEX IF NOT EXISTS idx_allin_rag_company ON public.allin_rag_documents(company_id);

CREATE TABLE IF NOT EXISTS public.allin_ai_chat_messages (
  id TEXT PRIMARY KEY DEFAULT 'msg_' || substr(md5(random()::text || clock_timestamp()::text), 1, 10),
  company_id TEXT NOT NULL DEFAULT 'emp-olivelas-matriz',
  module_slug TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  persona TEXT NOT NULL DEFAULT 'COPILOTO_EXECUTIVO',
  content TEXT NOT NULL,
  citations JSONB NOT NULL DEFAULT '[]'::jsonb,
  model_used TEXT NOT NULL DEFAULT 'gemini-2.5-flash (RAG Grounded)',
  actor_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.allin_ai_providers (
  provider_code TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  default_model TEXT NOT NULL,
  fast_model TEXT NOT NULL,
  reasoning_model TEXT NOT NULL,
  base_url TEXT NOT NULL,
  masked_api_key TEXT NOT NULL DEFAULT '••••••••••••',
  temperature NUMERIC(3,2) NOT NULL DEFAULT 0.30,
  max_tokens INTEGER NOT NULL DEFAULT 2048,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.allin_ai_providers (
  provider_code, display_name, is_enabled, is_primary, default_model, fast_model, reasoning_model, base_url, masked_api_key
) VALUES
  ('GEMINI', 'Google Gemini 2.5 (Motor RAG Principal)', TRUE, TRUE, 'gemini-2.5-flash', 'gemini-2.5-flash', 'gemini-2.5-pro', 'https://generativelanguage.googleapis.com/v1beta', 'AIzaSy••••••Olivelas'),
  ('OPENAI', 'OpenAI GPT-4o / o3-mini (Fallback #1)', TRUE, FALSE, 'gpt-4o-mini', 'gpt-4o-mini', 'gpt-4o', 'https://api.openai.com/v1', 'sk-proj-••••••Olivelas'),
  ('CLAUDE', 'Anthropic Claude 3.7 Sonnet (Fallback #2)', TRUE, FALSE, 'claude-3-7-sonnet-latest', 'claude-3-5-haiku-latest', 'claude-3-7-sonnet-latest', 'https://api.anthropic.com/v1', 'sk-ant-••••••Olivelas'),
  ('CUSTOM', 'OpenRouter / Ollama Corporativo Local', FALSE, FALSE, 'deepseek-chat', 'llama-3.3-70b-versatile', 'qwen-2.5-72b-instruct', 'https://openrouter.ai/api/v1', 'sk-or-••••••Olivelas')
ON CONFLICT (provider_code) DO NOTHING;

-- Seed de Documentos RAG Reais para todos os 16 Módulos Comerciais Olivelas
INSERT INTO public.allin_rag_documents (id, company_id, module_slug, db_schema, title, category, content, keywords, source_table)
VALUES
  ('rag_gestao_estoque_1', 'emp-olivelas-matriz', 'allin_gestao_estoque', 'gestao_estoque', 'Política FEFO de Alocação de Lotes e Aprovador de Baixa', 'Regra de Negócio & Governança', 'No módulo Olivelas - Gestão de Estoque & PDV, toda saída no PDV ou remessa para filial consome obrigatoriamente o lote com data de vencimento mais próxima (First-Expired, First-Out). Baixas por avaria, perda ou vencimento exigem autorização de um usuário com permissão granular inventory.approve_writeoff (STOCK_APPROVER) respeitando o limite de alçada financeira.', 'fefo lotes validade baixa estoque aprovador pdv', 'inventory_batches'),
  ('rag_gestao_estoque_2', 'emp-olivelas-matriz', 'allin_gestao_estoque', 'gestao_estoque', 'Transferência Matriz -> Filial Sem Registro de Venda', 'Manual Operacional', 'Transferências internas entre a Matriz e suas Filiais movimentam o saldo físico em gestao_estoque.products e gestao_estoque.inventory_batches sem gerar receita fictícia no PDV, mantendo o custo médio ponderado.', 'matriz filial transferencia remessa estoque custo', 'products'),
  ('rag_personal_1', 'emp-olivelas-matriz', 'allin_personal_treiner', 'personal_treiner', 'Protocolo de Periodização de Treinos e Bioimpedância', 'Diretriz Técnica Fitness', 'A prescrição no Olivelas - Personal Trainer utiliza divisão A/B/C/D com controle de percepção subjetiva de esforço (RPE 7 a 10), acompanhamento de massa magra, percentual de gordura corporal e streak de frequência em personal_treiner.students.', 'treino hipertrofia rpe bioimpedancia aluno frequencia', 'students'),
  ('rag_odonto_1', 'emp-olivelas-matriz', 'allin_agendamento_simples', 'agendamento_simples', 'Protocolo de Odontograma Digital e Confirmação WhatsApp', 'Manual Clínico', 'Todo agendamento em agendamento_simples.appointments vincula o elemento dentário ou procedimento clínico ao paciente e dispara confirmação automatizada 24h antes via WhatsApp.', 'odontograma dente consulta paciente whatsapp convenio', 'appointments'),
  ('rag_clinica_1', 'emp-olivelas-matriz', 'allin_agendamentos', 'agendamentos', 'Gestão de Salas Clínicas, Bloqueios e Fila de Espera', 'Regra de Agendamento', 'O motor de agenda multiprofissional evita conflito de horário por sala e profissional em agendamentos.appointments, promovendo automaticamente pacientes da lista de espera em caso de desistência.', 'clinica sala fila espera bloqueio agenda medico', 'appointments'),
  ('rag_condominio_1', 'emp-olivelas-matriz', 'allin_app_condominio', 'app_condominio', 'Convenção Condominial: Reservas, Portaria QR e Rateio', 'Regimento Interno', 'Reservas de salão de festas e churrasqueira em app_condominio.reservations têm taxa lançada no boleto da unidade (app_condominio.units) e liberam lista de convidados com QR Code na portaria.', 'condominio sindico unidade portaria reserva assembleia', 'units'),
  ('rag_arthub_1', 'emp-olivelas-matriz', 'allin_art_hub', 'art_hub', 'Curadoria Visual com Visão Computacional e Tags SEO', 'Guia de IA Generativa', 'O Olivelas - Art Hub analisa imagens de produtos e obras em art_hub.artworks, extraindo paleta cromática, estilo visual e metadados de indexação para marketplaces.', 'arte catalogo ia visao tags seo curadoria', 'artworks'),
  ('rag_casa_1', 'emp-olivelas-matriz', 'allin_casa_organizada', 'casa_organizada', 'Rotinas Domésticas por Cômodo e Lista de Compras Inteligente', 'Guia Operacional', 'As tarefas recorrentes em casa_organizada.tasks são agrupadas por ambiente (Cozinha, Lavanderia, Suíte) e geram reposição automática na despensa quando insumos atingem nível crítico.', 'casa rotina comodo limpeza despensa tarefas', 'tasks'),
  ('rag_contratos_1', 'emp-olivelas-matriz', 'allin_contratos', 'contratos', 'Matriz de Risco Jurídico, Aditivos e Assinatura Digital', 'Compliance Jurídico', 'Minutas em contratos.contracts passam por validação de cláusulas obrigatórias (LGPD, multa rescisória, foro e SLA) com hash SHA-256 de assinatura eletrônica.', 'contrato minuta clausula risco assinatura lgpd', 'contracts'),
  ('rag_espec_1', 'emp-olivelas-matriz', 'allin_especificacoes', 'especificacoes', 'Engenharia Spec-Driven Development (SDD) & ADRs', 'Arquitetura de Software', 'Todo requisito em especificacoes.projects exige Architecture Decision Record (ADR), modelo de domínio relacional e critérios de aceite testáveis antes da sprint.', 'sdd especificacao adr arquitetura sprint requisito', 'projects'),
  ('rag_os_1', 'emp-olivelas-matriz', 'allin_ordem_de_servico', 'ordem_de_servico', 'Garantia Legal de 90 Dias e Checklist de Bancada Técnica', 'Norma de Assistência Técnica', 'Ordens de serviço em ordem_de_servico.service_orders registram número de série, avarias pré-existentes, peças aplicadas e calculam automaticamente o prazo de garantia de 90 dias.', 'os assistencia bancada pecas garantia laudo', 'service_orders'),
  ('rag_restaurante_1', 'emp-olivelas-matriz', 'allin_restaurante', 'restaurante', 'SLA de Preparo KDS por Praça e Fechamento de Mesa', 'Padrão Gastronômico', 'Pedidos lançados em restaurante.orders são roteados instantaneamente para o monitor KDS da praça correspondente (Chapa, Cozinha Quente, Bar, Confeitaria) com alerta amarelo após 12 minutos.', 'restaurante mesa comanda kds cozinha garcom', 'orders'),
  ('rag_rifas_1', 'emp-olivelas-matriz', 'allin_rifas', 'rifas', 'Auditoria de Sorteio Loteria Federal e Liquidação PIX', 'Regulamento de Campanhas', 'Cotas reservadas em rifas.campaigns têm expiração automática configurável caso o PIX não seja liquidado e apuração auditável pelo resultado da Loteria Federal.', 'rifa cota bilhete pix sorteio premiacao', 'campaigns'),
  ('rag_delivery_1', 'emp-olivelas-matriz', 'allin_sistema_delivery', 'sistema_delivery', 'Despacho Georreferenciado de Entregadores e Taxa por Raio', 'Logística Last-Mile', 'Pedidos em sistema_delivery.deliveries calculam taxa de entrega por raio em KM e alocam o entregador ativo mais próximo com código de confirmação na entrega.', 'delivery entregador motoboy rota frete despacho', 'deliveries'),
  ('rag_mercado_1', 'emp-olivelas-matriz', 'allin_sistema_mercado', 'sistema_mercado', 'Montagem de Cestas, Kits Sazonais e Precificação Atacado', 'Operação Supermercadista', 'Produtos e cestas em sistema_mercado.products suportam composição de kits com baixa automática dos itens componentes e margem diferenciada para atacado e varejo.', 'mercado supermercado cesta kit gondola atacado', 'products'),
  ('rag_suiterifa_1', 'emp-olivelas-matriz', 'allin_suite_rifa', 'suite_rifa', 'Split de Pagamentos Multi-Organização e Comissionamento de Afiliados', 'Governança Multi-Tenant', 'A Suíte Multi-Organização (suite_rifa.organizations) isola campanhas por tenant, automatiza o split percentual de afiliados e consolida o repasse líquido.', 'suite rifa afiliado organizacao split comissao', 'organizations'),
  ('rag_vitrine_1', 'emp-olivelas-matriz', 'allin_vitrine_digital', 'vitrine_digital', 'Enriquecimento de Catálogo com IA, Cubagem e Copywriting SEO', 'E-Commerce & IA', 'Produtos analisados em vitrine_digital.catalog_items recebem título otimizado para busca, estimativa de dimensões logísticas (CxLxA) e score de qualidade visual.', 'vitrine digital seo copywriting cubagem ia catalogo', 'catalog_items')
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 5. PADRONIZAÇÃO DE COLUNAS (archive_metadata, updated_at) EM TODOS OS 16 SCHEMAS
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  r RECORD;
  v_schemas TEXT[] := ARRAY[
    'agendamento_simples', 'agendamentos', 'app_condominio', 'art_hub',
    'casa_organizada', 'contratos', 'especificacoes', 'gestao_estoque',
    'ordem_de_servico', 'personal_treiner', 'restaurante', 'rifas',
    'sistema_delivery', 'sistema_mercado', 'suite_rifa', 'vitrine_digital'
  ];
BEGIN
  FOR r IN
    SELECT table_schema, table_name
    FROM information_schema.tables
    WHERE table_schema = ANY(v_schemas)
      AND table_type = 'BASE TABLE'
  LOOP
    EXECUTE format(
      'ALTER TABLE %I.%I ADD COLUMN IF NOT EXISTS archive_metadata JSONB DEFAULT ''{"isArchived": false}''::jsonb;',
      r.table_schema, r.table_name
    );
    EXECUTE format(
      'ALTER TABLE %I.%I ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();',
      r.table_schema, r.table_name
    );
    EXECUTE format(
      'ALTER TABLE %I.%I ADD COLUMN IF NOT EXISTS company_id TEXT DEFAULT ''emp-olivelas-matriz'';',
      r.table_schema, r.table_name
    );
  END LOOP;
END $$;

-- Permissões para as novas tabelas e funções no schema public
GRANT ALL ON TABLE public.allin_entity_store TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.allin_rag_documents TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.allin_ai_chat_messages TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.allin_ai_providers TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.authenticate_olivelas_user(TEXT, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.change_olivelas_password(TEXT, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.register_olivelas_account(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;

ALTER TABLE public.allin_entity_store ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "olivelas_allin_public_access" ON public.allin_entity_store;
CREATE POLICY "olivelas_allin_public_access" ON public.allin_entity_store FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);

ALTER TABLE public.allin_rag_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "olivelas_allin_public_access" ON public.allin_rag_documents;
CREATE POLICY "olivelas_allin_public_access" ON public.allin_rag_documents FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);

ALTER TABLE public.allin_ai_chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "olivelas_allin_public_access" ON public.allin_ai_chat_messages;
CREATE POLICY "olivelas_allin_public_access" ON public.allin_ai_chat_messages FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);

ALTER TABLE public.allin_ai_providers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "olivelas_allin_public_access" ON public.allin_ai_providers;
CREATE POLICY "olivelas_allin_public_access" ON public.allin_ai_providers FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);
