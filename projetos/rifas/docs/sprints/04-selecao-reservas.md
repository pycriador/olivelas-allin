# Sprint 4 — Selecao e Reservas

**Status:** Concluida  
**Commit:** `1053d3d`  
**Objetivo:** Permitir selecao de numeros na pagina publica com reservas temporarias atomicas e atualizacao em tempo real.

---

## O que foi implementado

### Grade numerica

- Virtualizada e responsiva
- Filtro por status e busca “ir para numero”
- Legenda visual de estados
- Cards/celulas com cores por status

### Selecao

- Clique e arraste
- QuickPick aleatorio (Fisher-Yates) com presets de quantidade
- Resumo da selecao + botao flutuante de limpar (melhorias posteriores)

### Reserva temporaria

- RPC `reserve_campaign_numbers` com advisory lock
- Token unico por lote de reserva
- Expiracao automatica
- Timer regressivo MM:SS no cliente
- Cancelamento pelo proprio dispositivo (`cancel_campaign_reservation`)

### Expiracao server-side

- `release_expired_campaign_reservations` via pg_cron (1 min)
- Fallback de limpeza no cliente

### Realtime

- Canal Supabase atualiza a grade ao vivo
- Remove conflitos quando outro usuario reserva o mesmo numero

### Auditoria de reservas

Eventos: `RESERVATION_CREATED`, `CANCELLED`, `EXPIRED`, `INVALID`

---

## Modelo de dados

Tabela `campaign_numbers` com status:

```
AVAILABLE | RESERVED | PENDING_PAYMENT | PAID | BLOCKED | CANCELLED | WINNER
```

Migracao: `20260806020000_*`

---

## Componentes e hooks

| Item       | Caminho                                                                  |
| ---------- | ------------------------------------------------------------------------ |
| Grade      | `src/features/campaigns/components/numbers/number-grid.tsx`              |
| Selecao    | `number-selection-section.tsx`                                           |
| Quick pick | `quick-pick.tsx` + `use-quick-pick.ts`                                   |
| Reserva    | `use-reservation.ts`, `reservation-dialog.tsx`, `reservation-drawer.tsx` |
| Timer      | `reservation-timer.tsx`, `use-countdown.ts`                              |
| Realtime   | `use-realtime-campaign.ts`                                               |
| Servico    | `src/services/campaign-number.service.ts`                                |

---

## Fluxo do usuario publico

1. Abre `/r/{slug}`
2. Seleciona numeros livres
3. Confirma reserva → RPC atomica
4. Recebe token + timer
5. Segue para contato/WhatsApp (4.1) ou checkout (Sprint 6)

---

## Resultado de negocio

Numeros nao sao vendidos em duplicidade. Reserva segura com expiracao evita “segurar” a grade indefinidamente.
