# Prompt Lovable — Sprint 2 · ClauseForge AI Foundation

> Cole este documento inteiro (área "Code" do Lovable, Chat). Ele define o escopo, as regras de arquitetura e os critérios de aceite da Sprint 2.
> Contexto obrigatório: rode `Context`/leia o repositório antes de implementar. NÃO apague, renomeie ou reestruture o que já existe (Sprint 1).

---

## 0. Contexto do projeto (não modificar)

- Stack: React 19 + TypeScript (strict), TanStack Start (file-based routing, SSR), TanStack Query, Zustand (persist), React Hook Form + Zod, TailwindCSS v4, shadcn/ui + Radix, Framer Motion, Recharts, Supabase (Lovable Cloud), sonner, date-fns.
- Estrutura modular obrigatória em `src/`: `features/<dominio>/{ui,hooks,services}`, `components/shared`, `components/ui` (shadcn, não editar), `services`, `stores`, `providers`, `contexts`, `layouts`, `constants`, `types`, `schemas`, `integrations/supabase` (gerado — NÃO editar), `utils`.
- Rotas em `src/routes/`. Área autenticada sob `src/routes/_app.tsx` (layout enterprise com sidebar/topbar/command palette) e páginas em `src/routes/_app/*.tsx`. Páginas públicas sob `src/routes/_public.tsx`. Login em `/login`.
- UI em pt-BR. Nunca usar `alert/confirm/prompt` nativo. Usar shadcn/Radix + `toast` do sonner.
- Sem lógica de negócio em componentes React. Dados via service com camada única: `services/<nome>.ts` exportando singletons (`authService`, `workspaceService`, `roleService`, `auditService`, etc.).
- Multi-tenant: toda tabela tem `workspace_id` (nullable apenas em sistema/global). Super Admin = `user_roles.role = 'super_admin'` com `workspace_id is null`.
- RBAC: tabelas `permissions` (`key`, `module`, `description`) e `role_permissions` (`role`, `permission_key`). Permissões de módulos existentes: `projects.read`, `documents.read`, `executions.read`, `settings.manage`, `connectors.manage`, etc. Navegação filtrada por permissão via `src/constants/navigation.ts` (`APP_NAV`) e `usePermissionAny()` (`src/hooks/use-workspace.ts`).
- Banco já migrado (ver `supabase/migrations/`): workspaces, profiles, workspace_members, user_roles, groups, group_members, permissions, role_permissions, projects, project_versions, connectors, **credentials (com `encrypted_payload` e `fingerprint` — reutilizar para chaves criptografadas)**, data_sources, variables, builders, rules, executions, generated_documents, libraries, clauses, audit_logs, notifications, settings.
- Auditoria existente: `audit_logs` (workspace_id, actor_id, actor_email, action, entity, entity_id, metadata jsonb, ip_address) via `auditService.record(...)` em `src/services/audit.ts`.
- Funcionalidades de Projeto (Builder, Regras/Fluxo, Variáveis, Execuções, Validação, Documentos) são **placeholders navegáveis** — a IA deve ser construída desacoplada (pronta para quando existirem), MAS ler os dados reais já modelados (variáveis, builders, rules, clauses, executions).

---

## 1. Regras de arquitetura (NÃO NEGOCIÁVEIS)

