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

# Componentes

> Language: pt-BR | [English](../../en/architecture/components.md)
>
> Status: ACCEPTED
>
> Documentation Standard v1.0

## Finalidade

Mapeamento de todas as rotas do frontend, serviços, hooks, componentes e código do lado do servidor no RaffleHub.

## Rotas do Frontend

### Rotas Públicas

| Rota | Arquivo | Finalidade |
| --- | --- | --- |
| `/` | `index.tsx` | Página inicial / redirecionamento |
| `/auth` | `auth.tsx` | Login via Google OAuth |
| `/c/$slug` | `c.$slug.tsx` | Página pública da campanha (grade de números, reserva, contagem regressiva) |
| `/c/$slug/checkout` | `c.$slug.checkout.tsx` | Fluxo de checkout (informações do comprador, exibição PIX, polling de status) |

### Onboarding

| Rota | Arquivo | Finalidade |
| --- | --- | --- |
| `/onboarding` | `onboarding.tsx` | Criar primeira organização |

### Rotas Administrativas Autenticadas

| Rota | Arquivo | Finalidade |
| --- | --- | --- |
| `/dashboard` | `dashboard.tsx` | Resumo do plano, medidores de uso |
| `/campaigns` | `campaigns.tsx` | Lista de campanhas com filtros e métricas |
| `/campaigns/create` | `campaigns.create.tsx` | Criar nova campanha |
| `/campaigns/$campaignId` | `campaigns.$campaignId.tsx` | Detalhe da campanha (status, métricas, ações) |
| `/campaigns/$campaignId/edit` | `campaigns.$campaignId.edit.tsx` | Formulário de edição da campanha |
| `/campaigns/$campaignId/numbers` | `campaigns.$campaignId.numbers.tsx` | Gerenciamento da grade de números (gerar, bloquear, venda rápida, paginação) |
| `/participants` | `participants.tsx` | Lista de participantes entre campanhas |
| `/payments` | `payments.tsx` | Histórico de pagamentos + configuração do gateway |
| `/settings/organization` | `settings.organization.tsx` | Configurações da organização (5 abas) |
| `/settings/users` | `settings.users.tsx` | Gerenciamento de membros |
| `/settings/plan` | `settings.plan.tsx` | Detalhes do plano atual |
| `/settings/usage` | `settings.usage.tsx` | Medidores de uso |
| `/settings/audit` | `settings.audit.tsx` | Visualizador de log de auditoria |
| `/platform` | `platform.tsx` | Painel de administração global |

## Camada de Serviços

| Serviço | Arquivo | Funções RPC Utilizadas |
| --- | --- | --- |
| `TenantService` | `tenant.ts` | `bootstrap_session`, consultas de organização |
| `OrganizationService` | `organizations.ts` | `create_organization`, `set_organization_status`, `suspend_own_organization`, `set_organization_logo` |
| `AuditService` | `organizations.ts` | `list_audit_logs` |
| `PlatformService` | `organizations.ts` | `platform_metrics`, `platform_list_organizations`, `platform_list_users`, `platform_organization_detail` |
| `MembershipService` | `memberships.ts` | `list_organization_members`, `invite_member`, `resend_invitation`, `revoke_invitation`, `preview_invitation`, `accept_invitation`, `change_member_role`, `set_member_status`, `remove_member`, `transfer_ownership` |
| `PermissionService` | `permissions.ts` | `my_permissions` |
| `PlanLimitService` | `plans.ts` | Consultas diretas em plans, features, limits, subscriptions |
| `CampaignService` | `campaigns.ts` | `list_campaigns`, `campaign_metrics`, `create_campaign`, `update_campaign`, `set_campaign_status` |
| `CampaignImageService` | `campaigns.ts` | `add_campaign_image`, `delete_campaign_image`, `set_campaign_cover`, `reorder_campaign_images` |
| `PublicCampaignService` | `campaigns.ts` | `public_campaign` |
| `CampaignNumberService` | `numbers.ts` | `list_campaign_numbers_admin`, `campaign_number_metrics`, `generate_campaign_numbers`, `admin_block_numbers`, `admin_unblock_numbers`, `public_campaign_numbers` |
| `ReservationService` | `numbers.ts` | `reserve_numbers`, `cancel_reservation`, `get_active_reservation`, `admin_cancel_reservation` |
| `ParticipantService` | `participants.ts` | `create_participant`, `update_participant`, `list_participants`, `get_participant_history`, `export_participants_csv` |
| `SaleService` | `sales.ts` | `quick_sale`, `create_manual_sale`, `update_manual_sale`, `cancel_manual_sale`, `transfer_numbers`, `list_manual_sales`, `campaign_sales_metrics`, `export_sales_csv` |
| `PaymentService` | `payments.ts` | `create_payment`, `update_payment_status`, `confirm_payment`, `cancel_payment`, `get_payment`, `public_get_payment`, `list_payments`, `campaign_payment_metrics` |
| `PaymentGatewayService` | `payments.ts` | `create_payment_gateway`, `update_payment_gateway`, `delete_payment_gateway`, `list_payment_gateways` |

