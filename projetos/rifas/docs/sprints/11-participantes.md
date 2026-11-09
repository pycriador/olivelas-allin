# Sprint 11 — Participantes por campanha

**Status:** Concluida  
**Commit:** `23c5cb1`  
**Objetivo:** Listar e exportar todos os participantes de uma campanha com detalhe por cliente.

---

## O que foi implementado

### Hook `useCampaignParticipants`

Agrega clientes com pedidos na campanha:

- numeros comprados
- quantidade de pedidos
- valores
- fontes de compra

### Aba Participantes (`?tab=participants`)

Tabela com:

- Nome
- Telefone
- Numeros
- Origem
- Total

Origem derivada:

```
ONLINE | MANUAL | WHATSAPP | MIXED
```

### ParticipantSheet

- Detalhes do participante
- Atalho WhatsApp
- Pedidos do cliente na campanha

### Export

- CSV de todos os participantes

### Navegacao

- Icone Users na sidebar da campanha

---

## Arquivos

- `src/features/campaigns/hooks/use-campaign-participants.ts`
- `src/routes/_authenticated/campanhas/$campanhaId/index.tsx`
- `src/components/layout/app-sidebar.tsx`

---

## Resultado de negocio

Operador tem lista pronta para contato, conferencia e exportacao (planilha / pos-sorteio).
