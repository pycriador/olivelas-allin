# RaffleHub SaaS

Plataforma multiempresa (multi-tenant) para gestão de rifas.  
**Sprint 1** — Fundação SaaS · **Sprint 2** — Campanhas & Permissões · **Sprint 3** — Frontend de Campanhas

> O sistema nasce multi-tenant. Não há caminho single-tenant.

## Stack

| Camada | Tecnologia |
|--------|------------|
| App | React 19, TypeScript, Vite, TanStack Start/Router/Query |
| UI | Tailwind CSS 4, shadcn/ui, Radix UI, Zustand |
| Forms | React Hook Form + Zod |
| Backend | Lovable Cloud (Supabase) — Auth, PostgreSQL, Storage, RLS |
| Auth | Google OAuth via Lovable Cloud Auth |

---

## Sprint 1 — Fundação Multi-tenant

### Autenticação e sessão
- Login com Google (`/auth`)
- Bootstrap de perfil (`bootstrap_session`)
- Primeiro usuário da plataforma vira `GLOBAL_ADMIN` automaticamente
- Proteção de rotas autenticadas

### Multi-tenant
- Tenant principal: **Organization**
- Memberships com papéis: `OWNER`, `ADMIN`, `MEMBER`, `VIEWER`
- Papel de plataforma: `GLOBAL_ADMIN`
- Organization Switcher + tenant context (Zustand + React Query)
- Onboarding para criar a primeira organização (`/onboarding`)
- Isolamento por RLS em todas as tabelas de negócio

### Planos, assinatura e uso
- Planos seed: **Free** e **Pro**
- Features e limites por plano
- Subscription automática no trial Free ao criar organização
- Dashboard com consumo vs limites

### Auditoria e plataforma
- `audit_logs` com 30+ ações registradas
- Painel de plataforma para `GLOBAL_ADMIN` (`/platform`) com métricas

### Storage multi-tenant
- Bucket `org-assets` · Path: `organizations/{org_id}/...`
- Policies RLS por membership / papel

---

## Sprint 2 — Campanhas & Permissões

### Campanhas

Tabelas `campaigns` e `campaign_images`. Todo o ciclo de vida via security-definer RPCs.

- CRUD completo com paginação server-side, busca textual, filtros por status/intervalo e ordenação
- **Status machine**: `DRAFT` → `PUBLISHED` → `PAUSED` → `FINISHED` → `ARCHIVED` (restauração para `DRAFT`)
- **Slug**: editável até a primeira publicação; travado depois para preservar links públicos
- **Critical fields** (`total_numbers`, `number_price`): bloqueados após publicação (exceto `PAUSED` para `number_price`)
- **Validação de publicação**: produto obrigatório, preço > 0, assinatura ativa, limite de campanhas ativas
- **Campaign images**: COVER (única por campanha) e GALLERY · upload para `org-assets`
- **Limite de imagens por campanha** (`max_campaign_images`): Free 10, Pro 30
- **Uso sincronizado**: triggers `sync_campaign_usage` mantêm contadores de `campaigns` e `active_campaigns`
- **Visualização pública**: campanhas `PUBLISHED`/`PAUSED`/`FINISHED` visíveis para anônimos via RLS
- **Campaign metrics** RPC com totais e distribuição por status

### Permissões (RBAC)

Modelo declarativo com 22 permissões granulares. O banco é sempre a autoridade; o frontend apenas esconde UI.

- **Tabela `role_permissions`**: matriz role → permission_key
- **RPC `has_permission`**: verifica permissão (considera `GLOBAL_ADMIN` + role ativo na org)
- **RPC `my_permissions`**: lista permissões do usuário na organização
- **Organização**: `view`, `update`, `suspend` + `ownership.transfer`
- **Usuários**: `view`, `invite`, `update`, `remove`
- **Papéis**: `view`, `update`
- **Billing / Usage / Auditoria**: `view`
- **Campanhas**: `view`, `create`, `update`, `publish`, `pause`, `finish`, `archive`, `restore`, `manage_images`

| Papel | Permissões |
|-------|------------|
| OWNER | Todas (22) |
| ADMIN | 14 permissões (sem `suspend`, `ownership.transfer`, `billing.view`) |
| MEMBER | `org.view` + campanhas (`view`, `create`, `update`) |
| VIEWER | `org.view`, `usage.view`, `campaigns.view` |

