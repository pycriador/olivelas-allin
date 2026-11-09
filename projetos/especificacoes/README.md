# SpecForge

**Spec-Driven Engineering Platform** — plataforma offline-first para criação e gestão de especificações de engenharia de software.

Inspirada em Linear, Notion, GitHub, Vercel, Raycast e Obsidian. Toda persistência é local via IndexedDB com criptografia AES-256-GCM. Sem backend, sem Supabase, sem Firebase (Fase 1).

## Funcionalidades

- **Dashboard** — Métricas, gráficos de atividade (Recharts), timeline de atividades recentes e projetos recentes
- **Projetos** — CRUD completo com Sprints, Deliveries e Specification vinculadas
- **Especificações** — 16 tipos (Sprint, Backend, Frontend, Database, API, Arquitetura, ADR, RFC, Checklist, Teste, Release, Infraestrutura, Segurança, DevOps, Prompt Lovable, Prompt Cursor)
- **Editor de Blocos** — Documentos com 11 tipos de bloco (Markdown, Code, Table, Checklist, Image, Mermaid, JSON, YAML, SQL, Text, Prompt)
- **Busca Global** — Cmd+K com filtros por tipo, status, tags e projeto
- **Favoritos** — Toggle de favorito em qualquer spec
- **Biblioteca** — Snippets de código com linguagem e tags
- **Templates** — Templates pré-definidos por tipo de spec
- **Lixeira** — Soft delete com recuperação
- **Temas** — Corporate Blue, Emerald, Purple, Orange, Dark Graphite, Light + Dark/Light mode
- **i18n** — pt-BR (padrão), en, es via store Zustand
- **Criptografia** — AES-GCM 256-bit com Web Crypto API

## Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Framework | React 19 + TypeScript 5.8 |
| Build | Vite 8 |
| SSR / Routing | TanStack Start + TanStack Router |
| State Management | Zustand 5 |
| Data Fetching | TanStack React Query 5 |
| Styling | Tailwind CSS v4 |
| UI Components | shadcn/ui (New York) + Radix UI |
| Forms | React Hook Form + Zod |
| Animações | Framer Motion |
| Gráficos | Recharts |
| Database | Dexie.js (IndexedDB) |
| Markdown | react-markdown |
| Diagramas | Mermaid |
| Code Editor | Monaco Editor |
| Package Manager | Bun |

## Arquitetura

```
src/
  types/              Entidades, enums, schemas Zod
  repositories/       Acesso ao IndexedDB (Repository Pattern)
  services/           Regras de negócio + orquestração
  hooks/              React hooks (queries, mutations)
  stores/             Zustand (tema, idioma, UI state)
  lib/                Criptografia, seed, utils
  components/
    ui/               shadcn/ui (46 componentes)
    layout/           Sidebar, Header, Breadcrumb, AppShell
    dashboard/        Cards, gráficos, timeline
    specs/            Block editor, spec list, block renderers
    dialogs/          Diálogos modais
    common/           EmptyState, ErrorState, Skeletons
  routes/             TanStack Router (file-based)
```

## Rotas

| Rota | Descrição |
|---|---|
| `/` | Dashboard |
| `/projects` | Listagem de projetos |
| `/projects/$projectId` | Detalhe do projeto (sprints, deliveries, specs) |
| `/specs/$specId` | Detalhe da spec + editor de blocos |
| `/favorites` | Specs favoritas |
| `/templates` | Templates |
| `/library` | Biblioteca de snippets |
| `/trash` | Lixeira (soft-deleted) |
| `/search` | Busca global com filtros |
| `/settings` | Configurações (tema, idioma) |
| `/admin` | Administração (coming soon) |

## Modelo de Dados

- **Workspace** — Unidade de trabalho
- **Project** — Projeto vinculado a um workspace
- **Roadmap** — Roadmap do projeto
- **Sprint** — Sprint do roadmap
- **Delivery** — Entrega dentro de uma sprint
- **Specification** — Especificação vinculada a uma delivery
- **Document** — Documento com blocos (markdown, code, mermaid, etc.)
- **Tag** — Tags para categorização
- **Template** — Templates reutilizáveis
- **Snippet** — Trechos de código reutilizáveis
- **ActivityEntry** — Log de atividades

## Pré-requisitos

- [Bun](https://bun.sh/) (ou npm/yarn)
- Node.js 18+

## Instalação

```bash
# Instalar dependências
bun install

# Iniciar servidor de desenvolvimento
bun run dev

# Build para produção
bun run build

# Build em modo development
bun run build:dev

# Preview do build
bun run preview
```

## Comandos Disponíveis

| Comando | Descrição |
|---|---|
| `bun run dev` | Servidor de desenvolvimento |
| `bun run build` | Build de produção |
| `bun run build:dev` | Build em modo development |
| `bun run preview` | Preview do build |
| `bun run lint` | ESLint |
| `bun run format` | Prettier |

## Seed Automático

Na primeira abertura, a aplicação gera dados de demonstração automaticamente:

- 2 Workspaces
- 4 Projetos
- 8 Sprints
- 20 Entregas
- 80 Especificações com conteúdo fictício realista

## Diretrizes de Código

- **Repository Pattern** — Componentes nunca acessam o Dexie diretamente
- **Services** orquestram repositories
- **Hooks** `useQuery`/`useMutation` chamam services
- **SSR desativado** em rotas que usam IndexedDB — guards `useHydrated()`
- **Sem `any`** — tipagem estrita TypeScript
- **Zero alerts/confirms nativos** — tudo via Dialog shadcn
- **Rotas file-based** — TanStack Router (não criar `src/pages/`)

## Licença

Privado — todos os direitos reservados.
