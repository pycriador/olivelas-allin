# Prompt Lovable — Sprint 3 · ClauseForge AI Studio

> Cole este documento inteiro (área "Code" do Lovable, Chat). Ele define o escopo, as regras de arquitetura e os critérios de aceite da Sprint 3.
> Contexto obrigatório: rode `Context`/leia o repositório antes de implementar. NÃO apague, renomeie ou reestruture o que já existe (Sprint 1 e 2).

---

## 0. Contexto (Sprint 1 + 2 já entregues — não regredir)

- Stack: React 19 + TS (strict), TanStack Start (SSR, file-based routing), TanStack Query, Zustand (persist), React Hook Form + Zod, TailwindCSS v4, shadcn/Radix, Framer Motion, Recharts, Supabase (Lovable Cloud), sonner, date-fns.
- Estrutura modular: `features/<dominio>/{ui,hooks,services}`, `components/shared`, `components/ui`, `services`, `stores`, `providers`, `contexts`, `layouts`, `constants`, `types`, `schemas`, `integrations/supabase` (gerado — NÃO editar), `utils`.
- UI em pt-BR. Nunca usar `alert/confirm/prompt` nativo. Usar shadcn/Radix + `toast` (sonner).
- Multi-tenant: toda tabela com `workspace_id` (nullable só p/ global). Super Admin = `user_roles.role = 'super_admin'` com `workspace_id null`.
- RBAC: `permissions` (`key`,`module`,`description`) + `role_permissions`. Navegação filtrada por `src/constants/navigation.ts` + `usePermissionAny()`.
- Auditoria via `auditService.record(...)` em `src/services/audit.ts` (tabela `audit_logs`).
- Spring 2 entregou: provider é via `src/services/ai/` com **interface única `AIProviderLike`** (`connect/listModels/generate/stream/embeddings/moderation/countTokens/estimateCost`) e 6 implementações (`openai.ts`, `gemini.ts`, `claude.ts`, `openrouter.ts`, `azure.ts`, `local.ts`) num registry (`aiProviderRegistry.create(kind, params)`). `src/services/ai/crypto.server.ts` encripta chaves (AES-256-GCM, `AI_ENCRYPTION_KEY`) + fingerprint + mask.
- Spring 2 entregou migrations (`20260902120000_ai_foundation.sql`): `ai_providers`, `ai_models` (catálogo ~21 modelos), `ai_prompts`+`ai_prompt_versions`, `ai_agents` (12 seed: legal_reviewer, lgpd_specialist, clause_reviewer, language_reviewer, business_reviewer, consistency_reviewer, generation_assistant, risk_analyzer, summarization_agent, proofreading_agent, compliance_agent, workflow_assistant), `ai_conversations`+`ai_messages`, `document_uploads`+`document_upload_chunks`+`document_analyses`, `ai_executions`, `ai_tools` (7 catálogo), `knowledge_sources` (preparação RAG). Permissões `ai.read|ai.manage|ai.run|ai.prompts.manage|ai.agents.manage`. RLS por workspace.
- Spring 2 entregou 11 telas de frontend sob `/ai`: dashboard, providers, models, prompts, prompt-builder, agents, tools, executions, logs, costs, settings (em `features/ai/ui/*.tsx` + `routes/_app/ai/*.tsx`). Tudo compila: `npm run lint`, `npx tsc --noEmit`, `npm run build`.
- `src/services/ai/rag/index.ts` contém SÓ stubs/interfaces (Chunker, EmbeddingsProvider, DocumentStore, VectorSearch, Retriever, Ranker) — RAG NÃO foi implementado.
- Provider `embeddings()` já existe no contrato mas NÃO se conecta a banco vetorial.

