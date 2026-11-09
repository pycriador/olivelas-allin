# TODO — Gaps SDD × Código (RaffleHub)

Documento de backlog gerado a partir da validação dos planejamentos em `docs/sdd/` contra o código atual.

**Data:** 2026-08-09  
**Escopo:** Sprints 1–12 (planejado vs implementado)  
**Regra:** este arquivo é a fonte de trabalho. **Nada deve ser implementado sem atualizar o status aqui.**

---

## Legenda

| Status    | Significado                       |
| --------- | --------------------------------- |
| `todo`    | Não iniciado                      |
| `doing`   | Em andamento                      |
| `done`    | Concluído e verificado            |
| `blocked` | Bloqueado (dependência / decisão) |
| `wontfix` | Fora de escopo consciente         |

| Prioridade | Critério                                              |
| ---------- | ----------------------------------------------------- |
| **P0**     | Quebra produção ou fluxo crítico de pagamento         |
| **P1**     | Feature planejada no SDD com alto impacto operacional |
| **P2**     | Completude de UX / polish / nice-to-have do SDD       |
| **P3**     | Documentação SDD inconsistente / hygiene              |

---

## Resumo rápido

| Prioridade | Qtd (aprox.) | Foco                                                                      |
| ---------- | ------------ | ------------------------------------------------------------------------- |
| P0         | 5            | Webhook, gateways UI, conciliação, notificações reais, masking em uso     |
| P1         | 12+          | Publicação visual, media crop, sorteio público, relatórios, retry payment |
| P2         | 15+          | PDF/A4 artes, Framer Motion, FAQ/comments, audit IP, etc.                 |
| P3         | 4            | Corrigir SDDs duplicados/incompletos                                      |

---

## P0 — Crítico (fazer primeiro)

### P0.1 — Endpoint HTTP de webhook

- **Status:** `todo`
- **Sprint SDD:** 6–7
- **Problema:** `processWebhookEvent()` e URL `/api/public/payments/webhook/{gateway}` existem, mas **nenhuma rota/handler HTTP chama a função**. Gateway não confirma pagamento.
- **Entrega esperada:**
  - [ ] Rota server-side por gateway: InfinityPay, Mercado Pago, PagBank
  - [ ] Validar assinatura via adapter (`parseWebhook`)
  - [ ] Chamar `processWebhookEvent`
  - [ ] Responder 200 em duplicata (idempotência)
  - [ ] Logs estruturados (sem secrets)
- **Arquivos prováveis:** `src/routes/api/...` ou server handler TanStack Start; `payment.server.ts`
- **Critério de aceite:** webhook real (ou sandbox) marca `Payment` + `Order` + números como `PAID`

### P0.2 — UI Configurações → Pagamentos (credenciais de gateway)

- **Status:** `todo`
- **Sprint SDD:** 6
- **Problema:** tabela `payment_gateway_settings` + `testConnection` nos adapters; **sem tela admin**.
- **Entrega esperada:**
  - [ ] Tela admin (GLOBAL_ADMIN) para InfinityPay / Mercado Pago / PagBank
  - [ ] Campos: enabled, environment (SANDBOX/PRODUCTION), credenciais
  - [ ] Nunca expor secrets no client além do necessário
  - [ ] Botão **Testar conexão**
  - [ ] Badge visual Sandbox vs Produção
  - [ ] Gateway padrão global
- **Arquivos prováveis:** `configuracoes.tsx` ou rota dedicada; service de gateway settings
- **Critério de aceite:** admin salva credenciais e testa conexão com sucesso/erro claro

### P0.3 — Config de gateway por campanha

- **Status:** `todo`
- **Sprint SDD:** 6
- **Problema:** hierarquia campanha → global → default parcial/ausente na UI.
- **Entrega esperada:**
  - [ ] Em Campanha → Configurações → Pagamento: modo MANUAL/AUTOMATIC
  - [ ] Seletor de gateway (padrão / InfinityPay / MP / PagBank)
  - [ ] Persistência e uso em `resolveGatewayForCampaign`