1. **IA 100% server-side.** Nenhum SDK de LLM (OpenAI/Gemini/Claude/OpenRouter) é importado ou chamado no browser. Toda chamada acontece em server functions (`createServerFn`) ou rotas HTTP (`src/routes/api/**`) usando h3/TanStack Start. O cliente só envia `{ providerId, model, prompt, ... }` e recebe resposta/stream.
2. **Desacoplamento total.** Um módulo AI central em `src/features/ai/` + `src/services/ai/`. Componentes React NUNCA importam providers. Camadas: `aiProvider` (interface) → `providers/*` (implementações por vendor) → `aiService` → hooks → componentes.
3. **Contrato único de provider** — toda implementação deve expor: `connect()`, `listModels()`, `generate()`, `stream()`, `embeddings()`, `moderation()`, `countTokens()`, `estimateCost()`.
4. **Chaves criptografadas.** API keys nunca em texto puro: criptografar antes de persistir (reutilizar `credentials.encrypted_payload`/`fingerprint` ou encriptação equivalente), nunca retornar a key ao cliente (UI exibe mascarado), permitir rotação de chave e desativação do provider. Registrar auditoria em toda operação de chave (criar/rotacionar/desativar).
5. **Streaming real.** `stream()` deve usar SSE (Server-Sent Events) para o cliente exibir token a token com estado de "carregando" e botão de cancelamento.
6. **Auditoria obrigatória** em toda execução de IA e em toda alteração de configuração AI (provider, prompt, agente): gravar em `audit_logs` E nos novos logs de IA (ver §3).
7. **Custos e tokens** calculados e persistidos em toda invocação (estimativa por modelo, tokenizador por provider).
8. Seguir padrões existentes: RHF+Zod para formulários, TanStack Query para dados, hooks em `features/<dominio>/hooks`, `type` errors en Brasil via pt-BR, barrel de UI restrito a `components/ui`.
9. Semanticamente versionado: novos providers = novo arquivo em `src/services/ai/providers/`, sem alterar contratos existentes.

---

## 2. Escopo da Sprint

Criar o **módulo AI** (navegável na sidebar, seção "Inteligência") com as abas:

- AI Dashboard
- AI Providers
- AI Models
- AI Prompt Library
- AI Prompt Builder
- AI Agents
- AI Tools
- AI Executions
- AI Logs
- AI Costs
- AI Settings

Mais a integração com Projetos (§5): Assistente IA (aba no projeto), Upload de Documentos, Análise inteligente, Painel jurídico, Sugestões, Comparação, Biblioteca inteligente, Geração assistida no Builder, Explicação jurídica, Revisor de linguagem, Checklist, Chat do projeto, Explain (Builder/Workflow/Documento) e **Sala de Inteligência** (painel colaborativo multi-agente).

**Fora de escopo (NÃO implementar nesta sprint, apenas preparar):** RAG/busca vetorial real, execução real do motor de geração de documentos (Builder), documentação de produção.

---

## 3. Modelo de dados — migrations novas em `supabase/migrations/` (criar 1 arquivo)

Seguir o padrão das migrations existentes (RLS por workspace, triggers `set_updated_at` para tabelas com updated_at, grants).

> Reusar estrutura/RLS de `credentials` para chaves. Novas tabelas abaixo (nomes exatos):

### `ai_providers`

`id, workspace_id (fk workspaces on delete cascade, nullable=só para global), name, kind (enum ai_provider_kind: 'openai'|'gemini'|'claude'|'openrouter'|'azure_openai'|'local'), status (enum 'active'|'disabled'|'error'), base_url, default_model, api_key_encrypted text, api_key_fingerprint text, timeout_ms, default_temperature, max_tokens, is_default, created_by, created_at, updated_at`

- RLS: leitura/escrita apenas `workspace_admin` (espelhar policy `ws admin credentials`).

### `ai_models` (catálogo técnico)

`id, provider_kind (ai_provider_kind), model_key text (ex.: 'gpt-5.5', 'claude-opus-4-1'), display_name, context_tokens, input_price_1m, output_price_1m, supports_streaming bool, supports_embeddings bool, supports_moderation bool, is_beta bool` + seed com ~30 modelos (GPT-5.5/GPT-5.5 Mini, Claude Opus/Sonnet, Gemini Pro/Flash, OpenRouter Llama/Mistral, etc.).

### `ai_prompts`

`id, workspace_id, name, slug, description, category, system_prompt, prompt, temperature, suggested_model, tags text[], status (enum 'draft'|'published'|'archived'), author_id, version int default 1, created_at, updated_at` + `ai_prompt_versions` (prompt_id, version, content jsonb, created_by, created_at) para versionamento.

### `ai_agents`

`id, workspace_id (nullable=global), name, key, objective, system_prompt, tools jsonb (lista de ferramentas habilitadas), model, temperature, status (enum 'enabled'|'disabled'), is_system bool, created_by, created_at, updated_at`.

### `ai_executions`

`id, workspace_id, provider_id (fk ai_providers), agent_id (nullable), prompt_id (nullable), project_id (nullable), document_id (nullable), model, input jsonb, output jsonb, status (enum ai_execution_status: 'pending'|'running'|'succeeded'|'failed'|'cancelled'), prompt_tokens, completion_tokens, total_tokens, cost_estimate numeric, latency_ms, error, created_by, created_at, started_at, finished_at` — é a fonte de AI Executions/AI Logs/Costs.

