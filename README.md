# Olivelas All In — Plataforma SaaS Multiempresa, Ecossistema de 37 Plataformas Comerciais, Multi-Schema Supabase, RAG & Governança HBAC (`v2.0.0`)

![Version](https://img.shields.io/badge/version-2.0.0--production-0f172a?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6?style=flat-square)
![React](https://img.shields.io/badge/React-19.0-149eca?style=flat-square)
![Vite](https://img.shields.io/badge/Vite-6.x-646cff?style=flat-square)
![Database](https://img.shields.io/badge/Supabase-PostgreSQL%2017%20(27%20Schemas%20%2B%20public)-10b981?style=flat-square)
![Platforms](https://img.shields.io/badge/Plataformas%20Comerciais-37%20Apps%20(:4101--4137)-f59e0b?style=flat-square)
![Auth](https://img.shields.io/badge/SSO%20%26%20Auth-Global%20Admin%20Unificado%20%2B%20Bcrypt-2563eb?style=flat-square)
![RAG](https://img.shields.io/badge/RAG%20%26%20IA-Copiloto%20Contextual%2037%20M%C3%B3dulos-0d9488?style=flat-square)
![i18n](https://img.shields.io/badge/i18n-PT--BR%20%7C%20EN%20%7C%20ES-4f46e5?style=flat-square)
![Themes](https://img.shields.io/badge/Themes-15%20Light%20%2B%2015%20Dark-d97706?style=flat-square)

**Olivelas All In** é a plataforma corporativa SaaS multiempresa pronta para produção que unifica a governança central (**Autenticação Real no Supabase, Motor HBAC Granular, Gestão de Empresas, Catálogo Unificado com Modal e Menu Dropdown, Contratos com Assinatura SHA-256, Financeiro, API Hub PostgREST, Chamados e Auditoria Forense**) com as **37 Plataformas Comerciais Olivelas** localizadas em `/projetos` (servidas nas portas `:4101` a `:4137`), operando sobre o **PostgreSQL 17 (Supabase)** com **Administrador Global único (`willian.o.jesus@gmail.com`)**, **27 schemas dedicados**, **7 aplicações de Página Estática**, **SSO com URL limpa (`/<aplicacao>`)** e **Barra Inferior com Seletor de 3 Camadas (`Landing Page`, `Tela de Login (Visualização)` e `Administração SSO`)**.

---

## Sumário

1. [Arquitetura de Produção (Login Único + 27 Schemas Supabase + 37 Plataformas)](#1-arquitetura-de-produção-login-único--27-schemas-supabase--37-plataformas)
2. [Administrador Global Único (`willian.o.jesus@gmail.com`) & Primeiro Acesso no Supabase](#2-administrador-global-único-willianojeusgmailcom--primeiro-acesso-no-supabase)
3. [SSO All In, URL Limpa (`/<app>`) e Seletor de 3 Camadas na Barra Inferior](#3-sso-all-in-url-limpa-app-e-seletor-de-3-camadas-na-barra-inferior)
4. [Catálogo Completo das 37 Plataformas Comerciais (`:4101` a `:4137`)](#4-catálogo-completo-das-37-plataformas-comerciais-4101-a-4137)
5. [Páginas Estáticas (Frontend Puro) vs Plataformas Multi-Schema](#5-páginas-estáticas-frontend-puro-vs-plataformas-multi-schema)
6. [As 5 Abas Operacionais de Cada Módulo no Console Principal](#6-as-5-abas-operacionais-de-cada-módulo-no-console-principal)
7. [Motor HBAC Hierárquico, Tabelas Sem Scroll Horizontal e UI Unificada](#7-motor-hbac-hierárquico-tabelas-sem-scroll-horizontal-e-ui-unificada)
8. [Mapa Completo de Rotas e Telas](#8-mapa-completo-de-rotas-e-telas)
9. [Estrutura de Diretórios, Scripts e Migrations SQL](#9-estrutura-de-diretórios-scripts-e-migrations-sql)
10. [Como Iniciar (`./start`), Parar (`./start stop`), Testar e Compilar](#10-como-iniciar-start-parar-start-stop-testar-e-compilar)

---

## 1. Arquitetura de Produção (Login Único + 27 Schemas Supabase + 37 Plataformas)

- **Base Única de Autenticação (`public.profiles` & `auth.users`):**
  - O Console Principal (`http://localhost:5174`) e todas as **37 plataformas comerciais** (`http://localhost:4101` a `http://localhost:4137`) compartilham a identidade central do **Super Administrador Global**: **`Willian Jesus (willian.o.jesus@gmail.com)`**.
  - Senhas são armazenadas com hash `bcrypt` (`pgcrypto`) em `public.profiles` e sincronizadas com `auth.users` do Supabase Auth via RPCs `SECURITY DEFINER`.
- **Isolamento Multi-Schema no PostgreSQL (27 Schemas Dedicados):**
  - Os projetos com persistência em banco de dados possuem seu próprio schema PostgreSQL isolado no Supabase (`CREATE SCHEMA IF NOT EXISTS <schema>`), exposto no PostgREST para consultas e mutações diretas via `supabase.schema('<schema>').from('<tabela>')`.
- **Identidade Visual Própria & Favicons SVG Exclusivos (`/favicon.svg`):**
  - 100% independente de ferramentas ou plugins externos (zero dependências Lovable).
  - Cada uma das 37 plataformas e o Console Principal possuem seu próprio `/favicon.svg` vetorial exclusivo desenhado sob medida para o seu domínio e título padronizado **`Olivelas - <Nome da Aplicação>`**.

---

## 2. Administrador Global Único (`willian.o.jesus@gmail.com`) & Primeiro Acesso no Supabase

Todos os usuários demonstrativos legados foram removidos do banco de dados, dos seeds e das plataformas em `/projetos`, mantendo exclusivamente o **Global Admin oficial**:

| Nome | E-mail Corporativo | Papel HBAC | Nível HBAC | Escopo |
| :--- | :--- | :--- | :---: | :--- |
| **Willian Jesus** | `willian.o.jesus@gmail.com` | `GLOBAL_ADMIN` (Super Administrador) | `100` | Console Global + Todas as 4 Empresas + Todas as 37 Plataformas |

### Fluxo de Configuração de Senha no Primeiro Login
- Ao informar `willian.o.jesus@gmail.com` em `/login`, caso `must_setup_password = TRUE`, a plataforma exibe automaticamente o modal de **Configuração de Senha no Primeiro Acesso**.
- A senha definida é gravada diretamente no **Supabase PostgreSQL real** (`public.profiles.password_hash` via `public.setup_initial_olivelas_password`) e espelhada em `auth.users`.

---

## 3. SSO All In, URL Limpa (`/<app>`) e Seletor de 3 Camadas na Barra Inferior

Ao abrir qualquer uma das 37 plataformas comerciais (`4101`–`4137`), o servidor de instâncias (`scripts/serve-single-module.mjs`) autentica automaticamente o Super Administrador (`willian.o.jesus@gmail.com`) e mantém uma **sessão SSO ativa persistente** (`localStorage` + cookies HTTP compartilhados `allin_sso_session` e `allin_sso_active=1`).

### URL Limpa com Apenas o Nome da Aplicação
- Após autenticado, nenhum parâmetro de query string (`?allin_sso=1&instance_id=...&company_id=...`) permanece exposto na barra de endereços.
- A URL exibida no navegador contém exclusivamente o nome/slug da aplicação logada:
  - `http://localhost:4129/loja_simples_hortifruti`
  - `http://localhost:4110/personal_treiner`
  - `http://localhost:4108/gestao_estoque`
  - `http://localhost:4101/agendamento_simples`

### Barra Inferior com Seletor das 3 Camadas da Aplicação
Na barra inferior (`#olivelas-allin-instance-pill`) de todas as 37 aplicações (`4101` a `4137`), o usuário pode alternar em tempo real entre as **3 camadas da aplicação**:

1. **🌐 `Landing Page`:**
   - Acessa a vitrine pública ou página institucional da aplicação (ex.: em `:4129` `loja_simples_hortifruti`, exibe o catálogo público completo de frutas, verduras, busca e carrinho WhatsApp em `/index.html`, sem redirecionamento forçado para o admin).
2. **🔒 `Tela de Login (Visualização)`:**
   - Exibe a tela de login da aplicação em **modo somente visualização e sem funcionalidade** (todos os campos e botões permanecem desabilitados com `disabled` / `readonly`), preservando a sessão SSO ativa do usuário sem deslogá-lo.
3. **🛡️ `Administração (SSO)`:**
   - Acessa o painel administrativo/operacional da aplicação com a sessão SSO ativa de **`Willian Jesus (willian.o.jesus@gmail.com)`** aplicada.

---

## 4. Catálogo Completo das 37 Plataformas Comerciais (`:4101` a `:4137`)

| # | Porta & URL Limpa | Diretório (`/projetos`) | Nome Oficial da Aplicação | Tipo / Classificação | Schema PostgreSQL / Armazenamento |
| :-: | :--- | :--- | :--- | :--- | :--- |
| 1 | `:4101/agendamento_simples` | `agendamento_simples` | **Olivelas - Consultório & Odonto** | Plataforma Multi-Schema | `agendamento_simples` (`7 tabelas`) |
| 2 | `:4102/agendamentos` | `agendamentos` | **Olivelas - Clínicas & Agendamentos** | Plataforma Multi-Schema | `agendamentos` (`7 tabelas`) |
| 3 | `:4103/app_condominio` | `app_condominio` | **Olivelas - Gestão de Condomínios** | Plataforma Multi-Schema | `app_condominio` (`7 tabelas`) |
| 4 | `:4104/art_hub` | `art_hub` | **Olivelas - Art Hub & Catálogo IA** | Plataforma Multi-Schema | `art_hub` (`4 tabelas`) |
| 5 | `:4105/casa_organizada` | `casa_organizada` | **Olivelas - Casa Organizada & Rotinas** | Plataforma Multi-Schema | `casa_organizada` (`4 tabelas`) |
| 6 | `:4106/contratos` | `contratos` | **Olivelas - Automação de Contratos** | Plataforma Multi-Schema | `contratos` (`4 tabelas`) |
| 7 | `:4107/especificacoes` | `especificacoes` | **Olivelas - Engenharia de Especificações** | Plataforma Multi-Schema | `especificacoes` (`5 tabelas`) |
| 8 | `:4108/gestao_estoque` | `gestao_estoque` | **Olivelas - Gestão de Estoque & PDV** | Plataforma Multi-Schema | `gestao_estoque` (`7 tabelas`) |
| 9 | `:4109/ordem_de_servico` | `ordem_de_servico` | **Olivelas - Ordens de Serviço & Assistência** | Plataforma Multi-Schema | `ordem_de_servico` (`4 tabelas`) |
| 10 | `:4110/personal_treiner` | `personal_treiner` | **Olivelas - Personal Trainer** | Plataforma Multi-Schema | `personal_treiner` (`5 tabelas`) |
| 11 | `:4111/restaurante` | `restaurante` | **Olivelas - Gestão de Restaurantes & KDS** | Plataforma Multi-Schema | `restaurante` (`4 tabelas`) |
| 12 | `:4112/rifas` | `rifas` | **Olivelas - Rifas & Sorteios Digitais** | Plataforma Multi-Schema | `rifas` (`2 tabelas`) |
| 13 | `:4113/sistema_delivery` | `sistema_delivery` | **Olivelas - Central de Delivery** | Plataforma Multi-Schema | `sistema_delivery` (`3 tabelas`) |
| 14 | `:4114/sistema_mercado` | `sistema_mercado` | **Olivelas - Supermercado & Cestas** | Plataforma Multi-Schema | `sistema_mercado` (`3 tabelas`) |
| 15 | `:4115/suite_rifa` | `suite_rifa` | **Olivelas - Suíte Multi-Organização de Rifas** | Plataforma Multi-Schema | `suite_rifa` (`2 tabelas`) |
| 16 | `:4116/vitrine_digital` | `vitrine_digital` | **Olivelas - Vitrine Digital & Analisador IA** | Plataforma Multi-Schema | `vitrine_digital` (`2 tabelas`) |
| 17 | `:4117/album_figurinhas` | `album_figurinhas` | **Olivelas - Álbum de Figurinhas Digital** | Plataforma Multi-Schema | `album_figurinhas` (`3 tabelas`) |
| 18 | `:4118/artes_caneca` | `artes_caneca` | **Olivelas - Estúdio de Artes & Canecas** | Plataforma Multi-Schema | `artes_caneca` (`3 tabelas`) |
| 19 | `:4119/casa_organizada_ai` | `casa_organizada_ai` | **Olivelas - Casa Organizada AI & Automação** | Plataforma Multi-Schema | `casa_organizada_ai` (`3 tabelas`) |
| 20 | `:4120/cesta_cafe_manha` | `cesta_cafe_manha` | **Olivelas - Cestas de Café & Presentes** | Plataforma Multi-Schema | `cesta_cafe_manha` (`3 tabelas`) |
| 21 | `:4121/collection_vault` | `collection_vault` | **Olivelas - Collection Vault & Acervos** | Plataforma Multi-Schema | `collection_vault` (`3 tabelas`) |
| 22 | `:4122/dashboard_bi` | `dashboard_bi` | **Olivelas - Dashboard BI & Analytics** | Plataforma Multi-Schema | `dashboard_bi` (`3 tabelas`) |
| 23 | `:4123/forms` | `forms` | **Olivelas - IAM Forms & Pesquisas** | Plataforma Multi-Schema | `forms` (`3 tabelas`) |
| 24 | `:4124/forms_pro` | `forms_pro` | **Olivelas - Forms Pro Enterprise** | Plataforma Multi-Schema | `forms_pro` (`3 tabelas`) |
| 25 | `:4125/gerenciador_tunnel_apps` | `gerenciador_tunnel_apps` | **Olivelas - Gerenciador de Túneis & Apps** | API Local + SQLite | API Integrada (`/api/apps`, `/api/settings`) |
| 26 | `:4126/iam_suite` | `iam_suite` | **Olivelas - IAM Suite & Governança** | Plataforma Multi-Schema | `iam_suite` (`3 tabelas`) |
| 27 | `:4127/inventario_jogos` | `inventario_jogos` | **Olivelas - Inventário de Jogos & Mídias** | Plataforma Multi-Schema | `inventario_jogos` (`3 tabelas`) |
| 28 | `:4128/link_promo` | `link_promo` | **Olivelas - Link Promo & Afiliados** | Plataforma Multi-Schema | `link_promo` (`3 tabelas`) |
| 29 | `:4129/loja_simples_hortifruti` | `loja_simples_hortifruti` | **Olivelas - Hortifruti & Feira Fresca** | **Página Estática** | Frontend Estático (`index.html` + `admin/index.html`) |
| 30 | `:4130/loja_simples_vendas` | `loja_simples_vendas` | **Olivelas - Loja Simples de Vendas** | **Página Estática** | Frontend Estático (`index.html` + JSON/Storage) |
| 31 | `:4131/qrcode_maker` | `qrcode_maker` | **Olivelas - Estúdio QR Code & PIX** | **Página Estática** | Frontend Estático SPA (Client-Side) |
| 32 | `:4132/site_simpes_vendas_velas` | `site_simpes_vendas_velas` | **Olivelas - Boutique de Velas Artesanais** | **Página Estática** | Frontend Estático (`index.html`) |
| 33 | `:4133/site_simples_personal_trainer` | `site_simples_personal_trainer` | **Olivelas - Landing Personal Trainer** | **Página Estática** | Frontend Estático (`index.html`) |
| 34 | `:4134/site_simples_produtos_naturais` | `site_simples_produtos_naturais` | **Olivelas - Empório Produtos Naturais** | **Página Estática** | Frontend Estático (`index.html`) |
| 35 | `:4135/site_simples_ti` | `site_simples_ti` | **Olivelas - Consultoria & Soluções de TI** | **Página Estática** | Frontend Estático (`index.html`) |
| 36 | `:4136/sync_google_drive` | `sync_google_drive` | **Olivelas - Sync Google Drive & Backup** | API Local + SQLite | API Integrada (`/api/auth/status`, `/api/folders`) |
| 37 | `:4137/visualizador_dashboad_ai` | `visualizador_dashboad_ai` | **Olivelas - Visualizador Dashboard AI** | API Local + SQLite | API Integrada (`/api/auth/me`, `/api/projects`) |

---

## 5. Páginas Estáticas (Frontend Puro) vs Plataformas Multi-Schema

As 7 aplicações voltadas para vitrine, catálogo rápido, geração client-side ou landing page comercial sem dependência de backend (`:4129` a `:4135`) possuem a propriedade `isStaticPage: true` e são identificadas em toda a plataforma com o badge **`Página Estática`**:
- Na listagem unificada de módulos (`/app/global/modulos`), a coluna de arquitetura exibe **`Página Estática (Frontend Puro)`** em vez de schema PostgreSQL.
- No modal de detalhes da aplicação (`ModuleDetailsModal`), no Hub do Ecossistema (`/app/global/ecossistema`), na tela de detalhes da empresa (`/app/global/empresas/:id`) e na barra inferior de SSO, o selo **`Página Estática`** destaca claramente sua natureza leve e independente de banco de dados.

---

## 6. As 5 Abas Operacionais de Cada Módulo no Console Principal

Ao inspecionar qualquer módulo em `/app/global/ecossistema/:moduleSlug` ou `/app/empresa/:empresaId/ecossistema/:moduleSlug`, o operador dispõe de **5 abas de produção**:

1. **Interface Operacional (`interactive`):** KPIs em tempo real, sub-navegação de domínio e atalho direto para abrir a instância dedicada (`/<folder>`).
2. **CRUD Multi-Tabela PostgreSQL (`database`):** Operação completa sobre todas as tabelas do schema PostgreSQL do módulo (`<schema>.<tabela>`), com criação, edição, arquivamento lógico, restauração e exportação CSV.
3. **RAG & Copiloto IA (`rag`):** Base de conhecimento RAG (`public.allin_rag_documents`), indexação automática de tabelas e chat contextual (`public.allin_ai_chat_messages`).
4. **API Studio PostgREST (`api`):** Executor HTTP em tempo real com cabeçalhos `Accept-Profile` / `Content-Profile` e geração de `cURL`.
5. **Permissões HBAC do Módulo (`hbac`):** Matriz das 7 ações granulares (`view`, `create`, `edit`, `archive`, `export`, `approve`, `administer`) do usuário logado.

---

## 7. Motor HBAC Hierárquico, Tabelas Sem Scroll Horizontal e UI Unificada

- **Listagem Unificada em Tabela Única (`/app/global/modulos` e `/app/global/ecossistema`):**
  - Todos os módulos são apresentados em uma única lista tabular consolidada (sem cards fragmentados).
  - **Modal de Detalhes (`ModuleDetailsModal`):** Exibe todas as informações técnicas, KPIs, recursos, arquitetura (`Página Estática` vs `Schema PostgreSQL`) e fecha com botão **X**, tecla `ESC` ou clique fora.
  - **Menu Dropdown de Ações (`ActionDropdownMenu`):** Agrupa todas as ações de cada linha (*Ver Detalhes*, *Abrir Plataforma SSO*, *CRUD & RAG*, *Editar*, *Ativar/Desativar*) em um único menu suspenso inteligente com posicionamento automático (`fixed`).
- **Zero Scroll Horizontal em Todas as Tabelas:**
  - Todas as tabelas e modais utilizam layout fluido (`table-layout: fixed`, `overflow-x: hidden`, quebra inteligente de palavras e ocultação progressiva de colunas secundárias em telas menores), eliminando qualquer barra de rolagem horizontal.

---

## 8. Mapa Completo de Rotas e Telas

### 8.1. Área Pública & Autenticação Supabase (`http://localhost:5174`)
- `/` — Landing Page Executiva Olivelas All In
- `/planos` — Planos Comerciais e Simulador Modular
- `/login` — Autenticação Real no Supabase (`willian.o.jesus@gmail.com` + configuração de senha no 1º login)
- `/cadastro` — Auto-provisionamento de Nova Empresa + Administrador no Supabase
- `/recuperar-senha` — Redefinição de Senha Corporativa direto no Supabase

### 8.2. Console Global da Plataforma (`/app/global`)
- `/app/global` — Dashboard Executivo Global
- `/app/global/ecossistema` — Hub Unificado das 37 Plataformas Comerciais Olivelas
- `/app/global/ecossistema/:moduleSlug` — Workspace de 5 Abas do Módulo
- `/app/global/modulos` — Catálogo Unificado (37 Plataformas Comerciais + 10 Módulos Base) com Modal de Detalhes e Menu Dropdown
- `/app/global/empresas` | `/usuarios` | `/papeis` | `/contratos` | `/financeiro` | `/meios-pagamento` | `/api-hub/servicos` | `/tickets` | `/auditoria` | `/relatorios`

---

## 9. Estrutura de Diretórios, Scripts e Migrations SQL

```text
olivelas-allin/
├── .env.example                                     # Template de variáveis de ambiente (Supabase & PostgreSQL)
├── start                                            # Gerenciador de processos: ./start [start|stop|restart|status]
├── start.sh                                         # Wrapper compatível que delega para ./start
├── favicon.svg                                      # Favicon SVG oficial do Console Olivelas All In
├── README.md                                        # Documentação principal da plataforma
├── PRODUCT.md                                       # Especificação de produto e governança
├── DESIGN.md                                        # Especificação do Design System e tabelas responsivas
├── supabase/
│   └── migrations/
│       ├── 20261109000001_unified_auth_and_allin_core.sql
│       ├── 20261109000002_all_16_project_schemas.sql
│       ├── 20261109000003_real_auth_rag_api_hbac.sql
│       ├── 20261110000004_single_global_admin_willian.sql
│       └── 20261110000005_new_21_projects_and_global_admin.sql
├── scripts/
│   ├── start-all-modules.mjs                        # Orquestrador das 37 plataformas nas portas 4101–4137
│   ├── serve-single-module.mjs                      # Servidor SSO com URL limpa (/<app>) e barra de 3 camadas
│   ├── update-favicons-and-clean-lovable.mjs        # Gerador dos 38 favicons SVG e limpeza de pacotes legados
│   ├── verify-all-platforms-sso-favicons.mjs        # Verificador automatizado das 37 portas, SSO, camadas e favicons
│   └── apply-single-admin-willian.mjs               # Provisionamento do Global Admin único no Supabase
├── projetos/                                        # 37 aplicações comerciais completas e padronizadas
└── src/                                             # Código-fonte do Console Principal (React 19 + TypeScript)
```

---

## 10. Como Iniciar (`./start`), Parar (`./start stop`), Testar e Compilar

### 1. Gerenciar os serviços com o script `./start`
O script [`./start`](file:///home/willian/Downloads/projetos/olivelas-allin/start) gerencia em background tanto o Console Principal (`:5174`) quanto as 37 plataformas comerciais (`:4101` a `:4137`):

```bash
# Iniciar todos os serviços (sem argumentos ou com 'start')
./start
# ou
./start start

# Parar todos os serviços e liberar as portas 5174 e 4101..4137
./start stop

# Reiniciar todos os serviços
./start restart

# Verificar o status de todas as portas e processos
./start status
```

### 2. Verificar automaticamente todas as 37 plataformas, URLs limpas, 3 camadas e SSO
```bash
node scripts/verify-all-platforms-sso-favicons.mjs
```

### 3. Executar checagem de tipos, testes automatizados e build de produção
```bash
npm run typecheck
npm test
npm run build
```
