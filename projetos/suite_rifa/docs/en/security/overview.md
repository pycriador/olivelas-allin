---
title: "Security Overview"
status: "ACCEPTED"
owner: "rafflehub"
created: "2026-08-18"
updated: "2026-08-18"
version: "1.0"
id: "SEC-001"
type: "security"
---

# Security Overview

> Language: EN | [Português (pt-BR)](../../pt-BR/security/overview.md)
>
> Status: ACCEPTED
>
> Documentation Standard v1.0

## Purpose

Security model for RaffleHub covering trust boundaries, access control, data protection, and threat mitigation.

## Trust Boundaries

| Boundary | What is protected | Controls |
| --- | --- | --- |
| Organization isolation | All org-scoped data | RLS policies + SECURITY DEFINER functions |
| Client ↔ Server | Business logic execution | SECURITY DEFINER (all mutations server-side) |
| Public ↔ Authenticated | Campaign browsing vs. management | `public_campaign()` and `public_campaign_numbers()` only |
| Payment credentials | Gateway API keys | PGP encryption at rest |
| User data | PII (name, phone, email, document) | RLS + no cross-user visibility |

## Authentication

| Aspect | Implementation |
| --- | --- |
| Provider | Google OAuth via Supabase Auth (Lovable Cloud Auth) |
| Session | JWT-based (Supabase access_token) |
| Bootstrap | `bootstrap_session()` on every login |
| Token storage | Supabase client (httpOnly cookies where supported) |

## Authorization (RBAC)

Two-tier role model:

| Tier | Roles | Scope |
| --- | --- | --- |
| Platform | GLOBAL_ADMIN | Unrestricted access to all orgs |
| Organization | OWNER, ADMIN, MEMBER, VIEWER | Scoped to single org |

28 permissions enforced at three layers:

| Layer | Mechanism | Purpose |
| --- | --- | --- |
| Client UI | `PermissionGate` + `usePermissions()` | Hide/show UI elements (presentation only) |
| RPC Functions | `has_permission()` check in every SECURITY DEFINER function | Block unauthorized mutations |
| RLS Policies | Row-level security on every table | Restrict data visibility |

See [permissions.md](../application/permissions.md) for full matrix.

## Row-Level Security (RLS)

Every table has RLS enabled with policies for:

| Policy Type | Behavior |
| --- | --- |
| SELECT (member) | Users can read rows where `organization_id` matches their active membership |
| SELECT (public) | Published campaigns and their numbers visible to anonymous users |
| INSERT/UPDATE/DELETE | Blocked — all writes via SECURITY DEFINER functions |

### Key RLS Patterns

```sql
-- Member access: check organization_memberships
CREATE POLICY campaigns_select_member ON campaigns
  FOR SELECT USING (
    organization_id = (
      SELECT organization_id FROM organization_memberships
      WHERE user_id = auth.uid() AND status = 'ACTIVE'
    )
  );

-- Public access: published campaigns visible to all
CREATE POLICY campaigns_select_public ON campaigns
  FOR SELECT USING (status = 'PUBLISHED');
```

### RLS Bug Prevention

Table aliases in RLS policies must be fully qualified to avoid column resolution ambiguity:

```sql
-- CORRECT: qualified column references
CREATE POLICY payments_select_public ON payments
  FOR SELECT USING (
    payments.campaign_id = campaigns.id
    AND campaigns.status = 'PUBLISHED'
    AND payments.status = 'CONFIRMED'
  );

-- WRONG: unqualified 'status' may resolve to campaigns.status
-- instead of payments.status
```

## SECURITY DEFINER Functions

All mutating operations go through PostgreSQL functions with `SECURITY DEFINER`:

| Property | Value |
| --- | --- |
| Execution context | Function owner (typically postgres) |
| Bypasses RLS | Yes (can access all rows) |
| Self-enforced checks | `auth.uid()`, `has_permission()`, `org_is_active()` |
| Search path | `SET search_path = public` |

### Function Guard Pattern

Every function follows this sequence:

```sql
-- 1. Authentication
IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

-- 2. Organization context
_org_id := org_id_from_context();

-- 3. Permission check
IF NOT has_permission(_org_id, 'domain.action') THEN
  RAISE EXCEPTION 'Permission denied';
END IF;

-- 4. Org active check
IF NOT org_is_active(_org_id) THEN
  RAISE EXCEPTION 'Organization is not active';
END IF;

-- 5. Advisory lock (for concurrent operations)
PERFORM pg_advisory_xact_lock(hashtext('lock_name' || _org_id::text));

-- 6. Limit check
IF NOT org_limit(_org_id, 'limit_name', increment := 1) THEN
  RAISE EXCEPTION 'Limit exceeded';
END IF;
```

## Data Protection

### PII Handling

| Data | Storage | Access | Notes |
| --- | --- | --- | --- |
| User profile | `profiles` table | Own profile only (RLS) | Name, email, avatar |
| Participant data | `participants` table | Org members only (RLS) | Name, phone, email, document |
| Buyer info | `payments` table | Org members only (RLS) | Name, phone, email, document |
| Payment credentials | `payment_gateways` table | Org members only (RLS) | PGP encrypted |

### Encryption at Rest

Gateway credentials are encrypted using PostgreSQL's `pgp_sym_encrypt`:

```sql
-- Encryption
pgp_sym_encrypt($credentials, (SELECT value FROM app_settings WHERE key = 'payment_encryption_key'))

-- Decryption
pgp_sym_decrypt(credentials_encrypted, (SELECT value FROM app_settings WHERE key = 'payment_encryption_key'))
```

### Audit Trail

Every significant action is logged to `audit_logs`:

| Field | Purpose |
| --- | --- |
| `actor_id` | Who performed the action |
| `action` | What was done (e.g., CAMPAIGN_CREATED, PAYMENT_CONFIRMED) |
| `entity_type` | What was affected (e.g., campaign, payment) |
| `entity_id` | ID of the affected entity |
| `metadata` | JSONB with additional context |

## Threat Mitigation

| Threat | Mitigation |
| --- | ---|
| SQL injection | Parameterized RPC calls, no raw SQL from client |
| Cross-tenant data access | RLS policies + SECURITY DEFINER |
| Unauthorized mutations | `has_permission()` in every function |
| Race conditions | `pg_advisory_xact_lock` for concurrent operations |
| Webhook replay | Idempotent `record_webhook_event()` with UNIQUE constraint |
| Credential exposure | PGP encryption, never logged or returned to client |
| Directory traversal | Path validation in `/api/public/campaign-image` |
| Supply chain attacks | Bun `minimumReleaseAge = 24h` |

## Known Security Limitations

| Limitation | Impact | Classification |
| --- | --- | --- |
| No rate limiting on public endpoints | Potential abuse of public campaign pages | Confirmed |
| No webhook signature verification | Webhooks trusted by provider name only | Confirmed |
| No CSRF protection beyond Supabase defaults | Relies on SameSite cookies | Confirmed |
| No automated security scanning | Manual review only | Confirmed |

## Related Documentation

| Document | Path |
| --- | --- |
| Permissions | [../application/permissions.md](../application/permissions.md) |
| Auth | [../application/auth.md](../application/auth.md) |
| Data model | [../architecture/data-model.md](../architecture/data-model.md) |
| RPC functions | [../contracts/rpc-functions.md](../contracts/rpc-functions.md) |
| Payments | [../application/payments.md](../application/payments.md) |
