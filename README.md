# Olivelas All In — Ecossistema Multi-Schema Supabase & Governança Multiempresa (`v1.0.0`)

![Version](https://img.shields.io/badge/version-1.0.0-0f172a?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6?style=flat-square)
![React](https://img.shields.io/badge/React-19.0-149eca?style=flat-square)
![Vite](https://img.shields.io/badge/Vite-6.x-646cff?style=flat-square)
![Database](https://img.shields.io/badge/Supabase-PostgreSQL%2017%20(16%20Schemas%20%2B%20public)-10b981?style=flat-square)
![Storage](https://img.shields.io/badge/Fallback-IndexedDB-059669?style=flat-square)
![i18n](https://img.shields.io/badge/i18n-PT--BR%20%7C%20EN%20%7C%20ES-4f46e5?style=flat-square)
![Themes](https://img.shields.io/badge/Themes-15%20Light%20%2B%2015%20Dark-d97706?style=flat-square)

**Olivelas All In** é a plataforma corporativa SaaS multiempresa que unifica a governança central (HBAC, Contratos, Financeiro, API Hub, Chamados e Auditoria) com **16 plataformas verticais padronizadas** localizadas em `/projetos`, conectadas ao **PostgreSQL (Supabase)** com **login unificado em uma única tabela (`public.profiles`)** e **16 schemas dedicados** (um para cada módulo).

---

## Sumário

1. [Arquitetura Unificada no Supabase (Login Único + 16 Schemas)](#1-arquitetura-unificada-no-supabase-login-único--16-schemas)
2. [As 16 Plataformas Padronizadas do Ecossistema Olivelas](#2-as-16-plataformas-padronizadas-do-ecossistema-olivelas)
3. [Catálogo Comercial de Módulos Core](#3-catálogo-comercial-de-módulos-core)
4. [Perfis de Acesso, Login Único e Motor HBAC](#4-perfis-de-acesso-login-único-e-motor-hbac)
5. [Mapa Completo de Rotas e Telas](#5-mapa-completo-de-rotas-e-telas)
6. [Design System, 30 Temas e Internacionalização (`PT-BR`, `EN`, `ES`)](#6-design-system-30-temas-e-internacionalização-pt-br-en-es)
7. [Segurança, Variáveis de Ambiente (`.env`) e Governança](#7-segurança-variáveis-de-ambiente-env-e-governança)
8. [Estrutura de Diretórios](#8-estrutura-de-diretórios)
9. [Como Iniciar, Migrar o Banco, Testar e Compilar](#9-como-iniciar-migrar-o-banco-testar-e-compilar)

---

## 1. Arquitetura Unificada no Supabase (Login Único + 16 Schemas)

Toda a arquitetura de conexão, autenticação, permissões e migrations dos projetos foi padronizada tendo como referência o projeto **`gestao_estoque`** (`projetos/gestao_estoque`):

- **Login e Perfis Centralizados em Tabela Única (`public.profiles`):**
  - Todos os 16 módulos e o painel central do **Olivelas All In** compartilham a mesma tabela de autenticação e perfis de usuários no schema público: `public.profiles` (com view espelho `public.allin_users` e vínculo multiempresa `public.company_users`).
  - O cliente Supabase utiliza a chave de sessão unificada `storageKey: 'olivelas_supabase_auth_token'`, garantindo Single Sign-On (SSO) entre o All In e todos os módulos.
- **Isolamento Multi-Schema no PostgreSQL (16 Schemas Dedicados):**
  - Cada projeto em `/projetos/<modulo>` possui seu próprio schema PostgreSQL isolado no Supabase (`CREATE SCHEMA IF NOT EXISTS <schema>`), exposto no PostgREST para consultas diretas via `supabase.schema('<schema>').from('<tabela>')`.
  - Todas as tabelas de domínio possuem vínculo com `public.allin_companies(id)` (`company_id`) e `public.profiles(id)` (`user_id` / `created_by`), além de suporte a **arquivamento lógico** (`archive_metadata` — sem exclusão física).
- **Resiliência Híbrida (Supabase + Cache Local IndexedDB):**
  - O All In sincroniza em tempo real com o PostgreSQL no Supabase e mantém fallback automático em cache local/`IndexedDB` para operação contínua e execução determinística de testes automatizados.

---

## 2. As 16 Plataformas Padronizadas do Ecossistema Olivelas

Todas as 16 plataformas em `/projetos` foram renomeadas sob a identidade oficial **`Olivelas - <Nome da Plataforma>`**, padronizadas com cliente Supabase (`src/lib/supabase/client.ts`) e migrations dedicadas:

| # | Diretório (`/projetos`) | Nome Oficial da Plataforma | Slug no All In | Schema PostgreSQL | Tabela Operacional Principal | Tabelas no Schema |
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

## 3. Catálogo Comercial de Módulos Core

Além das 16 plataformas verticais, o **Olivelas All In** inclui os 10 módulos transversais de governança corporativa:

| Código Técnico | Nome do Módulo | Categoria | Dependências |
| :--- | :--- | :--- | :--- |
| `allin_core` | **Allin Core** | Core / Fundação | Base obrigatória da plataforma |
| `allin_equipe` | **Allin Equipe e Permissões** | Governança & HBAC | Depende de `allin_core` |
| `allin_estoque` | **Allin Estoque** | Operações & Suprimentos | Depende de `allin_core` |
| `allin_vendas` | **Allin Vendas e Pedidos** | Comercial & PDV | Depende de `allin_core` e `allin_estoque` |
| `allin_crm` | **Allin CRM** | Relacionamento & Funil | Depende de `allin_core` |
| `allin_financeiro` | **Allin Financeiro** | Finanças & Faturamento | Depende de `allin_core` |
| `allin_contratos` | **Allin Contratos** | Jurídico & Assinaturas | Depende de `allin_core` |
| `allin_suporte` | **Allin Suporte** | Atendimento & SLA | Depende de `allin_core` |
| `allin_analytics` | **Allin Analytics** | Inteligência & BI | Depende de `allin_core` |
| `allin_api_hub` | **Allin API Hub** | Integrações & Webhooks | Depende de `allin_core` |

---

## 4. Perfis de Acesso, Login Único e Motor HBAC

Ao alternar ou autenticar um usuário no All In, o perfil é sincronizado automaticamente com a tabela única **`public.profiles`** no Supabase (`syncUnifiedUserProfileToSupabase`).

### Regras do Motor HBAC (`src/services/hbacService.ts`)
- **Herança Hierárquica:** Papéis herdam permissões de papéis superiores (`parentRoleId`).
- **Exceções Individuais (`Permission Overrides`):** Concessões (`allow`) ou revogações (`deny`) explícitas por usuário, recurso, ação e empresa.
- **Matriz Efetiva de 105 Células:** Cruzamento de **15 recursos** × **7 ações** (`view`, `create`, `edit`, `archive`, `export`, `approve`, `administer`).
- **Prevenção de Elevação de Privilégios:** Bloqueio contra criação de papéis ou concessão de permissões superiores às do operador.
- **Modo de Suporte Auditado (`Impersonation Context`):** Acesso temporário rastreado em auditoria sem sobrescrever a identidade real do administrador global.

---

## 5. Mapa Completo de Rotas e Telas

### 5.1. Área Pública
- `/`, `/planos`, `/login`, `/recuperar-senha`, `/termos`, `/privacidade`

### 5.2. Console Global da Plataforma (`/app/global`)
- `/app/global` — Dashboard Executivo Global
- `/app/global/ecossistema` — **Hub das 16 Plataformas Olivelas & Schemas Supabase**
- `/app/global/ecossistema/:moduleSlug` — **Workspace Operacional Conectado ao Schema PostgreSQL do Módulo**
- `/app/global/empresas` | `/nova` | `/:empresaId` | `/:empresaId/editar`
- `/app/global/usuarios` | `/novo` | `/:usuarioId` | `/:usuarioId/editar`
- `/app/global/papeis`
- `/app/global/modulos` | `/novo` | `/:moduloId` | `/:moduloId/editar`
- `/app/global/contratos` | `/novo` | `/:contratoId` | `/:contratoId/editar`
- `/app/global/financeiro` | `/cobrancas` | `/pagamentos` | `/parcelas` | `/conciliacao` | `/relatorios`
- `/app/global/meios-pagamento` | `/novo` | `/:metodoId` | `/:metodoId/editar`
- `/app/global/api-hub/servicos` | `/colecoes` | `/ambientes` | `/tokens` | `/historico`
- `/app/global/tickets` | `/auditoria` | `/relatorios`

### 5.3. Ambiente da Empresa Cliente (`/app/empresa/:empresaId`)
- `/app/empresa/:empresaId` — Dashboard da Empresa
- `/app/empresa/:empresaId/ecossistema` — **Hub das 16 Plataformas Olivelas da Empresa**
- `/app/empresa/:empresaId/ecossistema/:moduleSlug` — **Operação em Tempo Real no Schema PostgreSQL do Módulo**
- `/app/empresa/:empresaId/usuarios`, `/papeis`, `/modulos`, `/contratos`, `/financeiro`
- `/app/empresa/:empresaId/operacao/estoque`, `/operacao/vendas`, `/operacao/crm`
- `/app/empresa/:empresaId/tickets`, `/auditoria`, `/relatorios`

---

## 6. Design System, 30 Temas e Internacionalização (`PT-BR`, `EN`, `ES`)

- **30 Temas Visuais (`src/styles/themes.ts`):** 15 Temas Claros e 15 Temas Escuros aplicáveis instantaneamente na barra superior.
- **3 Idiomas Completos (`src/i18n/translations.ts`):** Português (`pt-BR`), Inglês (`en`) e Espanhol (`es`) com formatação monetária e de datas nativa via `Intl`.

---

## 7. Segurança, Variáveis de Ambiente (`.env`) e Governança

1. **Proteção Estrita de Credenciais (`.gitignore`):**
   - Arquivos `.env` e `**/.env` (na raiz e dentro de `/projetos/*`) estão bloqueados no `.gitignore` e **jamais são versionados no Git**.
   - Use o arquivo [`.env.example`](.env.example) como modelo para configurar suas credenciais localmente.
2. **Zero Senhas em Código ou Repositórios:**
   - Nenhum código-fonte contém senhas de banco de dados, tokens privados ou chaves hardcoded.
3. **Zero Exclusão Física (`No Hard Delete`):**
   - Todos os módulos operam exclusivamente com arquivamento lógico (`archive_metadata`) auditado.
4. **Proteção Anti-SSRF (`validateSafeSandboxUrl`):**
   - Bloqueio automático de chamadas para redes privadas (`localhost`, `127.0.0.1`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.169.254`).

---

## 8. Estrutura de Diretórios

```text
olivelas-allin/
├── .env.example                # Template seguro de variáveis de ambiente (Supabase & PostgreSQL)
├── start.sh                    # Script de inicialização rápida do Olivelas All In
├── package.json                # Scripts e dependências unificadas
├── supabase/
│   └── migrations/
│       ├── 20261109000001_unified_auth_and_allin_core.sql  # Login único (public.profiles) + Core All In
│       └── 20261109000002_all_16_project_schemas.sql       # Criação dos 16 schemas dedicados + Seed
├── scripts/
│   ├── migrate-supabase.mjs    # Executor de migrations SQL no Supabase PostgreSQL
│   └── standardize-projects.mjs # Padronizador arquitetural dos 16 projetos (padrão gestao_estoque)
├── projetos/                   # 16 plataformas Olivelas padronizadas (clientes Supabase + migrations)
└── src/
    ├── lib/supabase/client.ts  # Cliente Supabase unificado (multi-schema + public.profiles)
    ├── services/
    │   ├── olivelasEcosystemService.ts # Catálogo, CRUD multi-schema e sincronização de login único
    │   ├── hbacService.ts      # Motor HBAC e matriz de 105 células
    │   └── operationalUtils.ts # Exportação CSV e segurança Anti-SSRF
    ├── pages/
    │   └── company/
    │       └── OlivelasEcosystemHub.tsx # Hub e Workspace Operacional das 16 Plataformas Olivelas
    └── test/
        └── app.test.tsx        # 10 suítes automatizadas (Vitest)
```

---

## 9. Como Iniciar, Migrar o Banco, Testar e Compilar

### 1. Configurar variáveis de ambiente
```bash
cp .env.example .env
# Edite o arquivo .env com as credenciais do seu projeto Supabase
```

### 2. Iniciar o projeto com o script automático
```bash
./start.sh
# ou
npm start
```

### 3. Executar as migrations no Supabase PostgreSQL
```bash
npm run db:migrate
```

### 4. Validar tipos, testes e build de produção
```bash
npm run typecheck
npm test
npm run build
```
