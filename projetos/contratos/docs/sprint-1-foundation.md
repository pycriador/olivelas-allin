# Sprint 1 · ClauseForge Foundation

> Fundação da plataforma enterprise de automação documental: estrutura modular, auth (Google + Email/Senha), multi-tenancy, IAM/RBAC, layout enterprise e módulos navegáveis.

## Objetivo

Entregar a base sobre a qual as próximas sprints (IA, Builder, Execuções, Documentos) serão construídas, sem necessidade de refatoração estrutural.

## Stack

React 19 · TypeScript (strict) · TanStack Start (file-based routing + SSR) · TanStack Query · Zustand (persist) · React Hook Form + Zod · TailwindCSS v4 · shadcn/ui + Radix · Framer Motion · Recharts · Supabase (Lovable Cloud) · sonner · date-fns

## Critérios de aceite (Sprint 1)

- [x] Integração Lovable Cloud e ambiente de desenvolvimento base
- [x] Landing page completa (claro/escuro, animações, seções de marketing e páginas institucionais)
- [x] Login funcional: Google (OAuth) + Email/Senha, com recuperação de senha
- [x] Multi-tenancy: Workspace → Usuários → Projetos → Documentos, com Super Admin global
- [x] IAM RBAC: papéis, permissões por módulo, grupos; telas de Usuários e Papéis
- [x] Layout enterprise: sidebar, topbar, command palette (Ctrl+K), notificações, alternância de workspace, tema
- [x] Modelagem do banco completa (migrations) e seed
- [x] Todos os módulos navegáveis no shell autenticado
- [x] Pronto para as próximas sprints (arquitetura desacoplada)

## Arquitetura

### Estrutura `src/`

```
src/
  app/                 # shell da aplicação
  components/
    shared/            # Logo, StatCard, EmptyState, ThemeToggle, ModulePlaceholder
    icons/             # ícones próprios (Google, etc.)
    ui/                # shadcn/ui gerado (não editar)
  constants/           # app.ts (MODULE_KEYS, ROLES), navigation.ts (APP_NAV)
  contexts/            # AppContext (auth + workspace)
  features/
    auth/              # login, signup, esqueci senha
    landing/           # landing page + institucionais
    dashboard/         # layout enterprise, sidebar, topbar, command palette, homepage
    iam/               # usuários, papéis/permissões
    settings/          # configurações do workspace
    audit/             # auditoria
    projects|executions|documents|libraries|connectors|validation/  # placeholders navegáveis
  hooks/               # use-auth, use-workspace, use-app-context
  integrations/supabase/  # client gerado (não editar)
  layouts/             # public-layout, auth-layout
  providers/           # ThemeProvider, AppProviders (QueryClient)
  repositories/        # (preparado)
  routes/              # TanStack Start file-based routing
  schemas/             # validações Zod
  services/            # auth, workspace, dashboard, audit, notifications (singletons)
  stores/              # Zustand: auth, workspace, ui, theme
  types/               # types + tipos inferidos do banco (Database)
  utils/
```

### Princípios adotados

- Nada de `alert/confirm/prompt` nativo — usar shadcn/Radix + sonner.
- Sem lógica de negócio em componentes React; camada de services única.
- UI em pt-BR.
- Navegação filtrada por permissão (`APP_NAV` + `usePermissionAny`).

## Modelo de dados (migrations)

Enums: `app_role`, `member_status`, `workspace_status`, `workspace_plan`, `project_status`, `execution_status`, `connector_kind`.

Tabelas: `workspaces`, `profiles`, `workspace_members`, `user_roles`, `groups`, `group_members`, `permissions`, `role_permissions`, `projects`, `project_versions`, `connectors`, `credentials` (encrypted_payload + fingerprint), `data_sources`, `variables`, `builders`, `rules`, `executions`, `generated_documents`, `libraries`, `clauses`, `audit_logs`, `notifications`, `settings`.

Todo o schema com RLS por workspace e seed (workspace "ClauseForge Demo" + grupos de sistema + permissões por papel).

## Telas principais

- `/` Landing page (hero, trust, features, how-it-works, benefits, security, integrations, pricing, faq, cta + about/privacy/terms/contact)
- `/login?view=login|signup|forgot`
- `/dashboard` — KPIs, gráfico 14 dias, execuções recentes, atividade recente
- `/users`, `/roles` — listagem de membros, RBAC por módulo
- `/audit` — trilha de auditoria
- `/settings` — empresa/branding/tema/idioma
- `/projects`, `/executions`, `/documents`, `/libraries`, `/connectors`, `/validation` — placeholders navegáveis

## Decisões técnicas relevantes

- **Encaminhamento de auth**: `AppProviders` faz bootstrap da sessão no root; `AppLayout` mostra skeleton enquanto carrega e redireciona para `/login`.
- **Login**: Google via `signInWithOAuth`, email via `signInWithPassword`; rotas com search `?view=`.
- **Credenciais**: padrão pronto em `credentials` (criptografia + fingerprint) para chaves de conectores e, futuramente, de providers de IA.
- **`.prettierrc`**: `endOfLine: auto` para evitar ruído CRLF no Windows.
- **ESLint**: arquivos gerados (`src/integrations/supabase/**`, `routeTree.gen.ts`) e shadcn `components/ui` ignorados em regras de fast-refresh.

## Resultado de verificação

- `npm run lint` — 0 problemas
- `npx tsc --noEmit` — sem erros
- `npm run build` — sucesso (route tree regenerada)

## Fora de escopo (próximas sprints)

- Projetos/Builders/Execuções reais, biblioteca de cláusulas, geração de documentos, PDF
- Conectores Google
- **Sprint 2**: fundação de IA (providers, playground, prompt library/builder, agentes, análise de documentos, RAG prepr) — ver `docs/sprint-2-ai-foundation.md`
