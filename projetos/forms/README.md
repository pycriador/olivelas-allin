# Olivelas IAM Forms

> **Sistema Corporativo de Formulários Inteligentes, Governança de Identidades (IAM / Multi-Tenant), Construtor de Dashboards Analíticos em Tempo Real e Integração Direta com Google Sheets & Google Drive.**

[![Deploy to GitHub Pages](https://github.com/pycriador/olivelas-iam-forms/actions/workflows/deploy.yml/badge.svg)](https://github.com/pycriador/olivelas-iam-forms/actions/workflows/deploy.yml)
[![Version](https://img.shields.io/badge/version-1.0.0-indigo.svg)](package.json)
[![Database](https://img.shields.io/badge/database-Supabase%20PostgreSQL-3ecf8e.svg)](supabase/migrations)
[![Frontend](https://img.shields.io/badge/frontend-React%2019%20%2B%20Vite%206-61dafb.svg)](src)
[![Documentation](https://img.shields.io/badge/docs-Enterprise%20Standard-blue.svg)](docs)

---

## 📑 Sumário

- [Visão Geral](#-visão-geral)
- [Funcionalidades Principais](#-funcionalidades-principais)
- [Arquitetura & Stack Tecnológica](#-arquitetura--stack-tecnológica)
- [Como Configurar o GitHub Pages com GitHub Actions](#-configuração-do-github-pages-com-github-actions)
- [Guia de Inicialização Local](#-guia-de-inicialização-local)
- [Divisão "Validar" (Rotas em Revisão)](#-divisão-validar-rotas-em-revisão)
- [Documentação Detalhada](#-documentação-detalhada)
- [Licença](#-licença)

---

## 🌟 Visão Geral

O **Olivelas IAM Forms** é uma plataforma corporativa completa desenvolvida para suprir as limitações de ferramentas convencionais como o Google Forms. O sistema une a flexibilidade de um criador avançado de formulários com um modelo robusto de governança de identidades e acessos (**IAM**), controle baseado em papéis e hierarquias (**HBAC / RBAC**), dashboards dinâmicos com widgets configuráveis e sincronização bidirecional em tempo real com o ecossistema Google Workspace.

### Diferenciais Exclusivos:
- 🛡️ **Multi-Tenant por Grupo**: Integrações do Google Cloud (Service Account JSON) e Tokens de API são vinculados a grupos hierárquicos (*Administradores do Sistema*, *Operações & Eventos*, *Marketing*, etc.).
- 📊 **Dashboards Analíticos Avançados**: Construtor drag-and-drop de painéis com gráficos de pizza, barras verticais/horizontais, linhas, KPIs e filtros inteligentes por perguntas.
- 🎨 **30 Temas Visuais**: Sistema dinâmico de troca de paletas em tempo real (15 temas claros e 15 escuros) sincronizados com o Tailwind CSS.
- 🌐 **Internacionalização Nativa**: Suporte completo a 3 idiomas: **Português (pt-BR)**, **Inglês (en)** e **Espanhol (es)**.
- 🔑 **API REST & HBAC Granular**: Tokens Bearer com permissões selecionáveis por escopo (`forms:read`, `forms:write`, `responses:read`, `responses:write`, `users:read`, `groups:read`, `dashboards:read`, `google:sync`) e aba com cURL interativo para integrações headless.
- 📜 **Auditoria Completa (`/app/audit`)**: Rastreabilidade com expansão modal contendo IP, navegador, horário exato, tipo de ação e payload serializado em JSON.

---

## 🚀 Funcionalidades Principais

| Módulo | Descrição |
| :--- | :--- |
| **Formulários (`/app/forms`)** | Criação de pesquisas com perguntas polimórficas (texto, número inteiro, decimal, seleção única, múltipla escolha, upload de arquivos). Menu de ações em dropdown com atalhos para Editar, Ver Respostas, Compartilhar, Duplicar e Excluir. |
| **Respostas (`/app/forms/:id/responses`)** | Visualização tabular e analítica de submissões, filtros por período e status, exportação e vínculo com moradores/respondentes. |
| **Dashboards (`/app/dashboards`)** | Criação de dashboards executivos públicos ou restritos, com painel lateral retrátil de elementos e menu de redimensionamento (`1/4`, `1/3`, `1/2`, `2/3`, `Full`). |
| **Governança & Usuários (`/app/users`)** | Gestão de colaboradores com perfis `admin`, `creator` e `viewer`, vinculação a grupos e modal customizado de exclusão segura. |
| **Grupos & Multi-Tenant (`/app/groups`)** | Criação de unidades organizacionais, definição de cores de identidade e configuração de Service Account Google própria por grupo. |
| **Tokens de API & HBAC (`/app/tokens`)** | Criação, revogação e **edição de escopos/grupos** de credenciais de integração, além de guia interativo de exemplos cURL testáveis. |
| **Auditoria (`/app/audit`)** | Registro detalhado de logins, alterações em formulários, geração de tokens e sincronizações com abertura em modal JSON. |

---

## 🛠️ Arquitetura & Stack Tecnológica

- **Frontend**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite 6](https://vitejs.dev/), [Tailwind CSS 3](https://tailwindcss.com/), [Lucide React](https://lucide.dev/), [Chart.js](https://www.chartjs.org/) / `react-chartjs-2`, [Sonner](https://sonner.emilkowal.ski/).
- **Backend**: [Express 4](https://expressjs.com/), [Node.js](https://nodejs.org/), [pg (node-postgres)](https://node-postgres.com/), Google APIs Client Library (`googleapis`).
- **Banco de Dados**: [Supabase PostgreSQL](https://supabase.com/) com schema isolado `olivelas_iam_forms`.
- **Roteamento SPA**: `react-router-dom` v7 com suporte a `basename` dinâmico e fallback `404.html` para GitHub Pages.

---

## 🚀 Configuração do GitHub Pages com GitHub Actions

O repositório já conta com o fluxo de integração e entrega contínua configurado em [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

Siga os passos abaixo no GitHub para habilitar a publicação automática:

### 1. Habilitar o GitHub Pages no Repositório

1. No GitHub, abra o repositório **`pycriador/olivelas-iam-forms`**.
2. Clique na aba superior **Settings** (Configurações).
3. No menu lateral esquerdo, clique em **Pages** (dentro da seção *Code and automation*).
4. Em **Build and deployment** > **Source**, altere de *"Deploy from a branch"* para:
   ```text
   GitHub Actions
   ```
5. Salve a alteração.

### 2. Configurar os Secrets do Repositório (Opcional / Recomendado)

Se desejar apontar o build estático para uma API em nuvem ou utilizar chaves do Supabase diretamente:

1. No repositório, acesse **Settings** > **Secrets and variables** > **Actions**.
2. Clique em **New repository secret** e adicione as seguintes variáveis:
   - `VITE_SUPABASE_URL`: URL do projeto Supabase (ex: `https://pkbjoxzqllextmtmjoia.supabase.co`).
   - `VITE_SUPABASE_ANON_KEY`: Chave pública `anon` do Supabase.
   - `VITE_API_URL`: URL da sua API backend hospedada (caso não utilize a API local `http://localhost:3001/api`).

> [!NOTE]
> Se os segredos não forem preenchidos, o workflow utiliza automaticamente as configurações seguras de contingência já definidas no arquivo [`.env.example`](.env.example).

### 3. Como Funciona a Publicação Automática

Sempre que um `git push` for realizado na branch **`main`** (ou ao acionar manualmente a Action em *Actions > Deploy to GitHub Pages > Run workflow*):

1. O runner Ubuntu faz o checkout do código com Node.js 20.
2. Executa `npm ci` para instalar todas as dependências de forma reproduzível.
3. Executa `npm run build`:
   - Valida os tipos TypeScript com `tsc -b`.
   - Gera o bundle otimizado com `vite build` utilizando o `base: '/olivelas-iam-forms/'`.
   - O hook `postbuild` executa `scripts/copy-404.js` duplicando o `index.html` como `404.html`. Isso garante que recarregar páginas ou acessar links diretos como `/app/forms` ou `/f/censo-olivelas-2026` funcione perfeitamente sem erros de página não encontrada do GitHub Pages.
4. O artefato `./dist` é enviado e implantado diretamente na URL:
   ```text
   https://pycriador.github.io/olivelas-iam-forms/
   ```

---

## 💻 Guia de Inicialização Local

### Pré-requisitos
- **Node.js**: v18.0.0 ou superior (recomendado v20+)
- **npm**: v9.0.0 ou superior

### 1. Clonar o Repositório
```bash
git clone https://github.com/pycriador/olivelas-iam-forms.git
cd olivelas-iam-forms
```

### 2. Instalar Dependências
```bash
npm install
```

### 3. Configurar Variáveis de Ambiente
Copie o arquivo de exemplo e ajuste suas credenciais do PostgreSQL / Supabase:
```bash
cp .env.example .env
```

### 4. Executar em Desenvolvimento
Inicia simultaneamente o servidor backend Express (porta `3001`) e o frontend Vite (porta `5173`):
```bash
npm run dev
```

Acesse:
- **Painel do Sistema**: [http://localhost:5173/app](http://localhost:5173/app)
- **Documentação de Rotas**: [http://localhost:5173/app/validate](http://localhost:5173/app/validate)
- **API Healthcheck**: [http://localhost:3001/api/health](http://localhost:3001/api/health)

### 5. Compilar para Produção Localmente
```bash
npm run build
```
Os arquivos prontos para publicação serão gerados na pasta `./dist`.

---

## 🔍 Divisão "Validar" (Rotas em Revisão)

Para manter a organização do código e permitir uma transição limpa, as rotas que foram substituídas por fluxos mais modernos estão agrupadas na seção **"Validar"** da barra lateral e no painel central **`/app/validate`**:

| Rota | Status | Substituição Atual |
| :--- | :--- | :--- |
| **`/app/validate`** | **Painel Central** | Central de diagnóstico com botões de inspeção direta. |
| **`/app/integrations`** | *Migrado* | Credenciais Google agora são gerenciadas por Grupo em `/app/groups/:id/google`. |
| **`/app/tokens/new`** | *Redundante* | Criação/edição rápida feita diretamente via modal em `/app/tokens`. |
| **`/app/integrations/groups/:groupId`** | *Alias* | Padronizado para `/app/groups/:id/google`. |
| **`/integrations/google/callback`** | *Legado* | Substituído por Contas de Serviço JSON corporativas por Grupo. |

*Para realizar a deleção definitiva dessas rotas e arquivos no futuro, basta solicitar a limpeza dos componentes listados no painel de validação.*

---

## 📚 Documentação Detalhada

- 🛠️ [Documentação Técnica (Banco, APIs e Arquitetura)](docs/olivelas-iam-forms-tecnica.md)
- 💼 [Documentação de Negócio (Jornadas e Regras)](docs/olivelas-iam-forms-negocio.md)

---

## 📄 Licença

Este projeto é desenvolvido para a **Olivelas Enterprise**. Todos os direitos reservados.
