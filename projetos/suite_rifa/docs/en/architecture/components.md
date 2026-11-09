---
title: "Components"
status: "ACCEPTED"
owner: "rafflehub"
created: "2026-08-18"
updated: "2026-08-18"
version: "1.0"
id: "ARCH-003"
type: "architecture"
---

# Components

> Language: EN | [Português (pt-BR)](../../pt-BR/architecture/components.md)
>
> Status: ACCEPTED
>
> Documentation Standard v1.0

## Purpose

Map of all frontend routes, services, hooks, components, and server-side code in RaffleHub.

## Frontend Routes

### Public Routes

| Route | File | Purpose |
| --- | --- | --- |
| `/` | `index.tsx` | Landing / redirect |
| `/auth` | `auth.tsx` | Google OAuth login |
| `/c/$slug` | `c.$slug.tsx` | Public campaign page (number grid, reservation, countdown) |
| `/c/$slug/checkout` | `c.$slug.checkout.tsx` | Checkout flow (buyer info, PIX display, status polling) |

### Onboarding

| Route | File | Purpose |
| --- | --- | --- |
| `/onboarding` | `onboarding.tsx` | Create first organization |

### Authenticated Admin Routes

| Route | File | Purpose |
| --- | --- | --- |
| `/dashboard` | `dashboard.tsx` | Plan summary, usage meters |
| `/campaigns` | `campaigns.tsx` | Campaign list with filters and metrics |
| `/campaigns/create` | `campaigns.create.tsx` | Create new campaign |
| `/campaigns/$campaignId` | `campaigns.$campaignId.tsx` | Campaign detail (status, metrics, actions) |
| `/campaigns/$campaignId/edit` | `campaigns.$campaignId.edit.tsx` | Edit campaign form |
| `/campaigns/$campaignId/numbers` | `campaigns.$campaignId.numbers.tsx` | Number grid management (generate, block, quick-sale, pagination) |
| `/participants` | `participants.tsx` | Cross-campaign participant list |
| `/payments` | `payments.tsx` | Payment history + gateway config |
| `/settings/organization` | `settings.organization.tsx` | Org settings (5 tabs) |
| `/settings/users` | `settings.users.tsx` | Member management |
| `/settings/plan` | `settings.plan.tsx` | Current plan details |
| `/settings/usage` | `settings.usage.tsx` | Usage meters |
| `/settings/audit` | `settings.audit.tsx` | Audit log viewer |
| `/platform` | `platform.tsx` | Global admin dashboard |

## Services Layer

| Service | File | RPC Functions Used |
| --- | --- | --- |
| `TenantService` | `tenant.ts` | `bootstrap_session`, org queries |
| `OrganizationService` | `organizations.ts` | `create_organization`, `set_organization_status`, `suspend_own_organization`, `set_organization_logo` |
| `AuditService` | `organizations.ts` | `list_audit_logs` |
| `PlatformService` | `organizations.ts` | `platform_metrics`, `platform_list_organizations`, `platform_list_users`, `platform_organization_detail` |
| `MembershipService` | `memberships.ts` | `list_organization_members`, `invite_member`, `resend_invitation`, `revoke_invitation`, `preview_invitation`, `accept_invitation`, `change_member_role`, `set_member_status`, `remove_member`, `transfer_ownership` |
| `PermissionService` | `permissions.ts` | `my_permissions` |
| `PlanLimitService` | `plans.ts` | Direct queries to plans, features, limits, subscriptions |
| `CampaignService` | `campaigns.ts` | `list_campaigns`, `campaign_metrics`, `create_campaign`, `update_campaign`, `set_campaign_status` |
| `CampaignImageService` | `campaigns.ts` | `add_campaign_image`, `delete_campaign_image`, `set_campaign_cover`, `reorder_campaign_images` |
| `PublicCampaignService` | `campaigns.ts` | `public_campaign` |
| `CampaignNumberService` | `numbers.ts` | `list_campaign_numbers_admin`, `campaign_number_metrics`, `generate_campaign_numbers`, `admin_block_numbers`, `admin_unblock_numbers`, `public_campaign_numbers` |
| `ReservationService` | `numbers.ts` | `reserve_numbers`, `cancel_reservation`, `get_active_reservation`, `admin_cancel_reservation` |
| `ParticipantService` | `participants.ts` | `create_participant`, `update_participant`, `list_participants`, `get_participant_history`, `export_participants_csv` |
| `SaleService` | `sales.ts` | `quick_sale`, `create_manual_sale`, `update_manual_sale`, `cancel_manual_sale`, `transfer_numbers`, `list_manual_sales`, `campaign_sales_metrics`, `export_sales_csv` |
| `PaymentService` | `payments.ts` | `create_payment`, `update_payment_status`, `confirm_payment`, `cancel_payment`, `get_payment`, `public_get_payment`, `list_payments`, `campaign_payment_metrics` |
| `PaymentGatewayService` | `payments.ts` | `create_payment_gateway`, `update_payment_gateway`, `delete_payment_gateway`, `list_payment_gateways` |