### `ai_tools` (catálogo)

`id, key (unique), name, description, engine (enum 'native'|'llm'), is_system bool` + seed: `documents`, `clauses`, `variables`, `projects`, `executions`, `search`, `library`.

### `ai_conversations` + `ai_messages` (Playground e Chat do Projeto)

- `ai_conversations`: `id, workspace_id, project_id (nullable — se null = playground global), title, pinned bool, is_favorite bool, created_by, created_at, updated_at`
- `ai_messages`: `id, conversation_id, role ('user'|'assistant'), content, provider_id, model, input_tokens, output_tokens, cost_estimate, created_at`

### `document_uploads`

`id, workspace_id, project_id (nullable — associado a Projeto ou Biblioteca Global), library_id (nullable), storage_path, original_name, mime_type, file_kind (enum 'pdf'|'docx'|'markdown'|'txt'|'rtf'|'odt'), size_bytes, status (enum 'uploaded'|'processing'|'analyzed'|'failed'), extracted_text, error, created_by, created_at, updated_at` — texto extraído deve ser truncado fragmentos em `document_upload_chunks` (`id, upload_id, seq, content, token_count`) para preparar RAG.

### `document_analyses`

`id, upload_id, project_id, report jsonb, risk_level (enum 'low'|'medium'|'high'), summary text, model, created_by, created_at` — `report` segue schema JSON da §5 (resumo executivo, objetivo, tipo, partes, datas, valores, prazos, obrigações, cláusulas, riscos, inconsistências, pontos de atenção, campos ausentes).

### Novas permissões (adicionar ao seed das migrations)

Módulo `AI` com `ai.read` (visualizar AI), `ai.manage` (configurar providers), `ai.run` (executar playground/agentes/analises), `ai.prompts.manage`, `ai.agents.manage`. Atribuir: `super_admin`/`workspace_admin` = todas; `manager` = `ai.read, ai.run`; `editor` = `ai.read, ai.run`; `reviewer` = `ai.read`; `viewer` = `ai.read`.

---

## 4. Módulo AI — telas

### 4.1 AI Dashboard

Cards resumo (nº providers ativos, execuções hoje, tokens totais, custo estimado hoje), gráfico de execuções 14 dias, custo por provider/modelo, erro recente. Reaproveitar `StatCard`, Recharts e padrão de `dashboardService`.

### 4.2 AI Providers

Lista de providers configurados no workspace + criar/editar. Formulário (RHF+Zod): nome, kind, status, modelo padrão, base_url, timeout, temperatura padrão, max tokens, chave API (input `type="password"`, exibida mascarada: só últimos 4), botão "Testar conexão" (chama `connect()` server-side), botão "Rotacionar chave", "Desativar". Log de auditoria a cada ação. Validação de chave enviada nunca persiste texto puro.

### 4.3 AI Models

Leitura do catálogo `ai_models`, filtro por provider_kind, badge "beta/streaming/embeddings". (Sem CRUD nesta sprint além de read.)

### 4.4 AI Prompt Library

CRUD de prompts: nome, descrição, categoria, system, prompt, temperatura, modelo sugerido, tags, status, autor, versão. Reuso: botão "Usar no Playground" (preenche playground) e "Usar em projeto". Pesquisa por nome/tag/categoria.

### 4.5 AI Prompt Builder

Editor com: autocomplete de variáveis (`{{variavel}}` + listagem das variáveis do projeto), templates prontos, blocos reutilizáveis, preview (renderização de variáveis), versionamento (`ai_prompt_versions`), salvar/publicar.

### 4.6 AI Agents

Lista + editor de agentes: objetivo, system_prompt, seleção de ferramentas (`ai_tools`), modelo, temperatura, status. Seed inicial com os agentes do §"Sala de Inteligência": `legal_reviewer`, `lgpd_specialist`, `clause_reviewer`, `language_reviewer`, `business_reviewer`, `consistency_reviewer`, `generation_assistant`, `risk_analyzer`, `summarization_agent`, `proofreading_agent`, `compliance_agent`, `workflow_assistant`. Execução manual de um agente com streaming. Auditoria.

