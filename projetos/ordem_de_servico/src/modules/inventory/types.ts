export interface InventoryProduct {
  id: string;
  partId?: string;
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  categoryId?: string;
  categoryName?: string;
  brandId?: string;
  brandName?: string;
  unitId?: string;
  unitName?: string;
  costPrice: number;
  sellingPrice: number;
  minStock: number;
  maxStock?: number;
  currentStock: number;
  status: "active" | "inactive" | "discontinued";
  createdAt: string;
  updatedAt: string;
}

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  responsible?: string;
  phone?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WarehouseBin {
  id: string;
  warehouseId: string;
  warehouseName?: string;
  code: string;
  description?: string;
  maxCapacity?: number;
  currentCapacity?: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type StockMovementType = "in" | "out" | "transfer_in" | "transfer_out" | "adjustment" | "return" | "sale" | "purchase";

export interface StockMovement {
  id: string;
  productId: string;
  productName?: string;
  productSku?: string;
  warehouseId: string;
  warehouseName?: string;
  binId?: string;
  binCode?: string;
  type: StockMovementType;
  quantity: number;
  unitCost: number;
  totalCost: number;
  referenceType?: string;
  referenceId?: string;
  notes?: string;
  operatorId?: string;
  operatorName?: string;
  createdAt: string;
}

export interface StockAdjustment {
  id: string;
  productId: string;
  productName?: string;
  productSku?: string;
  warehouseId: string;
  warehouseName?: string;
  binId?: string;
  binCode?: string;
  type: "count" | "damage" | "loss" | "found" | "expiry" | "other";
  previousQuantity: number;
  newQuantity: number;
  difference: number;
  reason: string;
  authorizedBy?: string;
  notes?: string;
  createdAt: string;
}

export interface InventoryCount {
  id: string;
  warehouseId: string;
  warehouseName?: string;
  status: "draft" | "in_progress" | "completed" | "approved";
  countDate: string;
  items: InventoryCountItem[];
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryCountItem {
  id: string;
  productId: string;
  productName?: string;
  productSku?: string;
  binId?: string;
  binCode?: string;
  expectedQuantity: number;
  countedQuantity: number;
  difference: number;
  notes?: string;
}

export interface StockAlert {
  id: string;
  productId: string;
  productName?: string;
  productSku?: string;
  warehouseId: string;
  warehouseName?: string;
  currentStock: number;
  minStock: number;
  status: "low" | "out" | "overstock" | "normal";
  notifiedAt?: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface InventoryDashboardStats {
  totalProducts: number;
  totalWarehouses: number;
  totalStockValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  pendingMovements: number;
  pendingCounts: number;
  totalMovements: number;
}

export interface TransferOrder {
  id: string;
  number: string;
  fromWarehouseId: string;
  fromWarehouseName?: string;
  toWarehouseId: string;
  toWarehouseName?: string;
  items: TransferOrderItem[];
  status: "draft" | "in_transit" | "completed" | "cancelled";
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransferOrderItem {
  id: string;
  productId: string;
  productName?: string;
  productSku?: string;
  quantity: number;
  receivedQuantity?: number;
  status: "pending" | "partial" | "completed";
}