- **Critério de aceite:** duas campanhas podem usar gateways diferentes

### P0.4 — Conciliação e recuperação de pagamentos

- **Status:** `todo`
- **Sprint SDD:** 7
- **Problema:** `PaymentReconciliationService`, dashboard de conciliação, reprocessar webhook e “consultar gateway” **não existem**.
- **Entrega esperada:**
  - [ ] Serviço de reconciliação (status/amount/currency/payment_id)
  - [ ] Job/processo periódico ou botão manual admin
  - [ ] Tela: conciliados / pendentes / divergentes / webhooks erro
  - [ ] Ação: Reprocessar webhook (idempotente)
  - [ ] Ação: Consultar novamente no gateway
  - [ ] Divergência → `REVIEW_REQUIRED` (não auto-PAID)
  - [ ] Validação de valor Payment vs Order vs Gateway
- **Critério de aceite:** pagamento pago no gateway e pendente no app é recuperado sem duplicar receita

### P0.5 — Notificações reais (não cosméticas)

- **Status:** `todo`
- **Sprint SDD:** 8
- **Problema:** preview + `window.open(wa.me)`; e-mail stub; sem disparo automático no webhook.
- **Entrega esperada:**
  - [ ] Providers server-side (Email obrigatório; WhatsApp API ou fila)
  - [ ] Disparo em eventos: PAYMENT_CONFIRMED, ORDER_CREATED, EXPIRED, etc.
  - [ ] Templates persistidos (DB) ou config editável
  - [ ] Log/fila de envios com status SENT/FAILED/SKIPPED
  - [ ] Remover dependência de `window.open` no fluxo automático
- **Critério de aceite:** pagamento confirmado gera notificação sem ação manual do admin

### P0.6 — Data masking LGPD em uso

- **Status:** `todo`
- **Sprint:** 12 (implementação parcial)
- **Problema:** `src/lib/mask.ts` existe e **não é importado em nenhuma UI**.
- **Entrega esperada:**
  - [ ] Aplicar `maskPhone` / `maskEmail` / `maskCPF` em listagens públicas e exports sensíveis
  - [ ] Definir onde mostrar dado completo (só admin autenticado)
  - [ ] Revisar página pública e comprovantes compartilháveis
- **Critério de aceite:** PII mascarada fora do contexto admin autorizado

---

## P1 — Alto impacto operacional

### P1.1 — Retry de pagamento (novo Payment)

- **Status:** `todo`
- **Sprint SDD:** 7
- **Entrega:**
  - [ ] Botão “Tentar novamente” quando FAILED/EXPIRED
  - [ ] Cria Payment #N novo (nunca reutiliza o anterior)
  - [ ] Histórico completo de tentativas na UI
- **Depende de:** P0.1, P0.2

### P1.2 — Timeline financeira do pagamento

- **Status:** `todo`
- **Sprint SDD:** 7
- **Entrega:**
  - [ ] Timeline: pedido → reserva → payment → PIX → webhook → confirmado → números
  - [ ] Detalhe: gateway IDs, valores, status interno vs gateway

### P1.3 — Expiração Payment + Order alinhada ao SDD 7

- **Status:** `todo`
- **Sprint SDD:** 7
- **Problema:** expiração de reserva via pg_cron OK; payment/order expirados de forma completa é parcial.
- **Entrega:**
  - [ ] Job: se `reserved_until < now` e Payment != PAID → numbers AVAILABLE, Order EXPIRED, Payment EXPIRED
  - [ ] Race condition: nunca liberar se Payment = PAID
  - [ ] Idempotente

### P1.4 — Personalização visual aplicada na página pública

- **Status:** `todo`
- **Sprint SDD:** 5
- **Problema:** campos de tema/cores/fonte/fundo existem; aplicação na `/r/{slug}` incompleta.
- **Entrega:**
  - [ ] primary/secondary/button_color, font, background, banner na página pública
  - [ ] Preview admin fiel ao público