### 4.7 AI Tools

Lista do catálogo `ai_tools` (read). Quando o arquivo de implementação existir, o nome do arquivo deve aparecer (ex.: `tools/document-tool.ts`).

### 4.8 / 4.9 AI Executions e AI Logs

Tabela/lista de execuções de IA (reaproveitar tabela+padrão de `RecentExecutionsTable`): status, modelo, provider, tokens, custo, latência, usuário, projeto, erro. Filtros. Detalhe de execução (prompt/response).

### 4.10 AI Costs

Painel de custos: total por provider, por modelo, por usuário, por projeto; gráfico de evolução; tabela de execuções mais caras. Valores estimados de `ai_executions.cost_estimate`.

### 4.11 AI Settings

Configurações globais de IA do workspace (default provider, default model, temperatura padrão, flag "exigir moderação", flag "logar saídas"), persistidos via `settings` (scope `'ai'`) ou `ai_settings`. Auditoria.

---

## 5. IA dentro dos Projetos

### 5.1 Upload de Documentos

Página/modal de upload aceitando PDF, DOCX, Markdown, TXT, RTF, ODT (usar libs: `mammoth` p/ DOCX, `pdf-parse` p/ PDF, `showdown`/regex p/ MD, parser para RTF/ODT ou fallback de extração de texto). Upload para bucket Supabase Storage `documents/{workspaceId}/{uploadId}/{originalName}`; gravar `document_uploads`; associação a Projeto ou Biblioteca Global. Status visual (uploading/processing/analyzed/failed) + retry.

### 5.2 Análise Inteligente de Documentos

Após upload, disparar `aiService.analyzeDocument(uploadId, projectId)` (server-side). Gerar `document_analyses.report` (JSON estruturado) com:

- Resumo executivo, objetivo do documento, tipo do contrato, partes envolvidas, datas importantes, valores encontrados, prazos, obrigações, cláusulas principais, riscos, inconsistências, pontos de atenção, campos ausentes.

### 5.3 Detecção de Problemas

A análise deve detectar: cláusulas contraditórias, datas inconsistentes, valores conflitantes, campos vazios, referências inexistentes, duplicidade, numeração quebrada, links inválidos, responsabilidades ambíguas, definições ausentes. Cada problema com `type`, `severity`, `location`, `description`, `suggestion`.

### 5.4 Análise Jurídica

Painel com classificação de risco (Baixo/Médio/Alto), justificativa, nível de confiança, por documento e por projeto.

### 5.5 Sugestões de Melhoria (com aceitar/rejeitar)

A IA pode sugerir: melhor redação, melhor organização, remover duplicações, adicionar cláusulas, atualizar LGPD, melhorar linguagem, padronizar definições, adicionar referências, corrigir inconsistências. Cada sugestão: `explicacao`, `trecho_original`, `trecho_sugerido`, `confianca`. UI com diff lado a lado + botões Aceitar/Rejeitar.

### 5.6 Comparação Inteligente

Selecionar 2 documentos → relatório: o que mudou, cláusulas removidas/adicionadas, riscos que aumentaram/diminuíram, resumo executivo, impacto jurídico.

### 5.7 Biblioteca Inteligente

Campo de busca semântica (keyword + embeddings quando disponíveis) sobre `clauses`/`libraries`/`projects` retornando: cláusulas semelhantes, projetos parecidos, contratos similares, sugestões de reutilização.

### 5.8 Geração Assistida no Builder

Botão **"Sugerir cláusula"**: a IA recebe contexto (projeto, variáveis, fluxo, biblioteca, documento atual) e retorna bloco pronto + explicação. Inserir no layout do builder.

### 5.9 Explicação Jurídica

Botão **"Explicar"** em cada cláusula: objetivo, quando usar, riscos, legislação relacionada.

### 5.10 Revisor de Linguagem

Analisar texto: ortografia, gramática, padronização, linguagem jurídica, tom, formalidade. Sugestões com diff.

### 5.11 Checklist Inteligente pré-exportação

Executar IA antes de exportar: verifica partes, assinaturas, foro, LGPD, confidencialidade, responsabilidades, obrigações, datas, anexos, campos obrigatórios. Resultado com pendências e bloqueio opcional.

### 5.12 Chat do Projeto ("Assistente IA")

