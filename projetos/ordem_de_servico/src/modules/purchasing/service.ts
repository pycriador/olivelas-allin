import { getStorage } from "@/core/providers/storage";
import { eventBus, EVENT_NAMES } from "@/modules/events/service";
import type { PurchaseSupplier, PurchaseOrder, PurchaseReceiving, PurchaseDashboardStats } from "./types";

const SUPPLIERS = "pur_suppliers";
const ORDERS = "pur_orders";
const RECEIVINGS = "pur_receivings";

export const purchasingService = {
  async getDashboard(): Promise<PurchaseDashboardStats> {
    const orders = await this.listOrders();
    const suppliers = await this.listSuppliers();
    const receivings = await this.listReceivings();
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const monthOrders = orders.filter(o => o.createdAt >= monthStart);
    const totalMonthValue = monthOrders.reduce((s, o) => s + o.total, 0);
    return {
      totalOrders: orders.length,
      pendingOrders: orders.filter(o => o.status === "draft" || o.status === "sent" || o.status === "confirmed").length,
      ordersToReceive: orders.filter(o => o.status === "confirmed" || o.status === "partial").length,
      totalMonthValue,
      totalSuppliers: suppliers.length,
      activeSuppliers: suppliers.filter(s => s.active).length,
      avgDeliveryDays: 3.5,
      pendingReceivings: receivings.length,
    };
  },

  /* Suppliers */
  async listSuppliers(): Promise<PurchaseSupplier[]> { return getStorage().findAll<PurchaseSupplier>(SUPPLIERS); },
  async getSupplier(id: string): Promise<PurchaseSupplier | null> { return getStorage().find<PurchaseSupplier>(SUPPLIERS, id); },
  async createSupplier(data: Omit<PurchaseSupplier, "id" | "createdAt" | "updatedAt">): Promise<PurchaseSupplier> {
    const created = await getStorage().create<PurchaseSupplier>(SUPPLIERS, data);
    eventBus.publish(EVENT_NAMES.PURCHASE_SUPPLIER_CREATED, "entity", "purchasing", { id: created.id, companyName: created.companyName }).catch(() => {});
    return created;
  },
  async updateSupplier(id: string, patch: Partial<PurchaseSupplier>): Promise<PurchaseSupplier> {
    const updated = await getStorage().update<PurchaseSupplier>(SUPPLIERS, id, patch);
    eventBus.publish(EVENT_NAMES.PURCHASE_SUPPLIER_UPDATED, "entity", "purchasing", { id, ...patch }).catch(() => {});
    return updated;
  },
  async removeSupplier(id: string): Promise<void> {
    await getStorage().delete(SUPPLIERS, id);
    eventBus.publish(EVENT_NAMES.PURCHASE_SUPPLIER_DELETED, "entity", "purchasing", { id }).catch(() => {});
  },

  /* Orders */
  async listOrders(): Promise<PurchaseOrder[]> { return getStorage().findAll<PurchaseOrder>(ORDERS); },
  async getOrder(id: string): Promise<PurchaseOrder | null> { return getStorage().find<PurchaseOrder>(ORDERS, id); },
  async createOrder(data: Omit<PurchaseOrder, "id" | "createdAt" | "updatedAt">): Promise<PurchaseOrder> {
    const created = await getStorage().create<PurchaseOrder>(ORDERS, data);
    eventBus.publish(EVENT_NAMES.PURCHASE_ORDER_CREATED, "entity", "purchasing", { id: created.id, number: created.number }).catch(() => {});
    return created;
  },
  async updateOrder(id: string, patch: Partial<PurchaseOrder>): Promise<PurchaseOrder> {
    const updated = await getStorage().update<PurchaseOrder>(ORDERS, id, patch);
    if (patch.status === "sent") eventBus.publish(EVENT_NAMES.PURCHASE_ORDER_SENT, "entity", "purchasing", { id }).catch(() => {});
    else if (patch.status === "confirmed") eventBus.publish(EVENT_NAMES.PURCHASE_ORDER_CONFIRMED, "entity", "purchasing", { id }).catch(() => {});
    else if (patch.status === "received") eventBus.publish(EVENT_NAMES.PURCHASE_ORDER_RECEIVED, "entity", "purchasing", { id }).catch(() => {});
    else if (patch.status === "cancelled") eventBus.publish(EVENT_NAMES.PURCHASE_ORDER_CANCELLED, "entity", "purchasing", { id }).catch(() => {});
    return updated;
  },
  async removeOrder(id: string): Promise<void> {
    await getStorage().delete(ORDERS, id);
    eventBus.publish(EVENT_NAMES.PURCHASE_ORDER_CANCELLED, "entity", "purchasing", { id }).catch(() => {});
  },

  /* Receivings */
  async listReceivings(): Promise<PurchaseReceiving[]> { return getStorage().findAll<PurchaseReceiving>(RECEIVINGS); },
  async getReceiving(id: string): Promise<PurchaseReceiving | null> { return getStorage().find<PurchaseReceiving>(RECEIVINGS, id); },
  async createReceiving(data: Omit<PurchaseReceiving, "id" | "createdAt">): Promise<PurchaseReceiving> {
    const created = await getStorage().create<PurchaseReceiving>(RECEIVINGS, data);
    eventBus.publish(EVENT_NAMES.PURCHASE_RECEIVING_CREATED, "entity", "purchasing", { id: created.id }).catch(() => {});
    return created;
  },
  async removeReceiving(id: string): Promise<void> { await getStorage().delete(RECEIVINGS, id); },
};
