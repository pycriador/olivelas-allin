# SpecForge — Fase 1: Fundação da Plataforma

Plataforma offline-first para gestão de especificações de engenharia (Spec-Driven Development), inspirada em Linear, Notion, GitHub, Vercel, Raycast e Obsidian.

## Escopo desta fase

Fundação completa com arquitetura preparada para crescimento. **Sem backend, sem Supabase, sem Firebase.** Toda persistência via IndexedDB (Dexie.js) com criptografia local.

## Stack

React 19 + TypeScript + Vite + TanStack Router + TanStack Query + Zustand + TailwindCSS v4 + shadcn/ui + Radix + React Hook Form + Zod + Framer Motion + Dexie.js + React Markdown + Mermaid + Monaco Editor.

## Arquitetura de pastas

```text
src/
  types/           Entidades, enums, schemas Zod
  repositories/    Acesso ao IndexedDB (Dexie) — única camada que toca o DB
  services/        Regras de negócio + orquestração de repositories
  hooks/           React hooks (queries, mutations, UI)
  stores/          Zustand (tema, idioma, UI state, workspace ativo)
  lib/             Criptografia, seed, utils
  components/
    ui/            shadcn/ui
    layout/        Sidebar, Header, Breadcrumb, Shell
    dashboard/     Cards, gráficos, timeline
    specs/         Editor stub, block renderers
    common/        EmptyState, ErrorState, Skeletons, Toaster
  routes/          TanStack Router (file-based)
```

## Modelagem (types + Dexie schema)

Entidades: `Workspace`, `Project`, `Roadmap`, `Sprint`, `Delivery`, `Specification`, `Document` (com `blocks[]`), `Tag`, `Template`.

Enums: `SpecType` (Sprint, Backend, Frontend, Database, API, Arquitetura, Prompt Lovable, Prompt Cursor, ADR, RFC, Checklist, Teste, Release, Infraestrutura, Segurança, DevOps), `SpecStatus` (Draft, Planning, In Progress, Review, Approved, Done, Archived), `BlockType` (markdown, code, table, checklist, image, mermaid, json, yaml, sql, text, prompt).

## Persistência

- **Dexie.js** encapsulado em `repositories/*.repository.ts` (Repository Pattern estrito — componentes nunca tocam o DB).
- Camada de **criptografia** (`lib/crypto.ts`) usando Web Crypto API (AES-GCM) com chave derivada localmente; envelopa payloads antes de salvar.
- **Seed automático** na primeira abertura: 2 workspaces, 4 projetos, 8 sprints, 20 entregas, 80 especificações — todas com conteúdo fictício realista.

## Rotas (TanStack Router)

- `/` Dashboard
- `/projects` + `/projects/$projectId`
- `/favorites`
- `/templates`
- `/library`
- `/trash`
- `/settings`
- `/admin`
- `/search` (busca global)

## Layout

- **Sidebar** colapsável: Logo, Workspace switcher, Projetos, Favoritos, Templates, Biblioteca, Lixeira, Configurações, Admin.
- **Header**: busca global (⌘K style), projeto atual, breadcrumb, notificações, avatar, toggle tema, toggle idioma.
- **Área principal**: Outlet com transições Framer Motion.

## Dashboard

Cards de métricas (Projetos, Specs, Sprints, Usuários, Templates, Última sync), gráficos mockados (Recharts leve ou SVG custom), timeline de atividades, últimas alterações, projetos recentes.

## Temas & i18n

- Sistema de temas preparado p/ múltiplos: **Corporate Blue** (padrão), Emerald, Purple, Orange, Dark Graphite, Light. Tokens em `src/styles.css` via `@theme` + variantes.
- Dark/Light mode.
- i18n com dicionário local (pt-BR padrão, en, es) via store Zustand + hook `useT()`.

## UX

- Zero `alert`/`confirm` nativos — tudo via `Dialog` shadcn.
- Toaster (sonner), Skeletons, EmptyState, ErrorState reutilizáveis.
- Formulários: React Hook Form + Zod resolver.

## Editor (stub estrutural)

Não implementar edição rica agora. Criar renderers por `BlockType` e container `<DocumentView blocks=... />` preparado para múltiplos blocos.

## Busca / Tags / Favoritos / Biblioteca / Templates

- Busca global mockada sobre dados do IndexedDB (título, descrição, tags, sprint, projeto, tipo).
- Sistema de tags (frontend, backend, security, database, api, aws, supabase, lovable, cursor, performance).
- Favoritar qualquer spec (toggle persistido).
- Biblioteca e Templates mockados com estrutura pronta.

## Performance / Qualidade

Lazy routes, code splitting automático do TanStack, memo onde necessário, sem `any`, tipagem estrita, arquitetura limpa por domínio.

## Detalhes técnicos

- **Dexie schema versionado** (`db.version(1).stores(...)`).
- **Criptografia**: AES-GCM 256, chave em `localStorage` (placeholder — futura fase troca por chave derivada de senha).
- **Repositories** expõem apenas DTOs tipados.
- **Services** compõem repositories (ex.: `SpecificationService.createWithDocument`).
- **Hooks** `useQuery`/`useMutation` chamam services.
- **Zustand stores**: `useUIStore` (sidebar), `useThemeStore`, `useI18nStore`, `useWorkspaceStore`.
- SSR desativado onde necessário — IndexedDB é client-only. Rotas usam guards `useHydrated()` para acesso a dados.

## Fora de escopo (fases futuras)

Editor rico completo, versionamento, IAM, importação/exportação, colaboração, sync backend, IA. Arquitetura fica pronta para acoplá-los.

## Critérios de aceite

Build limpo, todas as rotas navegáveis, layout responsivo, dashboard funcional, seed executado no primeiro load, sidebar/header/breadcrumb funcionais, TS estrito sem `any`, zero erros lint/build.
