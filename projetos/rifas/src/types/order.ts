import type { Database, Tables } from "@/integrations/supabase/types";
import type { Customer } from "@/types/customer";

export type OrderStatus = Database["public"]["Enums"]["order_status"];
export type OrderSource = Database["public"]["Enums"]["order_source"];
export type PaymentMethod = Database["public"]["Enums"]["payment_method"];

export type Order = Tables<"orders">;
export type OrderItem = Tables<"order_items">;
export type OrderReceipt = Tables<"order_receipts">;

export const ORDER_STATUS_VALUES: readonly OrderStatus[] = [
  "OPEN",
  "WAITING_CONTACT",
  "WAITING_PAYMENT",
  "PAID",
  "CANCELLED",
  "EXPIRED",
  "REFUNDED",
] as const;

export const ORDER_SOURCE_VALUES: readonly OrderSource[] = [
  "ONLINE",
  "WHATSAPP",
  "MANUAL",
] as const;

export const PAYMENT_METHOD_VALUES: readonly PaymentMethod[] = [
  "PIX",
  "DINHEIRO",
  "CARTAO",
  "TRANSFERENCIA",
  "MERCADO_PAGO",
  "PAGBANK",
  "INFINITYPAY",
  "OUTRO",
] as const;

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  OPEN: "Aberto",
  WAITING_CONTACT: "Aguardando contato",
  WAITING_PAYMENT: "Aguardando pagamento",
  PAID: "Pago",
  CANCELLED: "Cancelado",
  EXPIRED: "Expirado",
  REFUNDED: "Reembolsado",
};

export const ORDER_SOURCE_LABELS: Record<OrderSource, string> = {
  ONLINE: "Online",
  WHATSAPP: "WhatsApp",
  MANUAL: "Manual",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  PIX: "Pix",
  DINHEIRO: "Dinheiro",
  CARTAO: "Cartão",
  TRANSFERENCIA: "Transferência",
  MERCADO_PAGO: "Mercado Pago",
  PAGBANK: "PagBank",
  INFINITYPAY: "InfinityPay",
  OUTRO: "Outro",
};

/** Status finais (sem transições para frente). */
export const ORDER_TERMINAL_STATUSES: readonly OrderStatus[] = [
  "CANCELLED",
  "EXPIRED",
  "REFUNDED",
] as const;

/** Estados em que um pedido ainda aceita edição de números. */
export const ORDER_EDITABLE_STATUSES: readonly OrderStatus[] = [
  "OPEN",
  "WAITING_CONTACT",
  "WAITING_PAYMENT",
] as const;

export interface OrderWithRelations extends Order {
  customer: Customer | null;
  campaign: { id: string; title: string } | null;
  items: OrderItem[];
  receipts: OrderReceipt[];
}

export interface OrderFilters {
  campaignId?: string | undefined;
  status?: OrderStatus | "ALL" | undefined;
  source?: OrderSource | "ALL" | undefined;
  customerId?: string | undefined;
  search?: string | undefined;
  createdBy?: string | undefined;
}

export interface OrderListParams {
  page: number;
  pageSize: number;
  filters?: OrderFilters;
}

export interface OrderListResult {
  items: OrderWithRelations[];
  total: number;
  page: number;
  pageSize: number;
}

export interface OrderRpcResult {
  ok: boolean;
  error?:
    | "FORBIDDEN"
    | "CAMPAIGN_NOT_FOUND"
    | "CAMPAIGN_NOT_ACTIVE"
    | "ORDER_NOT_FOUND"
    | "ORDER_LOCKED"
    | "NO_NUMBERS"
    | "NUMBER_OUT_OF_RANGE"
    | "NUMBER_NOT_IN_ORDER"
    | "SAME_NUMBER"
    | "INVALID_RESERVATION"
    | "RESERVATION_NOT_FOUND"
    | "CUSTOMER_NOT_FOUND"
    | "INVALID_TRANSITION"
    | "CONFLICT"
    | "UNKNOWN";
  order_id?: string;
  status?: OrderStatus;
  from?: OrderStatus;
  to?: OrderStatus;
  numbers?: number[];
  count?: number;
  total?: number;
  unchanged?: boolean;
}

export interface OrderMetrics {
  totalOrders: number;
  open: number;
  waitingContact: number;
  waitingPayment: number;
  paid: number;
  cancelled: number;
  expired: number;
  refunded: number;
  revenue: number;
  numbersSold: number;
  whatsappOrders: number;
  manualOrders: number;
  onlineOrders: number;
  customerCount: number;
  recurringCustomers: number;
  averageTicket: number;
  byCampaign: Array<{
    campaign_id: string;
    campaign_title: string;
    orders: number;
    paid: number;
    revenue: number;
  }>;
}
