---
title: "Schema do Banco"
status: "ACCEPTED"
owner: "rafflehub-team"
created: "2026-08-16"
updated: "2026-08-16"
version: "1.0"
authority: "Verified"
---

# Schema do Banco

> 🇧🇷 Language: Portugues do Brasil

PostgreSQL via Supabase. Migracoes em `supabase/migrations/`.

## Tabelas Principais

| Tabela | Descricao |
|---|---|
| `profiles` | Usuarios (nome, email, avatar, status, soft delete) |
| `user_roles` | Papel do usuario: GLOBAL_ADMIN, ADMIN ou PUBLISHER |
| `role_permissions` | Permissoes por papel (matriz papel × permissao) |
| `user_roles_detail` | Detalhes de papeis de usuario (view) |
| `campaigns` | Campanha (slug, range, preco, status, purchase_mode, created_by) |
| `campaign_numbers` | Estado de cada numero da campanha + reserva/pedido |
| `campaign_images` | Midia tipada (COVER, GALLERY, SHARE, THUMBNAIL, BANNER) |
| `campaign_settings` | Configuracoes de exibicao, share, SEO, contato WhatsApp, gateway |
| `customers` | CRM — dados dos clientes |
| `orders` | Pedidos (source, status, payment, valores, customer_id) |
| `order_items` | Numeros vinculados ao pedido |
| `order_receipts` | Comprovantes de pagamento |
| `audit_logs` | Trilha de auditoria de acoes (actor, ip, valores old/new) |
| `platform_settings` | Configuracoes globais da plataforma |
| `payment_gateway_settings` | Credenciais e configuracao dos gateways de pagamento |
| `payment_events` | Eventos de webhook de gateway (idempotencia via UNIQUE gateway + event_id) |
| `admin_payment_ledger` | Livro de caixa administrativo para pagamentos manuais |

## Enums

| Enum | Valores |
|---|---|
| `campaign_status` | DRAFT, SCHEDULED, ACTIVE, PAUSED, FINISHED, CANCELLED, ARCHIVED |
| `campaign_number_status` | AVAILABLE, RESERVED, PENDING_PAYMENT, PAID, BLOCKED, CANCELLED, WINNER |
| `campaign_image_type` | COVER, GALLERY, SHARE, THUMBNAIL, BANNER |
| `campaign_purchase_mode` | MANUAL, AUTOMATIC |
| `order_source` | ONLINE, WHATSAPP, MANUAL |
| `order_status` | OPEN, WAITING_CONTACT, WAITING_PAYMENT, PAID, CANCELLED, EXPIRED, REFUNDED |
| `payment_method` | PIX, DINHEIRO, CARTAO, TRANSFERENCIA, MERCADO_PAGO, PAGBANK, INFINITYPAY, OUTRO |
| `profile_status` | ACTIVE, SUSPENDED, INACTIVE, PENDING |
| `payment_gateway` | INFINITYPAY, MERCADO_PAGO, PAGBANK |
| `payment_environment` | SANDBOX, PRODUCTION |

## RPCs Principais

| RPC | Descricao |
|---|---|
| `reserve_campaign_numbers` | Reserva atomica com advisory lock, validacao e rate limit |
| `release_expired_campaign_reservations` | Libera reservas expiradas (executado via pg_cron, a cada 1 min) |
| `cancel_campaign_reservation` | Libera reserva pelo token do dispositivo |
| `confirm_payment` | Confirma pagamento, atualiza pedido, libera/aloca numeros |
| `create_manual_order` | Cria pedido manual (registro de venda offline) |
| `create_whatsapp_order` | Cria reserva → pedido via WhatsApp |
| `import_sold_numbers` | Importa lista de numeros como vendidos |
| `admin_manage_number` | Edicao inline de numero pela administracao na grade |
| `add_order_numbers` / `remove_order_numbers` | Adiciona/remove itens numericos do pedido |
| `swap_order_number` | Troca numero de um pedido |
| `set_order_status` | Transicao de status com sincronizacao dos numeros |
| `log_order_audit` | Registra evento de auditoria no pedido |
| `is_global_admin()` | Helper RLS/RPC para verificacao de papel |
| `user_has_admin_role()` | Helper RLS para verificacao de papel admin |

## Nomenclatura de Migracoes

Padrao: `YYYYMMDDHHMMSS_descricao.sql`

Sempre aplicar migracoes na ordem cronologica do diretorio.

## Referencia de Migracoes

| Prefixo | Escopo |
|---|---|
| `20260804215329` | Migracao inicial — schema base |
| `20260804215357` | Ajustes iniciais |
| `20260805011246` | Sprint 1 — fundacao |
| `20260805011312` | Sprint 1 — ajustes |
| `20260806000001` | Sprint 3 — campanhas, imagens, settings |
| `20260806020000` | Sprint 4 — numbers, reservas, RPCs |
| `20260806100000` | Sprint 4.1 — customers, orders, enums |
| `20260806100001` | Sprint 4.5 — media types / indexes |
| `20260807000000` | Hotfix conflito reserva expirada |
| `20260807000001` | `admin_manage_number` |
| `20260807000002` | Hotfix cancel reservation |
| `20260808*` | Fixes admin access / permissoes Lovable |
| `20260811100000` | IAM Sprint 1 — fundacao de identidade |
| `20260812120000` | Permissoes por papel |
| `20260812130000` | RLS ownership scoping |
| `20260812140000` | Fix permissoes de campanha para PUBLISHER |
| `20260812150000` | Isolamento de clientes |
| `20260812160000` | Permissoes de gateway de pagamento |
| `20260812170000` | Fix isolamento de clientes (hardening) |
| `20260812180000` | Gateway de pagamento manual |
| `20260812190000` | Livro de caixa administrativo |
| `20260812210000` | Permissoes de notificacao cliente/pedido |
| `20260812220000` | RLS de permissoes de cliente |
| `20260812230000` | Pagamento com taxa antecipada (Advanced Fee) |
| `20260817000000` | Campanha destaque (featured) |

## Seguranca no Banco

- RLS habilitado em todas as tabelas de negocio
- RPCs privilegiadas como `SECURITY DEFINER` com verificacao interna de papel
- Service role exclusiva do servidor
- Webhooks idempotentes por `(gateway, event_id)`
- Travas de aconselhamento para reservas concorrentes
- pg_cron para expiracao automatica de reservas
