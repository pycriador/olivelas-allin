# Sprint 32 — Cloud Migration Platform

Escopo massivo (~40 módulos, ~60 tabelas, RLS multiempresa, Storage, auditoria, Google OAuth, Health Check). Impossível entregar em um único turno mantendo qualidade. Proponho **5 fases sequenciais**, cada uma validável de forma independente. A Parte 1 da migração Supabase (auth + client singleton + AuthProvider + SQL de fundação) já está concluída — este plano continua a partir dali.

---

## Fase 1 — Ativação Lovable Cloud + Multiempresa + RBAC real

Objetivo: substituir shim mock por infraestrutura Cloud real, com companies, roles e auditoria persistidos.

- Ativar **Lovable Cloud** (habilita migrations, secrets, storage e edge functions gerenciados).
- Migration SQL:
  - `companies` (id, name, cnpj, logo_url, active, timestamps).
  - `user_companies` (user_id, company_id, role, is_default) — vínculo N:N.
  - Enum `app_role` estendido: `global_admin`, `admin`, `editor`, `viewer`.
  - `user_roles` global + `has_role()`, `is_global_admin()`, `has_company_access()` SECURITY DEFINER.
  - `audit_log` (user_id, company_id, action, resource, ip, user_agent, result, metadata jsonb, created_at) com RLS "own company or global_admin".
  - Trigger `handle_new_user` cria profile + role `viewer` + audita signup.
- **AuthProvider** estendido: `currentCompany`, `availableCompanies`, `switchCompany(id)`, `permissions[]`.
- Nova rota `/select-company` (pós-login quando >1 empresa).
- Google Login: fluxo completo (auto-provisionar profile, vincular empresas existentes por domínio de email opcional, redirecionar para seleção).
- Auditoria: hooks em login/logout/falha/troca de empresa/reset/cadastro/update-profile via `authService`.

## Fase 2 — Database Manager + Provider Cloud como padrão

- `SupabaseProvider` reescrito com tipagem `Database` gerada (`supabase gen types`).
- `StorageProvider` interface ganha `tenantId` implícito (injeta `company_id` em toda escrita).
- `LocalStorageProvider` mantido **apenas para preferências de UI** (tema, idioma, layout) — nunca dados de negócio.
- Database Manager UI (`/admin/database`) mostra provider ativo, health, latência, teste de conexão, e prepara slots para PostgreSQL/MariaDB/MySQL/SQLite/SQL Server/Oracle (interface + factory, implementações futuras).
- Health Check dashboard (`/admin/health`): Supabase reachability, DB latency, Storage buckets, Auth status, Realtime ping, último erro.

## Fase 3 — Migração de schema dos módulos de negócio

Todas as tabelas com padrão obrigatório: `id`, `company_id`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`, RLS por `has_company_access(company_id)` + soft delete.

Agrupamento (uma migration por grupo):
1. **Cadastros base:** customers, suppliers, brands, manufacturers, categories, models, devices, equipment-types, defects, parts, services, technicians, warranties, payment-methods, payment-terms, measurement-units.
2. **Operação:** service-orders (+ items, history, attachments), documents (+ templates, versions), knowledge (+ categories, versions), portal.
3. **Comunicação:** communication (channels, templates, messages, logs, notifications) com Realtime habilitado.
4. **Financeiro/Estoque/Compras/RH/CRM:** financial, inventory, purchasing, hr, crm.
5. **Plataforma:** metadata (entidades dinâmicas), events, automation (workflows), integrations, reporting (dashboards, kpis, widgets), ai.

Cada `service.ts` de módulo é reescrito para usar o `SupabaseProvider` via `getStorage()` — nenhuma tela toca `supabase` diretamente. Regras de negócio permanecem intactas.

## Fase 4 — Storage + Documentos + Knowledge

- Buckets: `logos`, `avatars` (existente), `service-order-photos`, `documents`, `receipts`, `reports`, `attachments`, `firmware`, `drivers`, `diagrams`, `manuals`, `knowledge`.
- Policies: leitura por membros da empresa, escrita por editor+, exclusão por admin+, global_admin acesso total.
- Signed URLs com expiração para downloads sensíveis.
- Document Platform e Knowledge Platform reescritos para usar Storage (upload/download/versionamento).

## Fase 5 — Seeds reais + Demo Env + Remoção final de mocks

- Novos seeds SQL versionados: `seed-dev`, `seed-hom`, `seed-prod` (mínimo estritamente necessário — enums, categorias globais, roles).
- Demo Environment Manager reescrito: gera dados **no banco** dentro de transação, escopo `company_id`, apenas para `global_admin`.
- **Remoção**: `runMasterDataSeeds`, `runWorkflowSeeds`, `seedAsync`, `extended-seeds*`, todos `mock*.ts`, `fake-api*`, `LocalStorageProvider` como fonte de negócio.
- Sweep final: `rg` por `localStorage.setItem` / `MockAuth` / `mock` fora de testes → zero ocorrências em código de negócio.
- Tela de configuração de infraestrutura (`/admin/settings/infrastructure`) para global_admin: exibe URL do projeto Supabase, status de Storage/Realtime/Edge Functions/Google/SMTP, teste de conexão. Chaves ficam em Secrets do Cloud (nunca editáveis pela UI).

---

## Fora de escopo desta sprint (por design)
- Implementação real dos providers PostgreSQL/MariaDB/MySQL/SQL Server/Oracle — apenas a arquitetura de factory fica pronta.
- Edge Functions com lógica de negócio — apenas estrutura de pastas + exemplo.
- Migração de dados existentes de LocalStorage do usuário final (é ambiente de dev; começamos do zero no Cloud).

## Riscos e decisões que preciso confirmar

1. **Lovable Cloud vs projeto Supabase próprio** — na Parte 1 usamos o projeto Supabase do usuário via `VITE_SUPABASE_*`. O Sprint 32 diz "Lovable Cloud + Supabase". **Recomendo ativar Lovable Cloud** (habilita migrations gerenciadas, secrets, edge functions, storage tools, e Google OAuth via `supabase--configure_social_auth`). Isso substitui o projeto Supabase atual — os dados atuais lá (se houver) não migram automaticamente.
2. **Confirma que posso apagar completamente:** todos os `seeds.ts`, `extended-seeds*.ts`, `MockAuthProvider`, `LocalStorageProvider` como fonte de negócio, e o "shim" em `src/core/providers/auth/index.ts`?
3. **Ordem de entrega:** confirmo Fase 1 nesta resposta seguinte, e cada fase seguinte após você validar a anterior no preview? Ou prefere que eu enfileire Fase 1+2 no mesmo turno (dobra o tamanho, mais chance de erro)?
4. **Domínio corporativo para auto-vincular Google login a uma empresa** existe (ex.: `@empresa.com.br` → empresa X automaticamente), ou toda vinculação é manual pelo admin?

Confirma essas 4 questões para eu iniciar a Fase 1.
