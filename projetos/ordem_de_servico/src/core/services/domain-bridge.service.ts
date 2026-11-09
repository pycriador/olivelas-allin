import { eventBus, EVENT_NAMES } from "@/modules/events/service";
import { financialService } from "@/modules/financial/service";
import { inventoryService } from "@/modules/inventory/service";
import { purchasingService } from "@/modules/purchasing/service";
import { hrService } from "@/modules/hr/service";
import { serviceOrderService } from "@/modules/service-orders/service";

let initialized = false;

export function initDomainBridge(): void {
  if (initialized) return;
  initialized = true;

  // 1. Quando o orçamento de uma OS for aprovado:
  // - Cria previsão em Contas a Receber no Financeiro
  // - Reserva/movimenta peças no Estoque
  eventBus.subscribe("service-order.budget.approved", async (event) => {
    try {
      const orderId = (event.payload.orderId as string) || (event.payload.id as string);
      if (!orderId) return;

      const so = await serviceOrderService.get(orderId);
      if (!so) return;

      const totalValue = so.finalValue || so.estimatedValue || 0;
      if (totalValue > 0) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 15); // Vencimento padrão em 15 dias

        await financialService.createReceivable({
          customerId: so.customerId,
          customerName: so.customerName,
          serviceOrderId: so.id,
          description: `Recebível OS #${so.number} - ${so.customerName}`,
          originalValue: totalValue,
          discount: 0,
          fines: 0,
          interest: 0,
          finalValue: totalValue,
          issueDate: new Date().toISOString().split("T")[0],
          dueDate: dueDate.toISOString().split("T")[0],
          status: "pending",
          category: "service",
        });
      }

      // Baixa/reserva das peças da OS no estoque
      if (so.parts && so.parts.length > 0) {
        const products = await inventoryService.listProducts();
        const defaultWarehouse = (await inventoryService.listWarehouses())[0];

        for (const part of so.parts) {
          const product = products.find(p => p.id === part.partId || p.name.toLowerCase() === part.name.toLowerCase());
          if (product && defaultWarehouse) {
            await inventoryService.createMovement({
              productId: product.id,
              productName: product.name,
              warehouseId: defaultWarehouse.id,
              warehouseName: defaultWarehouse.name,
              type: "out",
              quantity: part.quantity || 1,
              unitCost: part.unitPrice || product.costPrice,
              totalCost: (part.quantity || 1) * (part.unitPrice || product.costPrice),
              reason: `Utilizado na OS #${so.number}`,
              document: so.number,
            });

            // Atualiza saldo do produto
            const newStock = Math.max(0, product.currentStock - (part.quantity || 1));
            await inventoryService.updateProduct(product.id, { currentStock: newStock });
          }
        }
      }
    } catch (err) {
      console.error("[DomainBridge] Erro ao processar service-order.budget.approved:", err);
    }
  });

  // 2. Quando um pagamento for confirmado ou OS finalizada:
  // - Baixa no título a receber
  // - Cria transação financeira de receita
  // - Credita comissão do técnico no RH
  eventBus.subscribe("service-order.payment.confirmed", async (event) => {
    try {
      const orderId = (event.payload.orderId as string) || (event.payload.id as string);
      const paymentValue = (event.payload.value as number) || 0;
      if (!orderId) return;

      const so = await serviceOrderService.get(orderId);
      if (!so) return;

      // Localiza o título a receber vinculado
      const receivables = await financialService.listReceivables();
      const targetReceivable = receivables.find(r => r.serviceOrderId === orderId && r.status === "pending");

      const defaultAccount = (await financialService.listAccounts())[0];
      const nowIso = new Date().toISOString();

      if (targetReceivable) {
        await financialService.updateReceivable(targetReceivable.id, {
          status: "received",
          receivedAt: nowIso,
          receivedValue: paymentValue || targetReceivable.finalValue,
          paymentMethod: (event.payload.paymentMethod as string) || "PIX",
          financialAccountId: defaultAccount?.id,
          financialAccountName: defaultAccount?.name,
        });
      }

      // Registra transação financeira
      if (defaultAccount && paymentValue > 0) {
        await financialService.createTransaction({
          financialAccountId: defaultAccount.id,
          financialAccountName: defaultAccount.name,
          type: "income",
          category: "Serviços",
          description: `Recebimento OS #${so.number} (${so.customerName})`,
          value: paymentValue,
          document: so.number,
          transactionDate: nowIso,
          relatedType: "service_order",
          relatedId: so.id,
        });

        // Atualiza saldo da conta
        await financialService.updateAccount(defaultAccount.id, {
          currentBalance: defaultAccount.currentBalance + paymentValue,
        });
      }

      // Credita comissão do técnico
      if (so.technicianId) {
        const commissionPercentage = 10; // 10% padrão de comissão sobre mão de obra
        const laborValue = so.services?.reduce((sum, s) => sum + (s.totalPrice || 0), 0) || paymentValue;
        const commissionVal = Math.round(laborValue * (commissionPercentage / 100) * 100) / 100;

        if (commissionVal > 0) {
          await hrService.createCommission({
            employeeId: so.technicianId,
            employeeName: so.technicianName || "Técnico",
            serviceOrderId: so.id,
            serviceOrderNumber: so.number,
            value: commissionVal,
            percentage: commissionPercentage,
            date: nowIso.split("T")[0],
            status: "pending",
          });
        }
      }
    } catch (err) {
      console.error("[DomainBridge] Erro ao processar service-order.payment.confirmed:", err);
    }
  });

  // 3. Quando uma Ordem de Compra for recebida:
  // - Dá entrada dos produtos no Estoque
  // - Gera Conta a Pagar no Financeiro
  eventBus.subscribe(EVENT_NAMES.PURCHASE_ORDER_RECEIVED, async (event) => {
    try {
      const orderId = event.payload.id as string;
      if (!orderId) return;

      const order = await purchasingService.getOrder(orderId);
      if (!order) return;

      const defaultWarehouse = (await inventoryService.listWarehouses())[0];
      const products = await inventoryService.listProducts();

      // Dá entrada nos produtos recebidos
      if (order.items && defaultWarehouse) {
        for (const item of order.items) {
          const product = products.find(p => p.id === item.productId || p.name.toLowerCase() === item.productName.toLowerCase());
          if (product) {
            await inventoryService.createMovement({
              productId: product.id,
              productName: product.name,
              warehouseId: defaultWarehouse.id,
              warehouseName: defaultWarehouse.name,
              type: "in",
              quantity: item.quantity,
              unitCost: item.unitPrice,
              totalCost: item.total,
              reason: `Entrada por Pedido de Compra #${order.number}`,
              document: order.number,
            });

            // Atualiza o estoque e custo médio
            const newStock = product.currentStock + item.quantity;
            await inventoryService.updateProduct(product.id, {
              currentStock: newStock,
              costPrice: item.unitPrice > 0 ? item.unitPrice : product.costPrice,
            });
          }
        }
      }

      // Gera Conta a Pagar no Financeiro
      if (order.total > 0) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30); // 30 dias para pagamento de fornecedor

        await financialService.createPayable({
          supplierId: order.supplierId,
          supplierName: order.supplierName,
          description: `Pagamento Pedido de Compra #${order.number} - ${order.supplierName}`,
          document: order.number,
          category: "supplier",
          originalValue: order.total,
          discount: order.discount || 0,
          fines: 0,
          interest: 0,
          finalValue: order.total,
          issueDate: new Date().toISOString().split("T")[0],
          dueDate: dueDate.toISOString().split("T")[0],
          status: "pending",
          purchaseOrderId: order.id,
        });
      }
    } catch (err) {
      console.error("[DomainBridge] Erro ao processar PURCHASE_ORDER_RECEIVED:", err);
    }
  });
}