**Pendências de código identificadas na revisão pré-implementação (Sprint 3 deve endereçar):**
1. Convite de usuário é placeholder (`use-members.ts` grava só auditoria, não cria convite/membro real). Implementar convite real.
2. RBAC só esconde controles no UI, rotas `/users` etc. não têm `beforeLoad` com permissão. Adicionar guarda de rota.
3. Chaves: `aiProviderRegistry` instancia providers com chave em memória; o fluxo completa de criptografia→execução server-side precisa de camada de serviço unificada (`aiExecutionService`) que nunca expõe a chave ao browser.
4. Não existe ainda rota HTTP/`createServerFn` para executar IA server-side (o contrato existe, o wiring não).

---

## 1. Regras de arquitetura (NÃO NEGOCIÁVEIS)

1. **IA 100% server-side.** Nenhum SDK de LLM (OpenAI/Gemini/Claude/OpenRouter) é importado/chamado no browser. Toda execução acontece em server functions (`createServerFn`) ou rotas `src/routes/api/**` (h3/TanStack Start). O cliente envia `{ providerId, model, prompt, ... }` e recebe resposta/stream (SSE).
2. **Adapter Pattern (já existente).** Múltiplos providers sob `AIProviderLike`. NUNCA chamar SDK de vendor dentro de componente React. Novos providers = novo arquivo em `src/services/ai/providers/`, sem alterar contrato.
3. **Cardinalidade de endpoint unificado.** Criar `aiExecutionService` (server-side) que orquestra: resolver provider/modelo → descriptografar chave → `connect()` → `generate/stream` → registrar `ai_executions` + auditoria + tokens/custo.
4. **Chaves protegidas.** Criptografar antes de persistir (`crypto.server.ts`), nunca devolver a chave ao cliente (UI exibe mascarado via `maskKey`), permitir rotação e desativação, auditoria em toda operação de chave. Segredos de Google igualmente em Lovable Cloud secure resource + criptografia AES.
5. **RAG com pgvector no Supabase.** Habilitar extensão `vector`; persistir chunks (`document_upload_chunks`) + embeddings + `knowledge_sources` indexados. Nenhuma dependência externa de vector store.
6. **Custos/tokens** calculados e persistidos em toda invocação (via `cost.ts` + tabela de preços `ai_models`).
7. **Auditoria obrigatória** em execuções de IA e em toda alteração config AI/provider/conhecimento/Google.
8. Seguir padrões: RHF+Zod, TanStack Query, hooks em `features/<dominio>/hooks`, textos pt-BR, barrel restrito a `components/ui`.
9. **Não reescrever histórico já publicado** (regra Lovable): commits novos, sem force-push/rebuild de histórico.
10. **Poder dwn-flag**: features complexas entregues em fases pequenas; cada fase compila/roda.

---

## 2. Escopo da Sprint

Transformar o módulo `/ai` em um **AI Studio** completo:

- **Multi-provider architecture** (já base, completar): unificar criador de provider + service de execução; health check por provider; listagem de modelos viva (`ai_models`); estimativa de custo.
- **Providers • Prompt Library • Prompt Builder • Playground** funcionais (CRUD + execução real com streaming).
- **Agentes + Sala de Inteligência** (coordenação multi-agente em paralelo com limite de concorrência).
- **RAG + Banco de Conhecimento**: chunking real, embeddings, busca vetorial (pgvector), indexação de `document_uploads` e `knowledge_sources`, recuperação + rerank.
- **Upload de documentos** (PDF/DOCX/Markdown/TXT/ODT/RTF) com extração real de texto + análise inteligente + IA no builder.
- **Integração Google Workspace** (Sheets • Docs • Drive • Cloud Storage) com OAuth/service-account e credenciais seguras.
- **Dashboards**: execução de IA e executivo.
- **AI Audit.**

**Fora de escopo (preparar apenas):** execução real do motor de geração de documentos do Builder é mantida desacoplada; build de produção/documentação.

---

## 3. Modelo de dados — nova migration `supabase/migrations/20260903xxxx_ai_studio.sql`

Seguir o padrão das migrations existentes (RLS por workspace, triggers `set_updated_at`, grants, seeds idempotentes).

### 3.1 pgvector

```sql
create extension if not exists vector;
```

