# Documentacao RaffleHub (Olivelas Raffle)

Documentacao completa das sprints implementadas no projeto **RaffleHub** — plataforma SaaS de rifas digitais.

**App:** https://olivelas-raffle.lovable.app  
**Repositorio:** https://github.com/pycriador-org/olivelas-raffle  
**Status:** Sprints 1 a 12 + IAM 2A–2D + Payments P0.1–P0.6 + Reestruturacao Admin (ago/2026)

---

## Indice

| Documento                                                                     | Descricao                                    |
| ----------------------------------------------------------------------------- | -------------------------------------------- |
| [Visao Geral das Sprints](./sprints/00-overview.md)                           | Mapa de todas as sprints, status e commits   |
| [Sprint 1 — Fundacao](./sprints/01-fundacao.md)                               | Layout, auth, RBAC, dashboard base           |
| [Sprint 2 — Modulos Admin](./sprints/02-modulos-admin.md)                     | Usuarios, arquivos, auditoria, configuracoes |
| [Sprint 3 — Campanhas](./sprints/03-campanhas.md)                             | CRUD, wizard, pagina publica, SEO            |
| [Sprint 4 — Selecao e Reservas](./sprints/04-selecao-reservas.md)             | Grade, reservas temporarias, realtime        |
| [Sprint 4.1 — Vendas Manuais e CRM](./sprints/04.1-vendas-crm.md)             | Clientes, pedidos, WhatsApp, RPCs            |
| [Sprint 4.2 — Centro de Operacoes](./sprints/04.2-centro-operacoes.md)        | Abas operacionais da campanha                |
| [Sprint 4.3 — Customer Picker](./sprints/04.3-customer-picker.md)             | Busca inteligente e cadastro rapido          |
| [Sprint 4.4 — Estabilizacao](./sprints/04.4-estabilizacao.md)                 | Correcoes de metricas e realtime             |
| [Sprint 4.5 — Media Manager](./sprints/04.5-media-manager.md)                 | Tipos de imagem e galeria                    |
| [Sprint 4.6 — Gerador de Artes](./sprints/04.6-gerador-artes.md)              | Canvas, temas, export PNG/JPEG               |
| [Sprint 5 — Auth e PIX base](./sprints/05-auth-pix-base.md)                   | Email/senha, QRCode, gateways base           |
| [Sprint 6 — Checkout e PIX](./sprints/06-checkout-pix.md)                     | Checkout publico, PIX, createCheckoutOrder   |
| [Sprint 7 — Confirmacao e Financeiro](./sprints/07-confirmacao-financeiro.md) | Comprovante, painel de pagamentos            |
| [Sprint 8 — Notificacoes](./sprints/08-notificacoes.md)                       | Templates WhatsApp/Email, eventos            |
| [Sprint 9 — Sorteio](./sprints/09-sorteio.md)                                 | Fisher-Yates, aba Sorteio, vencedores        |
| [Sprint 10 — Dashboard Executivo](./sprints/10-dashboard-executivo.md)        | KPIs de vendas e financeiro                  |
| [Sprint 11 — Participantes](./sprints/11-participantes.md)                    | Lista por campanha, sheet, export            |
| [Sprint 12 — Seguranca e LGPD](./sprints/12-seguranca-lgpd.md)                | Auditoria, masking, .env                     |
| [IAM 2A–2D — Admin Console e IAM Real](./sprints/00-overview.md)              | Admin Console, usuarios, roles, permissoes   |
| [Payments P0.1–P0.6 — Webhook, Gateways, Conciliacao](./sprints/00-overview.md)| Pagamentos, notificacoes, LGPD               |
| [Arquitetura](./arquitetura.md)                                               | Stack, pastas, fluxo de dados                |
| [Banco de Dados](./banco-de-dados.md)                                         | Tabelas, enums, RPCs, migracoes              |
| [Rotas](./rotas.md)                                                           | Mapa completo de rotas publicas e admin      |

---

## Como usar esta documentacao

1. Comece por [00-overview.md](./sprints/00-overview.md) para o panorama.
2. Leia as sprints na ordem se quiser entender a evolucao do produto.
3. Use [arquitetura.md](./arquitetura.md) e [banco-de-dados.md](./banco-de-dados.md) como referencia tecnica continua.
4. O README raiz traz o resumo consolidado de **todas** as sprints (1–12, IAM, Payments e reestruturacao admin).
