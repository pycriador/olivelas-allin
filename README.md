# Olivelas All In — Plataforma SaaS Multiempresa, Ecossistema Multi-Schema Supabase, RAG & Governança HBAC (`v2.0.0`)

![Version](https://img.shields.io/badge/version-2.0.0--production-0f172a?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6?style=flat-square)
![React](https://img.shields.io/badge/React-19.0-149eca?style=flat-square)
![Vite](https://img.shields.io/badge/Vite-6.x-646cff?style=flat-square)
![Database](https://img.shields.io/badge/Supabase-PostgreSQL%2017%20(16%20Schemas%20%2B%20public)-10b981?style=flat-square)
![Auth](https://img.shields.io/badge/Auth-Bcrypt%20pgcrypto%20%2B%20HBAC%20Granular-2563eb?style=flat-square)
![RAG](https://img.shields.io/badge/RAG%20%26%20IA-Copiloto%20Contextual%2016%20M%C3%B3dulos-0d9488?style=flat-square)
![i18n](https://img.shields.io/badge/i18n-PT--BR%20%7C%20EN%20%7C%20ES-4f46e5?style=flat-square)
![Themes](https://img.shields.io/badge/Themes-15%20Light%20%2B%2015%20Dark-d97706?style=flat-square)

**Olivelas All In** é a plataforma corporativa SaaS multiempresa pronta para produção que unifica a governança central (**Autenticação Real no Supabase, Motor HBAC Granular, Gestão de Empresas, Contratos com Assinatura SHA-256, Financeiro, API Hub PostgREST, Chamados e Auditoria Forense**) com as **16 Plataformas Comerciais Olivelas** localizadas em `/projetos`, operando sobre o **PostgreSQL 17 (Supabase)** com **base única de usuários e senhas (`public.profiles`)**, **16 schemas dedicados**, **CRUD Multi-Tabela**, **RAG & Copiloto IA** e **API Studio em tempo real**.

---

## Sumário

1. [Arquitetura de Produção no Supabase (Login Único + 16 Schemas + RAG + API)](#1-arquitetura-de-produção-no-supabase-login-único--16-schemas--rag--api)
2. [Autenticação Real no Supabase, Credenciais e Segurança](#2-autenticação-real-no-supabase-credenciais-e-segurança)
3. [As 16 Plataformas Comerciais do Ecossistema Olivelas](#3-as-16-plataformas-comerciais-do-ecossistema-olivelas)
4. [As 5 Abas Operacionais de Cada Módulo Olivelas](#4-as-5-abas-operacionais-de-cada-módulo-olivelas)
5. [Motor HBAC Hierárquico e Permissões Granulares](#5-motor-hbac-hierárquico-e-permissões-granulares)
6. [Catálogo de Módulos Base (Exemplos de Fundação)](#6-catálogo-de-módulos-base-exemplos-de-fundação)
7. [Mapa Completo de Rotas e Telas](#7-mapa-completo-de-rotas-e-telas)
8. [Design System, 30 Temas e Internacionalização (`PT-BR`, `EN`, `ES`)](#8-design-system-30-temas-e-internacionalização-pt-br-en-es)
9. [Estrutura de Diretórios e Migrations SQL](#9-estrutura-de-diretórios-e-migrations-sql)
10. [Como Iniciar, Migrar o Banco, Padronizar Projetos, Testar e Compilar](#10-como-iniciar-migrar-o-banco-padronizar-projetos-testar-e-compilar)

---

## 1. Arquitetura de Produção no Supabase (Login Único + 16 Schemas + RAG + API)

Toda a arquitetura visual e de dados foi construída tendo como referência o padrão do módulo **`gestao_estoque`** (`projetos/gestao_estoque`):

- **Base Única de Usuários e Senhas (`public.profiles`):**
  - Todos os 16 módulos comerciais e o painel central do **Olivelas All In** compartilham a tabela `public.profiles` no schema público (com view espelho `public.allin_users` e vínculo multiempresa `public.company_users`).
  - Senhas são armazenadas exclusivamente com hash `bcrypt` (`pgcrypto` `crypt(..., gen_salt('bf', 10))`) e validadas diretamente no PostgreSQL via RPCs seguras (`SECURITY DEFINER`).
- **Isolamento Multi-Schema no PostgreSQL (16 Schemas Dedicados):**
  - Cada projeto em `/projetos/<modulo>` possui seu próprio schema PostgreSQL isolado no Supabase (`CREATE SCHEMA IF NOT EXISTS <schema>`), exposto no PostgREST para consultas e mutações diretas via `supabase.schema('<schema>').from('<tabela>')`.
  - Todas as **77 tabelas** de domínio possuem vínculo com `public.allin_companies(id)` (`company_id`) e `public.profiles(id)`, além de suporte a **arquivamento lógico** (`archive_metadata`) e **CRUD completo**.
- **Persistência Bidirecional & Auditoria Forense (`public.allin_entity_store` & `public.allin_audit_events`):**
  - Todas as operações de empresas, usuários, papéis HBAC, contratos, faturas, meios de pagamento, chamados e itens operacionais são sincronizadas com o Supabase PostgreSQL e geram registros imutáveis em `public.allin_audit_events` (com exportação CSV e JSON Forense).
- **RAG Completo & Copiloto IA (`public.allin_rag_documents` & `public.allin_ai_chat_messages`):**
  - Cada um dos 16 módulos conta com base de conhecimento RAG persistida no Supabase, indexação em 1 clique dos registros reais do schema PostgreSQL e Copiloto IA contextual (modos *Executivo*, *Operacional* e *Técnico/SQL*) com citações verificáveis.

---

## 2. Autenticação Real no Supabase, Credenciais e Segurança

A tela de login (`/login`), o cadastro de nova empresa (`/cadastro`) e a redefinição de senha (`/recuperar-senha` e modal administrativo) operam diretamente sobre as funções PostgreSQL no Supabase:

- `public.authenticate_olivelas_user(p_email, p_password)` — Valida hash `bcrypt`, registra `last_login_at`, incrementa `login_count` e aplica bloqueio temporário automático (`locked_until`) após 5 tentativas inválidas consecutivas.
- `public.register_olivelas_account(...)` — Provisiona em transação única uma nova empresa em `public.allin_companies`, o usuário administrador em `public.profiles`, o vínculo em `public.company_users` e os módulos iniciais em `public.allin_company_modules`.
- `public.change_olivelas_password(p_user_id, p_email, p_new_password, p_actor_email)` — Atualiza o hash `bcrypt` no PostgreSQL, desbloqueia a conta e grava evento na trilha de auditoria.

### Contas Oficiais Provisionadas no Supabase

> **Senha padrão para todos os perfis oficiais:** `Olivelas@2026`

| Perfil / Papel HBAC | E-mail Corporativo | Escopo | Nível HBAC | Empresa Principal |
| :--- | :--- | :---: | :---: | :--- |
| **Super Admin Global** | `helena.vasconcelos@olivelasallin.com.br` | Global | `100` | Todas as Empresas + Console Global |
| **Administrador Operacional** | `marcos.azevedo@olivelasallin.com.br` | Global | `85` | Console Global + Impersonação Auditada |
| **Financeiro Global** | `claudia.mendes@olivelasallin.com.br` | Global | `75` | Console Global (Faturamento & Conciliação) |
| **Suporte / Operador Global** | `rafael.torres@olivelasallin.com.br` | Global | `65` | Console Global (Tickets & Diagnóstico) |
| **Cliente (Admin da Empresa)** | `beatriz.nogueira@olivelas.com.br` | Empresa | `50` | Olivelas Atelier (`emp-olivelas-matriz`) & Vega Retail |
| **Gerente da Empresa** | `rodrigo.sampaio@olivelas.com.br` | Empresa | `35` | Olivelas Atelier (`emp-olivelas-matriz`) |
| **Funcionário / Operador** | `camila.ferreira@olivelas.com.br` | Empresa | `20` | Olivelas Atelier (`emp-olivelas-matriz`) |

---

## 3. As 16 Plataformas Comerciais do Ecossistema Olivelas

Todas as 16 plataformas em `/projetos` fazem parte do catálogo de **Módulos Comerciais Olivelas**, renomeadas sob a identidade oficial **`Olivelas - <Nome da Plataforma>`** e conectadas ao seu respectivo schema no Supabase:

| # | Diretório (`/projetos`) | Nome Oficial da Plataforma | Slug Comercial | Schema PostgreSQL | Tabela Principal | Todas as Tabelas do Schema (CRUD Multi-Tabela) |
| :-: | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `agendamento_simples` | **Olivelas - Consultório & Odonto** | `allin_agendamento_simples` | `agendamento_simples` | `appointments` | `clinic_settings`, `plans`, `services`, `patients`, `appointments`, `messages`, `audit_logs` |
| 2 | `agendamentos` | **Olivelas - Clínicas & Agendamentos** | `allin_agendamentos` | `agendamentos` | `appointments` | `professionals`, `locations`, `appointment_types`, `clients`, `schedules`, `appointments`, `waiting_list` |
| 3 | `app_condominio` | **Olivelas - Gestão de Condomínios** | `allin_condominio` | `app_condominio` | `occurrences` | `condominiums`, `units`, `resources`, `reservations`, `announcements`, `occurrences`, `bills` |
| 4 | `art_hub` | **Olivelas - Art Hub & Catálogo IA** | `allin_art_hub` | `art_hub` | `artworks` | `collections`, `artworks`, `ai_prompts`, `ai_queue` |
| 5 | `casa_organizada` | **Olivelas - Casa Organizada & Rotinas** | `allin_casa_organizada` | `casa_organizada` | `custom_tasks` | `household_profiles`, `global_default_tasks`, `custom_tasks`, `task_completions` |
| 6 | `contratos` | **Olivelas - Automação de Contratos** | `allin_contratos_automacao` | `contratos` | `generated_documents` | `workspaces`, `projects`, `clauses`, `generated_documents` |
| 7 | `especificacoes` | **Olivelas - Engenharia de Especificações** | `allin_especificacoes` | `especificacoes` | `specifications` | `workspaces`, `projects`, `sprints`, `specifications`, `snippets` |
| 8 | `gestao_estoque` | **Olivelas - Gestão de Estoque & PDV** | `allin_gestao_estoque` | `gestao_estoque` | `products` | `stores`, `store_users`, `categories`, `suppliers`, `products`, `stock_batches`, `orders` |
| 9 | `ordem_de_servico` | **Olivelas - Ordens de Serviço & Assistência** | `allin_ordem_servico` | `ordem_de_servico` | `service_orders` | `customers`, `devices`, `technicians`, `service_orders` |
| 10 | `personal_treiner` | **Olivelas - Personal Trainer** | `allin_personal_trainer` | `personal_treiner` | `students` | `trainers`, `students`, `exercises`, `workout_plans`, `nutrition_plans` |
| 11 | `restaurante` | **Olivelas - Gestão de Restaurantes & KDS** | `allin_restaurante` | `restaurante` | `orders` | `restaurants`, `products`, `restaurant_tables`, `orders` |
| 12 | `rifas` | **Olivelas - Rifas & Sorteios Digitais** | `allin_rifas` | `rifas` | `campaigns` | `campaigns`, `orders` |
| 13 | `sistema_delivery` | **Olivelas - Central de Delivery** | `allin_delivery` | `sistema_delivery` | `delivery_orders` | `stores`, `couriers`, `delivery_orders` |
| 14 | `sistema_mercado` | **Olivelas - Supermercado & Cestas** | `allin_mercado` | `sistema_mercado` | `breakfast_baskets` | `products`, `breakfast_baskets`, `catalog_requests` |
| 15 | `suite_rifa` | **Olivelas - Suíte Multi-Organização de Rifas** | `allin_suite_rifa` | `suite_rifa` | `campaigns` | `organizations`, `campaigns` |
| 16 | `vitrine_digital` | **Olivelas - Vitrine Digital & Analisador IA** | `allin_vitrine_digital` | `vitrine_digital` | `art_submissions` | `art_submissions`, `image_analysis` |

---

## 4. As 5 Abas Operacionais de Cada Módulo Olivelas

Ao abrir qualquer uma das 16 plataformas em `/app/global/ecossistema/:moduleSlug` ou `/app/empresa/:empresaId/ecossistema/:moduleSlug`, o operador dispõe de **5 abas de produção 100% funcionais**:

1. **Interface Operacional (`interactive`):**
   - Sub-navegação interativa fiel ao domínio do módulo (ex.: *PDV & Frente de Caixa*, *Lotes FEFO*, *Prescrição de Treinos*, *KDS Cozinha*, *Torre de Despacho*, *Construtor de Cláusulas*), KPIs calculados em tempo real e ações rápidas conectadas ao Supabase.
2. **CRUD Multi-Tabela PostgreSQL (`database`):**
   - Seletor de todas as tabelas do schema PostgreSQL do módulo (`<schema>.<tabela>`), busca textual, filtro de status, criação, edição em modal, arquivamento lógico, restauração, exclusão física (quando autorizado) e exportação CSV/JSON.
3. **RAG & Copiloto IA (`rag`):**
   - Gestão completa da base de conhecimento RAG do módulo (`public.allin_rag_documents`), botão **"Indexar Tabelas do Schema no RAG"** e chat interativo com o **Copiloto IA Olivelas** (`public.allin_ai_chat_messages`) com citações de documentos e registros reais do banco.
4. **API Studio PostgREST (`api`):**
   - Executor HTTP em tempo real contra `${VITE_SUPABASE_URL}/rest/v1/<tabela>` com cabeçalhos `Accept-Profile: <schema>` / `Content-Profile: <schema>`, seletor de método (`GET`, `POST`, `PATCH`, `DELETE`), gerador de snippet `cURL`, medição de latência real e gravação automática em `public.allin_api_history`.
5. **Permissões HBAC do Módulo (`hbac`):**
   - Inspeção em tempo real das 7 ações granulares (`view`, `create`, `edit`, `archive`, `export`, `approve`, `administer`) do usuário logado naquele módulo específico e matriz dos papéis corporativos.

---

## 5. Motor HBAC Hierárquico e Permissões Granulares

O motor HBAC (`src/services/hbacService.ts` e `src/pages/shared/UsersAndHbacModule.tsx`) combina:

- **Herança Hierárquica de Papéis:** Papéis herdam permissões de papéis superiores (`parentRoleId`).
- **Exceções Individuais (`Permission Overrides`):** Concessões (`allow`) ou revogações (`deny`) auditadas por usuário, recurso, ação e empresa.
- **Permissões Granulares por Módulo (`granular_permissions` em `public.profiles`):** Matriz interativa de `16 Módulos Comerciais × 7 Ações` configurável diretamente na ficha de cada usuário e sincronizada no Supabase.
- **Prevenção de Elevação de Privilégios (`validateNoPrivilegeEscalation`):** Impede que operadores concedam papéis ou permissões acima do seu próprio nível hierárquico.
- **Modo de Suporte Auditado (`Impersonation Context`):** Administradores globais podem ingressar temporariamente no contexto de uma empresa cliente com banner de auditoria visível e rastreabilidade integral.

---

## 6. Catálogo de Módulos Base (Exemplos de Fundação)

Os 10 módulos originais de fundação permanecem disponíveis na aba **"Módulos de Exemplo (10 Base)"** da loja modular:
`allin_core`, `allin_equipe`, `allin_estoque`, `allin_vendas`, `allin_crm`, `allin_financeiro`, `allin_contratos`, `allin_suporte`, `allin_analytics` e `allin_api_hub`.

---

## 7. Mapa Completo de Rotas e Telas

### 7.1. Área Pública & Autenticação Supabase
- `/` — Landing Page Executiva atualizada com vitrine das 16 Plataformas Comerciais Olivelas
- `/planos` — Planos Comerciais e Simulador Modular
- `/login` — Autenticação Real no Supabase (`bcrypt` + proteção brute-force + troca rápida de perfil)
- `/cadastro` — Auto-provisionamento de Nova Empresa + Administrador no Supabase
- `/recuperar-senha` — Redefinição de Senha Corporativa direto no Supabase (`public.change_olivelas_password`)
- `/termos` e `/privacidade` — Governança Legal, LGPD e Retenção Imutável

### 7.2. Console Global da Plataforma (`/app/global`)
- `/app/global` — Dashboard Executivo Global
- `/app/global/ecossistema` — **Hub das 16 Plataformas Comerciais Olivelas**
- `/app/global/ecossistema/:moduleSlug` — **Workspace Completo do Módulo (Live UI + CRUD Multi-Tabela + RAG + API + HBAC)**
- `/app/global/empresas` | `/nova` | `/:empresaId` | `/:empresaId/editar` | `/:empresaId/usuarios` | `/:empresaId/modulos` | `/:empresaId/contratos` | `/:empresaId/financeiro`
- `/app/global/usuarios` | `/novo` | `/:usuarioId` | `/:usuarioId/editar` (inclui Matriz Granular dos 16 Módulos + Redefinição de Senha Supabase)
- `/app/global/papeis` — Hierarquia de Papéis HBAC e Simulador de Permissões
- `/app/global/modulos` | `/novo` | `/:moduloId` | `/:moduloId/editar`
- `/app/global/contratos` | `/novo` | `/:contratoId` | `/:contratoId/editar` (com Assinatura Eletrônica SHA-256)
- `/app/global/financeiro` | `/cobrancas` | `/pagamentos` | `/parcelas` | `/conciliacao` | `/relatorios`
- `/app/global/meios-pagamento` | `/novo` | `/:metodoId` | `/:metodoId/editar`
- `/app/global/api-hub/servicos` | `/colecoes` | `/ambientes` | `/tokens` | `/historico` | `/servicos/:servicoId/testar` (com proteção Anti-SSRF + chamada Live PostgREST)
- `/app/global/tickets` | `/auditoria` (com sincronização `public.allin_audit_events` + exportação JSON Forense) | `/relatorios`

### 7.3. Ambiente da Empresa Cliente (`/app/empresa/:empresaId`)
- `/app/empresa/:empresaId` — Dashboard Executivo da Empresa
- `/app/empresa/:empresaId/ecossistema` — **Hub das 16 Plataformas Olivelas da Empresa**
- `/app/empresa/:empresaId/ecossistema/:moduleSlug` — **Operação Completa do Módulo no Escopo do Tenant**
- `/app/empresa/:empresaId/usuarios` | `/novo` | `/:usuarioId` | `/:usuarioId/editar`
- `/app/empresa/:empresaId/papeis`, `/modulos`, `/contratos`, `/financeiro`
- `/app/empresa/:empresaId/operacao/estoque`, `/operacao/vendas`, `/operacao/crm`
- `/app/empresa/:empresaId/tickets`, `/auditoria`, `/relatorios`

---

## 8. Design System, 30 Temas e Internacionalização (`PT-BR`, `EN`, `ES`)

- **30 Temas Visuais (`src/styles/themes.ts`):** 15 Temas Claros e 15 Temas Escuros aplicáveis em tempo real.
- **3 Idiomas Completos (`src/i18n/translations.ts`):** Português (`pt-BR`), Inglês (`en`) e Espanhol (`es`) com formatação nativa de moedas (`BRL`, `USD`, `EUR`) e datas.
- **Responsividade Integral:** Barra lateral retrátil em dispositivos móveis/tablets, tabelas com rolagem horizontal fluida e modais adaptáveis.

---

## 9. Estrutura de Diretórios e Migrations SQL

```text
olivelas-allin/
├── .env.example                # Template seguro de variáveis de ambiente (Supabase & PostgreSQL)
├── start.sh                    # Script de inicialização rápida do Olivelas All In
├── package.json                # Scripts de desenvolvimento, build, testes e migrations
├── supabase/
│   └── migrations/
│       ├── 20261109000001_unified_auth_and_allin_core.sql  # Login único (public.profiles) + Core All In
│       ├── 20261109000002_all_16_project_schemas.sql       # Criação dos 16 schemas dedicados (77 tabelas) + Seed
│       └── 20261109000003_real_auth_rag_api_hbac.sql       # Auth Bcrypt RPCs + RAG + Copiloto IA + Entity Store
├── scripts/
│   ├── migrate-supabase.mjs    # Executor de todas as migrations SQL no Supabase PostgreSQL
│   └── standardize-projects.mjs # Padronizador arquitetural dos 16 projetos em /projetos
├── projetos/                   # 16 plataformas Olivelas padronizadas (clientes Supabase + migrations)
└── src/
    ├── lib/supabase/client.ts  # Cliente Supabase unificado (multi-schema + public.profiles)
    ├── services/
    │   ├── supabaseAuthService.ts      # Autenticação real, cadastro, troca de senha e matriz granular
    │   ├── olivelasEcosystemService.ts # Catálogo, CRUD multi-tabela, RAG, Copiloto IA e API PostgREST
    │   ├── hbacService.ts              # Motor HBAC hierárquico e validação anti-escalação
    │   └── operationalUtils.ts         # Exportação CSV e filtro de segurança Anti-SSRF
    ├── pages/
    │   ├── public/PublicPages.tsx                  # Landing page, Login real, Cadastro, Recuperar Senha
    │   ├── company/OlivelasEcosystemHub.tsx        # Hub e Workspace de 5 abas das 16 Plataformas Olivelas
    │   ├── global/CompaniesModule.tsx              # Governança multiempresa e contexto de suporte
    │   ├── global/ApiHubModule.tsx                 # API Hub com executor Anti-SSRF + Live PostgREST
    │   └── shared/
    │       ├── UsersAndHbacModule.tsx              # Gestão de usuários, senhas e matriz HBAC de 16 módulos
    │       ├── ModulesAndContractsModule.tsx       # Loja modular e contratos com assinatura SHA-256
    │       ├── FinanceModule.tsx                   # Faturamento, parcelas, conciliação e meios de pagamento
    │       ├── TicketsAuditAndOperationsModule.tsx # Tickets, auditoria forense Supabase e operação base
    │       └── DashboardsAndReports.tsx            # Dashboards executivos e relatórios analíticos
    └── test/
        └── app.test.tsx        # 10 suítes automatizadas de arquitetura, segurança, RAG e HBAC (Vitest)
```

---

## 10. Como Iniciar, Migrar o Banco, Padronizar Projetos, Testar e Compilar

### 1. Configurar variáveis de ambiente
```bash
cp .env.example .env
# Preencha o arquivo .env com as credenciais do seu projeto Supabase (nunca versionado no Git)
```

### 2. Executar as migrations no Supabase PostgreSQL
```bash
npm run db:migrate
```

### 3. Padronizar os 16 projetos em `/projetos` (opcional / já executado)
```bash
npm run projects:standardize
```

### 4. Iniciar o servidor de desenvolvimento
```bash
./start.sh
# ou
npm start
```

### 5. Validar checagem de tipos, suíte de testes e build de produção
```bash
npm run typecheck
npm test
npm run build
```