### P1.5 — Flags públicas: recent buyers, comments, FAQ

- **Status:** `todo`
- **Sprint SDD:** 5
- **Problema:** flags no banco/settings; UI pública não implementa.
- **Entrega:**
  - [ ] `show_recent_buyers` (lista real ou empty state)
  - [ ] Comments / FAQ: implementar ou desligar flag com “em breve”
  - [ ] Não deixar toggle que não faz nada sem indicação

### P1.6 — Media Manager: crop e ações avançadas

- **Status:** `todo`
- **Sprint SDD:** 4.5
- **Entrega:**
  - [ ] Editor crop (zoom, rotação, recorte)
  - [ ] Colar imagem (Ctrl+V)
  - [ ] Gerar WebP quando possível
  - [ ] Duplicar / renomear
  - [ ] Validação de duplicidade de arquivo

### P1.7 — Sorteio: fluxo completo + publicação pública

- **Status:** `todo`
- **Sprint SDD:** 9
- **Problema:** Fisher-Yates + aba admin OK; falta encerramento → apuração → publicação.
- **Entrega:**
  - [ ] Fluxo formal de encerramento da campanha antes do draw
  - [ ] Validação de participantes elegíveis
  - [ ] Publicação do vencedor na página pública `/r/{slug}`
  - [ ] Ata/comprovante público do sorteio (ou PDF/admin share)
  - [ ] Impedir re-sorteio sem processo autorizado

### P1.8 — Módulo Relatórios

- **Status:** `todo`
- **Sprint SDD:** 2 / 10–11
- **Problema:** item de sidebar/relatórios planejado; não existe.
- **Entrega:**
  - [ ] Rota `/relatorios` (ou equivalente)
  - [ ] Relatórios por campanha/período/canal
  - [ ] Export CSV/Excel

### P1.9 — Dashboard 360° do cliente

- **Status:** `todo`
- **Sprint SDD:** 4.1 / 11
- **Entrega:**
  - [ ] Pedidos, números, valor gasto, última compra, campanhas
  - [ ] Histórico de alterações quando houver
  - [ ] Atalhos para corrigir venda manual

### P1.10 — Edição completa de pedido

- **Status:** `todo`
- **Sprint SDD:** 4.1
- **Entrega:**
  - [ ] Editar cliente, observações, forma de pagamento
  - [ ] Add/remove/swap números com auditoria (já parcial via RPCs)
  - [ ] Regras de quais status são editáveis

### P1.11 — Checklist de publicação rigoroso

- **Status:** `todo`
- **Sprint SDD:** 5
- **Problema:** checklist existe; validar se bloqueia publicação de fato em todos os itens do SDD.
- **Entrega:**
  - [ ] Impedir publicar com itens pendentes
  - [ ] Motivo claro por item (nome, produto, capa, WhatsApp, SEO, etc.)

### P1.12 — Participantes: filtros e correções

- **Status:** `todo`
- **Sprint SDD:** 11
- **Entrega:**
  - [ ] Filtro “pendentes de pagamento”
  - [ ] Histórico de alterações por participante
  - [ ] Fluxo guiado de correção de venda manual a partir do sheet

### P1.13 — Rotação de secrets expostos no Git

- **Status:** `todo`
- **Sprint:** 12
- **Problema:** `.env` esteve versionado (ex.: commit antigo); chaves podem estar no histórico.
- **Entrega:**
  - [ ] Rotacionar chaves Supabase no painel
  - [ ] Confirmar `.env` fora do tracking
  - [ ] Documentar processo (sem colar secrets no repo)

### P1.14 — CSP headers + rate limiting

- **Status:** `todo`
- **Sprint:** 12 (recomendações)
- **Entrega:**
  - [ ] CSP no deploy
  - [ ] Rate limit auth / checkout / reserva

