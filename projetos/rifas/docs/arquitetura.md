# Arquitetura

## Stack

| Tecnologia                      | Uso                                      |
| ------------------------------- | ---------------------------------------- |
| React 19 + TypeScript 5.8       | UI tipada                                |
| TanStack Start + Router + Query | SSR, rotas file-based, cache             |
| Vite 8 + Tailwind 4             | Build e CSS (oklch)                      |
| shadcn/ui + Radix UI            | Componentes acessiveis                   |
| Zod                             | Validacao de schemas                     |
| Recharts                        | Graficos do dashboard                    |
| Supabase                        | Auth, PostgreSQL, Storage, Realtime, RLS |
| Canvas API                      | Gerador de artes                         |
| qrcode                          | PIX QR                                   |

---

## Fluxo de dados

```
Routes (TanStack)
  → Features / Hooks
    → Services
      → Supabase Client (browser) ou client.server (service role)
        → PostgreSQL + RLS / RPCs SECURITY DEFINER
```

Autorizacao final sempre no banco (RLS + checks dentro das RPCs).

---

## Mapa de pastas (`src/`)

```
src/
├── components/           # ui/, common/, layout/, auth/
├── config/               # navigation.ts
├── contexts/             # auth, theme
├── features/
│   ├── campaigns/        # wizard, numbers/, operations/, hooks
│   ├── customers/        # picker, CRM UI
│   ├── orders/           # manual sale, whatsapp, import
│   └── dashboard/
├── hooks/                # debounce, permissions, reservations, etc.
├── integrations/supabase # client, client.server, types, auth middleware
├── lib/
│   ├── payments/         # gateway factory + adapters
│   ├── notifications/    # service + types
│   ├── draw.service.ts
│   ├── mask.ts
│   ├── seo.ts, slug.ts, format.ts, ...
├── routes/               # file-based (public + _authenticated)
├── schemas/              # Zod
├── services/             # campaign, order, customer, ...
└── types/
```

---

## Dominios e responsabilidades

| Dominio       | Responsabilidade                                       |
| ------------- | ------------------------------------------------------ |
| Campaigns     | Ciclo de vida da rifa, midia, settings, pagina publica |
| Numbers       | Estado por numero, reserva, edicao admin               |
| Customers     | CRM e picker                                           |
| Orders        | Vendas ONLINE/MANUAL/WHATSAPP                          |
| Payments      | Checkout, PIX, webhooks, painel                        |
| Notifications | Eventos → templates → providers                        |
| Draw          | Sorteio Fisher-Yates + auditoria                       |
| Admin         | Usuarios, arquivos, auditoria, settings                |
| Security      | RLS, masking, service role server-only                 |

---

## Modos de compra da campanha

| `purchase_mode` | Fluxo publico                            |
| --------------- | ---------------------------------------- |
| `MANUAL`        | Reserva → WhatsApp / contato organizador |
| `AUTOMATIC`     | Reserva → Checkout → PIX → Confirmacao   |

---

## Realtime

Canais Supabase usados para:

- Grade de numeros na pagina publica e no CO
- Pedidos no centro de operacoes
- Progresso nos cards de campanha

---

## Server vs Client

| Contexto                    | Cliente Supabase                                           |
| --------------------------- | ---------------------------------------------------------- |
| Browser                     | `integrations/supabase/client.ts` (anon/publishable)       |
| Server functions / webhooks | `client.server.ts` (service role, nunca no bundle cliente) |