Aba no projeto (rota `/projects/{projectId}`), chat contextual que conhece: Builder, fluxo (rules), variáveis, fontes, biblioteca, execuções, documentos. Mensagens persistidas em `ai_conversations`/`ai_messages` com `project_id`. Streaming, histórico, favoritar/pin, copiar, exportar resposta, cancelar.

### 5.13 Explain Builder / Workflow / Documento

Botões "Explique esta regra" (seleção de regra → explicação do `expression`), "Explique" (fluxo), "Resuma" (documento). Reutilizar geração com contexto específico.

### 5.14 Sala de Inteligência (diferencial de mercado)

Painel consolidado multi-agente dentro do documento/upload: executar em paralelo agentes especializados (Revisor Jurídico, LGPD, Linguagem, Negócios, Consistência, Geração) e apresentar, por agente, observações independentes com justificativa, confiança e impacto estimado — ranqueadas e filtradas por risco. Base do `ai_agents` + `ai_executions` em paralelo (server-side, `Promise.all` com limite de concorrência).

---

## 6. RAG — preparação (NÃO implementar ainda)

Criar somente a camada de abstração em `src/services/ai/rag/` com interfaces TypeScript e stubs que lançam "não implementado": `EmbeddingsProvider`, `Chunker`, `DocumentStore`, `VectorSearch`, `Retriever`, `Ranker`. Manter `document_upload_chunks` alimentado pós-análise (chunks de texto + token_count). Nenhuma dependência de vector store instalada nesta sprint. Garantir que provider `embeddings()` já exista no contrato.

Banco de Conhecimento: tabela `knowledge_sources` (id, workspace_id, title, kind enum 'manual'|'law'|'regulation'|'policy'|'internal', content text, status, created_by, created_at, updated_at) com tela simples de cadastro/leitura — pronta para indexação futura (RAG).

---

## 7. UX

- Ícones de IA (Sparkles/Brain) na sidebar, botões de IA, estados de loading/streaming (cursor de escrita), botão cancelar, histórico por conversa, copiar resposta, exportar resposta (download/`.txt`), pin favoritos.
- Placeholders e EmptyStates reutilizando `src/components/shared/empty-state.tsx` e `module-placeholder.tsx`.
- Todos os textos em pt-BR.

---

## 8. Auditoria

Gravar em `audit_logs` (action/entity/entity_id/metadata): criação/edição/rotação/desativação de chaves de provider; criação/edição/publicação/arquivamento de prompts; criação/edição/habilitação de agentes; execução de análises; alterações de settings AI. `ai_executions` guardam a trilha técnica (provider, model, tokens, tempo, usuário, projeto, documento).

---

## 9. Critérios de aceite

1. Arquitetura de IA totalmente desacoplada e preparada para múltiplos providers (`aiProvider` interface + 6 impls) — sem import de SDK de LLM no browser.
2. Cada workspace configura múltiplos providers/modelos com credenciais criptografadas, rotação, desativação e auditoria.
3. Playground, Prompt Library, Prompt Builder e Agentes funcionais (CRUD + execução com streaming).
4. Upload + análise de documentos produzem relatórios estruturados (resumo, tipo, partes, riscos, inconsistências, cláusulas, sugestões) e detecção de problemas.
5. IA compara documentos, revisa linguagem, sugere cláusulas e responde perguntas contextualizadas do projeto (chat).
6. Sistema pronto para RAG/busca vetorial futura sem refatoração (interfaces + chunks prontos).
7. `npm run lint`, `npx tsc --noEmit` e `npm run build` passam sem erros novos.
8. Fluxo E2E verificável: configurar provider → testar no Playground → salvar prompt → criar agente → upload de documento → análise com risco/sugestões → chat do projeto respondendo.

---

## 10. Decisões a confirmar antes de codar (se preciso, pergunte)

- Provider padrão inicial para testes (recomendado: OpenRouter, uma só chave acessa vários modelos).
- Serviço de criptografia: reutilizar `credentials` (pgsodium/vault se disponível em Lovable Cloud) — senão, encriptação AES com chave de app via server function, mantendo `fingerprint`.
- Quais SDKs server-side instalar: `openai`, `@google/generative-ai`, `@anthropic-ai/sdk` (server-only, nunca no bundle do browser).
