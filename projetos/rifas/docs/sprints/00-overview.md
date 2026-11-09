# Visao Geral das Sprints

Documento mestre com o historico de entrega do **RaffleHub** (Olivelas Raffle).

---

## Linha do tempo

| Sprint | Nome                            | Status    | Commit de referencia                    |
| ------ | ------------------------------- | --------- | --------------------------------------- |
| 1      | Fundacao                        | Concluida | `3b0e214` (fundacao) + template base    |
| 2      | Modulos Admin                   | Concluida | Usuarios, arquivos, auditoria, settings |
| 3      | Campanhas                       | Concluida | `83dcd79`                               |
| 4      | Selecao e Reservas              | Concluida | `1053d3d`                               |
| 4.1    | Vendas Manuais e CRM            | Concluida | `57db5d4` / `8b8fc6c`                   |
| 4.2    | Centro de Operacoes             | Concluida | `8b8fc6c`                               |
| 4.3    | Customer Picker Inteligente     | Concluida | `8b8fc6c`                               |
| 4.4    | Estabilizacao                   | Concluida | `8b8fc6c` + fixes posteriores           |
| 4.5    | Media Manager e Open Graph      | Concluida | `8b8fc6c`                               |
| 4.6    | Gerador de Artes                | Concluida | `8b8fc6c` + melhorias de arte           |
| 5      | Auth expandida + base PIX       | Concluida | `2250334`, `0f81a9d`, `7c363ca`         |
| 6      | Checkout, PIX e Gateway         | Concluida | `f9968ab`                               |
| 7      | Confirmacao e Painel Financeiro | Concluida | `473c9d4`                               |
| 8      | Notificacoes e Templates        | Concluida | `c1f8eb5`                               |
| 9      | Sorteio (Fisher-Yates)          | Concluida | `d041d6e`                               |
| 10     | Dashboard Executivo             | Concluida | `4c80add`                               |
| 11     | Participantes por campanha      | Concluida | `23c5cb1`                               |
| 12     | Seguranca e LGPD                | Concluida | `8fd71e4`                               |

---

## Evolucao do produto (resumo)

### Fase 1 — Base administrativa (Sprints 1–2)

App autenticado com sidebar, tema, RBAC (`GLOBAL_ADMIN` / `USER`), gestao de usuarios, arquivos, auditoria e configuracoes.

### Fase 2 — Motor de campanhas (Sprints 3–4)

CRUD de campanhas, pagina publica `/r/{slug}`, grade numerica virtualizada, reservas temporarias com token, expiracao e realtime Supabase.

### Fase 3 — Operacao comercial (Sprints 4.1–4.6)

CRM de clientes, pedidos (manual/WhatsApp), centro de operacoes multi-aba, midia tipada, gerador de artes em canvas, exportacoes e UX mobile.

### Fase 4 — Monetizacao online (Sprints 5–7)

Login email/senha, checkout publico, PIX (QR + copia e cola), adapters de gateway (InfinityPay, Mercado Pago, PagBank), confirmacao e painel financeiro.

### Fase 5 — Pos-venda e inteligencia (Sprints 8–11)

Notificacoes por evento, sorteio auditavel, dashboard executivo com KPIs, lista de participantes com export.

### Fase 6 — Hardening (Sprint 12)

Auditoria de seguranca, data masking LGPD, protecao de `.env`, checklist de RLS/RPCs/service role.

---

## Principais entregaveis por dominio

| Dominio      | O que existe hoje                               |
| ------------ | ----------------------------------------------- |
| Auth         | Google OAuth + email/senha + reset de senha     |
| Campanhas    | Wizard 5 passos, 7 status, lixeira, SEO, midia  |
| Numeros      | Grade, reserva atomica, edicao admin, sorteio   |
| Vendas       | ONLINE / MANUAL / WHATSAPP                      |
| Pagamentos   | PIX + gateways + painel + confirmacao           |
| CRM          | Clientes, participantes, historico, export      |
| Ops          | Centro de operacoes com abas por URL (`?tab=`)  |
| Notificacoes | Templates WhatsApp/Email por evento             |
| Seguranca    | RLS, RPCs SECURITY DEFINER, masking, audit logs |

---

## Commits-chave (git log filtrado)

```
8fd71e4 feat: Sprint 12 - Seguranca, LGPD hardening, data masking
23c5cb1 feat: Sprint 11 - Participantes por campanha, detail sheet, export
4c80add feat: Sprint 10 - Dashboard Executivo + metricas de vendas
d041d6e feat: Sprint 9 - Sorteio com Fisher-Yates, aba Sorteio, vencedores
c1f8eb5 feat: Sprint 8 - Notificacoes, Templates, WhatsApp/Email
473c9d4 feat: Sprint 7 - Confirmacao, Painel Financeiro, Pagamentos ativo
f9968ab feat: Sprint 6 - Checkout, PIX e Gateway de Pagamentos
2250334 feat: login por email/senha + recuperacao de senha + Google
8b8fc6c feat: sprints 4.1-4.6 - campaign operations center, CRM, media & artwork
57db5d4 feat: Sprint 4.1 - Vendas Manuais, CRM de Clientes e Fluxo WhatsApp
1053d3d feat: sprint 4 - number selection & temporary reservations
83dcd79 feat: sprint 3 - campaign management platform
```

---

## Proximos passos sugeridos (pos-Sprint 12)

1. Rotacionar chaves Supabase expostas no historico antigo do Git.
2. CSP headers e rate limiting em auth/checkout.
3. Integrar providers reais de WhatsApp/Email nas notificacoes.
4. Testes automatizados de RPCs criticas (reserva, pagamento, sorteio).
5. Observabilidade (logs estruturados + alertas de webhook).
