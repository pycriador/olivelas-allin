# Rotas

TanStack Router file-based em `src/routes/`.

---

## Publicas

| Rota                     | Descricao                          | Sprint |
| ------------------------ | ---------------------------------- | ------ |
| `/`                      | Landing                            | 1      |
| `/auth`                  | Login Google + email/senha + reset | 1, 5   |
| `/r/$slug`               | Pagina publica da campanha         | 3, 4   |
| `/checkout/$orderId`     | Checkout ONLINE                    | 6      |
| `/checkout/$orderId/pix` | PIX QR + copia e cola              | 6      |
| `/confirmation/$orderId` | Comprovante pos-pagamento          | 7      |
| `/api/public/payments/webhook/{gateway}` | Webhook de pagamentos (POST) | P0.1 |

---

## Autenticadas (publicador)

| Rota                    | Descricao           | Acesso tipico | Sprint |
| ----------------------- | ------------------- | ------------- | ------ |
| `/dashboard`            | Dashboard executivo | Autenticado   | 1, 10  |
| `/campanhas`            | Minhas campanhas    | Autenticado   | 3      |
| `/campanhas/nova`       | Wizard              | Autenticado   | 3      |
| `/campanhas/$id`        | Centro de operacoes | Autenticado   | 4.2+   |
| `/campanhas/$id/editar` | Edicao              | Autenticado   | 3      |
| `/pedidos`              | Todas as vendas     | GLOBAL_ADMIN  | 4.1    |
| `/clientes`             | CRM global          | GLOBAL_ADMIN  | 4.1    |
| `/notificacoes`         | Templates           | Autenticado   | 8      |
| `/arquivos`             | Storage             | Autenticado   | 2      |
| `/auditoria`            | Logs                | Autenticado   | 2      |
| `/perfil`               | Perfil do usuario   | Autenticado   | 1      |

---

## Admin Console (`/admin/*`)

Base protegida por `AdminRouteGuard` (GLOBAL_ADMIN e ADMIN).

| Rota                     | Descricao                    | Sprint  |
| ------------------------ | ---------------------------- | ------- |
| `/admin/dashboard`       | Dashboard global             | 2A      |
| `/admin/users`           | Gestao de usuarios           | 2A      |
| `/admin/users/$userId`   | Detalhe do usuario           | 2A.2    |
| `/admin/campanhas`       | Todas as campanhas           | Reest.  |
| `/admin/pagamentos`      | Gateways e pagamentos        | P0.4    |
| `/admin/configuracoes`   | Configuracoes globais        | Reest.  |
| `/admin/roles`           | Roles e matriz               | 2A.2    |
| `/admin/permissions`     | Permissoes por role          | 2A.2    |

**Redirects:** `/usuarios` → `/admin/users` · `/pagamentos` → `/admin/pagamentos` · `/configuracoes` → `/admin/configuracoes`

---

## Abas do Centro de Operacoes

Base: `/campanhas/{id}?tab=`

| `tab`                | Conteudo             | Sprint  |
| -------------------- | -------------------- | ------- |
| (default) / overview | Visao geral          | 4.2     |
| `grid`               | Grade visual         | 4.2     |
| `numbers`            | Tabela de numeros    | 4.2     |
| `orders`             | Pedidos da campanha  | 4.2     |
| `crm`                | Clientes da campanha | 4.2     |
| `gallery`            | Midia                | 4.5     |
| `artwork`            | Artes                | 4.6     |
| `settings`           | Configuracoes        | 3 / 4.2 |
| `contact`            | Contato WhatsApp     | pos-4.2 |
| `reservations`       | Reservas ativas      | pos-4.6 |
| `draw`               | Sorteio              | 9       |
| `participants`       | Participantes        | 11      |

---

## Guardas

- Layout `_authenticated` exige sessao
- `/admin/*` exige papel GLOBAL_ADMIN ou ADMIN (`AdminRouteGuard`)
- Server functions admin usam `requireSupabaseAuth` + `assertGlobalAdmin`
- Itens de menu e rotas admin checam papel via permissions / RLS
- Paginas publicas nao expoem service role
