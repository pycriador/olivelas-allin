---
title: "Environment Configuration"
status: "ACCEPTED"
owner: "rafflehub"
created: "2026-08-18"
updated: "2026-08-18"
version: "1.0"
id: "OPS-002"
type: "operations"
---

# Environment Configuration

> Language: EN | [Português (pt-BR)](../../pt-BR/operations/environment.md)
>
> Status: ACCEPTED
>
> Documentation Standard v1.0

## Purpose

Reference for all environment variables, configuration files, and toolchain settings required to run RaffleHub.

## Environment Variables

| Variable | Scope | Required | Purpose |
| --- | --- | --- | --- |
| `VITE_SUPABASE_URL` | Client (browser) | Yes | Supabase project URL (e.g., `https://xxx.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Client (browser) | Yes | Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server (Nitro) | Yes | Supabase service role key — bypasses RLS, never exposed to client |

## Supabase Configuration

| Setting | Value |
| --- | --- |
| Auth provider | Google OAuth (via Lovable Cloud Auth) |
| Storage bucket | `org-assets` (tenant-isolated) |
| Realtime | Enabled for `campaign_numbers` and `payments` tables |
| RLS | Enabled on all tables |

### Storage Bucket: org-assets

| Property | Value |
| --- | --- |
| Name | `org-assets` |
| Public | No (accessed via server proxy) |
| Path structure | `organizations/{orgId}/campaigns/{campaignId}/{uuid}.{ext}` |
| Logo path | `organizations/{orgId}/logo/{timestamp}.{ext}` |
| RLS | Tenant-isolated (each org accesses only its folder) |

## Database Configuration

### App Settings (Key-Value)

| Key | Purpose | Default |
| --- | --- | --- |
| `payment_ttl_minutes` | Reservation/payment expiry in minutes | 30 |
| `payment_encryption_key` | PGP symmetric key for gateway credential encryption | (must be set) |

### Role Permissions

Stored in `role_permissions` table. 28 permissions across 10 domains:

| Domain | Permissions |
| --- | --- |
| Organization | `organization.view`, `organization.update`, `organization.suspend` |
| Ownership | `ownership.transfer` |
| Users | `users.view`, `users.invite`, `users.update`, `users.remove` |
| Roles | `roles.view`, `roles.update` |
| Billing | `billing.view` |
| Usage | `usage.view` |
| Audit | `audit.view` |
| Campaigns | `campaigns.view`, `campaigns.create`, `campaigns.update`, `campaigns.publish`, `campaigns.pause`, `campaigns.finish`, `campaigns.archive`, `campaigns.restore`, `campaigns.manage_images` |
| Numbers | `numbers.view`, `numbers.manage` |
| Reservations | `reservations.view`, `reservations.manage` |
| Participants | `participants.view`, `participants.manage` |
| Sales | `sales.view`, `sales.manage` |
| Payments | `payments.view`, `payments.manage` |

## Toolchain

| Tool | Version | Purpose |
| --- | --- | --- |
| Bun | Latest | Package manager (with supply-chain guard) |
| Node.js | 20+ | Runtime for build tools |
| TypeScript | 5.x | Type checking (`exactOptionalPropertyTypes: true`) |
| Vite | 8.x | Build tool |
| Nitro | Latest | Server-side framework |
| Tailwind CSS | 4.x | Styling |
| shadcn/ui | Latest | UI component library |

### TypeScript Configuration

Key `tsconfig.json` settings:

```json
{
  "compilerOptions": {
    "exactOptionalPropertyTypes": true,
    "noPropertyAccessFromIndexSignature": true,
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler"
  }
}
```

- `exactOptionalPropertyTypes: true` — `{ search: string | undefined }` is NOT assignable to `{ search?: string }`. Use spread operator to conditionally include properties.
- `noPropertyAccessFromIndexSignature: true` — Use bracket notation for dynamic keys (`obj["key"]` instead of `obj.key`).

## Development

```bash
# Install dependencies
bun install

# Start dev server
bun run dev

# Type check
npx tsc --noEmit

# Build for production
bun run build

# Preview production build
bun run preview
```

## Related Documentation

| Document | Path |
| --- | --- |
| Deployment | [deployment.md](deployment.md) |
| Migrations | [migrations.md](migrations.md) |
| Architecture | [../architecture/overview.md](../architecture/overview.md) |
