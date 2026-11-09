-- Sprint 2 · ClauseForge AI Foundation
-- Providers, modelos, prompts, agentes, execuções, tools, conversas, uploads, análises e banco de conhecimento.

-- ============================================================
-- Enums
-- ============================================================

create type public.ai_provider_kind as enum ('openai','gemini','claude','openrouter','azure_openai','local');
create type public.ai_provider_status as enum ('active','disabled','error');
create type public.ai_prompt_status as enum ('draft','published','archived');
create type public.ai_agent_status as enum ('enabled','disabled');
create type public.ai_execution_status as enum ('pending','running','succeeded','failed','cancelled');
create type public.ai_tool_engine as enum ('native','llm');
create type public.upload_file_kind as enum ('pdf','docx','markdown','txt','rtf','odt');
create type public.upload_status as enum ('uploaded','processing','analyzed','failed');
create type public.document_risk_level as enum ('low','medium','high');
create type public.knowledge_source_kind as enum ('manual','law','regulation','policy','internal');

-- ============================================================
-- ai_providers
-- ============================================================

create table public.ai_providers (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  name text not null,
  kind public.ai_provider_kind not null,
  status public.ai_provider_status not null default 'active',
  base_url text,
  default_model text,
  api_key_encrypted text,
  api_key_fingerprint text,
  timeout_ms integer not null default 30000,
  default_temperature numeric not null default 0.7,
  max_tokens integer not null default 4096,
  is_default boolean not null default false,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.ai_providers to authenticated;
grant all on public.ai_providers to service_role;

-- ============================================================
-- ai_models (catálogo técnico)
-- ============================================================

create table public.ai_models (
  id uuid primary key default gen_random_uuid(),
  provider_kind public.ai_provider_kind not null,
  model_key text not null,
  display_name text not null,
  context_tokens integer,
  input_price_1m numeric default 0,
  output_price_1m numeric default 0,
  supports_streaming boolean not null default true,
  supports_embeddings boolean not null default false,
  supports_moderation boolean not null default false,
  is_beta boolean not null default false,
  unique (provider_kind, model_key)
);
grant select on public.ai_models to authenticated;
grant all on public.ai_models to service_role;

-- ============================================================
-- ai_prompts + versions
-- ============================================================

create table public.ai_prompts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  category text,
  system_prompt text,
  prompt text not null,
  temperature numeric not null default 0.7,
  suggested_model text,
  tags text[] not null default '{}',
  status public.ai_prompt_status not null default 'draft',
  author_id uuid,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, slug)
);
grant select, insert, update, delete on public.ai_prompts to authenticated;
grant all on public.ai_prompts to service_role;

create table public.ai_prompt_versions (
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid not null references public.ai_prompts(id) on delete cascade,
  version integer not null,
  content jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  unique (prompt_id, version)
);
grant select, insert on public.ai_prompt_versions to authenticated;
grant all on public.ai_prompt_versions to service_role;

-- ============================================================
-- ai_agents
-- ============================================================

create table public.ai_agents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  name text not null,
  key text not null,
  objective text,
  system_prompt text not null default '',
  tools jsonb not null default '[]'::jsonb,
  model text,
  temperature numeric not null default 0.7,
  status public.ai_agent_status not null default 'enabled',
  is_system boolean not null default false,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.ai_agents to authenticated;
grant all on public.ai_agents to service_role;

-- ============================================================
-- ai_conversations + ai_messages
-- ============================================================

create table public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  title text not null default 'Nova conversa',
  pinned boolean not null default false,
  is_favorite boolean not null default false,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.ai_conversations to authenticated;
grant all on public.ai_conversations to service_role;

create table public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  provider_id uuid references public.ai_providers(id) on delete set null,
  model text,
  input_tokens integer,
  output_tokens integer,
  cost_estimate numeric default 0,
  created_at timestamptz not null default now()
);
grant select, insert on public.ai_messages to authenticated;
grant all on public.ai_messages to service_role;


-- ============================================================
-- document_uploads + chunks + analyses
-- ============================================================