- **`usePermissions()` hook**: cache React Query, expõe `can()`, `canWrite()`, `canAny()`
- **`PermissionGate`**: oculta conteúdo não autorizado com fallback visual
- **`PermissionService`**: `listMine(orgId)`, `matrix()`, helpers `has`/`hasAny`

### Organizações (revamp)

Tela `/settings/organization` dividida em 5 abas:

| Aba | Componente | Campos |
|-----|------------|--------|
| Geral | `OrganizationGeneralForm` | Nome, slug, razão social, documento |
| Identidade visual | `OrganizationBrandingForm` | Logo, cores primária/secundária |
| Contato | `OrganizationContactForm` | E-mail, telefone, site |
| Preferências | `OrganizationPreferencesForm` | Fuso, locale, moeda, formato de data |
| Zona de risco | `OrganizationDangerZone` | Suspensão (owner) e inativação (GLOBAL_ADMIN) |

### Membros (revamp)

- **Status `SUSPENDED`**: suspender/reativar membros sem remover
- **Transferência de propriedade**: mudança de OWNER com confirmação de nome
- **Convites**: mensagem personalizada, reenvio com contagem, rate limit (20/hora configurável)
- **Convite único pendente**: índice parcial garante no máximo 1 convite `INVITED` por org+email
- **App settings**: `invite_expiry_days`, `invite_rate_limit_per_hour` via `app_settings`

### Shell da aplicação
- Layout responsivo (`AppShell`) com navegação por seções
- Itens bloqueados por permissão aparecem desabilitados
- Tema claro/escuro, menu do usuário, OrganizationSwitcher

### Frontend de configurações e plataforma

- **`/settings/users`** — listagem de membros com busca, filtros por papel/situação e paginação; convites com link único (copiar, reenviar, cancelar); troca de papel, suspender/reativar, remover e transferência de propriedade com confirmação de nome
- **`/settings/audit`** — trilha de auditoria paginada com filtros por ação e responsável (`list_audit_logs`)
- **`/settings/usage`** — consumo vs limites do plano com barras de progresso
- **`/platform`** — painel `GLOBAL_ADMIN`: cards de métricas globais, tabelas de organizações e usuários com busca e paginação
- Toda ação é protegida por `PermissionGate` no frontend e revalidada no banco

---

## Sprint 3 — Frontend de Campanhas

### Listagem (`/campaigns`)
- Cards de métricas (total, publicadas, rascunhos, pausadas, finalizadas)
- Busca com debounce, filtro por status, ordenação e paginação server-side
- Menu de ações por campanha: abrir, copiar link público e transições de status
- Cada transição é filtrada pela permissão correspondente (`campaigns.publish`, `pause`, `finish`, `archive`, `restore`)
- Confirmação via dialog antes de executar a transição

### Criação e edição (`/campaigns/create`, `/campaigns/:id/edit`)
- Formulários únicos com React Hook Form + Zod (schema compartilhado)
- Slug com sugestão automática (editável até a primeira publicação)
- Campos críticos (`total_numbers`, `number_price`) bloqueados conforme a situação da campanha
- Validação de `end_at > start_at` e mensagens de erro amigáveis
- `slug` e campos críticos respeitam o locking do backend (`SLUG_LOCKED_AFTER_PUBLISH`, `CRITICAL_FIELD_LOCKED`)

### Detalhe (`/campaigns/:id`)
- Dados gerais, cobertura e galeria de imagens, métricas
- Transições de status com `PermissionGate` por permissão
- Estado "não encontrada" para campanhas sem acesso (sem skeleton infinito)

### Página pública (`/c/:slug`)
- Acessível a anônimos para campanhas `PUBLISHED`/`PAUSED`/`FINISHED`
- SEO/OG dinâmico: título, descrição, URL absoluta e `og:image` da capa

### Imagens e proxy
- Upload de capa/galeria para o bucket privado `org-assets` (`organizations/{org_id}/campaigns/{id}/...`)
- URLs assinadas (7 dias) gravadas em `campaign_images`
- Proxy público `server/api/public/campaign-image.get.ts` (Nitro) resolve as imagens para anônimos sem expor o bucket, com `Cache-Control`
- Suporte a reordenar imagens da galeria

