---
title: "RPC Functions"
status: "ACCEPTED"
owner: "rafflehub"
created: "2026-08-18"
updated: "2026-08-18"
version: "1.0"
id: "CTR-001"
type: "contracts"
---

# RPC Functions

> Language: EN | [Português (pt-BR)](../../pt-BR/contracts/rpc-functions.md)
>
> Status: ACCEPTED
>
> Documentation Standard v1.0

## Purpose

Complete catalog of all PostgreSQL SECURITY DEFINER functions exposed via Supabase RPC. Every mutation in RaffleHub goes through these functions — the client never writes directly to tables.

## Pattern

All functions follow this structure:

```sql
CREATE OR REPLACE FUNCTION function_name(_param TYPE)
RETURNS TYPE
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _org_id UUID;
BEGIN
  -- 1. Get organization context
  _org_id := org_id_from_context();

  -- 2. Check authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 3. Check permission
  IF NOT has_permission(_org_id, 'permission.key') THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  -- 4. Check org is active
  IF NOT org_is_active(_org_id) THEN
    RAISE EXCEPTION 'Organization is not active';
  END IF;

  -- 5. Advisory lock (for concurrent operations)
  PERFORM pg_advisory_xact_lock(hashtext('lock_name' || _org_id::text));

  -- 6. Check org limits
  IF NOT org_limit(_org_id, 'limit_name', increment := 1) THEN
    RAISE EXCEPTION 'Limit exceeded';
  END IF;

  -- 7. Business logic
  -- ...

  -- 8. Audit
  PERFORM write_audit(_org_id, 'ACTION', 'entity', entity_id, jsonb_build_object(...));

  RETURN result;
END;
$$;
```

## Organization Functions

| Function | Parameters | Returns | Permission | Purpose |
| --- | --- | --- | --- | --- |
| `bootstrap_session()` | — | JSONB | authenticated | Create/update profile, auto-promote GLOBAL_ADMIN |
| `create_organization()` | `_name, _slug, _email` | UUID | authenticated | Create org + OWNER membership |
| `suspend_own_organization()` | `_org_id` | VOID | organization.suspend | Self-suspend org |
| `set_organization_status()` | `_org_id, _status` | VOID | GLOBAL_ADMIN | Set org status (reactivate) |
| `set_organization_logo()` | `_org_id, _logo_url` | VOID | organization.update | Set org logo |

## Membership Functions

| Function | Parameters | Returns | Permission | Purpose |
| --- | --- | --- | --- | --- |
| `invite_member()` | `_org_id, _email, _role` | UUID | users.invite | Send invitation |
| `resend_invitation()` | `_invitation_id` | VOID | users.invite | Resend invitation email |
| `revoke_invitation()` | `_invitation_id` | VOID | users.invite | Revoke pending invitation |
| `preview_invitation()` | `_token_hash` | JSONB | authenticated | Preview invitation details |
| `accept_invitation()` | `_token` | UUID | authenticated | Accept invitation by token |
| `change_member_role()` | `_org_id, _user_id, _new_role` | VOID | roles.update | Change member role |
| `set_member_status()` | `_org_id, _user_id, _new_status` | VOID | users.update | Suspend/reactivate member |
| `remove_member()` | `_org_id, _user_id` | VOID | users.remove | Remove member from org |
| `transfer_ownership()` | `_org_id, _new_owner_id` | VOID | ownership.transfer | Transfer OWNER role |
| `list_organization_members()` | `_org_id, _search, _role, _status, _limit, _offset` | JSONB | users.view | Paginated member list |

## Permission Functions

| Function | Parameters | Returns | Permission | Purpose |
| --- | --- | --- | --- | --- |
| `my_permissions()` | `_org_id` | TEXT[] | authenticated | Return permission keys for user |

## Campaign Functions

| Function | Parameters | Returns | Permission | Purpose |
| --- | --- | --- | --- | --- |
| `create_campaign()` | `_org_id, _name, _description, _product_name, _product_description, _total_numbers, _number_price, _currency, _start_date, _end_date` | UUID | campaigns.create | Create new campaign |
| `update_campaign()` | `_campaign_id, _name, _description, _product_name, _product_description, _number_price, _start_date, _end_date` | VOID | campaigns.update | Update campaign fields |
| `set_campaign_status()` | `_campaign_id, _new_status` | VOID | campaigns.publish/pause/finish/archive/restore | Transition status |
| `list_campaigns()` | `_org_id, _search, _status, _sort, _limit, _offset` | JSONB | campaigns.view | Paginated list |
| `campaign_metrics()` | `_org_id` | JSONB | campaigns.view | Counts by status |
| `public_campaign()` | `_slug` | JSONB | anon | Safe public view |

## Campaign Image Functions

| Function | Parameters | Returns | Permission | Purpose |
| --- | --- | --- | --- | --- |
| `add_campaign_image()` | `_campaign_id, _url, _type` | UUID | campaigns.manage_images | Add image |
| `delete_campaign_image()` | `_image_id` | VOID | campaigns.manage_images | Remove image |
| `set_campaign_cover()` | `_campaign_id, _image_id` | VOID | campaigns.manage_images | Set cover |
| `reorder_campaign_images()` | `_campaign_id, _image_ids` | VOID | campaigns.manage_images | Reorder gallery |

## Number Functions

| Function | Parameters | Returns | Permission | Purpose |
| --- | --- | --- | --- | --- |
| `generate_campaign_numbers()` | `_campaign` | VOID | numbers.manage | Bulk insert AVAILABLE numbers |
| `admin_block_numbers()` | `_campaign, _numbers` | VOID | numbers.manage | Set numbers to BLOCKED |
| `admin_unblock_numbers()` | `_campaign, _numbers` | VOID | numbers.manage | Set BLOCKED to AVAILABLE |
| `list_campaign_numbers_admin()` | `_campaign, _status, _search, _limit, _offset` | JSONB | numbers.view | Paginated list |
| `campaign_number_metrics()` | `_campaign` | JSONB | numbers.view | Counts by status |
| `public_campaign_numbers()` | `_slug` | JSONB | anon | Safe public view |

