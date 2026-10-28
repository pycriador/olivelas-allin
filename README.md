# Olivelas Allin — Fundação Mock V1 (`v0.0.1`)

![Version](https://img.shields.io/badge/version-0.0.1-0f172a?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6?style=flat-square)
![React](https://img.shields.io/badge/React-19.0-149eca?style=flat-square)
![Vite](https://img.shields.io/badge/Vite-6.x-646cff?style=flat-square)
![Storage](https://img.shields.io/badge/Storage-IndexedDB-059669?style=flat-square)
![i18n](https://img.shields.io/badge/i18n-PT--BR%20%7C%20EN%20%7C%20ES-4f46e5?style=flat-square)
![Themes](https://img.shields.io/badge/Themes-15%20Light%20%2B%2015%20Dark-d97706?style=flat-square)

**Olivelas Allin** é uma plataforma SaaS B2B multiempresa projetada para que pequenas e médias empresas contratem sob demanda exclusivamente os módulos de gestão operacional de que precisam.

Esta entrega constitui a **Fundação Mock V1 (`v0.0.1`)**: uma aplicação web 100% navegável, funcional e executada localmente no navegador, com persistência real em **IndexedDB**, camada de repositórios desacoplada para futura migração a uma API REST/GraphQL, controle de acesso hierárquico (**HBAC**), isolamento lógico multiempresa (**Tenant Isolation**), trilha de auditoria imutável, **30 temas visuais** (15 claros e 15 escuros), responsividade mobile completa e internacionalização nativa em **Português (`pt-BR`)**, **Inglês (`en`)** e **Espanhol (`es`)**.

---

## Sumário

1. [Visão Geral e Princípios de Arquitetura](#1-visão-geral-e-princípios-de-arquitetura)
2. [Catálogo Comercial de Módulos](#2-catálogo-comercial-de-módulos)
3. [Perfis de Demonstração e Motor HBAC](#3-perfis-de-demonstração-e-motor-hbac)
4. [Empresas de Demonstração (Multi-Tenant Seed)](#4-empresas-de-demonstração-multi-tenant-seed)
5. [Mapa Completo de Rotas e Telas](#5-mapa-completo-de-rotas-e-telas)
6. [Persistência Local (IndexedDB) e Camada de Repositórios](#6-persistência-local-indexeddb-e-camada-de-repositórios)
7. [Design System, 30 Temas e Responsividade Mobile](#7-design-system-30-temas-e-responsividade-mobile)
8. [Segurança, Credenciais Mascaradas e Proteção Anti-SSRF](#8-segurança-credenciais-mascaradas-e-proteção-anti-ssrf)
9. [Internacionalização (`PT-BR`, `EN`, `ES`)](#9-internacionalização-pt-br-en-es)
10. [Estrutura de Diretórios](#10-estrutura-de-diretórios)
11. [Como Executar, Testar e Compilar](#11-como-executar-testar-e-compilar)
12. [Plano de Migração Futura para Produção (API Real)](#12-plano-de-migração-futura-para-produção-api-real)

---

## 1. Visão Geral e Princípios de Arquitetura

A Fundação Mock V1 segue rigorosamente os princípios de engenharia e governança abaixo:

- **Arquitetura Multiempresa desde a Fundação:** Separação clara entre Área Pública, Console Global da Plataforma (`/app/global`) e Ambiente da Empresa Cliente (`/app/empresa/:empresaId`).
- **Isolamento Lógico Estrito por Empresa (`Tenant Isolation`):** Nenhuma empresa pode visualizar ou editar dados de outra empresa, inclusive contra manipulação direta de IDs na URL.
- **Módulos Comerciais Independentes e Contratáveis:** A navegação lateral e o acesso às rotas operacionais de cada empresa refletem em tempo real os módulos contratados e ativos daquela empresa somados às permissões do usuário autenticado.
- **HBAC (*Hierarchical-Based Access Control*):** Controle de acesso baseado em hierarquia de papéis, escopos (`global`, `company`, `resource`), ações granulares (`view`, `create`, `edit`, `archive`, `export`, `approve`, `administer`) e exceções individuais (`allow` / `deny`), impedindo elevação de privilégios.
- **Zero Exclusão Física (`No Hard Delete`):** Nenhum registro de negócio é removido fisicamente do banco. Toda inativação utiliza **arquivamento lógico** (`archiveMetadata`) com justificativa obrigatória, data, autor e possibilidade de restauração auditada.
- **URLs Próprias e Filtros Persistidos via Query Params:** Listagens mantêm paginação real (`page`, `pageSize`), busca textual (`search`), filtro de estado (`status`), exibição de arquivados (`includeArchived`) e ordenação (`sort`, `order`) sincronizados na URL.
- **Transparência de Simulação:** Operações exclusivas do ambiente demonstrativo (como assinatura contratual simulada, conciliação financeira local, execução de chamadas no API Hub e seleção rápida de persona no login) exibem selos explícitos de estado simulado.
- **Zero Alertas Nativos:** Todas as confirmações de arquivamento, avisos e feedbacks utilizam modais e banners integrados ao Design System (sem `window.alert`, `window.confirm` ou `window.prompt`).

---

## 2. Catálogo Comercial de Módulos

O catálogo inicial conta com **10 módulos comerciais** configuráveis pelo `Super Admin` (com código técnico, categoria, preço mensal/anual, moeda, limites operacionais e dependências):

| Código Técnico | Nome do Módulo | Categoria | Obrigatoriedade / Dependências |
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

## 3. Perfis de Demonstração e Motor HBAC

A tela `/login` oferece um seletor interativo de personas (identificado como recurso exclusivo do ambiente Mock) cobrindo todos os **6 papéis iniciais**:

| Papel (Role) | Usuário de Demonstração | E-mail | Escopo Padrão | Nível Hierárquico | Resumo de Atribuições |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **Super Admin** | Helena Vasconcelos | `helena.vasconcelos@olivelas.com.br` | Global | `100` | Acesso total à plataforma, catálogo de módulos, API Hub, auditoria global e **Modo de Suporte Auditado** a qualquer empresa. |
| **Admin** | Ricardo Montez | `ricardo.montez@olivelas.com.br` | Global | `80` | Gestão operacional de empresas atribuídas, usuários, contratos e tickets de suporte. Sem permissão de administração financeira global. |
| **Financeiro** | Camila Siqueira | `camila.siqueira@olivelas.com.br` | Global | `75` | Gestão de cobranças, parcelas, conciliações, inadimplência, relatórios financeiros e meios de pagamento. |
| **Cliente** | Eduardo Olivelas | `eduardo@olivelasmatriz.com.br` | Empresa (`Matriz` e `Vega`) | `60` | Administrador da própria empresa (vinculado a múltiplas empresas para testar troca de contexto). Gerencia equipe, módulos, contratos e financeiro do tenant. |
| **Gerente** | Fernanda Costa | `fernanda.costa@olivelasmatriz.com.br` | Empresa (`Matriz`) | `40` | Coordenação operacional dos módulos contratados (Estoque, Pedidos, CRM, Equipe) e exceção individual de leitura em contratos. |
| **Funcionário** | Lucas Prado | `lucas.prado@olivelasmatriz.com.br` | Empresa (`Matriz`) | `20` | Operação diária restrita aos recursos autorizados (Estoque, Pedidos, abertura de Tickets). Sem acesso a contratos, financeiro ou HBAC. |

*(Há também a usuária adicional **Beatriz Nogueira** — `beatriz@auroralog.com.br` — como **Cliente** exclusiva da empresa **Aurora Logística**, permitindo validar o isolamento entre clientes distintos).*

### Regras do Motor HBAC (`src/services/hbacService.ts`)
- **Herança Hierárquica:** Papéis podem herdar permissões de um papel pai (`parentRoleId`).
- **Exceções Individuais (`Permission Overrides`):** Concessões (`allow`) ou revogações (`deny`) explícitas por usuário, recurso, ação e empresa, com justificativa auditada.
- **Matriz Efetiva de 105 Células:** Consulta visual completa cruzando **15 recursos** × **7 ações** (`view`, `create`, `edit`, `archive`, `export`, `approve`, `administer`), detalhando a origem exata de cada permissão (`direct_role`, `inherited_role`, `individual_allow`, `individual_deny` ou `none`).
- **Prevenção de Elevação de Privilégios:** Nenhum usuário pode criar papéis com nível hierárquico igual ou superior ao seu, nem delegar permissões que ele próprio não possua ou fora do escopo da sua empresa.
- **Modo de Suporte Explícito e Auditado (`Impersonation Context`):** Quando o `Super Admin` ou `Admin` acessa o ambiente de uma empresa para suporte, um banner amarelo fixo é exibido no topo informando o contexto temporário, sem alterar silenciosamente a identidade real do operador nos logs de auditoria.

---

## 4. Empresas de Demonstração (Multi-Tenant Seed)

O banco local é inicializado com **4 empresas independentes** em diferentes cenários operacionais e cadastrais:

1. **Olivelas Comércio & Distribuição Ltda. (`emp-olivelas-matriz`)** — *Estado: Ativa (BRL / `pt-BR`)*
   - Módulos ativos: Core, Equipe, Estoque, Vendas, CRM, Financeiro, Contratos, Suporte e Analytics.
2. **Vega Retail & Concept Store S.A. (`emp-vega-retail`)** — *Estado: Ativa (BRL / `pt-BR`)*
   - Segunda empresa vinculada ao usuário `Eduardo Olivelas` para demonstração de troca rápida de empresa na barra superior.
3. **Aurora Logística & Fulfillment Global Corp. (`emp-aurora-log`)** — *Estado: Suspensa (USD / `en`)*
   - Possui faturas em atraso (`overdue`) para demonstração de gestão de inadimplência e bloqueio de escopo entre tenants.
4. **Solaris Biotecnologia & Insumos S.L. (`emp-solaris-bio`)** — *Estado: Pendente (EUR / `es`)*
   - Empresa em fase de implantação contratual (`awaiting_signature`).

---

## 5. Mapa Completo de Rotas e Telas

### 5.1. Área Pública
- `/` — Landing Page institucional (Proposta de valor, catálogo de módulos, comparativo de planos, governança HBAC, FAQ e rodapé).
- `/planos` — Simulador e catálogo comercial de planos e módulos sob demanda.
- `/login` — Autenticação demonstrativa por seleção de perfil, papel e empresa inicial.
- `/recuperar-senha` — Fluxo simulado de recuperação de acesso com registro em auditoria.
- `/termos` — Termos de Uso e Governança da Plataforma.
- `/privacidade` — Política de Privacidade, LGPD/GDPR e Isolamento de Dados.

### 5.2. Console Global da Plataforma (`/app/global`)
- `/app/global` — Dashboard Global (MRR, empresas ativas, inadimplência, tickets abertos, saúde de APIs e auditoria recente).
- **Empresas (Tenants):**
  - `/app/global/empresas` — Listagem paginada e filtrável de empresas.
  - `/app/global/empresas/nova` — Cadastro de nova empresa.
  - `/app/global/empresas/:empresaId` — Visão 360º da empresa (com abas e atalhos para usuários, módulos, contratos e financeiro).
  - `/app/global/empresas/:empresaId/editar` — Edição cadastral e operacional da empresa.
  - `/app/global/empresas/:empresaId/usuarios` — Usuários vinculados à empresa.
  - `/app/global/empresas/:empresaId/modulos` — Gestão de módulos contratados pela empresa.
  - `/app/global/empresas/:empresaId/contratos` — Contratos da empresa.
  - `/app/global/empresas/:empresaId/financeiro` — Histórico financeiro da empresa.
- **Usuários Globais:**
  - `/app/global/usuarios` | `/novo` | `/:usuarioId` | `/:usuarioId/editar`
- **Papéis, Permissões e HBAC:**
  - `/app/global/papeis` | `/novo` | `/:papelId` | `/:papelId/editar`
  - `/app/global/permissoes` — Matriz Efetiva de Permissões (105 células) e simulador de avaliação HBAC por usuário/escopo.
- **Catálogo Comercial de Módulos:**
  - `/app/global/modulos` | `/novo` | `/:moduloId` | `/:moduloId/editar`
- **Contratos e Assinaturas:**
  - `/app/global/contratos` | `/novo` | `/:contratoId` | `/:contratoId/editar`
- **Central Financeira e Meios de Pagamento:**
  - `/app/global/financeiro` | `/cobrancas/:cobrancaId`
  - `/app/global/meios-pagamento` | `/novo` | `/:metodoId` | `/:metodoId/editar`
- **API Hub, Ambientes, Serviços e Tokens:**
  - `/app/global/api-hub` — Gestão de serviços externos, ambientes com variáveis interpoladas (`{{BASE_URL}}`, `{{TENANT_ID}}`), cofre de tokens mascarados e **Executor HTTP Simulado** com proteção Anti-SSRF.
- **Tickets e Suporte:**
  - `/app/global/tickets` | `/novo` | `/:ticketId`
- **Auditoria e Relatórios Globais:**
  - `/app/global/auditoria` | `/:eventoId`
  - `/app/global/relatorios` — Exportação real de relatórios em CSV compatível com Excel (UTF-8 BOM).

### 5.3. Ambiente da Empresa Cliente (`/app/empresa/:empresaId`)
- `/app/empresa/:empresaId` — Painel executivo da empresa selecionada.
- `/app/empresa/:empresaId/usuarios` | `/novo` | `/:usuarioId` | `/:usuarioId/editar`
- `/app/empresa/:empresaId/papeis` | `/novo` | `/:papelId` | `/:papelId/editar`
- `/app/empresa/:empresaId/permissoes` — Matriz efetiva HBAC restrita ao escopo da empresa.
- `/app/empresa/:empresaId/modulos` — Módulos ativos da empresa e solicitação de ativação/upgrade.
- `/app/empresa/:empresaId/contratos` | `/:contratoId`
- `/app/empresa/:empresaId/financeiro` | `/cobrancas/:cobrancaId`
- `/app/empresa/:empresaId/tickets` | `/novo` | `/:ticketId`
- `/app/empresa/:empresaId/auditoria` | `/:eventoId`
- `/app/empresa/:empresaId/relatorios`
- **Módulos Operacionais Contratáveis (Persistidos no IndexedDB):**
  - `/app/empresa/:empresaId/estoque` — Gestão de SKUs, categorias, saldos e arquivamento lógico (**Allin Estoque**).
  - `/app/empresa/:empresaId/pedidos` — Gestão de pedidos de venda e faturamento operacional (**Allin Vendas e Pedidos**).
  - `/app/empresa/:empresaId/crm` — Funil de oportunidades e contas B2B (**Allin CRM**).

---

## 6. Persistência Local (IndexedDB) e Camada de Repositórios

Toda a aplicação persiste dados localmente no banco IndexedDB **`olivelas_allin_v1_db`** (`src/storage/indexedDb.ts`), estruturado em **14 Object Stores**:

1. `companies` — Empresas clientes (Tenants).
2. `users` — Usuários globais e de empresas.
3. `roles` — Papéis e matriz de permissões HBAC.
4. `modules` — Catálogo comercial de módulos SaaS.
5. `companyModules` — Vínculo de módulos contratados e limites de uso por empresa.
6. `contracts` — Contratos comerciais, vigências, itens e histórico de versões/aditivos.
7. `charges` — Cobranças, parcelas e conciliações financeiras.
8. `paymentMethods` — Meios de pagamento e gateways em modo `sandbox_mock`.
9. `tickets` — Chamados de suporte, SLAs e mensagens da linha do tempo.
10. `auditEvents` — Eventos imutáveis de auditoria com estado anterior (`previousState`) e novo (`newState`).
11. `apiServices` — Endpoints e serviços cadastrados no API Hub.
12. `apiEnvironments` — Ambientes (`Sandbox`, `Staging`, `Production Mock`) e dicionário de variáveis.
13. `apiTokens` — Tokens de integração com preview mascarado e escopos.
14. `operationalItems` — Registros operacionais dos módulos de Estoque (`inventory`), Pedidos (`orders`) e CRM (`crm`).

> **Restauração Instantânea de Seed:** A qualquer momento, o usuário pode clicar no botão **"Restaurar Demo"** na barra superior do aplicativo para redefinir o IndexedDB ao estado original de fábrica (`resetToInitialSeed()`).

---

## 7. Design System, 30 Temas e Responsividade Mobile

### 7.1. Seletor Visual com 30 Temas (`src/styles/themes.ts`)
O cabeçalho da aplicação conta com um seletor interativo contendo **30 presets de temas corporativos** (além da opção automática **Sistema**):

- **15 Temas Claros (`Light Themes`):**
  1. `01. Papel Mineral (Padrão)`
  2. `02. Marfim Executivo`
  3. `03. Brisa Nórdica`
  4. `04. Linho Editorial`
  5. `05. Sálvia Botânica`
  6. `06. Quartzo Urbano`
  7. `07. Areia Atlântica`
  8. `08. Pérola Institucional`
  9. `09. Alabastro Suíço`
  10. `10. Cobalto Cristal`
  11. `11. Menta Corporativa`
  12. `12. Âmbar Solar`
  13. `13. Lavanda Arquitetônica`
  14. `14. Gelo Ártico`
  15. `15. Platina Executiva`

- **15 Temas Escuros (`Dark Themes`):**
  1. `01. Ardósia Comando (Padrão)`
  2. `02. Obsidiana Carbono`
  3. `03. Abismo Oceânico`
  4. `04. Floresta Boreal`
  5. `05. Grafite Titânio`
  6. `06. Noite Safira`
  7. `07. Expresso Torrado`
  8. `08. Cobalto Noturno`
  9. `09. Ametista Profunda`
  10. `10. Esmeralda Noturna`
  11. `11. Vulcano Basal`
  12. `12. Horizonte Polar`
  13. `13. Bronze Sideral`
  14. `14. Ciano CiberSegurança`
  15. `15. Monólito Ébano`

### 7.2. Visual Mobile 100% Responsivo (`src/index.css`)
- **Menu Gaveta (`Mobile Drawer`):** Em telas `< 1024px`, a barra lateral transforma-se em um drawer deslizante com backdrop translúcido e fechamento automático ao navegar.
- **Tabelas Adaptáveis via Container Queries:** Utilização de `@container (width < 600px)` para converter tabelas densas em cartões empilhados com rótulos `data-label` no celular, sem perda de ações ou dados.
- **Touch Targets Acessíveis:** Botões, filtros e controles respeitam altura mínima de toque e espaçamento ergonômico em dispositivos móveis.

---

## 8. Segurança, Credenciais Mascaradas e Proteção Anti-SSRF

Mesmo sendo um ambiente Mock V1, o código segue práticas rigorosas de segurança e governança:

1. **Zero Senhas ou Segredos no Código:** Nenhum registro de usuário (`User`) possui campos `password`, `senha`, `passwordHash` ou `secret`.
2. **Credenciais Financeiras e Tokens Mascarados:** Meios de pagamento e tokens do API Hub armazenam exclusivamente previews mascarados (ex.: `tok_sandbox_olivelas_****9921`, `pk_test_51Nx...****...89aB`) e operam estritamente com `environment: 'sandbox_mock'`.
3. **Validação Anti-SSRF (`validateSafeSandboxUrl`):** O executor de chamadas do API Hub bloqueia esquemas perigosos (`file://`, `javascript:`, `data:`) e endereços de rede interna/loopback/metadados cloud (`localhost`, `127.0.0.1`, `10.x.x.x`, `172.16-31.x.x`, `192.168.x.x`, `169.254.169.254`).

---

## 9. Internacionalização (`PT-BR`, `EN`, `ES`)

- **3 Idiomas Completos:** Seletor instantâneo no topo da página entre **Português (`pt-BR`)**, **Inglês (`en`)** e **Espanhol (`es`)**.
- **Formatação Nativa:** Valores monetários (`BRL`, `USD`, `EUR`), números e datas utilizam `Intl.NumberFormat` e `Intl.DateTimeFormat` respeitando o idioma ativo.
- **Cobertura Testada Automatizadamente:** A suíte Vitest valida que todas as chaves de tradução utilizadas pelos componentes existem nos 3 dicionários (`src/i18n/translations.ts`).

---

## 10. Estrutura de Diretórios

```text
olivelas-allin/
├── index.html                  # Entrada HTML com fontes Inter & JetBrains Mono
├── package.json                # Dependências e scripts (v0.0.1)
├── tsconfig.json               # Configuração TypeScript estrita
├── vite.config.ts              # Configuração Vite + Vitest (jsdom)
└── src/
    ├── App.tsx                 # Roteamento completo e guardas de escopo/HBAC
    ├── main.tsx                # Bootstrap React 19
    ├── index.css               # Design tokens, layout responsivo e container queries
    ├── components/
    │   ├── layout/
    │   │   └── AppShell.tsx    # Shell Administrativo e Público, Seletor de 30 Temas, Idioma e Contexto
    │   └── shared/
    │       └── SharedComponents.tsx # Tabelas paginadas, Modais, Badges, Breadcrumbs e Guardas
    ├── context/
    │   └── AppContext.tsx      # Estado global de sessão, HBAC, tema ativo, idioma e sincronização IndexedDB
    ├── i18n/
    │   └── translations.ts     # Dicionários completos (pt-BR, en, es) e helpers Intl
    ├── pages/
    │   ├── public/
    │   │   └── PublicPages.tsx # Landing Page, Planos, Login Demo, Recuperar Senha, Termos e Privacidade
    │   ├── global/             # Páginas do Console Global e Módulos Compartilhados
    │   │   ├── GlobalDashboard.tsx
    │   │   ├── CompaniesPages.tsx
    │   │   ├── UsersPages.tsx
    │   │   ├── RolesHbacPages.tsx
    │   │   ├── ModulesCatalogPages.tsx
    │   │   ├── ContractsPages.tsx
    │   │   ├── FinancePages.tsx
    │   │   ├── ApiHubPages.tsx
    │   │   └── TicketsAuditReportsPages.tsx
    │   └── company/
    │       └── CompanyPages.tsx # Dashboard da Empresa, Módulos Contratados e Operações (Estoque, Pedidos, CRM)
    ├── repositories/
    │   └── repositories.ts     # Camada de Repositórios CRUD + Arquivamento Lógico + Paginação + Auditoria
    ├── seed/
    │   └── initialData.ts      # Dados sintéticos iniciais (6 papéis, 4 empresas, 7 usuários, 10 módulos, etc.)
    ├── services/
    │   ├── hbacService.ts      # Motor HBAC, avaliação hierárquica, matriz de 105 células e anti-escalação
    │   └── operationalUtils.ts # Exportação CSV, interpolação de variáveis e proteção Anti-SSRF
    ├── storage/
    │   └── indexedDb.ts        # Driver nativo IndexedDB (olivelas_allin_v1_db) com 14 stores
    ├── styles/
    │   └── themes.ts           # Definição dos 30 temas (15 claros + 15 escuros) e aplicação no DOM
    ├── test/
    │   └── app.test.tsx        # Suíte de testes automatizados (9 suítes de arquitetura, HBAC, i18n e segurança)
    └── types/
        └── domain.ts           # Contratos TypeScript de todas as entidades de domínio
```

---

## 11. Como Executar, Testar e Compilar

### Pré-requisitos
- **Node.js** `>= 20.x`
- **npm** `>= 10.x`

### Passo a Passo

```bash
# 1. Instalar as dependências
npm install

# 2. Iniciar o servidor de desenvolvimento (http://127.0.0.1:5173)
npm run dev

# 3. Executar a verificação estática de tipos TypeScript
npm run typecheck

# 4. Executar a suíte de testes automatizados (Vitest + Fake-IndexedDB)
npm test

# 5. Gerar o build otimizado de produção na pasta dist/
npm run build

# 6. Visualizar o build de produção localmente
npm run preview
```

### Suíte de Testes Automatizados (`npm test`)
O arquivo `src/test/app.test.tsx` valida os 9 pilares obrigatórios da especificação:
1. **Seeding & Repositórios IndexedDB:** População inicial, criação, arquivamento lógico sem deleção física, restauração e geração automática de eventos de auditoria.
2. **Motor HBAC:** Avaliação de papéis diretos, herança hierárquica, overrides individuais, matriz efetiva de 105 células e bloqueio de elevação de privilégios.
3. **Isolamento Multiempresa (`Tenant Isolation`) & Módulos Contratados:** Bloqueio de acesso cruzado entre empresas e verificação de assinatura ativa de módulos.
4. **Paginação Real, Busca e Filtro de Arquivados:** Paginação determinística e ordenação sobre os dados locais.
5. **Segurança do API Hub & Interpolação:** Bloqueio de alvos SSRF e substituição dinâmica de variáveis de ambiente.
6. **Internacionalização (`PT-BR`, `EN`, `ES`):** Cobertura integral das chaves de interface nos 3 idiomas e formatação monetária `Intl`.
7. **Motor de 30 Temas:** Validação dos 15 temas claros e 15 temas escuros e injeção de variáveis CSS no DOM.
8. **Governança de Segurança e Senhas:** Garantia de zero senhas em registros de usuários, credenciais mascaradas em meios de pagamento/tokens e bloqueio de redes privadas.
9. **Persistência de Módulos Operacionais:** CRUD e arquivamento lógico de itens de Estoque, Pedidos de Venda e Leads CRM no IndexedDB.

---

## 12. Plano de Migração Futura para Produção (API Real)

A arquitetura foi construída para que a transição do Mock V1 para uma API backend real ocorra sem reescrever as páginas React:

1. **Substituição dos Repositórios (`src/repositories/repositories.ts`):** Trocar as chamadas ao driver `IndexedDB` por clientes HTTP (`fetch` / `axios`) mantendo a mesma assinatura assíncrona (`listAll`, `getById`, `create`, `update`, `archive`, `restore`).
2. **Enforce de HBAC e Tenant Isolation no Backend:** Replicar as funções puras de `src/services/hbacService.ts` em middlewares de autorização da API e políticas *Row-Level Security (RLS)* no banco de dados relacional.
3. **Autenticação Real (OIDC / JWT + MFA):** Substituir o seletor de personas demonstrativo de `/login` por fluxo OAuth2/OIDC com tokens `HttpOnly` e sessões de suporte temporárias assinadas criptograficamente.
4. **Gateways de Pagamento e Assinatura Digital:** Conectar os contratos de `PaymentMethodConfig` e `Contract` aos provedores reais via webhooks autenticados no backend.

---

**Olivelas Allin** — *Fundação Mock V1 (`v0.0.1`)*