---

## P2 — Completude / polish

### P2.1 — Framer Motion

- **Status:** `todo`
- **Sprint SDD:** 1
- **Entrega:** animações suaves em layout/transições (ou marcar `wontfix` se stack atual for suficiente)

### P2.2 — Área global de notificações no layout

- **Status:** `todo`
- **Sprint SDD:** 1
- **Entrega:** sino/dropdown de notificações do sistema (não só página `/notificacoes`)

### P2.3 — Auditoria: IP e user_agent

- **Status:** `todo`
- **Sprint SDD:** 2
- **Entrega:** preencher `ip` / `user_agent` nos audit logs; login/logout automáticos

### P2.4 — Configurações por categorias ricas

- **Status:** `todo`
- **Sprint SDD:** 2
- **Entrega:** categorias Sistema, Interface, Segurança, Pagamentos, Compartilhamento, Uploads, Notificações com forms completos

### P2.5 — Storage organizado + progresso de upload

- **Status:** `todo`
- **Sprint SDD:** 2
- **Entrega:** pastas `avatars/`, `campaigns/`, `documents/`, `temp/`; barra de progresso

### P2.6 — Editor rich text completo nas campanhas

- **Status:** `todo`
- **Sprint SDD:** 3
- **Entrega:** editor rico além de Markdown básico (ou documentar Markdown como decisão final)

### P2.7 — Artes: PDF, A4, 300 DPI, QR Code

- **Status:** `todo`
- **Sprint SDD:** 4.6
- **Entrega:**
  - [ ] Export PDF
  - [ ] Dimensão A4
  - [ ] Qualidade impressão
  - [ ] QR Code no rodapé (link da campanha)
  - [ ] Filtros somente vendidos/disponíveis/reservados + destaque
  - [ ] Impressão / Web Share da arte

### P2.8 — Templates extras de arte (Story, Cartaz, Banner, Status WA)

- **Status:** `todo`
- **Sprint SDD:** 4.6 (fase 2 — SDD priorizou só mapa)
- **Entrega:** templates além do mapa de números

### P2.9 — Preview social (WhatsApp/FB/Telegram/LinkedIn/X)

- **Status:** `todo`
- **Sprint SDD:** 5
- **Entrega:** painel “como vai aparecer” por rede

### P2.10 — Histórico de payments dedicado (não só orders)

- **Status:** `todo`
- **Sprint SDD:** 6–7
- **Entrega:** listagem da entidade `payments` com filtros gateway/status/período

### P2.11 — Estrutura preparada CREDIT_CARD / DEBIT_CARD / BOLETO

- **Status:** `todo`
- **Sprint SDD:** 6
- **Entrega:** tipos/UI desabilitada “em breve”; sem implementar cobrança ainda

### P2.12 — Testes automatizados de RPCs críticas

- **Status:** `todo`
- **Sprint SDD:** 4.4 / pós-12
- **Entrega:** testes reserva, set_order_status, finalize_payment, sorteio, webhook idempotente

### P2.13 — Observabilidade

- **Status:** `todo`
- **Entrega:** logs estruturados + alertas de falha de webhook/conciliação

### P2.14 — Exclusão formal de número no CO

- **Status:** `todo`
- **Sprint SDD:** 4.2
- **Entrega:** fluxo explícito de exclusão/liberação com confirmação e audit

### P2.15 — Masking em exports CSV

- **Status:** `todo`
- **Entrega:** opção “exportar mascarado” vs “exportar completo (admin)”

---

## P3 — Higiene de documentação SDD

### P3.1 — Corrigir `docs/sdd/Sprint 4.3.md`

- **Status:** `todo`
- **Problema:** arquivo é cópia idêntica de Sprint 4.2
- **Entrega:** reescrever SDD real do Customer Picker (ou apontar para doc em `docs/sprints/04.3-*.md`)

### P3.2 — Corrigir `docs/sdd/Sprint 10.md`

