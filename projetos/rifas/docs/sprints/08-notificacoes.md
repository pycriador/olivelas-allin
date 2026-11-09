# Sprint 8 — Notificacoes, Templates, WhatsApp/Email

**Status:** Concluida  
**Commit:** `c1f8eb5`  
**Objetivo:** Notificar clientes e operadores por eventos de pedido/pagamento com templates editaveis.

---

## O que foi implementado

### Arquitetura desacoplada

```
Evento de dominio
  → NotificationService
    → Provider (WhatsApp | Email)
```

### NotificationService

- Providers abstraidos
- Templates por **evento + canal**
- Variaveis seguras no formato `{{var}}`
- Integracao `notifyPaymentConfirmed` na confirmacao de pagamento

### Admin `/notificacoes`

- Preview de templates
- Gestao por evento/canal
- Item no menu lateral (icone Bell)

### Templates padrao

| Evento                 | Canais           |
| ---------------------- | ---------------- |
| `PAYMENT_CONFIRMED`    | WhatsApp + Email |
| `ORDER_CREATED`        | WhatsApp / Email |
| `PAYMENT_FAILED`       | WhatsApp / Email |
| `PAYMENT_EXPIRED`      | WhatsApp / Email |
| `RESERVATION_EXPIRING` | WhatsApp / Email |

---

## Arquivos

| Item     | Caminho                                      |
| -------- | -------------------------------------------- |
| Service  | `src/lib/notifications/service.ts`           |
| Types    | `src/lib/notifications/types.ts`             |
| UI admin | `src/routes/_authenticated/notificacoes.tsx` |
| Nav      | `src/config/navigation.ts`                   |

---

## Resultado de negocio

Comunicacao pos-venda padronizada e extensivel (novos eventos/providers sem reescrever o fluxo de pagamento).