Coluna de embedding em: `document_upload_chunks` e nova `knowledge_embeddings`. Usar `vector(1536)` (padrão OpenAI/Gemini text-embedding-3-large/text-embedding-004).

### 3.2 `ai_settings` (config global de IA do workspace)

`id, workspace_id (nullable=global), default_provider_id (fk ai_providers), default_model, default_temperature numeric, require_moderation bool default false, log_outputs bool default true, max_concurrent_agents int default 3, rag_top_k int default 4, created_by, created_at, updated_at`.

### 3.3 `knowledge_sources` (estender para RAG)

Adicionar colunas opcionais: `source_type` (enum `upload|manual|google_docs|google_drive|google_sheets|web`), `storage_path`, `file_kind`, `document_upload_id (fk)`, `indexed bool default false`, `error text`. Índice para busca.

### 3.4 `knowledge_embeddings`

`id, source_id (fk knowledge_sources on delete cascade), chunk_id (uuid), content text, seq int, token_count int, embedding vector(1536), model text, created_at` + índice `ivfflat`/`hnsw` em `embedding` (índice `ivfflat` ou `hnsw` conforme tamanho esperado).

### 3.5 `ai_playground` (ou reusar `ai_conversations` com `project_id null`)

Recomendado: reutilizar `ai_conversations`/`ai_messages` já existentes (playground = conversa global). Não criar tabela duplicada.

### 3.6 Google Workspace

`google_connections`:
`id, workspace_id, provider (enum 'sheets'|'docs'|'drive'|'cloud_storage'), auth_type (enum 'oauth'|'service_account'), client_email, project_id, private_key_encrypted text, private_key_fingerprint text, refresh_token_encrypted text, token_fingerprint text, status (enum 'connected'|'error'|'revoked'), scopes text[], created_by, created_at, updated_at`.

`google_resources` (objetos referenciáveis por projetos/conhecimento):
`id, workspace_id, connection_id (fk google_connections), kind (enum 'sheet'|'document'|'folder'|'file'|'bucket'), google_id text, name, url text, metadata jsonb, created_by, created_at, updated_at`.

### 3.7 Estender `ai_executions`

Adicionar `source` text ('playground'|'agent'|'analysis'|'rag'|'builder'|'google'), `agent_id` já existe. (Se preferir, manter como está e usar `input/metadata`.)

### 3.8 Novas permissões (seed)

Módulo `AIStudio`/`Knowledge`:
- `ai.analyze` (rodar análise de documento / sala de inteligência)
- `ai.rag` (usar banco de conhecimento/busca vetorial)
- `knowledge.manage` (gerir conhecimento/Google)
- `connectors.google` (gerir conexões Google)

Atribuir: `super_admin`, `workspace_admin` = todas; `manager` = `ai.analyze, ai.rag`; `editor` = `ai.analyze, ai.rag`; `reviewer` = `ai.rag`; `viewer` = `ai.rag`.

---

## 4. AI Studio — camadas de serviço (server-side, NOVO)

Criar em `src/services/ai/`:

### 4.1 `execution.ts` — `AIExecutionService`
- `resolveProvider(providerId)` → descriptografa chave (server-only), instancia via `aiProviderRegistry`.
- `run(exec: AIExecuteInput)` → gera, persiste `ai_executions`, auditoria, devolve `AICompletionResult`.
- `runStream(exec, onEvent)` → SSE; grava ao finalizar/cancelar.
- `healthCheck(providerId)` → `connect()` + cheap call.
- `analyzeDocument(uploadId, projectId)` → extrai texto (se preciso), invoca agentes, grava `document_analyses`.
- `intelligenceRoom(uploadId, agentKeys[], {concurrency})` → `Promise.all` com limite.
- `chat(context)` → conversa (`ai_conversations`/`ai_messages`) com streaming.

### 4.2 `embed.ts` — `EmbeddingService`
- `embedTexts(texts, model?)` → via provider `embeddings()`.
- `indexDocument(uploadId)` → chunk + embed + gravar em `knowledge_embeddings`.
- `indexKnowledgeSource(sourceId)`.
- `search(query, {topK, filters})` → busca pgvector (server-side, funções RPC/REST via Supabase).

