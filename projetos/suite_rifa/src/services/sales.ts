import { supabase } from "@/integrations/supabase/client";
import type { PaymentMethod, SaleWithDetails, CampaignSalesMetrics } from "./types";

export interface PaginatedSales {
  items: SaleWithDetails[];
  total: number;
  limit: number;
  offset: number;
}

export const SaleService = {
  async quickSale(
    campaignId: string,
    data: {
      name: string;
      phone: string;
      numbers: number[];
      payment_method?: PaymentMethod;
      notes?: string;
    },
  ): Promise<string> {
    const { data: result, error } = await supabase.rpc("quick_sale" as never, {
      _campaign: campaignId,
      _name: data.name,
      _phone: data.phone,
      _numbers: data.numbers,
      _payment_method: data.payment_method ?? "OTHER",
      _notes: data.notes ?? null,
    } as never);
    if (error) throw error;
    return result as unknown as string;
  },

  async createSale(
    campaignId: string,
    data: {
      participant_id: string;
      numbers: number[];
      payment_method?: PaymentMethod;
      amount?: number;
      notes?: string;
    },
  ): Promise<string> {
    const { data: result, error } = await supabase.rpc("create_manual_sale" as never, {
      _campaign: campaignId,
      _participant_id: data.participant_id,
      _numbers: data.numbers,
      _payment_method: data.payment_method ?? "OTHER",
      _amount: data.amount ?? null,
      _notes: data.notes ?? null,
    } as never);
    if (error) throw error;
    return result as unknown as string;
  },

  async updateSale(
    saleId: string,
    data: {
      add_numbers?: number[];
      remove_numbers?: number[];
      payment_method?: PaymentMethod;
      amount?: number;
      notes?: string;
    },
  ): Promise<void> {
    const { error } = await supabase.rpc("update_manual_sale" as never, {
      _sale_id: saleId,
      _add_numbers: data.add_numbers ?? null,
      _remove_numbers: data.remove_numbers ?? null,
      _payment_method: data.payment_method ?? null,
      _amount: data.amount ?? null,
      _notes: data.notes ?? null,
    } as never);
    if (error) throw error;
  },

  async cancel(saleId: string): Promise<void> {
    const { error } = await supabase.rpc("cancel_manual_sale" as never, {
      _sale_id: saleId,
    } as never);
    if (error) throw error;
  },

  async transfer(
    saleId: string,
    toParticipantId: string,
    numbers: number[],
  ): Promise<void> {
    const { error } = await supabase.rpc("transfer_numbers" as never, {
      _sale_id: saleId,
      _to_participant: toParticipantId,
      _numbers: numbers,
    } as never);
    if (error) throw error;
  },

  async list(
    campaignId: string,
    opts?: { search?: string; limit?: number; offset?: number },
  ): Promise<PaginatedSales> {
    const { data, error } = await supabase.rpc("list_manual_sales" as never, {
      _campaign: campaignId,
      _search: opts?.search ?? null,
      _limit: opts?.limit ?? 50,
      _offset: opts?.offset ?? 0,
    } as never);
    if (error) throw error;
    return (data as unknown as PaginatedSales) ?? { items: [], total: 0, limit: 50, offset: 0 };
  },

  async metrics(campaignId: string): Promise<CampaignSalesMetrics> {
    const { data, error } = await supabase.rpc("campaign_sales_metrics" as never, {
      _campaign: campaignId,
    } as never);
    if (error) throw error;
    return (data as unknown as CampaignSalesMetrics) ?? { revenue: 0, average_ticket: 0, participants_count: 0, numbers_sold: 0, total_sales: 0 };
  },

  async exportCsv(campaignId: string): Promise<string> {
    const { data, error } = await supabase.rpc("export_sales_csv" as never, {
      _campaign: campaignId,
    } as never);
    if (error) throw error;
    return (data as unknown as string) ?? "";
  },
};
