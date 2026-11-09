export interface FinancialAccount {
  id: string;
  name: string;
  code: string;
  type: "checking" | "savings" | "cash" | "credit" | "investment";
  bank?: string;
  agency?: string;
  accountNumber?: string;
  initialBalance: number;
  currentBalance: number;
  active: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CostCenter {
  id: string;
  name: string;
  code: string;
  description?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AccountPayable {
  id: string;
  supplierId?: string;
  supplierName?: string;
  description: string;
  document?: string;
  category: "supplier" | "tax" | "rent" | "utility" | "salary" | "service" | "other";
  originalValue: number;
  discount: number;
  fines: number;
  interest: number;
  finalValue: number;
  issueDate: string;
  dueDate: string;
  paidAt?: string;
  paidValue?: number;
  paymentMethod?: string;
  financialAccountId?: string;
  financialAccountName?: string;
  costCenterId?: string;
  costCenterName?: string;
  status: "pending" | "paid" | "overdue" | "cancelled";
  notes?: string;
  purchaseOrderId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AccountReceivable {
  id: string;
  customerId?: string;
  customerName?: string;
  description: string;
  document?: string;
  category: "sale" | "service" | "product" | "rent" | "other";
  originalValue: number;
  discount: number;
  fines: number;
  interest: number;
  finalValue: number;
  issueDate: string;
  dueDate: string;
  receivedAt?: string;
  receivedValue?: number;
  paymentMethod?: string;
  financialAccountId?: string;
  financialAccountName?: string;
  costCenterId?: string;
  costCenterName?: string;
  serviceOrderId?: string;
  status: "pending" | "received" | "overdue" | "cancelled";
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinancialTransaction {
  id: string;
  financialAccountId: string;
  financialAccountName?: string;
  type: "income" | "expense" | "transfer" | "adjustment";
  category: string;
  description: string;
  value: number;
  document?: string;
  transactionDate: string;
  costCenterId?: string;
  costCenterName?: string;
  relatedType?: string;
  relatedId?: string;
  notes?: string;
  createdBy?: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  number: string;
  series?: string;
  type: "entry" | "exit" | "service";
  status: "draft" | "issued" | "cancelled" | "denied";
  emitterId: string;
  emitterName: string;
  emitterDocument: string;
  receiverId: string;
  receiverName: string;
  receiverDocument: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  taxes: number;
  total: number;
  issueDate: string;
  key?: string;
  xmlUrl?: string;
  pdfUrl?: string;
  notes?: string;
  serviceOrderId?: string;
  purchaseOrderId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitValue: number;
  total: number;
  taxRate?: number;
  taxValue?: number;
}

export interface FinancialDashboardStats {
  totalAccounts: number;
  totalPayable: number;
  totalReceivable: number;
  openPayable: number;
  openReceivable: number;
  overduePayable: number;
  overdueReceivable: number;
  monthlyIncome: number;
  monthlyExpense: number;
  currentBalance: number;
  cashFlow: number;
}
