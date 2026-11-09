import { getStorage } from "@/core/providers/storage";
import { eventBus, EVENT_NAMES } from "@/modules/events/service";
import type { InventoryProduct, Warehouse, WarehouseBin, StockMovement, StockAdjustment, InventoryCount, TransferOrder, StockAlert, InventoryDashboardStats } from "./types";

const PRODUCTS = "inv_products";
const WAREHOUSES = "inv_warehouses";
const BINS = "inv_bins";
const MOVEMENTS = "inv_movements";
const ADJUSTMENTS = "inv_adjustments";
const COUNTS = "inv_counts";
const TRANSFERS = "inv_transfers";
const ALERTS = "inv_alerts";

export const inventoryService = {
  async getDashboard(): Promise<InventoryDashboardStats> {
    const products = await this.listProducts();
    const warehouses = await this.listWarehouses();
    const movements = await this.listMovements();
    const adjustments = await this.listAdjustments();
    const counts = await this.listCounts();
    const alerts = await this.listAlerts();
    const totalStockValue = products.reduce((s, p) => s + p.currentStock * p.costPrice, 0);
    return {
      totalProducts: products.length,
      totalWarehouses: warehouses.length,
      totalStockValue,
      lowStockItems: products.filter(p => p.currentStock > 0 && p.currentStock <= p.minStock).length,
      outOfStockItems: products.filter(p => p.currentStock === 0).length,
      pendingMovements: movements.length,
      pendingCounts: counts.filter(c => c.status === "draft" || c.status === "in_progress").length,
      totalMovements: movements.length,
    };
  },

  /* Products */
  async listProducts(): Promise<InventoryProduct[]> { return getStorage().findAll<InventoryProduct>(PRODUCTS); },
  async getProduct(id: string): Promise<InventoryProduct | null> { return getStorage().find<InventoryProduct>(PRODUCTS, id); },
  async createProduct(data: Omit<InventoryProduct, "id" | "createdAt" | "updatedAt">): Promise<InventoryProduct> {
    const created = await getStorage().create<InventoryProduct>(PRODUCTS, data);
    eventBus.publish(EVENT_NAMES.PRODUCT_CREATED, "entity", "inventory", { id: created.id, sku: created.sku }).catch(() => {});
    return created;
  },
  async updateProduct(id: string, patch: Partial<InventoryProduct>): Promise<InventoryProduct> {
    const updated = await getStorage().update<InventoryProduct>(PRODUCTS, id, patch);
    eventBus.publish(EVENT_NAMES.PRODUCT_UPDATED, "entity", "inventory", { id, ...patch }).catch(() => {});
    return updated;
  },
  async removeProduct(id: string): Promise<void> {
    await getStorage().delete(PRODUCTS, id);
    eventBus.publish(EVENT_NAMES.PRODUCT_DELETED, "entity", "inventory", { id }).catch(() => {});
  },

  /* Warehouses */
  async listWarehouses(): Promise<Warehouse[]> { return getStorage().findAll<Warehouse>(WAREHOUSES); },
  async getWarehouse(id: string): Promise<Warehouse | null> { return getStorage().find<Warehouse>(WAREHOUSES, id); },
  async createWarehouse(data: Omit<Warehouse, "id" | "createdAt" | "updatedAt">): Promise<Warehouse> {
    const created = await getStorage().create<Warehouse>(WAREHOUSES, data);
    eventBus.publish(EVENT_NAMES.WAREHOUSE_CREATED, "entity", "inventory", { id: created.id, code: created.code }).catch(() => {});
    return created;
  },
  async updateWarehouse(id: string, patch: Partial<Warehouse>): Promise<Warehouse> {
    const updated = await getStorage().update<Warehouse>(WAREHOUSES, id, patch);
    eventBus.publish(EVENT_NAMES.WAREHOUSE_UPDATED, "entity", "inventory", { id, ...patch }).catch(() => {});
    return updated;
  },
  async removeWarehouse(id: string): Promise<void> {
    await getStorage().delete(WAREHOUSES, id);
    eventBus.publish(EVENT_NAMES.WAREHOUSE_DELETED, "entity", "inventory", { id }).catch(() => {});
  },

  /* Bins */
  async listBins(warehouseId?: string): Promise<WarehouseBin[]> {
    const all = await getStorage().findAll<WarehouseBin>(BINS);
    return warehouseId ? all.filter(b => b.warehouseId === warehouseId) : all;
  },
  async getBin(id: string): Promise<WarehouseBin | null> { return getStorage().find<WarehouseBin>(BINS, id); },
  async createBin(data: Omit<WarehouseBin, "id" | "createdAt" | "updatedAt">): Promise<WarehouseBin> {
    return getStorage().create<WarehouseBin>(BINS, data);
  },
  async updateBin(id: string, patch: Partial<WarehouseBin>): Promise<WarehouseBin> {
    return getStorage().update<WarehouseBin>(BINS, id, patch);
  },
  async removeBin(id: string): Promise<void> { await getStorage().delete(BINS, id); },

  /* Movements */
  async listMovements(): Promise<StockMovement[]> { return getStorage().findAll<StockMovement>(MOVEMENTS); },
  async getMovement(id: string): Promise<StockMovement | null> { return getStorage().find<StockMovement>(MOVEMENTS, id); },
  async createMovement(data: Omit<StockMovement, "id" | "createdAt">): Promise<StockMovement> {
    const created = await getStorage().create<StockMovement>(MOVEMENTS, data);
    eventBus.publish(EVENT_NAMES.STOCK_MOVEMENT_CREATED, "entity", "inventory", { id: created.id, type: created.type }).catch(() => {});
    return created;
  },

  /* Adjustments */
  async listAdjustments(): Promise<StockAdjustment[]> { return getStorage().findAll<StockAdjustment>(ADJUSTMENTS); },
  async getAdjustment(id: string): Promise<StockAdjustment | null> { return getStorage().find<StockAdjustment>(ADJUSTMENTS, id); },
  async createAdjustment(data: Omit<StockAdjustment, "id" | "createdAt">): Promise<StockAdjustment> {
    const created = await getStorage().create<StockAdjustment>(ADJUSTMENTS, data);
    eventBus.publish(EVENT_NAMES.STOCK_ADJUSTMENT_CREATED, "entity", "inventory", { id: created.id, type: created.type }).catch(() => {});
    return created;
  },

  /* Counts */
  async listCounts(): Promise<InventoryCount[]> { return getStorage().findAll<InventoryCount>(COUNTS); },
  async getCount(id: string): Promise<InventoryCount | null> { return getStorage().find<InventoryCount>(COUNTS, id); },
  async createCount(data: Omit<InventoryCount, "id" | "createdAt" | "updatedAt">): Promise<InventoryCount> {
    const created = await getStorage().create<InventoryCount>(COUNTS, data);
    eventBus.publish(EVENT_NAMES.STOCK_COUNT_CREATED, "entity", "inventory", { id: created.id }).catch(() => {});
    return created;
  },
  async updateCount(id: string, patch: Partial<InventoryCount>): Promise<InventoryCount> {
    const updated = await getStorage().update<InventoryCount>(COUNTS, id, patch);
    if (patch.status === "completed") {
      eventBus.publish(EVENT_NAMES.STOCK_COUNT_COMPLETED, "entity", "inventory", { id }).catch(() => {});
    }
    return updated;
  },
  async removeCount(id: string): Promise<void> { await getStorage().delete(COUNTS, id); },

  /* Transfers */
  async listTransfers(): Promise<TransferOrder[]> { return getStorage().findAll<TransferOrder>(TRANSFERS); },
  async getTransfer(id: string): Promise<TransferOrder | null> { return getStorage().find<TransferOrder>(TRANSFERS, id); },
  async createTransfer(data: Omit<TransferOrder, "id" | "createdAt" | "updatedAt">): Promise<TransferOrder> {
    const created = await getStorage().create<TransferOrder>(TRANSFERS, data);
    eventBus.publish(EVENT_NAMES.TRANSFER_ORDER_CREATED, "entity", "inventory", { id: created.id, number: created.number }).catch(() => {});
    return created;
  },
  async updateTransfer(id: string, patch: Partial<TransferOrder>): Promise<TransferOrder> {
    const updated = await getStorage().update<TransferOrder>(TRANSFERS, id, patch);
    if (patch.status === "completed") {
      eventBus.publish(EVENT_NAMES.TRANSFER_ORDER_COMPLETED, "entity", "inventory", { id }).catch(() => {});
    }
    return updated;
  },
  async removeTransfer(id: string): Promise<void> { await getStorage().delete(TRANSFERS, id); },

  /* Alerts */
  async listAlerts(): Promise<StockAlert[]> { return getStorage().findAll<StockAlert>(ALERTS); },
  async getAlert(id: string): Promise<StockAlert | null> { return getStorage().find<StockAlert>(ALERTS, id); },
  async createAlert(data: Omit<StockAlert, "id" | "createdAt">): Promise<StockAlert> {
    const created = await getStorage().create<StockAlert>(ALERTS, data);
    eventBus.publish(EVENT_NAMES.STOCK_ALERT_TRIGGERED, "entity", "inventory", { id: created.id, productId: created.productId }).catch(() => {});
    return created;
  },
  async resolveAlert(id: string): Promise<void> {
    await getStorage().update<StockAlert>(ALERTS, id, { resolvedAt: new Date().toISOString() });
  },
};
