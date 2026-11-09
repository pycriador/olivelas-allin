# Catálogo & Referência de Eventos de Domínio (Event Bus)

O **ServiceForge** adota uma arquitetura orientada a eventos (*Event-Driven Architecture*) que permite a comunicação assíncrona e desacoplada entre os 37 módulos do sistema.

---

## ⚡ Como Funciona o Event Bus

O barramento de eventos opera através de assinaturas (*subscribers*) tipadas. Qualquer módulo pode emitir ou escutar eventos:

```typescript
import { eventBus } from '@/core/events/eventBus';

// Emitindo um evento
eventBus.emit('service-order.status.changed', {
  orderId: 'so_123',
  previousStatus: 'Em Diagnóstico',
  newStatus: 'Orçamento Criado',
  technicianId: 'tech_456',
  timestamp: new Date().toISOString()
});

// Escutando um evento
eventBus.subscribe('service-order.status.changed', async (payload) => {
  console.log(`OS ${payload.orderId} mudou para ${payload.newStatus}`);
});
```

---

## 📜 Catálogo Completo de Eventos

### 1. Ciclo de Vida da Ordem de Serviço (`service-order.*`)

| Evento | Gatilho / Momento de Emissão | Payload Principal | Assinantes Típicos |
| :--- | :--- | :--- | :--- |
| `service-order.created` | Nova OS cadastrada via Wizard ou API | `{ orderId, customerId, deviceId, number }` | Auditoria, Notificação Inicial |
| `service-order.updated` | Dados da OS modificados | `{ orderId, changes, updatedBy }` | Timeline, Auditoria |
| `service-order.deleted` | OS excluída do sistema | `{ orderId, deletedBy }` | Auditoria, Liberação de Ativos |
| `service-order.status.changed` | Transição de etapa da OS | `{ orderId, previousStatus, newStatus }` | Comunicação (WhatsApp), Workflows |
| `service-order.assigned` | Técnico responsável atribuído | `{ orderId, technicianId, previousTechId }` | Painel do Técnico, Notificação Push |
| `service-order.reopened` | OS finalizada é reaberta | `{ orderId, reason, reopenedBy }` | Financeiro, Qualidade |
| `service-order.closed` | OS encerrada administrativamente | `{ orderId, closedBy, finalValue }` | Financeiro, DRE, Fechamento de Comissões |
| `service-order.cancelled` | OS cancelada antes da conclusão | `{ orderId, cancelReason, cancelledBy }` | Estorno de Estoque, Devolução |

---

### 2. Diagnóstico, Execução e Testes (`service-order.execution.*`, `service-order.test.*`)

| Evento | Gatilho / Momento | Payload Principal |
| :--- | :--- | :--- |
| `service-order.diagnostic.created` | Conclusão do laudo técnico inicial | `{ orderId, diagnosticId, defectReported, defectIdentified }` |
| `service-order.diagnostic.updated` | Revisão do laudo técnico | `{ orderId, diagnosticId, revisionNumber }` |
| `service-order.checklist.completed`| Checklist de entrada ou saída concluído | `{ orderId, checklistType, passed, totalItems }` |
| `service-order.execution.started` | Técnico aciona timer de execução | `{ orderId, activityId, technicianId, startedAt }` |
| `service-order.execution.paused` | Pausa no cronômetro da atividade | `{ orderId, activityId, durationSeconds }` |
| `service-order.execution.completed`| Atividade concluída | `{ orderId, activityId, totalHoursSpent }` |
| `service-order.test.created` | Novo teste de bancada adicionado | `{ orderId, testType, parameters }` |
| `service-order.test.completed` | Teste finalizado (Aprovado / Reprovado) | `{ orderId, testId, passed, observations }` |
| `service-order.quality.approved` | Inspeção de qualidade aprovada | `{ orderId, inspectorId, score }` |
| `service-order.quality.rejected` | Inspeção de qualidade reprovada | `{ orderId, inspectorId, reason, returnToStep }` |

---

### 3. Orçamento, Aprovação e Financeiro (`service-order.budget.*`, `service-order.payment.*`)

| Evento | Gatilho / Momento | Ações Automáticas Disparadas |
| :--- | :--- | :--- |
| `service-order.budget.created` | Orçamento gerado com peças e serviços | Dispara mensagem com link no WhatsApp/E-mail do cliente |
| `service-order.budget.approved` | Cliente aprova orçamento (Portal/Loja) | Altera status para *Em Execução*; reserva peças no estoque |
| `service-order.budget.rejected` | Cliente recusa o orçamento | Altera status para *Devolução*; notifica atendente |
| `service-order.payment.recorded` | Pagamento registrado (cartão, pix, dinheiro)| Cria transação financeira; atualiza saldo da OS |
| `service-order.payment.confirmed`| Confirmação bancária do pagamento | Libera comprovante de quitação e autoriza entrega |
| `service-order.costs.calculated`| Cálculo de custos de peças, mão de obra e margem | Atualiza relatório de lucratividade da OS |

---

### 4. Entrega, Garantia e Devolução (`service-order.delivery.*`, `service-order.warranty.*`)

| Evento | Gatilho / Momento | Impacto no Sistema |
| :--- | :--- | :--- |
| `service-order.delivery.completed` | Equipamento retirado pelo cliente | Gera termo de entrega e finaliza contagem de guarda |
| `service-order.signature.collected`| Assinatura digital colhida no app/tablet | Anexa assinatura criptografada ao documento PDF |
| `service-order.receipt.generated` | Emissão de recibo de entrada ou saída | Armazena PDF e gera QR Code para conferência |
| `service-order.warranty.activated` | Início do período de garantia contratual | Agenda lembrete de pós-venda no CRM |
| `service-order.return.created` | Equipamento retorna dentro da garantia | Abre OS vinculada de garantia sem custo ao cliente |

---

### 5. Estoque e Compras (`inventory.*`, `purchasing.*`)

| Evento | Gatilho / Momento | Payload Principal |
| :--- | :--- | :--- |
| `inventory.movement.created` | Entrada, saída ou transferência de peças | `{ productId, warehouseId, type, quantity, previousStock, newStock }` |
| `inventory.stock.low` | Saldo atinge nível abaixo do estoque mínimo | `{ productId, currentStock, minStock, recommendedPurchase }` |
| `purchasing.order.created` | Novo pedido de compra emitido | `{ orderId, supplierId, totalValue, itemsCount }` |
| `purchasing.order.received`| Recebimento físico de mercadoria no almoxarifado | `{ orderId, invoiceKey, receivedItems }` |

---

### 6. Automação, IA e Comunicação (`automation.*`, `ai.*`, `communication.*`)

| Evento | Descrição |
| :--- | :--- |
| `ai.ocr.completed` | Extração de texto de fotos/etiquetas concluída |
| `ai.vision.analyzed` | Análise visual de danos estéticos finalizada |
| `communication.message.queued` | E-mail/WhatsApp colocado na fila de envio |
| `communication.message.sent` | Confirmação de entrega da mensagem |
| `automation.workflow.triggered`| Regra de workflow ativada por evento |
| `automation.job.completed` | Job agendado (ex: alerta de vencimento) executado |
