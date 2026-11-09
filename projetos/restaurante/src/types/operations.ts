export type TableStatus = 'available' | 'occupied' | 'reserved' | 'bill_requested' | 'cleaning';

export type TableArea = string;

export interface RestaurantArea {
  id: string;
  restaurant_id: string;
  name: string;
  code: string;
  description?: string;
  color?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface RestaurantTable {
  id: string;
  restaurant_id: string;
  number: number;
  label: string;
  area: TableArea;
  capacity: number;
  status: TableStatus;
  current_order_id?: string | null;
  waiter_name?: string | null;
  occupied_at?: string | null;
  notes?: string | null;
  created_at: string;
}

export type OrderStatus = 'pending' | 'in_preparation' | 'ready' | 'delivered' | 'paid' | 'cancelled';
export type OrderType = 'table' | 'counter' | 'delivery' | 'takeaway';
export type PaymentMethod = 'cash' | 'pix' | 'credit' | 'debit' | 'voucher';

export interface OrderItemAddOn {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes?: string;
  add_ons: OrderItemAddOn[];
}

export interface Order {
  id: string;
  restaurant_id: string;
  code: string;
  type: OrderType;
  table_id?: string | null;
  table_number?: number | null;
  customer_name?: string | null;
  waiter_id?: string | null;
  waiter_name?: string | null;
  status: OrderStatus;
  subtotal: number;
  service_fee: number;
  discount: number;
  total: number;
  payment_method?: PaymentMethod | null;
  items: OrderItem[];
  notes?: string | null;
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
}

export interface CashierShift {
  id: string;
  restaurant_id: string;
  user_id: string;
  user_name: string;
  opened_at: string;
  closed_at?: string | null;
  opening_balance: number;
  cash_in: number;
  cash_out: number;
  total_sales: number;
  expected_cash: number;
  actual_cash?: number | null;
  difference?: number | null;
  status: 'open' | 'closed';
  notes?: string | null;
}

export interface CashTransaction {
  id: string;
  restaurant_id: string;
  shift_id: string;
  type: 'sale' | 'cash_in' | 'cash_out';
  amount: number;
  payment_method: PaymentMethod;
  order_id?: string | null;
  order_code?: string | null;
  description: string;
  created_at: string;
}

export interface OperationalReportsSummary {
  totalRevenue: number;
  totalOrders: number;
  averageTicket: number;
  activeTablesCount: number;
  topSellingProducts: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
  salesByCategory: Array<{
    category: string;
    revenue: number;
    percentage: number;
  }>;
  salesByPaymentMethod: Array<{
    method: PaymentMethod;
    label: string;
    amount: number;
    count: number;
  }>;
  hourlyTraffic: Array<{
    hour: string;
    orders: number;
    revenue: number;
  }>;
}