### 4.3 `rag.ts` → implementar `Chunker`, `VectorSearch`, `Retriever` (substituir stubs de `rag/index.ts` explicitamente, em arquivos novos `rag/chunker.ts`, `rag/store.ts`, `rag/retriever.ts`), mantendo `rag/index.ts` como contract export.

### 4.4 `google/` — `GoogleWorkspaceService`
- `client.ts` (auth OAuth/service_account via `google-auth-library` server-only).
- `sheets.ts`, `docs.ts`, `drive.ts`, `cloud.ts` (extração de conteúdo → conhecimento).
- `credentials.ts` (encripta private_key/refresh_token em `google_connections`).

### 4.5 `document-analysis/`
- `parser.ts` (extração: pdf-parse PDF, mammoth DOCX, showdown MD, rtf/odt via extração/text).
- `analysis.ts` (schema report JSON).

### 4.6 `knowledge/` — `KnowledgeService` (CRUD `knowledge_sources` + indexação + busca).

### Rota/api
- `src/routes/api/ai/execute.ts` (POST) → chama `aiExecutionService.run`.
- `src/routes/api/ai/stream.ts` (POST, SSE) → `runStream`.
- `src/routes/api/ai/search.ts` (POST) → `rag.retrieve`.
- `src/routes/api/google/connect.ts`, `refresh.ts`, `resource.ts`.

---

## 5. AI Studio — telas (UI)

Estender `features/ai/ui/` e adicionar novas. Todas pt-BR, com EmptyState/placeholders, streaming com cursor de escrita + botão cancelar, copiar/exportar resposta.

### 5.1 AI Playground (novo, reutiliza Service)
Chat por conversa global (`ai_conversations`), streaming, escolha de provider/modelo, temperatura, copiar/exportar, favoritar/pin.

### 5.2 AI Providers (estender)
Adicionar "Testar conexão" (health check server-side), indicadores de health, toggle default.

### 5.3 AI Models (estender)
Mostrar preços, filtro; "modelo de embeddings".

### 5.4 Prompt Library / Builder (estender)
Botões reais "Testar no Playground" e "Executar" (server-side); autocomplete de variáveis já existentes.

### 5.5 AI Agents (estender)
Botão "Executar agente" com streaming; visualizar `ai_executions` do agente.

### 5.6 Sala de Inteligência (NOVO — `features/ai/ui/intelligence-room.tsx`, rota `ai/intelligence-room`)
Painel multi-agente: selecionar documento/knowledge, rodar N agentes em paralelo, apresentar por agente observações ranqueadas por risco/confiança.

### 5.7 Documentos / Upload / Análise (NOVO em `features/documents` + integração)
Upload (PDF/DOCX/MD/TXT/ODT/RTF) → bucket `documents/{ws}/{id}/{name}` → `document_uploads` → análise (`document_analyses.report`) → problemas/sugestões/Sala de Inteligência/Checklist.

### 5.8 Banco de Conhecimento (NOVO `features/knowledge` — `ai/knowledge`, `ai/knowledge/[id]`)
CRUD `knowledge_sources` (manual + a partir de upload/Google), indexação para RAG, busca semântica.

### 5.9 Google Workspace (NOVO `features/integrations/google` — `ai/integrations/google`)
Conectar Sheets/Docs/Drive/Cloud Storage (OAuth ou service-account JSON), listar recursos, importar conteúdo p/ conhecimento.

### 5.10 RAG / Busca Inteligente (NOVO `ai/search` ou integrado 5.8)
Busca híbrida (keyword + vetorial), resultados com score, referenciar cláusulas.

### 5.11 Dashboard Executivo de IA (estender `ai-dashboard`)
Incluir métricas de RAG, conhecimento indexado, uso por provider/modelo/source, custo.

### 5.12 AI Audit (NOVO `ai/audit`)
Trilha de auditoria + `ai_executions` unificados: quem, o quê, modelo, tokens, custo, latência, erro.