## Camada de Hooks

| Hook | Arquivo | Finalidade |
| --- | --- | --- |
| `useSession`, `useCurrentUser` | `useTenant.ts` | Estado de autenticação |
| `useBootstrap` | `useTenant.ts` | Configuração inicial da sessão |
| `useTenant` | `useTenant.ts` | Contexto central do tenant (organização, função, isGlobalAdmin) |
| `usePlanContext` | `useTenant.ts` | Funcionalidades/limites/uso do plano |
| `usePermissions` | `usePermissions.ts` | Permissões RBAC |
| `useCampaignList`, `useCampaignMetrics`, `useCampaign` | `useCampaigns.ts` | Consultas de campanha |
| `useCreateCampaign`, `useUpdateCampaign`, `useSetCampaignStatus` | `useCampaigns.ts` | Mutações de campanha |
| `usePublicCampaign` | `useCampaigns.ts` | Consulta de campanha pública |
| `useCampaignNumbers`, `useCampaignNumberMetrics` | `useNumbers.ts` | Consultas de números |
| `useGenerateNumbers`, `useBlockNumbers`, `useUnblockNumbers` | `useNumbers.ts` | Mutações administrativas de números |
| `useActiveReservation`, `useReserveNumbers`, `useCancelReservation` | `useNumbers.ts` | Fluxo de reserva |
| `useParticipants`, `useCreateParticipant`, `useUpdateParticipant` | `useParticipants.ts` | CRUD de participantes |
| `useSales`, `useSalesMetrics`, `useQuickSale`, `useCreateSale` | `useSales.ts` | Consultas/mutações de vendas |
| `usePayments`, `usePaymentMetrics`, `usePayment`, `usePublicPayment` | `usePayments.ts` | Consultas de pagamento (auto-polling) |
| `useCreatePayment`, `useConfirmPayment`, `useCancelPayment` | `usePayments.ts` | Mutações de pagamento |
| `usePaymentGateways`, `useCreateGateway`, `useUpdateGateway`, `useDeleteGateway` | `usePaymentGateways.ts` | CRUD de gateway |
| `useRealtimeNumbers` | `useRealtimeNumbers.ts` | Supabase Realtime para campaign_numbers |
| `useRealtimePayments` | `useRealtimePayments.ts` | Supabase Realtime para payments |

## Componentes UI Principais

| Componente | Caminho | Finalidade |
| --- | --- | --- |
| `AppShell` | `components/app/AppShell.tsx` | Layout principal autenticado (sidebar, seletor de organização, tema) |
| `PermissionGate` | `components/app/PermissionGate.tsx` | Renderização condicional baseada em permissões |
| `NumberGrid` | `components/numbers/NumberGrid.tsx` | Grade interativa de números com cores de status |
| `CheckoutPage` | `components/payments/CheckoutPage.tsx` | Fluxo de checkout em 5 etapas |
| `PixDisplay` | `components/payments/PixDisplay.tsx` | QR code + copy-paste + contagem regressiva |
| `QuickSaleDialog` | `components/sales/QuickSaleDialog.tsx` | Diálogo de venda rápida do administrador |
| `GatewayConfigForm` | `components/payments/GatewayConfigForm.tsx` | Formulário CRUD de gateway |

## Rotas do Servidor

| Rota | Método | Finalidade |
| --- | --- | --- |
| `/api/payments/create` | POST | Cria pagamento via provedor (stub) |
| `/api/webhooks/:provider` | POST | Receptor de webhook com idempotência |
| `/api/public/campaign-image` | GET | Proxieda imagens de campanha do Storage |

## Documentação Relacionada

| Documento | Caminho |
| --- | --- |
| Visão geral da arquitetura | [overview.md](overview.md) |
| Modelo de dados | [data-model.md](data-model.md) |
| Funções RPC | [../contracts/rpc-functions.md](../contracts/rpc-functions.md) |
| Rotas de API | [../contracts/api-routes.md](../contracts/api-routes.md) |