- **Status:** `todo`
- **Problema:** arquivo é cópia idêntica de Sprint 9
- **Entrega:** SDD do Dashboard Executivo

### P3.3 — Completar stubs SDD 8, 9, 11

- **Status:** `todo`
- **Problema:** arquivos só com outline curto
- **Entrega:** requisitos detalhados alinhados ao que foi/será feito

### P3.4 — Adicionar SDD Sprint 12 (Segurança/LGPD)

- **Status:** `todo`
- **Problema:** não existe em `docs/sdd/`
- **Entrega:** SDD formal de hardening + checklist produção

### P3.5 — Alinhar numeração SDD 5 vs git “Sprint 5”

- **Status:** `todo`
- **Problema:** SDD 5 = platform settings/publicação; no git “Sprint 5” virou auth+base PIX
- **Entrega:** nota de mapeamento no overview para evitar confusão

---

## Ordem de execução sugerida

```text
1. P0.1  Webhook HTTP
2. P0.2  UI credenciais gateway
3. P0.3  Gateway por campanha
4. P1.3  Expiração payment/order
5. P0.4  Conciliação
6. P1.1  Retry payment
7. P1.2  Timeline pagamento
8. P0.5  Notificações reais
9. P0.6  Masking em uso
10. P1.7 Sorteio público
11. P1.4–P1.6 / P1.8–P1.12 conforme prioridade de negócio
12. P2.* polish
13. P3.* docs SDD
```

---

## Já implementado (não reabrir sem regressão)

Referência rápida do que **não** precisa recomeçar:

| Área                                                      | Status                            |
| --------------------------------------------------------- | --------------------------------- |
| Auth Google + email/senha + reset                         | OK                                |
| RBAC GLOBAL_ADMIN / USER                                  | OK                                |
| CRUD campanhas, wizard, lixeira, slug                     | OK                                |
| Grade, reserva atômica, realtime, pg_cron expire reservas | OK                                |
| CRM, venda manual, WhatsApp order, import números         | OK                                |
| Centro de operações multi-aba                             | OK                                |
| Media tipada (COVER/GALLERY/SHARE) básica                 | OK parcial (ver P1.6)             |
| Artes canvas PNG/JPEG + temas                             | OK parcial (ver P2.7)             |
| Checkout + PIX QR + adapters server                       | OK (falta fechar webhook/UI — P0) |
| Confirmação `/confirmation`                               | OK básico                         |
| Dashboard executivo KPIs                                  | OK                                |
| Participantes aba + export                                | OK básico                         |
| Sorteio admin Fisher-Yates                                | OK básico                         |
| `.env` no `.gitignore` + `mask.ts` criado                 | OK parcial (P0.6 / P1.13)         |

Detalhes por sprint: `docs/sprints/` e validação original na conversa de auditoria.

---

## Como atualizar este arquivo

1. Ao iniciar item: `todo` → `doing`
2. Ao concluir: marcar checkboxes + `done` + data
3. Se decidir não fazer: `wontfix` + motivo em 1 linha
4. Novos gaps descobertos: adicionar sob a prioridade correta com ID `P{n}.{m}`

---

## Decisões pendentes (perguntar antes de codar)

| #   | Decisão                                                               | Impacta |
| --- | --------------------------------------------------------------------- | ------- |
| D1  | Provider real de WhatsApp (só wa.me manual vs API oficial/Z-API/etc.) | P0.5    |
| D2  | Provider de e-mail (Supabase/Resend/SMTP)                             | P0.5    |
| D3  | Credenciais de gateway: só env vars vs UI + DB criptografado          | P0.2    |
| D4  | Sorteio público automático vs só admin até publicação manual          | P1.7    |
| D5  | Framer Motion: adotar ou `wontfix`                                    | P2.1    |
| D6  | Comments/FAQ: implementar agora ou remover toggles                    | P1.5    |

---

_Gerado para orientar implementação. Não executa mudanças de código por si só._
