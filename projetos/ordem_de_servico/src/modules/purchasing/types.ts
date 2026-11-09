export interface PurchaseSupplier {
  id: string;
  companyName: string;
  tradeName?: string;
  document: string;
  ie?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  email?: string;
  website?: string;
  contactName?: string;
  paymentTerms?: string;
  deliveryDays?: number;
  category?: string;
  rating?: number;
  active: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrder {
  id: string;
  number: string;
  supplierId: string;
  supplierName?: string;
  warehouseId?: string;
  warehouseName?: string;
  status: PurchaseOrderStatus;
  items: PurchaseOrderItem[];
  subtotal: number;
  discount: number;
  discountType: "percent" | "fixed";
  shipping: number;
  taxes: number;
  total: number;
  expectedDate?: string;
  deliveryDate?: string;
  paymentTerms?: string;
  paymentMethod?: string;
  notes?: string;
  internalNotes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  approvedBy?: string;
  approvedAt?: string;
}

export type PurchaseOrderStatus = "draft" | "sent" | "confirmed" | "partial" | "received" | "cancelled";

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  productId: string;
  productName?: string;
  productSku?: string;
  quantity: number;
  unitCost: number;
  discount: number;
  discountType: "percent" | "fixed";
  total: number;
  receivedQuantity: number;
  status: "pending" | "partial" | "received";
}

export interface PurchaseReceiving {
  id: string;
  number: string;
  purchaseOrderId: string;
  purchaseOrderNumber?: string;
  supplierId: string;
  supplierName?: string;
  warehouseId: string;
  warehouseName?: string;
  receivedDate: string;
  items: PurchaseReceivingItem[];
  document?: string;
  notes?: string;
  receivedBy: string;
  createdAt: string;
}

export interface PurchaseReceivingItem {
  id: string;
  purchaseOrderItemId: string;
  productId: string;
  productName?: string;
  productSku?: string;
  expectedQuantity: number;
  receivedQuantity: number;
  unitCost: number;
  total: number;
  batch?: string;
  expiryDate?: string;
  notes?: string;
  status: "ok" | "damaged" | "missing" | "replaced";
}

export interface PurchaseDashboardStats {
  totalOrders: number;
  pendingOrders: number;
  ordersToReceive: number;
  totalMonthValue: number;
  totalSuppliers: number;
  activeSuppliers: number;
  avgDeliveryDays: number;
  pendingReceivings: number;
}
