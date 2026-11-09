# Plano de implementação

## 1. Papéis e permissões (backend)

Adicionar valores `editor` e `viewer` ao enum `app_role` (mantendo `admin`). Novos cadastros recebem `viewer` por padrão (atualizar `assign_role_on_signup`); os e-mails autorizados como admin continuam recebendo `admin`.

Matriz de permissões:
- **viewer**: edita apenas suas próprias tarefas/perfil; pode deletar/customizar o padrão que veio pré-configurado para ele.
- **editor**: tudo de viewer + edita o **formulário global** (lista de tarefas padrão que novos usuários recebem).
- **admin**: tudo de editor + gerencia usuários (mudar papel, bloquear, deletar).

## 2. Formulário global (nova tabela)

Criar tabela `global_default_tasks` com as colunas de tarefa (title, category, estimated_minutes, day_of_week, chain_to_next_day).
- Seed inicial com as tarefas de `src/data/defaultTasks.ts`.
- RLS: leitura para autenticados; escrita só para `editor`/`admin`.
- Novos usuários, no primeiro acesso, recebem cópia dessas tarefas em `custom_tasks` (via `useRoutine`).

## 3. Bloqueio e exclusão de usuários

- Adicionar coluna `blocked boolean` em `profiles` + coluna `email` (preenchida via trigger `handle_new_user`).
- RLS: admin pode ler/atualizar/deletar qualquer `profiles` e `user_roles`.
- Login: hook `useAuth` checa se o profile está `blocked` e força logout com mensagem.
- Exclusão definitiva de conta auth requer edge function `admin-manage-users` com service role (criar/deletar/atualizar via Supabase Admin API).

## 4. UI

**`SettingsPage.tsx`** ganha duas seções condicionais:
- **Gerenciar usuários** (só admin): lista de usuários (email, papel, status) com select de papel, botão bloquear/desbloquear e deletar.
- **Formulário global** (editor/admin): link para nova rota `/global-form` com CRUD das tarefas padrão (reaproveita `AddTaskForm` + `RoutineSection`).

**`BottomNav.tsx`**: itens Pets e Bebê passam a depender de `settings.petMode` / `settings.babyMode`. Quando `babyMode` está ligado, aparece um item "Bebê" apontando para nova página `/baby` (espelho da `PetsPage`).

**Nova `BabyPage.tsx`**: lista as tarefas do bebê com CRUD (idêntica em estrutura à `PetsPage`).

## 5. Resumo técnico das mudanças

```text
Migrations:
  - ALTER TYPE app_role ADD VALUE 'editor', 'viewer'
  - ALTER TABLE profiles ADD blocked, email
  - CREATE TABLE global_default_tasks + RLS + seed
  - Update assign_role_on_signup (default viewer)
  - Update handle_new_user (salva email)
  - (Re)attach triggers em auth.users
  - Policies admin em profiles e user_roles

Edge function:
  - admin-manage-users (list/update-role/block/delete) com service role

Frontend:
  - src/hooks/useUserRole.ts (novo)
  - src/hooks/useAuth.tsx (checa blocked)
  - src/pages/SettingsPage.tsx (seções admin/editor)
  - src/pages/UserManagementPage.tsx (novo, admin)
  - src/pages/GlobalFormPage.tsx (novo, editor/admin)
  - src/pages/BabyPage.tsx (novo)
  - src/components/BottomNav.tsx (itens condicionais)
  - src/App.tsx (novas rotas)
  - src/hooks/useRoutine.ts (seed inicial a partir de global_default_tasks)
```

Confirma que posso seguir com tudo isso de uma vez, ou prefere que eu faça em etapas (ex.: primeiro bottom nav + Bebê, depois papéis/admin)?