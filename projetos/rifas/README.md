# RaffleHub — Plataforma de Rifa Digital

SaaS para gestao profissional de rifas: campanhas, reservas, CRM, WhatsApp, checkout PIX, sorteio, notificacoes, dashboard executivo, IAM, gestao de pagamentos e hardening LGPD.

> **Status:** Sprints **1 a 12** + **IAM 2A–2D** + **Payments P0.1–P0.6** + **Reestruturacao Admin** concluidas.  
> **Documentacao completa:** [`/docs`](./docs/README.md)

**Live app:** https://olivelas-raffle.lovable.app

---

## Sumario

- [Documentacao (`/docs`)](./docs/README.md) — **fonte detalhada por sprint**
- [Visao geral](#visao-geral)
- [Funcionalidades por Sprint](#funcionalidades-por-sprint)
- [Arquitetura](#arquitetura)
- [Banco de dados](#banco-de-dados)
- [Rotas](#rotas)
- [Stack](#stack)
- [Testes](#testes)
- [Como executar](#como-executar)
- [Roadmap](#roadmap)

---

## Visao geral

O **RaffleHub** e uma plataforma completa para operadores de rifas digitais:

- **Autenticacao** Google OAuth + email/senha + reset, RBAC (GLOBAL_ADMIN / ADMIN / PUBLISHER)
- **IAM real** — tabelas `roles` e `plans`, bootstrap do primeiro usuario como GLOBAL_ADMIN, migracao automatica de dados legados
- **Admin Console** (`/admin/*`) com layout proprio: Dashboard, Usuarios, Roles, Permissoes, Campanhas, Pagamentos e Configuracoes
- **CRUD de campanhas** com wizard, 7 status e transicoes auditadas
- **Grade numerica virtualizada** com selecao por clique, arraste e aleatoria
- **Reservas temporarias** com token, expiracao automatica e realtime
- **CRM de clientes** com busca inteligente, cadastro rapido e historico
- **Vendas manuais, WhatsApp e ONLINE** com pedidos, itens e comprovantes
- **Checkout PIX** com gateways (InfinityPay, Mercado Pago, PagBank), webhook HTTP, conciliacao, retry e timeline
- **Centro de Operacoes** multi-aba (grade, pedidos, midia, artes, sorteio, participantes)
- **Notificacoes** por templates WhatsApp/Email (server-side)
- **Sorteio** Fisher-Yates com auditoria
- **Dashboard executivo** com KPIs por canal e financeiro
- **LGPD** helpers de masking + hardening de secrets
- **Testes automatizados** (30 testes IAM com Vitest)
- Documentacao completa em [`/docs`](./docs/README.md)

---

## Funcionalidades por Sprint

### Sprint 1 — Fundacao

| Area         | Funcionalidade                                              |
| ------------ | ----------------------------------------------------------- |
| Layout       | Sidebar recolhivel, breadcrumbs, footer, tema claro/escuro  |
| Autenticacao | Google OAuth via Lovable Cloud, sessao persistente          |
| RBAC         | GLOBAL_ADMIN / USER, primeiro usuario automaticamente admin |
| Dashboard    | Metricas com mock data + graficos Recharts                  |
| Perfil       | Edicao de nome/avatar, exibicao do papel                    |
| Infra        | Error boundary, 404/500, loading/empty/error states         |

### Sprint 2 — Modulos Admin

| Area          | Funcionalidade                                           |
| ------------- | -------------------------------------------------------- |
| Usuarios      | CRUD, ativar/desativar, alterar papel, busca e paginacao |
| Arquivos      | Upload, listagem e remocao de arquivos com RLS           |
| Auditoria     | Timeline de eventos com filtros, paginacao e atores      |
| Configuracoes | Tema, idioma, informacoes da plataforma                  |

### Sprint 3 — Campanhas

| Area           | Funcionalidade                                                        |
| -------------- | --------------------------------------------------------------------- |
| CRUD           | Criacao, edicao, duplicacao, arquivamento, exclusao com lixeira       |
| Wizard         | 5 passos com validacao Zod e preview ao vivo                          |
| Status         | DRAFT → SCHEDULED → ACTIVE → PAUSED → FINISHED → CANCELLED → ARCHIVED |
| Pagina publica | `/r/{slug}` com grade, galeria, progresso, SEO e compartilhamento     |
| Galeria        | Upload com compressao, drag-and-drop, capa com fallback               |
| SEO            | Open Graph, Twitter Card, JSON-LD, canonical, robots.txt, sitemap     |
| Metricas       | Cards de resumo + grafico de campanhas por mes                        |
| Lixeira        | Restauracao e esvaziamento permanente com liberacao de slug           |

### Sprint 4 — Selecao e Reservas

| Area           | Funcionalidade                                                      |
| -------------- | ------------------------------------------------------------------- |
| Grade numerica | Virtualizada, responsiva, com filtro e busca (ir para numero)       |
| Selecao        | Clique, arraste, QuickPick aleatorio (Fisher-Yates) com presets     |
| Reserva        | RPC transacional com advisory lock, token unico por lote            |
| Expiracao      | pg_cron a cada minuto + fallback no cliente, timer regressivo MM:SS |
| Cancelamento   | Pelo proprio dispositivo com `cancel_campaign_reservation`          |
| Realtime       | Canal Supabase atualiza grade e remove conflitos ao vivo            |
| Checkout       | Tela pos-reserva com token e total (pagamento na Sprint 5)          |
| Auditoria      | RESERVATION_CREATED/CANCELLED/EXPIRED/INVALID                       |

### Sprint 4.1 — Vendas Manuais e CRM

| Area             | Funcionalidade                                                                                                  |
| ---------------- | --------------------------------------------------------------------------------------------------------------- |
| Clientes (CRM)   | CRUD completo: nome, telefone, email, cidade, observacoes, soft delete                                          |
| Pedidos (Orders) | Modelo central: toda venda gera Order → atualiza Number → Dashboard                                             |
| Venda manual     | Seletor de campanha/cliente/numeros, pagamento, desconto, status inicial                                        |
| Importacao       | Lista de numeros (TXT/CSV) → pedido automatico                                                                  |
| WhatsApp         | Reserva → cria Order WAITING_CONTACT → abre wa.me com template                                                  |
| Comprovantes     | Upload de imagem/PDF vinculado ao pedido                                                                        |
| Timeline         | Historico completo por pedido com ActivityTimeline                                                              |
| RPCs             | create_manual_order, create_whatsapp_order, add/remove/swap_order_number, set_order_status, import_sold_numbers |

### Sprint 4.2 — Centro de Operacoes

| Area         | Funcionalidade                                                                     |
| ------------ | ---------------------------------------------------------------------------------- |
| Visao Geral  | Progresso (% vendido, % reservado, ocupacao), metricas de numeros, financeiro      |
| Grade Visual | Edicao inline de status via clique direito/esquerdo em numeros ocupados            |
| Numeros      | DataTable com filtros (status/origem) e busca inteligente (numero, nome, telefone) |
| NumberDrawer | Sheet lateral com status, cliente, pedido, historico e acoes (liberar, trocar)     |
| Pedidos      | Resumo financeiro (total, pagos, receita, ticket medio), export CSV, impressao     |
| Clientes     | Cards com stats, Sheet de historico de pedidos ao clicar                           |
| Midia        | CampaignMediaManager com grid, upload drag-drop, tipos de imagem                   |
| Artes        | Gerador de grade em canvas com 5 temas, export PNG/JPEG                            |
| Realtime     | useRealtimeOrders + useRealtimeCampaign em todas as abas                           |

### Sprint 4.3 — Customer Picker Inteligente

| Area              | Funcionalidade                                                           |
| ----------------- | ------------------------------------------------------------------------ |
| Busca             | Debounce 300ms, pesquisa por nome/telefone/email/cidade                  |
| Resultados        | Avatar, nome, telefone, email, cidade por cliente                        |
| QuickCustomerForm | Modal criar/editar com deteccao de duplicidade por telefone              |
| Cliente avulso    | Fluxo rapido: apenas nome + telefone, cadastro completo em segundo plano |
| Historico         | CustomerHistoryCard com pedidos, total gasto e ultima compra             |
| Servico           | findByPhone() para deteccao de duplicidade                               |

### Sprint 4.4 — Estabilizacao

| Correcao            | Descricao                                                                   |
| ------------------- | --------------------------------------------------------------------------- |
| Counts zerados      | useCampaignNumbersEnriched agora usa countNumberStates real                 |
| CustomerHistoryCard | Math bug corrigido (total/total=1 → orders_count)                           |
| useRealtimeOrders   | Wire no CampaignOrdersTab para atualizacao ao vivo                          |
| Status inicial      | ManualSaleDialog agora envia p_initial_status para a RPC                    |
| Hardcoded strings   | whatsapp-dialog usa ORDER_EDITABLE_STATUSES                                 |
| Dead code           | Imports nao usados removidos (useMemo, CampaignPreview, formatDateTime, cn) |
| Status constants    | Extraidos para status-constants.ts compartilhado                            |

### Sprint 4.5 — Media Manager e Open Graph

| Area                 | Funcionalidade                                                               |
| -------------------- | ---------------------------------------------------------------------------- |
| campaign_images      | Novas colunas: width, height, size, mime_type, image_type, alt_text, caption |
| image_type           | Enum: COVER, GALLERY, SHARE, THUMBNAIL, BANNER                               |
| Partial indexes      | Apenas 1 COVER/SHARE/THUMBNAIL/BANNER por campanha                           |
| CampaignMediaManager | Grid, upload drag-drop, type badges, edicao (alt/caption), preview           |
| setImageType         | Reset automatico do tipo anterior + is_cover                                 |
| Storage              | Organizado por tipo: cover/, gallery/, share/                                |

### Sprint 4.6 — Gerador de Artes

| Area               | Funcionalidade                                                   |
| ------------------ | ---------------------------------------------------------------- |
| NumberGridRenderer | Canvas com grade colorida, lista de vendidos, cabecalho e rodape |
| Temas              | claro, escuro, corporativo, minimalista, colorido                |
| Dimensoes          | 1080x1080, 1080x1920, 1080x1350, 1920x1080                       |
| Formatos           | PNG (qualidade 0.95) e JPEG                                      |
| Preview            | Canvas ao vivo que atualiza com cada configuracao                |
| Export             | Download automatico com nome {slug}-grade.{ext}                  |
| URL por aba        | ?tab=grid, ?tab=numbers, etc. — bookmarks diretos                |

### Sprint 5 — Auth expandida e base PIX

| Area               | Funcionalidade                                                     |
| ------------------ | ------------------------------------------------------------------ |
| Login email/senha  | Pagina `/auth` com 3 modos (login, cadastro, reset de senha)       |
| AuthContext        | Expandido: sessao, perfil, persistencia e logout                   |
| QRCode             | Gera e exibe QR PIX                                                 |
| Base de gateways   | Estrutura inicial de adapters de pagamento                         |

### Sprint 6 — Checkout e PIX

| Area                  | Funcionalidade                                                      |
| --------------------- | ------------------------------------------------------------------- |
| `/checkout/$orderId`  | Checkout publico ONLINE (resumo, dados do cliente, numeros, total)  |
| `/checkout/$orderId/pix` | PIX QR + copia e cola                                              |
| createCheckoutOrder   | Server function que converte reserva → pedido online                |
| Bifurcacao publica    | `/r/{slug}` decide fluxo MANUAL (reserva) vs AUTOMATIC (checkout)   |

### Sprint 7 — Confirmacao e Painel Financeiro

| Area                    | Funcionalidade                                                  |
| ----------------------- | --------------------------------------------------------------- |
| `/confirmation/$orderId`| Comprovante pos-pagamento                                       |
| Painel `/pagamentos`    | Lista de pagamentos, filtros, resumo financeiro                 |
| Menu                    | Item Pagamentos ativo na navegacao                              |

### Sprint 8 — Notificacoes

| Area            | Funcionalidade                                             |
| --------------- | ---------------------------------------------------------- |
| Arquitetura     | Desacoplada: evento → template → canal (WhatsApp/Email)    |
| NotificationService | Envio com templates padrao por evento                   |
| Admin `/notificacoes` | Configuracao de templates                            |
| Eventos         | ORDER_CREATED, PAYMENT_CONFIRMED, PAYMENT_FAILED, EXPIRED, RESERVATION_EXPIRING, etc. |

### Sprint 9 — Sorteio

| Area      | Funcionalidade                                                   |
| --------- | ---------------------------------------------------------------- |
| draw.service | Sorteio com Fisher-Yates e auditoria                          |
| Aba Sorteio | `/campanhas/{id}?tab=draw`                                     |
| Elegibilidade | Numeros pagos/conferidos participam                          |
| Vencedores | Exibicao dos numeros sorteados                                  |

### Sprint 10 — Dashboard Executivo

| Area        | Funcionalidade                                                    |
| ----------- | ----------------------------------------------------------------- |
| KPIs        | Reescrito por categorias (vendas, financeiro, canais, campanhas)  |
| Camada de dados | Hooks/mocks de metricas em `features/dashboard/data`          |
| Graficos    | Recharts                                                          |

### Sprint 11 — Participantes

| Area                | Funcionalidade                                                   |
| ------------------- | ---------------------------------------------------------------- |
| useCampaignParticipants | Hook por campanha                                            |
| Aba Participantes   | `/campanhas/{id}?tab=participants`                               |
| ParticipantSheet    | Detalhe do participante (numeros, compras)                       |
| Export              | Exportacao da lista                                              |

### Sprint 12 — Seguranca e LGPD

| Area               | Funcionalidade                                                    |
| ------------------ | ----------------------------------------------------------------- |
| `.env` versionado  | Protecao de chaves (service role nunca no cliente)                |
| Data masking       | `src/lib/mask.ts` — helpers LGPD (mascarar telefone, email, CPF)  |
| Auditoria          | Confirmado OK: eventos com actor, ip, user_agent                  |
| RLS/RPCs           | Checklist de grants e policies por funcao                         |

### Sprint 2A — Admin Console Foundation (IAM)

| Area        | Funcionalidade                                                        |
| ----------- | --------------------------------------------------------------------- |
| Layout      | `AdminLayout` + `AdminSidebar` (painel separado com visual amber)     |
| Dashboard   | `/admin/dashboard` com metricas reais (usuarios, planos, campanhas)   |
| Usuarios    | `/admin/users` com `UserTable` real (dados Supabase, sem mock)        |
| Navegacao   | Link "Admin Console" na sidebar principal                             |

### Sprint 2A (Parte 2) — Gestao de Usuarios, Perfis e Permissoes

| Area        | Funcionalidade                                                        |
| ----------- | --------------------------------------------------------------------- |
| Usuarios    | Busca, filtros por status/role, paginacao, ordenacao, soft delete/restore |
| Edicao      | Nome e avatar com auditoria (old/new value)                           |
| Roles       | `/admin/roles` — cards por role com contagem de usuarios + matriz     |
| Permissoes  | `/admin/permissions` — matriz role × permissao                        |
| Auth guard  | `/admin` protegido (GLOBAL_ADMIN e ADMIN)                             |

### Sprint 2C — Seguranca e Finalizacao

| Area             | Funcionalidade                                                    |
| ---------------- | ----------------------------------------------------------------- |
| Autorizacao      | `usePermissions` (`can`/`canAny`/`canAll`) + ROLE_PERMISSIONS     |
| Auditoria        | `ROLE_CHANGE`, `PLAN_CHANGE`, `STATUS_CHANGE`, edicao de perfil   |
| Protecao         | Grants de RPCs restritos, colunas sensiveis ocultas de `anon`     |
| Server functions | `requireSupabaseAuth` middleware nas rotas admin                  |

### Sprint 2D — IAM Real, Integracao e Finalizacao

| Area          | Funcionalidade                                                        |
| ------------- | --------------------------------------------------------------------- |
| Bootstrap     | Primeiro usuario → GLOBAL_ADMIN com advisory lock anti-race           |
| Migracao      | `user_roles` legado → `roles`/`plans` (role_id/plan_id nos profiles)  |
| CurrentUser   | `iamService.getCurrentUser` consolida role, plano e status            |
| Hooks         | `useUsers`, `useSetUserStatus`, `useSetUserRole`, `useDeleteUser`     |
| Testes        | 30 testes Vitest (bootstrap + permissao por role)                     |

### P0.1 — Webhook HTTP de Pagamentos

| Area        | Funcionalidade                                                    |
| ----------- | ----------------------------------------------------------------- |
| Endpoint    | `POST /api/public/payments/webhook/{gateway}`                     |
| Gateways    | infinitypay, mercado_pago/mercadopago, pagbank                     |
| Validacao   | Assinatura do provedor (sem auth de sessao)                       |
| Idempotencia| `payment_events` com UNIQUE (gateway, event_id)                   |
| Seguranca   | Sem service role exposto ao cliente                               |

### P0.2 + P0.3 — Gateway Settings UI e gateway por campanha

| Area                    | Funcionalidade                                                          |
| ----------------------- | ----------------------------------------------------------------------- |
| `payment_gateway_settings` | Credenciais por gateway (SOMENTE service role; sem grants anon/auth) |
| GatewaySettingsPanel    | Form de credenciais por campo (secrets nunca retornados)                |
| Teste de conexao        | `testGatewayConnectionAdmin` com resultado salvo (ok/falha)             |
| Gateway padrao          | `default_payment_gateway` em platform_settings                          |
| Gateway por campanha    | `payment_gateway` + `enable_pix` em campaign_settings                   |
| Server functions        | list/save/test/setDefault (todas com `assertGlobalAdmin`)               |

### P0.4 + P1 — Conciliacao, Retry, Timeline e Expiracao

| Area                 | Funcionalidade                                                          |
| -------------------- | ----------------------------------------------------------------------- |
| `reconcilePayment`   | Consulta gateway, expira localmente (com race check), sincroniza status |
| `reconcileOpenPayments` | Lote de pagamentos abertos (mais recentes primeiro)                 |
| `expireStalePayments`| Expiracao idempotente de pagamentos vencidos                            |
| Retry                | `retryPaymentForOrder` — nova tentativa PIX, nunca reutiliza anterior   |
| Timeline             | `loadPaymentAdminDetail` com eventos, tentativas e timeline montada     |
| Painel admin         | `/admin/pagamentos` — metricas, lista, filtros, detalhe em Sheet        |
| `confirm_payment`    | RPC que confirma pagamento e libera numeros                             |

### P0.5 + P0.6 — Notificacoes server-side e LGPD masking

| Area          | Funcionalidade                                                        |
| ------------- | --------------------------------------------------------------------- |
| NotificationService | Envio de notificacoes (server-side) com templates por evento     |
| notifyPaymentConfirmed | Notificacao automatica ao confirmar pagamento                   |
| Masking LGPD  | `src/lib/mask.ts` reforçado                                        |
| Hardening     | Chaves e segredos protegidos (payment_gateway_settings sem grants)  |

### Reestruturacao Admin (final)

| Area          | Funcionalidade                                                        |
| ------------- | --------------------------------------------------------------------- |
| `/admin/campanhas` | Lista TODAS as campanhas da plataforma (criador, status, metricas) |
| `/admin/pagamentos` | Gestao de gateways e pagamentos movida para /admin                |
| `/admin/configuracoes` | Configuracoes globais movidas para /admin                       |
| Redirects     | `/usuarios`→`/admin/users`, `/pagamentos`→`/admin/pagamentos`, `/configuracoes`→`/admin/configuracoes` |
| Sidebar admin | Todos os 7 links ativos (Dashboard, Usuarios, Campanhas, Pagamentos, Configuracoes, Roles, Permissoes) |

---

## Arquitetura

```
src/
├── __tests__/        # Vitest: iam-bootstrap, iam-permissions
├── components/       # UI components (ui/ common/ layout/ auth/ admin/)
│   └── admin/        #   AdminLayout, AdminSidebar, users/ (badges, forms, dialogs)
├── config/           # navigation.ts (NAV_ITEMS, ROUTE_LABELS)
├── contexts/         # AuthContext, ThemeContext
├── features/         # Modulos de dominio
│   ├── campaigns/    #   components/, hooks/, public-campaign.functions.ts
│   │   └── components/
│   │       ├── numbers/       # Grade, cartao, filtros, reserva
│   │       └── operations/    # Centro de operacoes (13 componentes)
│   ├── customers/    #   components/, hooks/
│   ├── orders/       #   components/, hooks/
│   ├── payments/     #   GatewaySettingsPanel
│   ├── users/        #   UserTable
│   └── dashboard/    #   components/, data/
├── hooks/            # use-debounce, use-permissions, use-users, use-audit, etc.
├── integrations/     # supabase/ (client, client.server, types, auth-middleware)
├── lib/              # format, permissions, slug, seo, utils, number-input, mask
│   ├── notifications/#   service.ts, types.ts, admin.server.ts
│   └── payments/     #   gateway.*, payment.*, reconciliation, webhook, adapters/
├── routes/           # TanStack Router file-based (+ /api public webhook)
├── schemas/          # Zod: campaign, customer, order, profile, platform-settings
├── services/         # campaign, customer, order, campaign-number, audit, storage,
│                     # iam, user, profile, platform-settings, settings, search
└── types/            # campaign, campaign-number, customer, order, audit, payment,
                      # profile (Role/Plan/CurrentUser), settings, storage, platform-settings
```

**Fluxo de dados**: Routes → Features/Hooks → Services → Supabase. RLS aplica autorizacao final no banco. Rotas admin usam `requireSupabaseAuth` + verificação de papel; credenciais de gateway trafegam apenas em server functions (service role).

---

## Banco de dados

### Tabelas principais

| Tabela                    | Descricao                                                     |
| ------------------------- | ------------------------------------------------------------- |
| `profiles`                | Usuarios com nome, email, avatar, status, `role_id`, `plan_id`, soft delete |
| `roles`                   | Roles de acesso: GLOBAL_ADMIN, ADMIN, PUBLISHER (IAM)         |
| `plans`                   | Planos: FREE, STANDARD, PRO (limites de campanhas/imagens)    |
| `user_roles`              | Compatibilidade legada (mantida em sincronia)                 |
| `campaigns`               | Campanhas com slug unico, range de numeros, preco, status     |
| `campaign_numbers`        | Estado de cada numero (AVAILABLE…WINNER), reserva e pedido    |
| `campaign_images`         | Imagens com tipo (COVER/GALLERY/SHARE), dimensoes e metadados |
| `campaign_settings`       | Configuracoes de exibicao, compartilhamento, SEO, gateway e PIX |
| `customers`               | CRM com nome, telefone, email, cidade e soft delete           |
| `orders`                  | Pedidos com source, status, payment_method, valores           |
| `order_items`             | Itens do pedido (numero, preco unitario, status)              |
| `order_receipts`          | Comprovantes de pagamento (imagem/PDF)                        |
| `payments`                | Pagamentos com gateway, tentativa, PIX, idempotency, expiracao |
| `payment_events`          | Eventos de webhook (idempotencia por gateway+event_id)        |
| `payment_gateway_settings`| Credenciais de gateways (SOMENTE service role)                |
| `platform_settings`       | Configuracao global (nome, logo, cores, idioma, gateway padrao) |
| `settings`                | Configuracoes da plataforma                                   |
| `audit_logs`              | Auditoria completa de acoes                                   |

### Enums

| Enum                     | Valores                                                                         |
| ------------------------ | ------------------------------------------------------------------------------- |
| `campaign_status`        | DRAFT, SCHEDULED, ACTIVE, PAUSED, FINISHED, CANCELLED, ARCHIVED                 |
| `campaign_number_status` | AVAILABLE, RESERVED, PENDING_PAYMENT, PAID, BLOCKED, CANCELLED, WINNER          |
| `campaign_image_type`    | COVER, GALLERY, SHARE, THUMBNAIL, BANNER                                        |
| `campaign_purchase_mode` | MANUAL, AUTOMATIC                                                               |
| `order_source`           | ONLINE, WHATSAPP, MANUAL                                                        |
| `order_status`           | OPEN, WAITING_CONTACT, WAITING_PAYMENT, PAID, CANCELLED, EXPIRED, REFUNDED      |
| `payment_method`         | PIX, DINHEIRO, CARTAO, TRANSFERENCIA, MERCADO_PAGO, PAGBANK, INFINITYPAY, OUTRO |
| `profile_status`         | ACTIVE, DISABLED, INACTIVE, PENDING, SUSPENDED                                  |
| `payment_gateway`        | INFINITYPAY, MERCADO_PAGO, PAGBANK                                              |
| `payment_environment`    | SANDBOX, PRODUCTION                                                             |
| `payment_status`         | CREATED, PENDING, WAITING_PAYMENT, PAID, FAILED, CANCELLED, EXPIRED, REFUNDED   |
| `payment_method_type`    | PIX, CREDIT_CARD, DEBIT_CARD, BOLETO                                            |

### RPCs principais

| RPC                                          | Descricao                                                 |
| -------------------------------------------- | --------------------------------------------------------- |
| `reserve_campaign_numbers`                   | Reserva atomica com advisory lock, expiracao e rate limit |
| `release_expired_campaign_reservations`      | pg_cron a cada minuto                                     |
| `cancel_campaign_reservation`                | Libera reserva pelo token do dispositivo                  |
| `create_manual_order`                        | Cria pedido manual com status inicial configuravel        |
| `create_whatsapp_order`                      | Converte reserva em pedido WhatsApp                       |
| `create_checkout_order`                      | Converte reserva em pedido ONLINE (checkout)              |
| `add_order_numbers` / `remove_order_numbers` | Gerencia itens do pedido                                  |
| `swap_order_number`                          | Troca um numero do pedido                                 |
| `set_order_status`                           | Transicao de status com sync de campaign_numbers          |
| `import_sold_numbers`                        | Importa lista de numeros como pedido PAID                 |
| `admin_manage_number`                        | Altera status inline pela grade (admin)                   |
| `confirm_payment`                           | Confirma pagamento e libera numeros                       |
| `get_user_role_code` / `is_global_admin_v2`  | IAM: leitura de role via tabela `roles`                   |

### Migracoes

Localizadas em `supabase/migrations/`:

- `20260806000001` — Sprint 3: campanhas, imagens, settings
- `20260806020000` — Sprint 4: campaign_numbers, reservas, RPCs
- `20260806100000` — Sprint 4.1: customers, orders, order_items/receipts, enums
- `20260806100001` — Sprint 4.5: image_type, partial indexes, new columns
- `20260807000000` — Hotfix: conflito de numeros expirados
- `20260807000001` — Sprint 4.6: admin_manage_number (edicao inline)
- `20260807000002` — Hotfix: recria cancel_campaign_reservation
- `20260807001841` — Hardening: grants de RPCs e colunas sensiveis
- `20260807042604` — platform_settings (configuracao global)
- `20260807042746` — Hardening: grants admin-only e colunas ocultas
- `20260808171653` — Hardening: RPCs admin + anon read-only
- `20260808171957` — Payments: enums, payments, payment_events, create_checkout_order, confirm_payment
- `20260808180000` — Hotfix: GLOBAL_ADMIN + handle_new_user ignora deletados
- `20260808_fix_lovable_permissions` — Hotfix: reverte bloqueio Lovable
- `20260811100000` — IAM Sprint 1: roles, plans, migracao de dados, bootstrap

---

## Rotas

### Publicas

| Rota                     | Descricao                          | Acesso  |
| ------------------------ | ---------------------------------- | ------- |
| `/`                      | Landing page                       | Publico |
| `/auth`                  | Login Google + email/senha/reset   | Publico |
| `/r/{slug}`              | Pagina publica da campanha         | Publico |
| `/checkout/{orderId}`    | Checkout ONLINE                    | Publico |
| `/checkout/{orderId}/pix`| PIX QR + copia e cola              | Publico |
| `/confirmation/{orderId}`| Comprovante pos-pagamento          | Publico |
| `/api/public/payments/webhook/{gateway}` | Webhook de pagamentos (POST) | Provedor |

### Autenticadas — area do publicador

| Rota                     | Descricao                   | Acesso       |
| ------------------------ | --------------------------- | ------------ |
| `/dashboard`             | Metricas em tempo real      | Autenticado  |
| `/campanhas`             | Minhas campanhas, lixeira   | Autenticado  |
| `/campanhas/nova`        | Wizard de criacao           | Autenticado  |
| `/campanhas/{id}`        | Centro de operacao (12 abas)| Autenticado  |
| `/campanhas/{id}/editar` | Editar campanha             | Autenticado  |
| `/pedidos`               | Todas as vendas             | GLOBAL_ADMIN |
| `/clientes`              | CRM completo                | GLOBAL_ADMIN |
| `/arquivos`              | Storage files               | Autenticado  |
| `/auditoria`             | Logs de auditoria           | Autenticado  |
| `/perfil`                | Editar perfil               | Autenticado  |
| `/notificacoes`          | Templates de notificacao    | Autenticado  |

### Admin Console (`/admin/*` — GLOBAL_ADMIN e ADMIN)

| Rota                     | Descricao                   | Acesso         |
| ------------------------ | --------------------------- | -------------- |
| `/admin/dashboard`       | Dashboard executivo global  | GLOBAL_ADMIN/ADMIN |
| `/admin/users`           | Gestao de usuarios          | GLOBAL_ADMIN/ADMIN |
| `/admin/users/{userId}`  | Detalhe do usuario          | GLOBAL_ADMIN/ADMIN |
| `/admin/campanhas`       | Todas as campanhas          | GLOBAL_ADMIN/ADMIN |
| `/admin/pagamentos`      | Gateways e pagamentos       | GLOBAL_ADMIN   |
| `/admin/configuracoes`   | Configuracoes globais       | GLOBAL_ADMIN   |
| `/admin/roles`           | Roles e matriz              | GLOBAL_ADMIN   |
| `/admin/permissions`     | Permissoes por role         | GLOBAL_ADMIN   |

### Redirects

`/usuarios` → `/admin/users` · `/pagamentos` → `/admin/pagamentos` · `/configuracoes` → `/admin/configuracoes`

---

## Stack

| Tecnologia                      | Uso                                      |
| ------------------------------- | ---------------------------------------- |
| React 19 + TypeScript 5.8       | UI com tipagem estrita                   |
| TanStack Start + Router + Query | SSR, roteamento file-based, cache        |
| Vite 8 + Tailwind 4             | Build e CSS utility-first (oklch)        |
| shadcn/ui + Radix UI            | Componentes acessiveis                   |
| Zod                             | Validacao de esquemas                    |
| Recharts                        | Graficos                                 |
| Supabase                        | Auth, PostgreSQL, Storage, Realtime, RLS |
| Google OAuth                    | Login social                             |
| Canvas API                      | Gerador de artes (NumberGridRenderer)    |
| Vitest                          | Testes automatizados (IAM)               |

---

## Testes

```sh
npm run test    # Vitest — 30 testes (iam-bootstrap + iam-permissions)
```

Cobertura atual:

| Suíte                  | Testes | Descricao                                  |
| ---------------------- | ------ | ------------------------------------------ |
| `iam-bootstrap.test.ts`| 19     | Bootstrap do primeiro usuario (GLOBAL_ADMIN), planos, migracao |
| `iam-permissions.test.ts` | 11  | Matriz de permissoes por role (PUBLISHER/ADMIN/GLOBAL_ADMIN) |

---

## Como executar

```sh
git clone https://github.com/pycriador-org/olivelas-raffle.git
cd olivelas-raffle
npm install
```

Configure `.env`:

```env
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_service_role_...
```

```sh
npm run dev     # Dev server
npm run build   # Producao
npm run lint    # ESLint
npm run test    # Vitest
```

---

## Roadmap

| Sprint                          | Status    |
| ------------------------------- | --------- |
| 1 — Fundacao                    | Concluida |
| 2 — Modulos Admin               | Concluida |
| 3 — Campanhas                   | Concluida |
| 4 — Selecao e Reservas          | Concluida |
| 4.1 — Vendas Manuais e CRM      | Concluida |
| 4.2 — Centro de Operacoes       | Concluida |
| 4.3 — Customer Picker Inteligente | Concluida |
| 4.4 — Estabilizacao             | Concluida |
| 4.5 — Media Manager e Open Graph | Concluida |
| 4.6 — Gerador de Artes          | Concluida |
| 5 — Auth expandida + base PIX   | Concluida |
| 6 — Checkout e PIX              | Concluida |
| 7 — Confirmacao e Painel Financeiro | Concluida |
| 8 — Notificacoes                | Concluida |
| 9 — Sorteio                     | Concluida |
| 10 — Dashboard Executivo        | Concluida |
| 11 — Participantes              | Concluida |
| 12 — Seguranca e LGPD           | Concluida |
| 2A — Admin Console Foundation   | Concluida |
| 2A.2 — Gestao de Usuarios e Permissoes | Concluida |
| 2C — Seguranca e Finalizacao    | Concluida |
| 2D — IAM Real e Integracao      | Concluida |
| P0.1 — Webhook HTTP             | Concluida |
| P0.2+P0.3 — Gateway Settings UI | Concluida |
| P0.4+P1 — Conciliacao/Retry/Timeline | Concluida |
| P0.5+P0.6 — Notificacoes e LGPD | Concluida |
| Reestruturacao Admin            | Concluida |

**Proximos passos sugeridos:**

1. CSP headers e rate limiting em auth/checkout.
2. Integrar providers reais de WhatsApp/Email nas notificacoes.
3. Testes automatizados das RPCs criticas (reserva, pagamento, sorteio).
4. Observabilidade (logs estruturados + alertas de webhook).

---

Built with [Lovable](https://lovable.dev). Continue in the [Lovable editor](https://lovable.dev/projects/6dbfcfbd-4727-46c6-827d-c53ad4ed2e7f).
