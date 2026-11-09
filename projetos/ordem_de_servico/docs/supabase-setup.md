# Configuração do Supabase

O ServiceForge usa **exclusivamente** o Supabase (sem Lovable Cloud) para
autenticação, banco PostgreSQL, Storage e Realtime.

## 1. Variáveis de ambiente

Copie `.env.example` para `.env` e preencha:

```
VITE_SUPABASE_URL=https://<seu-projeto>.supabase.co
VITE_SUPABASE_ANON_KEY=<sua-anon-key>
```

Sem elas o app exibe uma tela de erro na primeira chamada ao Supabase.

## 2. Rodar a migration de fundação

Supabase Dashboard → **SQL Editor → New query** → cole
[`docs/supabase-setup.sql`](./supabase-setup.sql) e execute.

Cria:
- Enum `app_role` e tabela `user_roles` com função `has_role()` (SECURITY DEFINER)
- Tabela `profiles` (FK `auth.users`) + RLS
- Trigger `on_auth_user_created` popula `profiles` e concede role `user`
- Buckets `avatars` (público), `documents`/`uploads`/`exports` (privados) com policies "owner + admin"

## 3. Habilitar Google OAuth

1. **Google Cloud Console → Credentials → OAuth client (Web)**.
2. Authorized redirect URIs: `https://<seu-projeto>.supabase.co/auth/v1/callback`
3. Supabase → **Authentication → Providers → Google** → cole Client ID/Secret.
4. **Authentication → URL Configuration**:
   - **Site URL:** `http://localhost:8080` (dev) / `https://<seu-dominio>` (prod)
   - **Redirect URLs:** adicione
     - `http://localhost:8080/auth/callback`
     - `http://localhost:8080/reset-password`
     - `https://<seu-dominio>/auth/callback`
     - `https://<seu-dominio>/reset-password`

## 4. Confirmação de e-mail (opcional)

Para testes locais, desative em **Authentication → Providers → Email → Confirm email**.

## 5. Próxima parte

A Parte 2 migrará o schema de todos os módulos (Cadastros, OS, Financeiro,
Estoque, etc.) para tabelas PostgreSQL com RLS, Realtime e tipos gerados via
`supabase gen types`.
