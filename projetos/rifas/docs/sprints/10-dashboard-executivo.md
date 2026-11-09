# Sprint 10 — Dashboard Executivo + metricas de vendas

**Status:** Concluida  
**Commit:** `4c80add`  
**Objetivo:** Dar visao gerencial consolidada de receita, canais e ocupacao.

---

## O que foi implementado

### Dashboard reescrito por categorias de KPI

**Principais**

- Receita
- Campanhas
- Usuarios
- Ticket medio

**Vendas**

- Total
- Online
- Manuais
- WhatsApp

**Financeiro**

- Recebido
- Pendente
- Cancelado
- Expirado

**Numeros**

- Vendidos
- Reservados
- Expirados
- Clientes

**Ranking**

- Top campanhas por receita

### Camada de dados

- `OrderMetrics` ganhou `onlineOrders` para separar checkout de WhatsApp/Manual
- Metricas centralizadas em `order.service.ts`

---

## Arquivos

- `src/routes/_authenticated/dashboard.tsx`
- `src/services/order.service.ts`
- `src/types/order.ts`

---

## Resultado de negocio

Gestao enxerga performance por canal e saude financeira sem abrir campanha por campanha.