create table public.document_uploads (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  library_id uuid references public.libraries(id) on delete set null,
  storage_path text,
  original_name text not null,
  mime_type text,
  file_kind public.upload_file_kind not null,
  size_bytes integer,
  status public.upload_status not null default 'uploaded',
  extracted_text text,
  error text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.document_uploads to authenticated;
grant all on public.document_uploads to service_role;

create table public.document_upload_chunks (
  id uuid primary key default gen_random_uuid(),
  upload_id uuid not null references public.document_uploads(id) on delete cascade,
  seq integer not null,
  content text not null,
  token_count integer,
  created_at timestamptz not null default now(),
  unique (upload_id, seq)
);
grant select, insert on public.document_upload_chunks to authenticated;
grant all on public.document_upload_chunks to service_role;

create table public.document_analyses (
  id uuid primary key default gen_random_uuid(),
  upload_id uuid not null references public.document_uploads(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  report jsonb not null default '{}'::jsonb,
  risk_level public.document_risk_level not null default 'medium',
  summary text,
  model text,
  created_by uuid,
  created_at timestamptz not null default now()
);
grant select, insert on public.document_analyses to authenticated;
grant all on public.document_analyses to service_role;


-- ============================================================
-- ai_executions
-- ============================================================

create table public.ai_executions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  provider_id uuid references public.ai_providers(id) on delete set null,
  agent_id uuid references public.ai_agents(id) on delete set null,
  prompt_id uuid references public.ai_prompts(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  document_id uuid references public.document_uploads(id) on delete set null,
  conversation_id uuid references public.ai_conversations(id) on delete set null,
  model text,
  input jsonb not null default '{}'::jsonb,
  output jsonb,
  status public.ai_execution_status not null default 'pending',
  prompt_tokens integer,
  completion_tokens integer,
  total_tokens integer,
  cost_estimate numeric default 0,
  latency_ms integer,
  error text,
  created_by uuid,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz
);
grant select, insert, update on public.ai_executions to authenticated;
grant all on public.ai_executions to service_role;

-- ============================================================
-- ai_tools (catálogo)
-- ============================================================

create table public.ai_tools (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text,
  engine public.ai_tool_engine not null default 'llm',
  is_system boolean not null default true
);
grant select on public.ai_tools to authenticated;
grant all on public.ai_tools to service_role;



-- ============================================================
-- knowledge_sources (preparação RAG)
-- ============================================================

create table public.knowledge_sources (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null,
  kind public.knowledge_source_kind not null default 'internal',
  content text,
  status text not null default 'ready',
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.knowledge_sources to authenticated;
grant all on public.knowledge_sources to service_role;

-- ============================================================
-- Triggers
-- ============================================================

create trigger ai_providers_updated before update on public.ai_providers for each row execute function public.set_updated_at();
create trigger ai_prompts_updated before update on public.ai_prompts for each row execute function public.set_updated_at();
create trigger ai_agents_updated before update on public.ai_agents for each row execute function public.set_updated_at();
create trigger ai_conversations_updated before update on public.ai_conversations for each row execute function public.set_updated_at();
create trigger document_uploads_updated before update on public.document_uploads for each row execute function public.set_updated_at();
create trigger knowledge_sources_updated before update on public.knowledge_sources for each row execute function public.set_updated_at();

-- ============================================================
-- RLS
-- ============================================================

alter table public.ai_providers enable row level security;
alter table public.ai_models enable row level security;
alter table public.ai_prompts enable row level security;
alter table public.ai_prompt_versions enable row level security;
alter table public.ai_agents enable row level security;
alter table public.ai_executions enable row level security;
alter table public.ai_tools enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;
alter table public.document_uploads enable row level security;
alter table public.document_upload_chunks enable row level security;
alter table public.document_analyses enable row level security;
alter table public.knowledge_sources enable row level security;

-- Providers: membros leem, admins administram (chaves protegidas por policy admin)
create policy "members read providers" on public.ai_providers for select to authenticated using (workspace_id is null or public.is_workspace_member(auth.uid(), workspace_id));
create policy "admins manage providers" on public.ai_providers for all to authenticated using (workspace_id is not null and public.is_workspace_admin(auth.uid(), workspace_id)) with check (workspace_id is not null and public.is_workspace_admin(auth.uid(), workspace_id));

-- Catálogos: leitura liberada
create policy "read models" on public.ai_models for select to authenticated using (true);
create policy "read tools" on public.ai_tools for select to authenticated using (true);

-- Prompts
create policy "members read prompts" on public.ai_prompts for select to authenticated using (workspace_id is null or public.is_workspace_member(auth.uid(), workspace_id));
create policy "admins manage prompts" on public.ai_prompts for all to authenticated using (workspace_id is not null and public.is_workspace_admin(auth.uid(), workspace_id)) with check (workspace_id is not null and public.is_workspace_admin(auth.uid(), workspace_id));
create policy "read prompt versions" on public.ai_prompt_versions for select to authenticated using (exists (select 1 from public.ai_prompts p where p.id = prompt_id and (p.workspace_id is null or public.is_workspace_member(auth.uid(), p.workspace_id))));
create policy "insert prompt versions" on public.ai_prompt_versions for insert to authenticated with check (exists (select 1 from public.ai_prompts p where p.id = prompt_id and public.is_workspace_member(auth.uid(), p.workspace_id)));

-- Agentes
create policy "members read agents" on public.ai_agents for select to authenticated using (workspace_id is null or public.is_workspace_member(auth.uid(), workspace_id));
create policy "admins manage agents" on public.ai_agents for all to authenticated using (workspace_id is not null and public.is_workspace_admin(auth.uid(), workspace_id)) with check (workspace_id is not null and public.is_workspace_admin(auth.uid(), workspace_id));

-- Execuções de IA
create policy "members read ai executions" on public.ai_executions for select to authenticated using (workspace_id is null or public.is_workspace_member(auth.uid(), workspace_id));
create policy "members create ai executions" on public.ai_executions for insert to authenticated with check (public.is_workspace_member(auth.uid(), workspace_id));
create policy "members update ai executions" on public.ai_executions for update to authenticated using (public.is_workspace_member(auth.uid(), workspace_id));

-- Conversas e mensagens
create policy "members read conversations" on public.ai_conversations for select to authenticated using (workspace_id is null or public.is_workspace_member(auth.uid(), workspace_id));
create policy "owners manage conversations" on public.ai_conversations for all to authenticated using (created_by = auth.uid() or public.is_workspace_admin(auth.uid(), workspace_id)) with check (created_by = auth.uid() or public.is_workspace_admin(auth.uid(), workspace_id));
create policy "read messages" on public.ai_messages for select to authenticated using (exists (select 1 from public.ai_conversations c where c.id = conversation_id and (c.workspace_id is null or public.is_workspace_member(auth.uid(), c.workspace_id))));
create policy "insert messages" on public.ai_messages for insert to authenticated with check (exists (select 1 from public.ai_conversations c where c.id = conversation_id and (c.created_by = auth.uid() or public.is_workspace_admin(auth.uid(), c.workspace_id))));

-- Uploads e análises
create policy "members read uploads" on public.document_uploads for select to authenticated using (public.is_workspace_member(auth.uid(), workspace_id));
create policy "members manage uploads" on public.document_uploads for all to authenticated using (public.is_workspace_member(auth.uid(), workspace_id)) with check (public.is_workspace_member(auth.uid(), workspace_id));
create policy "read chunks" on public.document_upload_chunks for select to authenticated using (exists (select 1 from public.document_uploads u where u.id = upload_id and public.is_workspace_member(auth.uid(), u.workspace_id)));
create policy "insert chunks" on public.document_upload_chunks for insert to authenticated with check (exists (select 1 from public.document_uploads u where u.id = upload_id and public.is_workspace_member(auth.uid(), u.workspace_id)));
create policy "read analyses" on public.document_analyses for select to authenticated using (exists (select 1 from public.document_uploads u where u.id = upload_id and public.is_workspace_member(auth.uid(), u.workspace_id)));
create policy "insert analyses" on public.document_analyses for insert to authenticated with check (exists (select 1 from public.document_uploads u where u.id = upload_id and public.is_workspace_member(auth.uid(), u.workspace_id)));

-- Knowledge sources
create policy "members read knowledge" on public.knowledge_sources for select to authenticated using (public.is_workspace_member(auth.uid(), workspace_id));
create policy "admins manage knowledge" on public.knowledge_sources for all to authenticated using (public.is_workspace_admin(auth.uid(), workspace_id)) with check (public.is_workspace_admin(auth.uid(), workspace_id));

-- ============================================================
-- Permissões do módulo AI
-- ============================================================

insert into public.permissions (key, module, description) values
 ('ai.read','AI','Ver Inteligência IA'),
 ('ai.manage','AI','Configurar providers e settings'),
 ('ai.run','AI','Executar playground, agentes e análises'),
 ('ai.prompts.manage','AI','Administrar biblioteca de prompts'),
 ('ai.agents.manage','AI','Administrar agentes');

insert into public.role_permissions (role, permission_key) select 'super_admin', key from public.permissions where module = 'AI';
insert into public.role_permissions (role, permission_key) select 'workspace_admin', key from public.permissions where module = 'AI';
insert into public.role_permissions (role, permission_key) select 'manager', key from public.permissions where module = 'AI' and key in ('ai.read','ai.run');
insert into public.role_permissions (role, permission_key) select 'editor', key from public.permissions where module = 'AI' and key in ('ai.read','ai.run');
insert into public.role_permissions (role, permission_key) select 'reviewer', key from public.permissions where module = 'AI' and key in ('ai.read');
insert into public.role_permissions (role, permission_key) select 'viewer', key from public.permissions where module = 'AI' and key in ('ai.read');

-- ============================================================
-- Seed · ai_models
-- ============================================================

insert into public.ai_models (provider_kind, model_key, display_name, context_tokens, input_price_1m, output_price_1m, supports_streaming, supports_embeddings, supports_moderation, is_beta) values
 ('openai','gpt-5.5','GPT-5.5',400000,10.00,30.00,true,false,false,false),
 ('openai','gpt-5.5-mini','GPT-5.5 Mini',400000,1.25,5.00,true,false,false,false),
 ('openai','gpt-4o','GPT-4o',128000,2.50,10.00,true,true,true,false),
 ('openai','gpt-4o-mini','GPT-4o Mini',128000,0.15,0.60,true,true,true,false),
 ('openai','gpt-4-turbo','GPT-4 Turbo',128000,10.00,30.00,true,false,true,false),
 ('openai','text-embedding-3-large','Embedding 3 Large',8191,0.13,0.00,false,true,false,false),
 ('gemini','gemini-2.5-pro','Gemini 2.5 Pro',1000000,1.25,10.00,true,true,false,false),
 ('gemini','gemini-2.5-flash','Gemini 2.5 Flash',1000000,0.30,2.50,true,true,false,false),
 ('gemini','gemini-2.0-flash','Gemini 2.0 Flash',1000000,0.10,0.40,true,true,false,false),
 ('gemini','text-embedding-004','Embedding 004',2048,0.00,0.00,false,true,false,false),
 ('claude','claude-opus-4-1','Claude Opus 4.1',200000,15.00,75.00,true,false,false,false),
 ('claude','claude-sonnet-4-5','Claude Sonnet 4.5',200000,3.00,15.00,true,false,false,false),
 ('claude','claude-haiku-4-5','Claude Haiku 4.5',200000,1.00,5.00,true,false,false,false),
 ('claude','claude-3-5-sonnet','Claude 3.5 Sonnet',200000,3.00,15.00,true,false,false,false),
 ('openrouter','openrouter/auto','OpenRouter Auto',200000,0.00,0.00,true,false,false,false),
 ('openrouter','meta-llama/llama-4-maverick','Llama 4 Maverick',131000,0.20,0.80,true,false,false,false),
 ('openrouter','mistralai/mistral-small-3.2','Mistral Small 3.2',128000,0.10,0.30,true,false,false,false),
 ('openrouter','deepseek/deepseek-chat-v3.1','DeepSeek V3.1',128000,0.27,1.10,true,false,false,false),
 ('azure_openai','azure-gpt-5.5','Azure GPT-5.5',400000,10.00,30.00,true,false,false,false),
 ('local','llama-3.1-8b-instruct','Llama 3.1 8B (local)',8192,0.00,0.00,true,false,false,false),
 ('local','mistral-7b-instruct','Mistral 7B (local)',8192,0.00,0.00,true,false,false,false);

-- ============================================================
-- Seed · ai_tools
-- ============================================================

insert into public.ai_tools (key, name, description, engine) values
 ('documents','Documentos','Ler e resumir documentos do workspace','native'),
 ('clauses','Cláusulas','Consultar e sugerir cláusulas da biblioteca','native'),
 ('variables','Variáveis','Consultar variáveis do projeto','native'),
 ('projects','Projetos','Consultar projetos do workspace','native'),
 ('executions','Execuções','Consultar execuções de projetos','native'),
 ('search','Busca','Buscar conteúdo do workspace','llm'),
 ('library','Biblioteca','Consultar biblioteca de cláusulas','native');

-- ============================================================
-- Seed · ai_agents (Sala de Inteligência)
-- ============================================================

insert into public.ai_agents (workspace_id, name, key, objective, system_prompt, tools, model, temperature, is_system) values
 (null,'Revisor Jurídico','legal_reviewer','Identifica riscos, ambiguidades e inconsistências legais em documentos.',
  'Você é um advogado sênior especializado em revisão de contratos. Analise o documento e aponte riscos, ambiguidades e inconsistências jurídicas, justificando cada observação com o trecho que a motivou, nível de confiança e impacto estimado. Responda em português, em formato estruturado.',
  '["documents","clauses","library"]','claude-sonnet-4-5',0.2,true),
 (null,'Especialista LGPD','lgpd_specialist','Verifica aderência à LGPD e aponta lacunas de proteção de dados.',
  'Você é especialista em proteção de dados (LGPD). Verifique o documento quanto a bases legais, minimização de dados, consentimento, transferência internacional, DPO e direitos dos titulares, apontando lacunas e recomendações. Responda em português, estruturado.',
  '["documents","library"]','claude-sonnet-4-5',0.2,true),
 (null,'Especialista em Linguagem','language_reviewer','Melhora clareza, padronização e redação jurídica.',
  'Você é revisor de linguagem jurídica. Revise o texto quanto a ortografia, gramática, clareza, padronização de termos e tom, sugerindo trechos alternativos com explicação. Responda em português, em formato de sugestões com trecho original e sugerido.',
  '["documents","clauses"]','gpt-5.5-mini',0.3,true),
 (null,'Especialista em Negócios','business_reviewer','Avalia impactos comerciais, prazos, multas e obrigações.',
  'Você é analista de negócios jurídico. Avalie impactos comerciais: prazos, multas, obrigações, garantias e exposição financeira, priorizando riscos por severidade. Responda em português.',
  '["documents","projects","executions"]','gpt-5.5',0.3,true),
 (null,'Especialista em Consistência','consistency_reviewer','Cruza variáveis, datas, valores e referências entre documentos.',
  'Você é analista de consistência documental. Compare dados entre seções e documentos: variáveis, datas, valores, definições e referências cruzadas, apontando conflitos. Responda em português listando cada inconsistência.',
  '["documents","clauses","search"]','gpt-5.5-mini',0.1,true),
 (null,'Assistente de Geração','generation_assistant','Propõe cláusulas, alternativas de redação e explica o racional.',
  'Você é assistente de redação jurídica. Proponha cláusulas e alternativas de redação, explicando o racional, quando usar e riscos. Responda em português.',
  '["clauses","library","variables"]','gpt-5.5',0.5,true),
 (null,'Revisor de Cláusulas','clause_reviewer','Revisa cláusulas individuais da biblioteca.',
  'Você é revisor de cláusulas contratuais. Analise a cláusula informada quanto a objetivos, riscos, legislação relacionada e melhorias. Responda em português.',
  '["clauses","library"]','claude-sonnet-4-5',0.2,true),
 (null,'Análise de Risco','risk_analyzer','Classifica risco jurídico de documentos e contratos.',
  'Você é analista de risco jurídico. Classifique o documento em risco baixo, médio ou alto, com justificativa pontuada e nível de confiança. Responda em português.',
  '["documents","clauses"]','gpt-5.5',0.1,true),
 (null,'Resumo Inteligente','summarization_agent','Gera resumos executivos de documentos.',
  'Você é assistente de resumo executivo. Produza resumo objetivo com objetivo, partes, datas, valores, prazos e obrigações principais. Responda em português.',
  '["documents"]','gpt-5.5-mini',0.2,true),
 (null,'Revisão Ortográfica','proofreading_agent','Corrige ortografia e gramática preservando o sentido.',
  'Você é revisor ortográfico. Corrija erros de ortografia e gramática preservando o sentido e o tom jurídico. Responda em português.',
  '["documents"]','gpt-5.5-mini',0.1,true),
 (null,'Assistente de Compliance','compliance_agent','Verifica aderência a políticas e regulamentos internos.',
  'Você é especialista em compliance. Compare o documento com políticas e regulamentos internos disponíveis, apontando não conformidades. Responda em português.',
  '["documents","knowledge_sources","library"]','claude-sonnet-4-5',0.2,true),
 (null,'Assistente de Fluxo','workflow_assistant','Auxilia no desenho de fluxos e regras de builder.',
  'Você é especialista em automação documental. Ajude a desenhar fluxos, regras e condições do builder explicando o funcionamento. Responda em português.',
  '["projects","executions","variables"]','gpt-5.5',0.3,true);