### Hooks (`src/hooks/useCampaigns.ts`)
- 12 hooks React Query com query keys por tenant: listagem, detalhe, métricas, criação, atualização, transições de status, upload/remoção/reordenação de imagens e página pública

---

## Arquitetura de tenant

```
Platform (GLOBAL_ADMIN)
   │
   ├── Organization A
   │      ├── Users (memberships + invitations)
   │      ├── Campaigns (CRUD, imagens, status machine)
   │      ├── Settings (general, branding, contact, preferences, danger)
   │      └── Plan / Usage / Audit
   │
   ├── Organization B
   └── Organization C
```

Um usuário só acessa dados de organizations em que possui membership ativa (ou se for `GLOBAL_ADMIN`).

## Modelo de dados

| Tabela | Função |
|--------|--------|
| `profiles` | Perfil do usuário autenticado |
| `platform_roles` | Papéis de plataforma (`GLOBAL_ADMIN`) |
| `organizations` | Tenants (com preferências, branding, contato) |
| `organization_memberships` | Usuário ↔ org + role (ACTIVE, SUSPENDED, REMOVED) |
| `organization_invitations` | Convites pendentes (mensagem, resend, rate limit) |
| `role_permissions` | Matriz declarativa role → permission_key (22 permissões) |
| `app_settings` | Configurações da plataforma (expiry, rate limit) |
| `audit_logs` | Trilha de auditoria (>30 ações) |
| `plans` / `plan_features` / `plan_limits` | Catálogo de planos |
| `subscriptions` | Assinatura da org |
| `organization_usage` | Contadores de uso (sync automático) |
| `campaigns` | Campanhas (status machine, slug locking, plan enforcement) |
| `campaign_images` | Imagens COVER/GALLERY vinculadas à campanha |

## Rotas

| Rota | Descrição |
|------|-----------|
| `/` | Landing / redirecionamento |
| `/auth` | Login Google |
| `/onboarding` | Criar primeira organização |
| `/dashboard` | Resumo do plano e uso |
| `/campaigns` | Lista de campanhas (busca, filtros, métricas) |
| `/campaigns/create` | Criar campanha |
| `/campaigns/:campaignId` | Detalhe da campanha |
| `/campaigns/:campaignId/edit` | Editar campanha |
| `/c/:slug` | Página pública da campanha |
| `/settings/organization` | Organização (5 abas) |
| `/settings/users` | Membros e convites |
| `/settings/plan` | Plano e features |
| `/settings/usage` | Consumo vs limites (barras de progresso) |
| `/settings/audit` | Logs de auditoria |
| `/platform` | Painel GLOBAL_ADMIN (métricas, orgs, usuários) |

## Estrutura do código

```
src/
  components/app/       # AppShell, OrganizationSwitcher, UserMenu, ThemeToggle, PermissionGate
  components/settings/  # OrganizationGeneral/ Branding/Contact/Preferences/DangerZone forms
  components/ui/        # shadcn/ui
  hooks/                # useTenant, usePermissions, useCampaigns (12 hooks)
  integrations/         # Supabase client + Lovable auth
  lib/                  # rpc helpers, theme, error reporting
  routes/               # TanStack file-based routes
  services/             # campaigns, organizations, memberships, permissions, plans, tenant, types
  stores/               # tenant (Zustand)
server/
  api/public/           # Proxy Nitro de imagens públicas (campaign-image)
supabase/
  migrations/           # 11 migrations — schema, RLS, RPCs, seed, bucket org-assets
```

## Desenvolvimento

```bash
npm install          # ou bun install
npm run dev          # ambiente local
npm run build        # build produção
npm run lint         # lint
npm run format       # format
```

Variáveis de ambiente (Lovable Cloud / Supabase) no `.env` — não versionar secrets.

## Próximas sprints

- Seleção, reserva e venda de números
- Checkout, PIX e gateways (InfinityPay, Mercado Pago, PagBank)
- Sorteio e apuração
- Billing real / cobrança recorrente
- Relatórios executivos, marketplace, API pública
## Repositório

- GitHub: https://github.com/pycriador-org/raffle-suite-hub
- Branch principal: `main`
- Projeto conectado ao Lovable — evitar force-push / rebase de histórico já publicado
