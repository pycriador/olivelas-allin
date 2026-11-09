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

# Database Migrations

> Language: EN | [Português (pt-BR)](../../pt-BR/operations/migrations.md)
>
> Status: ACCEPTED
>
> Documentation Standard v1.0

## Purpose

Chronological reference for all 14 database migrations. Migrations are ordered and must be applied in sequence.

## Migration History

### Sprint 1: Core Platform (6 migrations)

| Migration | Scope |
| --- | --- |
| `20260808234403` | Tables: `profiles`, `platform_roles`, `organizations`, `organization_memberships`, `organization_invitations`, `plans`, `plan_features`, `plan_limits`, `subscriptions`, `organization_usage`, `app_settings`, `audit_logs`, `notification_templates`. Enums: `org_role`, `org_status`, `membership_status`, `invitation_status`, `subscription_status`. RLS policies. |
| `20260808234448` | Functions: `bootstrap_session()`, `create_organization()`, `invite_member()`, `accept_invitation()` |
| `20260808234524` | Functions: `list_organization_members()`, `change_member_role()`, `set_member_status()`, `remove_member()`, `transfer_ownership()` |
| `20260808234832` | Functions: Plan and subscription management |
| `20260808234851` | Functions: `list_audit_logs()`, platform admin functions (`platform_metrics`, `platform_list_organizations`, `platform_list_users`) |
| `20260808234936` | Additional helper functions and refinements |

### Sprint 2: Campaigns (3 migrations)

| Migration | Scope |
| --- | --- |
| `20260809023411` | Tables: `campaigns`, `campaign_images`. Enum: `campaign_status`, `campaign_image_type`. RLS policies. |
| `20260809023922` | Functions: `create_campaign()`, `update_campaign()`, `set_campaign_status()`, `list_campaigns()` |
| `20260809023940` | Functions: `campaign_metrics()`, `add_campaign_image()`, `delete_campaign_image()`, `set_campaign_cover()`, `reorder_campaign_images()`, `public_campaign()` |

### Sprint 3: Refinements (1 migration)

| Migration | Scope |
| --- | --- |
| `20260810214801` | Additional refinements and fixes |

### Storage (1 migration)

| Migration | Scope |
| --- | --- |
| `20260812120000` | Creates `org-assets` storage bucket with tenant-isolated RLS |

### Sprint 4: Number Engine (1 migration)

| Migration | Scope |
| --- | --- |
| `20260812200000` | Tables: `campaign_numbers`, `number_reservations`. Enum: `number_status`, `reservation_status`. Functions: `generate_campaign_numbers()`, `admin_block_numbers()`, `admin_unblock_numbers()`, `list_campaign_numbers_admin()`, `campaign_number_metrics()`, `reserve_numbers()`, `cancel_reservation()`, `get_active_reservation()`, `admin_cancel_reservation()`, `public_campaign_numbers()`, `list_campaign_numbers_with_participant()`. RLS policies. |

### Sprint 5: Participants & Sales (1 migration)

| Migration | Scope |
| --- | --- |
| `20260812210000` | Tables: `participants`, `manual_sales`, `manual_sale_items`. Enum: `payment_method`. Functions: `create_participant()`, `update_participant()`, `list_participants()`, `get_participant_history()`, `export_participants_csv()`, `quick_sale()`, `create_manual_sale()`, `update_manual_sale()`, `cancel_manual_sale()`, `transfer_numbers()`, `list_manual_sales()`, `campaign_sales_metrics()`, `export_sales_csv()`. RLS policies. |

### Sprint 6: Payment Engine (1 migration)

| Migration | Scope |
| --- | --- |
| `20260817150000` | Tables: `payments`, `payment_gateways`, `webhook_events`. Enums: `payment_status`, `payment_gateway_provider`, `payment_method_online`. Functions: `create_payment()`, `update_payment_status()`, `confirm_payment()`, `cancel_payment()`, `get_payment()`, `public_get_payment()`, `list_payments()`, `campaign_payment_metrics()`, `create_payment_gateway()`, `update_payment_gateway()`, `delete_payment_gateway()`, `list_payment_gateways()`, `record_webhook_event()`. App settings: `payment_ttl_minutes`, `payment_encryption_key`. Permissions: `payments.view`, `payments.manage`. RLS policies. |

## Migration Order

```text
Sprint 1 (6) → Sprint 2 (3) → Sprint 3 (1) → Storage (1) → Sprint 4 (1) → Sprint 5 (1) → Sprint 6 (1)
```

**Total: 14 migrations**

## Naming Convention

```text
YYYYMMDDHHMMSS_<descriptive_name>.sql
```

Examples:
- `20260808234403_sprint1_core.sql`
- `20260812200000_sprint4_number_engine.sql`
- `20260817150000_sprint6_payment_engine.sql`

## Rollback Guidance

Migrations are forward-only. Rollback requires manual inverse operations:

| Sprint | Inverse |
| --- | --- |
| Sprint 4 | DROP tables, functions, enums in reverse order |
| Sprint 5 | DROP tables, functions, enums in reverse order |
| Sprint 6 | DROP tables, functions, enums in reverse order |

**Warning:** Rollback may break dependent functions from later sprints.

## Related Documentation

| Document | Path |
| --- | --- |
| Data model | [../architecture/data-model.md](../architecture/data-model.md) |
| Environment | [environment.md](environment.md) |
| Deployment | [deployment.md](deployment.md) |