### Nav Senhora
Atualizar `src/constants/navigation.ts` seção "Inteligência" (Playground, Sala de Inteligência, Conhecimento, Integrações, Audit).

---

## 6. Dependências a instalar (server-only, não no bundle do browser)

- `pdf-parse` (PDF), `mammoth` (DOCX), `showdown` (Markdown) — extração no servidor.
- `google-auth-library` (Google OAuth/service-account) e, para Sheets/Docs/Drive, `@googleapis/*` (server-only) ou chamadas REST com token.
- `@supabase/supabase-js` já presente; pgvector via SQL/RPC (sem client-side de embed).

Nenhuma lib estilo `openai` precisa ser instalada se mantivermos HTTP puro via `fetch` (já é o caso dos providers). Se optar por SDKs, mantê-los EXCLUSIVAMENTE em `src/services/ai/providers/*` (server-only).

---

## 7. UX

- Ícones de IA (Sparkles/Brain/Sparkles) nos CTA; loading/streaming; botão cancelar; histórico; copiar; exportar `.txt`; pin/favorito.
- EmptyStates reutilizando `src/components/shared/empty-state.tsx` e `module-placeholder.tsx`.
- Todos os textos pt-BR (revisar: NÃO deixar `Ninguno`/`Sin objetivo`/`Sin descripción` — já corrigidos nesta Sprint; manter padrão).

---

## 8. Auditoria

Registrar em `audit_logs`: execução de IA (source), criação/rotação/desativação de chave provider, criação/edição publicações de prompts/agentes, análise de documento, indexação de conhecimento, conexão/revogação Google, alterações `ai_settings`. `ai_executions` guardam trilha técnica.

---

## 9. Critérios de aceite

1. AI 100% server-side; nenhum SDK de LLM no bundle do browser (conferir bundles).
2. `Testar conexão` e execução real de gordura (playground/agentes/análise) retornam respostas reais com tokens/custo persistidos.
3. Upload DOCX/PDF → extração → `document_analyses.report` estruturado + problemas + Sala de Inteligência paralela.
4. RAG operacional: chunk + embedding + busca vetorial pgvector em `document_uploads` e `knowledge_sources`.
5. Google Workspace conectado (OAuth ou service-account), recursos listados, conteúdo importável p/ conhecimento.
6. Dashboard executivo + AI Audit com trilha completa.
7. Convite de usuário real (não só auditoria) + guarda de rota por permissão.
8. `npm run lint`, `npx tsc --noEmit`, `npm run build` sem erros novos.
9. Fluxo E2E: configurar provider → health check → playground streaming → salvar prompt → rodar agente/Sala → upload DOCX → análise → indexar conhecimento → buscar por RAG → conectar Google → importar → dashboard/audit refletem.

---

## 10. Fases sugeridas (implementar nesta ordem)

- **Fase A:** `aiExecutionService` + rotas `execute/stream` + health check; wire Playground real. (fundação server-side)
- **Fase B:** Upload + parsing + análise + Sala de Inteligência.
- **Fase C:** RAG (chunker + embeddings + pgvector + busca) + Banco de Conhecimento.
- **Fase D:** Google Workspace (auth + Sheets/Docs/Drive/Cloud + importar).
- **Fase E:** Convite real + guarda de rota RBAC.
- **Fase F:** Dashboards executivos + AI Audit + polish pt-BR.

---

## 11. Decisões a confirmar antes de codar

- Chamadas reais de LLM exigem uma chave válida de provider (OpenRouter recomendado p/ teste) e `AI_ENCRYPTION_KEY` em Lovable Cloud secure resource.
- pgvector: confirmar que Lovable Cloud permite `create extension vector` (senão, fallback: busca por tokenization/JSONB até servir; registrar no spec).
- Parsing DOCX/PDF/ODT server-side via libs acima; tamanho máximo de upload.
- Google: definir se usará OAuth (fluxo do usuário logado) ou service-account (conta de serviço da organização) como padrão.