## Hooks Layer

| Hook | File | Purpose |
| --- | --- | --- |
| `useSession`, `useCurrentUser` | `useTenant.ts` | Auth state |
| `useBootstrap` | `useTenant.ts` | First-time session setup |
| `useTenant` | `useTenant.ts` | Central tenant context (org, role, isGlobalAdmin) |
| `usePlanContext` | `useTenant.ts` | Plan features/limits/usage |
| `usePermissions` | `usePermissions.ts` | RBAC permissions |
| `useCampaignList`, `useCampaignMetrics`, `useCampaign` | `useCampaigns.ts` | Campaign queries |
| `useCreateCampaign`, `useUpdateCampaign`, `useSetCampaignStatus` | `useCampaigns.ts` | Campaign mutations |
| `usePublicCampaign` | `useCampaigns.ts` | Public campaign query |
| `useCampaignNumbers`, `useCampaignNumberMetrics` | `useNumbers.ts` | Number queries |
| `useGenerateNumbers`, `useBlockNumbers`, `useUnblockNumbers` | `useNumbers.ts` | Admin number mutations |
| `useActiveReservation`, `useReserveNumbers`, `useCancelReservation` | `useNumbers.ts` | Reservation flow |
| `useParticipants`, `useCreateParticipant`, `useUpdateParticipant` | `useParticipants.ts` | Participant CRUD |
| `useSales`, `useSalesMetrics`, `useQuickSale`, `useCreateSale` | `useSales.ts` | Sales queries/mutations |
| `usePayments`, `usePaymentMetrics`, `usePayment`, `usePublicPayment` | `usePayments.ts` | Payment queries (auto-polling) |
| `useCreatePayment`, `useConfirmPayment`, `useCancelPayment` | `usePayments.ts` | Payment mutations |
| `usePaymentGateways`, `useCreateGateway`, `useUpdateGateway`, `useDeleteGateway` | `usePaymentGateways.ts` | Gateway CRUD |
| `useRealtimeNumbers` | `useRealtimeNumbers.ts` | Supabase Realtime for campaign_numbers |
| `useRealtimePayments` | `useRealtimePayments.ts` | Supabase Realtime for payments |

## Key UI Components

| Component | Path | Purpose |
| --- | --- | --- |
| `AppShell` | `components/app/AppShell.tsx` | Main authenticated layout (sidebar, org switcher, theme) |
| `PermissionGate` | `components/app/PermissionGate.tsx` | Conditional render based on permissions |
| `NumberGrid` | `components/numbers/NumberGrid.tsx` | Interactive number grid with status colors |
| `CheckoutPage` | `components/payments/CheckoutPage.tsx` | 5-step checkout flow |
| `PixDisplay` | `components/payments/PixDisplay.tsx` | QR code + copy-paste + countdown |
| `QuickSaleDialog` | `components/sales/QuickSaleDialog.tsx` | Admin quick-sale dialog |
| `GatewayConfigForm` | `components/payments/GatewayConfigForm.tsx` | Gateway CRUD form |

## Server Routes

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/payments/create` | POST | Creates payment via provider (stubbed) |
| `/api/webhooks/:provider` | POST | Webhook receiver with idempotency |
| `/api/public/campaign-image` | GET | Proxies campaign images from Storage |

## Related Documentation

| Document | Path |
| --- | --- |
| Architecture overview | [overview.md](overview.md) |
| Data model | [data-model.md](data-model.md) |
| RPC functions | [../contracts/rpc-functions.md](../contracts/rpc-functions.md) |
| API routes | [../contracts/api-routes.md](../contracts/api-routes.md) |
