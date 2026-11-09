# Banco de Dados

PostgreSQL via Supabase. Migracoes em `supabase/migrations/`.

---

## Tabelas principais

| Tabela                         | Descricao                                            |
| ------------------------------ | ---------------------------------------------------- |
| `profiles`                     | Usuarios (nome, email, avatar, status, soft delete)  |
| `user_roles`                   | `GLOBAL_ADMIN` ou `USER`                             |
| `campaigns`                    | Campanha (slug, range, preco, status, purchase_mode) |
| `campaign_numbers`             | Estado de cada numero + reserva/pedido               |
| `campaign_images`              | Midia tipada (COVER, GALLERY, SHARE, …)              |
| `campaign_settings`            | Exibicao, share, SEO, contato WhatsApp               |
| `customers`                    | CRM                                                  |
| `orders`                       | Pedidos (source, status, payment, valores)           |
| `order_items`                  | Numeros do pedido                                    |
| `order_receipts`               | Comprovantes                                         |
| `audit_logs`                   | Auditoria de acoes                                   |
| `settings` / platform settings | Config global                                        |

Tabelas de pagamento/webhook (quando presentes nas migracoes Lovable): eventos de gateway com chave de idempotencia.

---

## Enums

| Enum                     | Valores                                                                         |
| ------------------------ | ------------------------------------------------------------------------------- |
| `campaign_status`        | DRAFT, SCHEDULED, ACTIVE, PAUSED, FINISHED, CANCELLED, ARCHIVED                 |
| `campaign_number_status` | AVAILABLE, RESERVED, PENDING_PAYMENT, PAID, BLOCKED, CANCELLED, WINNER          |
| `campaign_image_type`    | COVER, GALLERY, SHARE, THUMBNAIL, BANNER                                        |
| `campaign_purchase_mode` | MANUAL, AUTOMATIC                                                               |
| `order_source`           | ONLINE, WHATSAPP, MANUAL                                                        |
| `order_status`           | OPEN, WAITING_CONTACT, WAITING_PAYMENT, PAID, CANCELLED, EXPIRED, REFUNDED      |
| `payment_method`         | PIX, DINHEIRO, CARTAO, TRANSFERENCIA, MERCADO_PAGO, PAGBANK, INFINITYPAY, OUTRO |

---

## RPCs principais

| RPC                                          | Descricao                                    |
| -------------------------------------------- | -------------------------------------------- |
| `reserve_campaign_numbers`                   | Reserva atomica + advisory lock + rate limit |
| `release_expired_campaign_reservations`      | Cron 1 min                                   |
| `cancel_campaign_reservation`                | Libera pelo token do dispositivo             |
| `create_manual_order`                        | Pedido manual                                |
| `create_whatsapp_order`                      | Reserva → pedido WhatsApp                    |
| `add_order_numbers` / `remove_order_numbers` | Itens do pedido                              |
| `swap_order_number`                          | Troca numero                                 |
| `set_order_status`                           | Transicao + sync dos numeros                 |
| `import_sold_numbers`                        | Importa lista como vendida                   |
| `admin_manage_number`                        | Edicao inline admin na grade                 |
| `log_order_audit`                            | Auditoria (ex.: sorteio)                     |
| `is_global_admin()`                          | Helper RLS/RPC                               |

---

## Migracoes (referencia)

| Prefixo          | Escopo                                  |
| ---------------- | --------------------------------------- |
| `20260806000001` | Sprint 3 — campanhas, imagens, settings |
| `20260806020000` | Sprint 4 — numbers, reservas, RPCs      |
| `20260806100000` | Sprint 4.1 — customers, orders, enums   |
| `20260806100001` | Sprint 4.5 — media types / indexes      |
| `20260807000000` | Hotfix conflito reserva expirada        |
| `20260807000001` | `admin_manage_number`                   |
| `20260807000002` | Hotfix cancel reservation               |
| `20260808*`      | Fixes admin access / permissoes Lovable |

Sempre aplicar migracoes na ordem cronologica do diretorio.

---

## Seguranca no banco

- RLS habilitado nas tabelas de negocio
- RPCs privilegiadas como `SECURITY DEFINER` com check de papel
- Service role apenas no servidor
- Webhooks idempotentes por `(gateway, event_id)`
