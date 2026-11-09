---
title: "Seguranca"
status: "ACCEPTED"
owner: "rafflehub-team"
created: "2026-08-16"
updated: "2026-08-16"
version: "1.0"
authority: "Verified"
---

# Seguranca

> 🇧🇷 Language: Portugues do Brasil

## Autenticacao

Supabase Auth com dois provedores:

| Provedor | Metodo | Observacao |
|---|---|---|
| Google OAuth | @lovable.dev/cloud-auth-js | Login social via Google |
| Email/Senha | Supabase Auth | Autenticacao basica com recuperação de senha |

- Sessao persistida em `localStorage` com auto-refresh de token
- Primeiro usuario registrado automaticamente recebe papel `GLOBAL_ADMIN`
- Verificacao de sessao no layout `_authenticated/route.tsx` — redirects para `/auth` se invalida
- Status do perfil verificado: apenas `ACTIVE` permite acesso; `SUSPENDED` e `INACTIVE` redirecionam com motivo

## Autorizacao

### Papeis

| Papel | Descricao | Permissoes |
|---|---|---|
| **GLOBAL_ADMIN** | Controle total da plataforma | 55 permissoes (todas) |
| **ADMIN** | Administrador operacional | Acesso amplo (37 permissoes incluindo gestao de gateway) |
| **PUBLISHER** | Criador de campanhas | 16 permissoes (campanhas, clientes, pedidos, arquivos) |

### Matriz de Permissoes

Definida em `src/lib/permissions.ts` como array `PERMISSIONS` com 55 entries. Cada papel mapeia um subconjunto via `ROLE_PERMISSIONS`.

Categorias de permissoes:
- `dashboard.view` — Acesso ao dashboard
- `users.*` — Gestao de usuarios (view, create, edit, delete, change_role, change_status)
- `campaigns.*` — Campanhas (view, manage, publish)
- `files.*` — Arquivos (view, view_all, upload, delete)
- `audit.*` — Auditoria (view, view_all)
- `settings.*` — Configuracoes (view, edit)
- `reports.*` — Relatorios (view, customer, payment, campaign, finance, orders)
- `customers.*` — Clientes (view, all, edit, delete)
- `orders.*` — Pedidos (view)
- `notifications.*` — Notificacoes (view)
- `payments.*` — Pagamentos (view, manage)
- `payments.gateways.<gateway>.*` — Por gateway: infinitypay, mercado_pago, pagbank, advanced_fee (view, manage)

### Verificacao em Server Functions

```ts
requireSupabaseAuth()          // Garante sessao valida
requirePermission("perm")      // Verifica se o papel do usuario possui a permissao
requireGlobalAdmin()           // Garante papel GLOBAL_ADMIN
```

### Guards em Rotas

| Guarda | Localizacao | Verificacao |
|---|---|---|
| `_authenticated/route.tsx` | Layout raiz autenticado | Sessao valida + perfil ACTIVE |
| `_authenticated/admin/route.tsx` | Console administrativo | Papel GLOBAL_ADMIN ou ADMIN |

## Row Level Security (RLS)

Habilitado em **todas as tabelas** do banco de dados.

### Politicas por Papel

| Papel | Mecanismo | Acesso |
|---|---|---|
| **GLOBAL_ADMIN** | Cliente service-role (`supabaseAdmin`) | Ignora RLS completamente |
| **ADMIN** | Helper `user_has_admin_role()` | Acesso amplo via politicas admin |
| **PUBLISHER** | Condicao `campaigns.created_by = auth.uid()` | Restrito as proprias campanhas e dados associados |

### Cliente Service-Role

- Definido em `src/integrations/supabase/client.server.ts`
- Usa `SUPABASE_SERVICE_ROLE_KEY` (variavel de ambiente server-only)
- Nunca exportado para o bundle do cliente
- Utilizado exclusivamente em modulos `*.server.ts`
- RLS sempre bypassado — responsabilidade do codigo verificar permissoes

## Seguranca de Pagamentos

### Credenciais de Gateway

- Armazenadas em tabela `payment_gateway_settings` (coluna `credentials` como JSONB)
- Acessivel apenas via service-role (sem grants para anon/auth)
- Campos por gateway definidos em `GATEWAY_CREDENTIAL_FIELDS`
- Cada gateway suporta ambiente: `SANDBOX` / `PRODUCTION`

### Webhooks

- Endpoints: `/api/public/payments/webhook/{gateway}`
- Validacao de assinatura do gateway na recepcao
- Idempotencia garantida via tabela `payment_events` com UNIQUE em `(gateway, event_id)`
- Processamento via `webhook.server.ts` → `confirm_payment` RPC

### Resolucao de Gateway para Campanha

Hierarquia de resolução:
1. Gateway especifico na `campaign_settings` da campanha
2. Gateway padrao na `platform_settings`
3. Primeiro gateway habilitado, PIX ativo e configurado

### Modos de Pagamento

| Modo | Descricao |
|---|---|
| PIX (gateway) | Checkout automatico via InfinityPay/Mercado Pago/PagBank |
| Manual | Registro manual de pagamento (dinheiro, transferencia, etc.) |
| Advanced Fee | Modo com taxa antecipada configuravel por gateway |

## Conformidade LGPD

### Mascaramento de Dados

- Telefone: exibido parcialmente (mascarado)
- Email: mascarado em visualizacoes publicas
- CPF: mascarado com asteriscos

### Soft Delete

Padrao de exclusao suave em:
- **Campanhas**: coluna `deleted_at` (lixeira com restauracao)
- **Clientes**: coluna `deleted_at`

### Hardening de Segredos

- Credenciais de gateway em JSONB isolado (service-role only)
- Variaveis de ambiente server-side nunca expostas ao cliente
- Service role key exclusiva do lado do servidor

### Trilha de Auditoria

Tabela `audit_logs` registra:
- `actor_id` — Quem executou a acao
- `action` — Tipo da acao
- `entity_type` / `entity_id` — Entidade afetada
- `old_values` / `new_values` — Estado antes e depois (JSONB)
- `ip_address` — Endereço IP do solicitante
- `user_agent` — User-agent do navegador
- `created_at` — Timestamp da acao

## Seguranca do Banco

### Travas de Aconselhamento (Advisory Locks)

- RPC `reserve_campaign_numbers` adquire `pg_advisory_xact_lock` antes de modificar `campaign_numbers`
- Previne dupla-venda sob concorrencia
- Lock liberado automaticamente ao final da transacao

### Expiracao Automatica de Reservas

- `pg_cron` executa `release_expired_campaign_reservations` periodicamente (a cada 1 minuto)
- Reservas com `reserved_until` expirado sao automaticamente liberadas

### Rate Limiting

- RPC `get_reservation_count_by_device()` conta tentativas de reserva por token de dispositivo
- Janela de tempo configuravel
- Prevencao de abuso no sistema de reserva

### RPCs Seguras

- RPCs privilegiadas como `SECURITY DEFINER` com verificacao interna de papel
- Service role restrita a modulos `*.server.ts`
