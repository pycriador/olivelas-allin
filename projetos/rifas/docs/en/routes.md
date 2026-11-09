---
title: "Application Routes"
status: "ACCEPTED"
owner: "rafflehub-team"
created: "2026-08-16"
updated: "2026-08-16"
version: "1.0"
authority: "Verified"
---

# Application Routes

> 🇧🇷 Language: English

## Public Routes

| Path | Component | Description |
|---|---|---|
| `/` | LandingPage | Campaign carousel, featured campaign, CTA |
| `/auth` | AuthPage | Login, register, forgot password, Google OAuth |
| `/r/$slug` | PublicCampaignPage | Public campaign view with number selection |
| `/checkout/$orderId` | CheckoutPage | Customer data + PIX payment |
| `/checkout/$orderId/pix` | PixPaymentPage | QR code + copy-paste PIX code |
| `/confirmation/$orderId` | ConfirmationPage | Post-payment receipt and confirmation |

## Authenticated Routes

All routes under `_authenticated/` require a valid session (enforced by route guard in `_authenticated/route.tsx`).

| Path | Component | Permission | Description |
|---|---|---|---|
| `/dashboard` | DashboardPage | `dashboard.view` | Executive KPIs and metrics |
| `/campanhas` | CampaignsRoute | `campaigns.view` | Campaign list with filtering |
| `/campanhas/nova` | NewCampaignRoute | `campaigns.manage` | 4-step campaign creation wizard |
| `/campanhas/$id` | CampaignDetailRoute | `campaigns.view` | 12-tab operations center |
| `/pedidos` | PedidosPage | `orders.view` | Order management |
| `/clientes` | ClientesPage | `customers.view` | Customer CRM |
| `/arquivos` | FilesRoute | `files.view` | File and media management |
| `/notificacoes` | NotificacoesPage | `notifications.view` | Notification templates and logs |
| `/perfil` | ProfilePage | Any authenticated user | Edit own profile |
| `/iam` | IamPage | Any authenticated user | Identity view |

## Admin Routes

All routes under `_authenticated/admin/` require a valid session plus ADMIN or GLOBAL_ADMIN role (enforced by `_authenticated/admin/route.tsx`).

| Path | Component | Description |
|---|---|---|
| `/admin/dashboard` | AdminDashboardPage | Platform-wide metrics and analytics |
| `/admin/users` | AdminUsersPage | User CRUD, role assignment, status management |
| `/admin/campanhas` | AdminCampanhasPage | All campaigns, feature/pin management |
| `/admin/pagamentos` | AdminPagamentosPage | Payment gateway management, reconciliation |
| `/admin/gateways/$gateway` | AdminGatewayPage | Per-gateway configuration (credentials, environment) |
| `/admin/configuracoes` | AdminConfiguracoesPage | Global platform settings |
| `/admin/roles` | AdminRolesPage | Role × permission matrix editor |
| `/admin/relatorios` | AdminRelatoriosPage | Report exports (CSV, Excel, JSON) |
| `/admin/auditoria` | AdminAuditoriaPage | Audit log viewer with filters |

## Route Hierarchy

```
/                           (Public)
├── /auth                   (Public - Login/Register)
├── /r/$slug                (Public - Campaign View)
├── /checkout/$orderId      (Public - Checkout)
│   └── /pix                (Public - PIX Payment)
├── /confirmation/$orderId  (Public - Receipt)
│
└── _authenticated/         (Session Required)
    ├── /dashboard          (dashboard.view)
    ├── /campanhas          (campaigns.view)
    │   ├── /nova           (campaigns.manage)
    │   └── /$id            (campaigns.view)
    ├── /pedidos            (orders.view)
    ├── /clientes           (customers.view)
    ├── /arquivos           (files.view)
    ├── /notificacoes       (notifications.view)
    ├── /perfil             (Any)
    ├── /iam                (Any)
    │
    └── admin/              (ADMIN or GLOBAL_ADMIN)
        ├── /dashboard
        ├── /users
        ├── /campanhas
        ├── /pagamentos
        │   └── /$gateway
        ├── /configuracoes
        ├── /roles
        ├── /relatorios
        └── /auditoria
```
