# Sprint 1 — Fundacao

**Status:** Concluida  
**Objetivo:** Criar a base do RaffleHub: shell autenticado, layout admin, tema, RBAC e dashboard inicial.

---

## Contexto

Partiu do template TanStack Start + Lovable Cloud. A sprint estabeleceu a identidade do produto e o esqueleto administrativo usado por todas as sprints seguintes.

---

## O que foi implementado

### Layout e UX base

- Sidebar recolhivel com navegacao centralizada (`src/config/navigation.ts`)
- Topbar, breadcrumbs e footer
- Tema claro/escuro (`ThemeContext`)
- Estados de loading, empty e error reutilizaveis
- Error boundary + paginas 404/500

### Autenticacao

- Login via Google OAuth (Lovable Cloud / Supabase Auth)
- Sessao persistente no cliente
- Rota protegida `_authenticated`

### RBAC

- Papeis: `GLOBAL_ADMIN` e `USER`
- Primeiro usuario promovido automaticamente a admin
- Tabela `user_roles` + helpers de permissao

### Dashboard inicial

- Cards de metricas (inicialmente mock)
- Graficos com Recharts
- Base para metricas reais (substituidas nas sprints 4.4 e 10)

### Perfil

- Edicao de nome e avatar
- Exibicao do papel do usuario

---

## Arquivos / areas principais

| Area         | Caminho                                   |
| ------------ | ----------------------------------------- |
| Auth context | `src/contexts/auth-context.tsx`           |
| Theme        | `src/contexts/theme-context.tsx`          |
| Layout       | `src/components/layout/`                  |
| Navegacao    | `src/config/navigation.ts`                |
| Permissoes   | `src/lib/permissions.ts`                  |
| Dashboard    | `src/routes/_authenticated/dashboard.tsx` |
| Perfil       | `src/routes/_authenticated/perfil.tsx`    |

---

## Resultado de negocio

Operador consegue entrar no sistema, navegar no painel e ver a estrutura basica do produto. Sem campanhas ou vendas ainda.
