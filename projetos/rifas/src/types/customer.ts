import type { Tables } from "@/integrations/supabase/types";

export type Customer = Tables<"customers">;

/** Cliente com métricas agregadas (pedidos, valores, última compra). */
export interface CustomerWithStats extends Customer {
  orders_count: number;
  total_spent: number;
  last_order_at: string | null;
}

export interface CustomerFilters {
  search?: string;
}

export interface CustomerListParams {
  page: number;
  pageSize: number;
  search?: string;
}

export interface CustomerListResult {
  items: Customer[];
  total: number;
  page: number;
  pageSize: number;
}
