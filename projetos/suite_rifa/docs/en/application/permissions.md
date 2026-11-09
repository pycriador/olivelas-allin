---
title: "Permissions & RBAC"
status: "ACCEPTED"
owner: "rafflehub"
created: "2026-08-18"
updated: "2026-08-18"
version: "1.0"
id: "APP-006"
type: "application"
---

# Permissions & RBAC

> Language: EN | [Português (pt-BR)](../../pt-BR/application/permissions.md)
>
> Status: ACCEPTED
>
> Documentation Standard v1.0

## Purpose

RaffleHub implements a two-tier role-based access control system: platform-level (GLOBAL_ADMIN) and organization-level (OWNER, ADMIN, MEMBER, VIEWER). Permissions are enforced at three layers: client UI, RPC functions, and RLS policies.

## Scope

| In scope | Notes |
| --- | --- |
| Platform role | GLOBAL_ADMIN (unrestricted access) |
| Organization roles | OWNER, ADMIN, MEMBER, VIEWER |
| 28 permissions | Stored in `role_permissions` table |
| Enforcement layers | UI (PermissionGate), RPC (has_permission), RLS |

## Role Hierarchy

| Role | Level | Description |
| --- | --- | --- |
| GLOBAL_ADMIN | Platform | Unrestricted access to all orgs and platform admin |
| OWNER | Organization | Full org control, can transfer ownership |
| ADMIN | Organization | Most admin operations, cannot transfer ownership |
| MEMBER | Organization | View + limited operations |
| VIEWER | Organization | Read-only access |

## Permission Matrix

### Organization

| Permission | OWNER | ADMIN | MEMBER | VIEWER |
| --- | --- | --- | --- | --- |
| `organization.view` | Yes | Yes | Yes | Yes |
| `organization.update` | Yes | Yes | No | No |
| `organization.suspend` | Yes | No | No | No |

### Ownership

| Permission | OWNER | ADMIN | MEMBER | VIEWER |
| --- | --- | --- | --- | --- |
| `ownership.transfer` | Yes | No | No | No |

### Users

| Permission | OWNER | ADMIN | MEMBER | VIEWER |
| --- | --- | --- | --- | --- |
| `users.view` | Yes | Yes | Yes | Yes |
| `users.invite` | Yes | Yes | No | No |
| `users.update` | Yes | Yes | No | No |
| `users.remove` | Yes | Yes | No | No |

### Roles

| Permission | OWNER | ADMIN | MEMBER | VIEWER |
| --- | --- | --- | --- | --- |
| `roles.view` | Yes | Yes | Yes | Yes |
| `roles.update` | Yes | Yes | No | No |

### Billing & Usage

| Permission | OWNER | ADMIN | MEMBER | VIEWER |
| --- | --- | --- | --- | --- |
| `billing.view` | Yes | Yes | Yes | Yes |
| `usage.view` | Yes | Yes | Yes | Yes |

### Audit

| Permission | OWNER | ADMIN | MEMBER | VIEWER |
| --- | --- | --- | --- | --- |
| `audit.view` | Yes | Yes | No | No |

### Campaigns

| Permission | OWNER | ADMIN | MEMBER | VIEWER |
| --- | --- | --- | --- | --- |
| `campaigns.view` | Yes | Yes | Yes | Yes |
| `campaigns.create` | Yes | Yes | Yes | No |
| `campaigns.update` | Yes | Yes | Yes | No |
| `campaigns.publish` | Yes | Yes | Yes | No |
| `campaigns.pause` | Yes | Yes | Yes | No |
| `campaigns.finish` | Yes | Yes | Yes | No |
| `campaigns.archive` | Yes | Yes | No | No |
| `campaigns.restore` | Yes | Yes | No | No |
| `campaigns.manage_images` | Yes | Yes | Yes | No |

### Numbers

| Permission | OWNER | ADMIN | MEMBER | VIEWER |
| --- | --- | --- | --- | --- |
| `numbers.view` | Yes | Yes | Yes | Yes |
| `numbers.manage` | Yes | Yes | Yes | No |

### Reservations

| Permission | OWNER | ADMIN | MEMBER | VIEWER |
| --- | --- | --- | --- | --- |
| `reservations.view` | Yes | Yes | Yes | Yes |
| `reservations.manage` | Yes | Yes | Yes | No |

### Participants

| Permission | OWNER | ADMIN | MEMBER | VIEWER |
| --- | --- | --- | --- | --- |
| `participants.view` | Yes | Yes | Yes | Yes |
| `participants.manage` | Yes | Yes | Yes | No |

### Sales

| Permission | OWNER | ADMIN | MEMBER | VIEWER |
| --- | --- | --- | --- | --- |
| `sales.view` | Yes | Yes | Yes | Yes |
| `sales.manage` | Yes | Yes | Yes | No |

### Payments

| Permission | OWNER | ADMIN | MEMBER | VIEWER |
| --- | --- | --- | --- | --- |
| `payments.view` | Yes | Yes | Yes | Yes |
| `payments.manage` | Yes | Yes | Yes | No |

## Enforcement Layers

### Layer 1: Client UI (Presentation Only)

```typescript
// PermissionGate component
<PermissionGate permission="campaigns.create">
  <Button>Criar Campanha</Button>
</PermissionGate>
```

`usePermissions()` hook fetches permission keys via `my_permissions()` RPC. `PermissionGate` hides/shows UI elements. This is presentation-only — the database independently enforces the same rules.

### Layer 2: RPC Functions (Business Logic)

Every SECURITY DEFINER function checks permissions:

```sql
-- Inside every mutating function:
IF NOT has_permission(_org_id, 'campaigns.create') THEN
  RAISE EXCEPTION 'Permission denied: campaigns.create';
END IF;
```

### Layer 3: RLS Policies (Data Access)

RLS policies on every table restrict which rows are visible:

```sql
-- Example: SELECT on campaigns
CREATE POLICY campaigns_select_member ON campaigns
  FOR SELECT USING (
    organization_id = (SELECT organization_id FROM organization_memberships WHERE user_id = auth.uid() AND status = 'ACTIVE')
    OR status = 'PUBLISHED'  -- public campaigns visible to all
  );
```

## GLOBAL_ADMIN Bypass

GLOBAL_ADMIN bypasses all org-level checks:
- Client: `isGlobalAdmin` flag makes all `can()`/`canWrite()` return `true`
- Server: `has_permission()` returns `true` for GLOBAL_ADMIN
- RLS: GLOBAL_ADMIN can access all org data

## Owner Restrictions

- OWNER can only be assigned via `transfer_ownership()` (requires typing org name)
- OWNER cannot be suspended or removed through standard member management
- Self-suspension via `suspend_own_organization()` (requires confirmation)
- Reactivation restricted to platform admins

## Related Documentation

| Document | Path |
| --- | --- |
| Auth | [auth.md](auth.md) |
| Security | [../security/overview.md](../security/overview.md) |
| RPC functions | [../contracts/rpc-functions.md](../contracts/rpc-functions.md) |
