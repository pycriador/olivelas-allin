# Sprint 9 — Sorteio com Fisher-Yates

**Status:** Concluida  
**Commit:** `d041d6e`  
**Objetivo:** Realizar sorteio auditavel de vencedores a partir dos numeros pagos.

---

## O que foi implementado

### `draw.service.ts`

- `performCampaignDraw` — embaralha numeros elegiveis com **Fisher-Yates**
- `loadDrawView` — carrega dados completos de vencedores (numero + cliente)

### Aba Sorteio (`?tab=draw`)

- Cards: pagos, total, vencedores
- Seletor de quantidade de vencedores
- Resultado com ranking (1º, 2º, …) e nome do cliente
- Auditoria via RPC `log_order_audit`
- Icone Trophy na sidebar da campanha

### Elegibilidade

Em geral: numeros com status `PAID` (e regras da campanha) entram no pool do sorteio.

---

## Arquivos

- `src/lib/draw.service.ts`
- `src/routes/_authenticated/campanhas/$campanhaId/index.tsx` (aba draw)
- `src/components/layout/app-sidebar.tsx`

---

## Fluxo operacional

1. Campanha com numeros pagos
2. Admin abre aba **Sorteio**
3. Define N vencedores
4. Sistema embaralha e grava resultado
5. Exibe ranking + registra auditoria

---

## Resultado de negocio

Sorteio transparente, reproduzivel no processo e rastreavel em audit log.