## Reservation Functions

| Function | Parameters | Returns | Permission | Purpose |
| --- | --- | --- | --- | --- |
| `reserve_numbers()` | `_campaign, _numbers` | UUID | reservations.manage | Create time-limited hold |
| `cancel_reservation()` | `_reservation_id` | VOID | reservations.manage | Release held numbers |
| `get_active_reservation()` | `_campaign` | JSONB | reservations.view | Get current active reservation |
| `admin_cancel_reservation()` | `_reservation_id` | VOID | reservations.manage | Admin cancel |

## Participant Functions

| Function | Parameters | Returns | Permission | Purpose |
| --- | --- | --- | --- | --- |
| `create_participant()` | `_campaign_id, _name, _phone, _email, _document, _notes` | UUID | participants.manage | Create participant |
| `update_participant()` | `_participant_id, _name, _phone, _email, _document, _notes` | VOID | participants.manage | Update participant |
| `list_participants()` | `_campaign_id, _search, _limit, _offset` | JSONB | participants.view | Paginated list |
| `get_participant_history()` | `_participant_id` | JSONB | participants.view | Full history |
| `export_participants_csv()` | `_campaign_id` | TEXT | participants.view | CSV export |

## Sale Functions

| Function | Parameters | Returns | Permission | Purpose |
| --- | --- | --- | --- | --- |
| `quick_sale()` | `_campaign_id, _numbers, _name, _phone, _payment_method` | UUID | sales.manage | Atomically: create participant + sale + mark SOLD |
| `create_manual_sale()` | `_campaign_id, _participant_id, _numbers, _payment_method, _amount, _notes` | UUID | sales.manage | Create manual sale |
| `update_manual_sale()` | `_sale_id, _payment_method, _amount, _notes` | VOID | sales.manage | Update sale |
| `cancel_manual_sale()` | `_sale_id` | VOID | sales.manage | Cancel sale (revert numbers) |
| `transfer_numbers()` | `_from_participant_id, _to_participant_id, _numbers` | VOID | sales.manage | Move numbers between participants |
| `list_manual_sales()` | `_campaign_id, _search, _limit, _offset` | JSONB | sales.view | Paginated list |
| `campaign_sales_metrics()` | `_campaign_id` | JSONB | sales.view | Revenue and count metrics |
| `export_sales_csv()` | `_campaign_id` | TEXT | sales.view | CSV export |

## Payment Functions

| Function | Parameters | Returns | Permission | Purpose |
| --- | --- | --- | --- | --- |
| `create_payment()` | `_reservation_id, _gateway_id, _method, _buyer_name, _buyer_phone, _buyer_email, _buyer_document` | UUID | payments.manage | Create pending payment |
| `update_payment_status()` | `_payment_id, _new_status` | VOID | payments.manage | Update status |
| `confirm_payment()` | `_payment_id` | VOID | payments.manage | Confirm: mark numbers SOLD, create sale |
| `cancel_payment()` | `_payment_id` | VOID | payments.manage | Cancel payment |
| `get_payment()` | `_payment_id` | JSONB | payments.view | Get payment by ID |
| `public_get_payment()` | `_payment_id` | JSONB | anon | Safe public view |
| `list_payments()` | `_campaign_id, _status, _search, _limit, _offset` | JSONB | payments.view | Paginated list |
| `campaign_payment_metrics()` | `_campaign_id` | JSONB | payments.view | Revenue and count metrics |

## Gateway Functions

| Function | Parameters | Returns | Permission | Purpose |
| --- | --- | --- | --- | --- |
| `create_payment_gateway()` | `_org_id, _provider, _name, _credentials, _settings` | UUID | payments.manage | Create gateway config |
| `update_payment_gateway()` | `_gateway_id, _name, _credentials, _settings, _is_active` | VOID | payments.manage | Update gateway config |
| `delete_payment_gateway()` | `_gateway_id` | VOID | payments.manage | Delete gateway config |
| `list_payment_gateways()` | `_org_id` | JSONB | payments.view | List gateway configs |

## Platform Admin Functions

| Function | Parameters | Returns | Permission | Purpose |
| --- | --- | --- | --- | --- |
| `platform_metrics()` | — | JSONB | GLOBAL_ADMIN | Platform-wide metrics |
| `platform_list_organizations()` | `_search, _status, _limit, _offset` | JSONB | GLOBAL_ADMIN | List all orgs |
| `platform_list_users()` | `_search, _limit, _offset` | JSONB | GLOBAL_ADMIN | List all users |
| `platform_organization_detail()` | `_org_id` | JSONB | GLOBAL_ADMIN | Org detail with members |

## Audit Functions

| Function | Parameters | Returns | Permission | Purpose |
| --- | --- | --- | --- | --- |
| `list_audit_logs()` | `_org_id, _action, _entity, _actor, _limit, _offset` | JSONB | audit.view | Paginated audit log |
| `write_audit()` | `_org_id, _action, _entity, _entity_id, _metadata` | VOID | (internal) | Write audit entry |

## Related Documentation

| Document | Path |
| --- | --- |
| API routes | [api-routes.md](api-routes.md) |
| Data model | [../architecture/data-model.md](../architecture/data-model.md) |
| Security | [../security/overview.md](../security/overview.md) |
| Permissions | [../application/permissions.md](../application/permissions.md) |
