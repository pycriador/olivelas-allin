# Sprint 6 — Checkout, PIX e Gateway de Pagamentos

**Status:** Concluida  
**Commit:** `f9968ab`  
**Objetivo:** Fechar o fluxo publico de compra online: reserva → checkout → PIX.

---

## O que foi implementado

### 1. Pagina `/checkout/$orderId`

- Resumo do pedido e numeros
- Dados do cliente
- Aceite de termos
- Criacao/confirmacao do pedido ONLINE

### 2. Pagina `/checkout/$orderId/pix`

- QR Code PIX
- Pix Copia e Cola
- Timer de expiracao
- Estados de aguardando pagamento

### 3. `createCheckoutOrder` (server function)

- Converte reserva em `Order` com source `ONLINE`
- Integra com a camada `payment.server.ts`

### 4. Bifurcacao na pagina publica

- Campanhas `purchase_mode = AUTOMATIC` → checkout
- Campanhas `MANUAL` → fluxo WhatsApp (4.1)

---

## Arquivos

| Item            | Caminho                                |
| --------------- | -------------------------------------- |
| Checkout        | `src/routes/checkout/$orderId.tsx`     |
| PIX             | `src/routes/checkout/$orderId/pix.tsx` |
| Payment server  | `src/lib/payments/payment.server.ts`   |
| Public campaign | `src/routes/r.$slug.tsx` (redirect)    |

---

## Fluxo completo (AUTOMATIC)

```
/r/{slug}
  → seleciona numeros
  → reserva (token)
  → /checkout/{orderId}
  → gera cobranca PIX
  → /checkout/{orderId}/pix
  → webhook/confirmacao (Sprint 7)
  → /confirmation/{orderId}
```

---

## Proximas pecas (entregues na Sprint 7)

- Webhooks + idempotencia
- Painel admin de pagamentos
- Pagina de confirmacao/comprovante

---

## Resultado de negocio

Visitante compra numeros online com PIX, sem depender de WhatsApp do organizador.
