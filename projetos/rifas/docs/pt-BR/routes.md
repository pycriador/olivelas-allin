---
title: "Rotas da Aplicacao"
status: "ACCEPTED"
owner: "rafflehub-team"
created: "2026-08-16"
updated: "2026-08-16"
version: "1.0"
authority: "Verified"
---

# Rotas da Aplicacao

> 🇧🇷 Language: Portugues do Brasil

TanStack Router file-based em `src/routes/`.

## Publicas

| Rota | Descricao | Sprint |
|---|---|---|
| `/` | Landing page | 1 |
| `/auth` | Login Google + email/senha + recuperacao de senha | 1, 5 |
| `/r/$slug` | Pagina publica da campanha | 3, 4 |
| `/checkout/$orderId` | Checkout ONLINE | 6 |
| `/checkout/$orderId/pix` | QR code PIX + copia e cola | 6 |
| `/confirmation/$orderId` | Comprovante pos-pagamento | 7 |
| `/api/public/payments/webhook/{gateway}` | Webhook de pagamentos (POST) | P0.1 |

## Autenticadas (Publicador)

| Rota | Descricao | Acesso Tipico | Sprint |
|---|---|---|---|
| `/dashboard` | Dashboard executivo | Autenticado | 1, 10 |
| `/campanhas` | Minhas campanhas | Autenticado | 3 |
| `/campanhas/nova` | Wizard de criacao | Autenticado | 3 |
| `/campanhas/$id` | Centro de operacoes | Autenticado | 4.2+ |
| `/campanhas/$id/editar` | Edicao de campanha | Autenticado | 3 |
| `/pedidos` | Todas as vendas | GLOBAL_ADMIN | 4.1 |
| `/clientes` | CRM global | GLOBAL_ADMIN | 4.1 |
| `/notificacoes` | Templates de notificacao | Autenticado | 8 |
| `/arquivos` | Gestao de storage | Autenticado | 2 |
| `/auditoria` | Logs de auditoria | Autenticado | 2 |
| `/perfil` | Perfil do usuario | Autenticado | 1 |

## Console Administrativo (`/admin/*`)

Base protegida por `AdminRouteGuard` (papel GLOBAL_ADMIN ou ADMIN).

| Rota | Descricao | Sprint |
|---|---|---|
| `/admin/dashboard` | Dashboard global | 2A |
| `/admin/users` | Gestao de usuarios | 2A |
| `/admin/users/$userId` | Detalhe do usuario | 2A.2 |
| `/admin/campanhas` | Todas as campanhas | Reest. |
| `/admin/pagamentos` | Gateways e pagamentos | P0.4 |
| `/admin/configuracoes` | Configuracoes globais | Reest. |
| `/admin/roles` | Papeis e matriz de permissoes | 2A.2 |
| `/admin/permissions` | Permissoes por papel | 2A.2 |

**Redirects:** `/usuarios` → `/admin/users` · `/pagamentos` → `/admin/pagamentos` · `/configuracoes` → `/admin/configuracoes`

## Abas do Centro de Operacoes

Base: `/campanhas/{id}?tab=`

| `tab` | Conteudo | Sprint |
|---|---|---|
| (default) / overview | Visao geral da campanha | 4.2 |
| `grid` | Grade visual de numeros | 4.2 |
| `numbers` | Tabela de numeros | 4.2 |
| `orders` | Pedidos da campanha | 4.2 |
| `crm` | Clientes da campanha | 4.2 |
| `gallery` | Midia da campanha | 4.5 |
| `artwork` | Geracao de artes | 4.6 |
| `settings` | Configuracoes da campanha | 3 / 4.2 |
| `contact` | Contato WhatsApp | pos-4.2 |
| `reservations` | Reservas ativas | pos-4.6 |
| `draw` | Sorteio | 9 |
| `participants` | Participantes | 11 |

## Guardas de Rota

| Guarda | Localizacao | Verificacao |
|---|---|---|
| `_authenticated/route.tsx` | Layout raiz autenticado | Sessao valida + perfil ACTIVE |
| `_authenticated/admin/route.tsx` | Console administrativo | Papel GLOBAL_ADMIN ou ADMIN |
| Server functions admin | Modulos `*.server.ts` | `requireSupabaseAuth` + `requireGlobalAdmin` / `requirePermission` |
| Menu e itens de navegacao | Componentes UI | Verificacao de papel via permissions / RLS |
| Pagina publica `/r/$slug` | Rota publica | Nenhum service role exposto |
