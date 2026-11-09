---
title: "Database Migrations"
status: "ACCEPTED"
owner: "rafflehub"
created: "2026-08-18"
updated: "2026-08-18"
version: "1.0"
id: "OPS-003"
type: "operations"
---

# Migrações do Banco de Dados

> Language: pt-BR | [English](../../en/operations/migrations.md)
>
> Status: ACCEPTED
>
> Documentation Standard v1.0

## Finalidade

Referência cronológica de todas as 14 migrações do banco de dados. As migrações são ordenadas e devem ser aplicadas em sequência.

## Histórico de Migrações

### Sprint 1: Plataforma Core (6 migrações)

| Migração | Escopo |
| --- | --- |
| `20260808234403` | Tabelas: `profiles`, `platform_roles`, `organizations`, `organization_memberships`, `organization_invitations`, `plans`, `plan_features`, `plan_limits`, `subscriptions`, `organization_usage`, `app_settings`, `audit_logs`, `notification_templates`. Enums: `org_role`, `org_status`, `membership_status`, `invitation_status`, `subscription_status`. Políticas RLS. |
| `20260808234448` | Funções: `bootstrap_session()`, `create_organization()`, `invite_member()`, `accept_invitation()` |
| `20260808234524` | Funções: `list_organization_members()`, `change_member_role()`, `set_member_status()`, `remove_member()`, `transfer_ownership()` |
| `20260808234832` | Funções: Gerenciamento de planos e assinaturas |
| `20260808234851` | Funções: `list_audit_logs()`, funções de administração da plataforma (`platform_metrics`, `platform_list_organizations`, `platform_list_users`) |
| `20260808234936` | Funções auxiliares adicionais e refinamentos |

### Sprint 2: Campanhas (3 migrações)

| Migração | Escopo |
| --- | --- |
| `20260809023411` | Tabelas: `campaigns`, `campaign_images`. Enum: `campaign_status`, `campaign_image_type`. Políticas RLS. |
| `20260809023922` | Funções: `create_campaign()`, `update_campaign()`, `set_campaign_status()`, `list_campaigns()` |
| `20260809023940` | Funções: `campaign_metrics()`, `add_campaign_image()`, `delete_campaign_image()`, `set_campaign_cover()`, `reorder_campaign_images()`, `public_campaign()` |

### Sprint 3: Refinamentos (1 migração)

| Migração | Escopo |
| --- | --- |
| `20260810214801` | Refinamentos e correções adicionais |

### Storage (1 migração)

| Migração | Escopo |
| --- | --- |
| `20260812120000` | Cria bucket de storage `org-assets` com RLS isolado por tenant |

### Sprint 4: Motor de Números (1 migração)

| Migração | Escopo |
| --- | --- |
| `20260812200000` | Tabelas: `campaign_numbers`, `number_reservations`. Enum: `number_status`, `reservation_status`. Funções: `generate_campaign_numbers()`, `admin_block_numbers()`, `admin_unblock_numbers()`, `list_campaign_numbers_admin()`, `campaign_number_metrics()`, `reserve_numbers()`, `cancel_reservation()`, `get_active_reservation()`, `admin_cancel_reservation()`, `public_campaign_numbers()`, `list_campaign_numbers_with_participant()`. Políticas RLS. |

### Sprint 5: Participantes e Vendas (1 migração)

| Migração | Escopo |
| --- | --- |
| `20260812210000` | Tabelas: `participants`, `manual_sales`, `manual_sale_items`. Enum: `payment_method`. Funções: `create_participant()`, `update_participant()`, `list_participants()`, `get_participant_history()`, `export_participants_csv()`, `quick_sale()`, `create_manual_sale()`, `update_manual_sale()`, `cancel_manual_sale()`, `transfer_numbers()`, `list_manual_sales()`, `campaign_sales_metrics()`, `export_sales_csv()`. Políticas RLS. |

### Sprint 6: Motor de Pagamentos (1 migração)

| Migração | Escopo |
| --- | --- |
| `20260817150000` | Tabelas: `payments`, `payment_gateways`, `webhook_events`. Enums: `payment_status`, `payment_gateway_provider`, `payment_method_online`. Funções: `create_payment()`, `update_payment_status()`, `confirm_payment()`, `cancel_payment()`, `get_payment()`, `public_get_payment()`, `list_payments()`, `campaign_payment_metrics()`, `create_payment_gateway()`, `update_payment_gateway()`, `delete_payment_gateway()`, `list_payment_gateways()`, `record_webhook_event()`. App settings: `payment_ttl_minutes`, `payment_encryption_key`. Permissões: `payments.view`, `payments.manage`. Políticas RLS. |

## Ordem das Migrações

```text
Sprint 1 (6) → Sprint 2 (3) → Sprint 3 (1) → Storage (1) → Sprint 4 (1) → Sprint 5 (1) → Sprint 6 (1)
```

**Total: 14 migrações**

## Convenção de Nomes

```text
YYYYMMDDHHMMSS_<nome_descritivo>.sql
```

Exemplos:
- `20260808234403_sprint1_core.sql`
- `20260812200000_sprint4_number_engine.sql`
- `20260817150000_sprint6_payment_engine.sql`

## Orientações de Rollback

Migrações são apenas para frente. Rollback requer operações inversas manuais:

| Sprint | Inverso |
| --- | --- |
| Sprint 4 | DROP tabelas, funções, enums na ordem inversa |
| Sprint 5 | DROP tabelas, funções, enums na ordem inversa |
| Sprint 6 | DROP tabelas, funções, enums na ordem inversa |

**Aviso:** Rollback pode quebrar funções dependentes de sprints posteriores.

## Documentação Relacionada

| Documento | Caminho |
| --- | --- |
| Modelo de dados | [../architecture/data-model.md](../architecture/data-model.md) |
| Ambiente | [environment.md](environment.md) |
| Implantação | [deployment.md](deployment.md) |
