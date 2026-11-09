import { supabase } from "@/integrations/supabase/client";
import type { CampaignNumber, CampaignNumberMetrics, NumberReservation } from "./types";

export interface PaginatedNumbers {
  items: CampaignNumber[];
  total: number;
  limit: number;
  offset: number;
}

export const CampaignNumberService = {
  async list(
    campaignId: string,
    opts?: { status?: string; search?: string; limit?: number; offset?: number },
  ): Promise<PaginatedNumbers> {
    const { data, error } = await supabase.rpc("list_campaign_numbers_admin" as never, {
      _campaign: campaignId,
      _status: opts?.status ?? null,
      _search: opts?.search ?? null,
      _limit: opts?.limit ?? 50,
      _offset: opts?.offset ?? 0,
    } as never);
    if (error) throw error;
    return (data as unknown as PaginatedNumbers) ?? { items: [], total: 0, limit: 50, offset: 0 };
  },

  async metrics(campaignId: string): Promise<CampaignNumberMetrics> {
    const { data, error } = await supabase.rpc("campaign_number_metrics" as never, {
      _campaign: campaignId,
    } as never);
    if (error) throw error;
    return (data as unknown as CampaignNumberMetrics) ?? { sold: 0, reserved: 0, blocked: 0, available: 0, total: 0 };
  },

  async generate(campaignId: string): Promise<void> {
    const { error } = await supabase.rpc("generate_campaign_numbers" as never, {
      _campaign: campaignId,
    } as never);
    if (error) throw error;
  },

  async publicNumbers(slug: string) {
    const { data, error } = await supabase.rpc("public_campaign_numbers" as never, {
      _slug: slug,
    } as never);
    if (error) throw error;
    return data as unknown as {
      campaign_id: string;
      name: string;
      total_numbers: number;
      number_price: number;
      currency: string;
      numbers: { number: number; status: string }[];
    };
  },

  async blockNumbers(campaignId: string, numbers: number[]): Promise<void> {
    const { error } = await supabase.rpc("admin_block_numbers" as never, {
      _campaign: campaignId,
      _numbers: numbers,
    } as never);
    if (error) throw error;
  },

  async unblockNumbers(campaignId: string, numbers: number[]): Promise<void> {
    const { error } = await supabase.rpc("admin_unblock_numbers" as never, {
      _campaign: campaignId,
      _numbers: numbers,
    } as never);
    if (error) throw error;
  },

  async listWithParticipant(
    campaignId: string,
    opts?: { status?: string; search?: string; limit?: number; offset?: number },
  ): Promise<PaginatedNumbers & { items: (CampaignNumber & { participant_name?: string; participant_phone?: string; participant_email?: string; payment_method?: string; sale_amount?: number })[] }> {
    const { data, error } = await supabase.rpc("list_campaign_numbers_with_participant" as never, {
      _campaign: campaignId,
      _status: opts?.status ?? null,
      _search: opts?.search ?? null,
      _limit: opts?.limit ?? 50,
      _offset: opts?.offset ?? 0,
    } as never);
    if (error) throw error;
    return (data as unknown as PaginatedNumbers & { items: (CampaignNumber & { participant_name?: string; participant_phone?: string; participant_email?: string; payment_method?: string; sale_amount?: number })[] }) ?? { items: [], total: 0, limit: 50, offset: 0 };
  },
};

export const ReservationService = {
  async reserve(campaignId: string, numbers: number[]): Promise<string> {
    const { data, error } = await supabase.rpc("reserve_numbers" as never, {
      _campaign: campaignId,
      _numbers: numbers,
    } as never);
    if (error) throw error;
    return data as unknown as string;
  },

  async cancel(reservationId: string): Promise<void> {
    const { error } = await supabase.rpc("cancel_reservation" as never, {
      _reservation_id: reservationId,
    } as never);
    if (error) throw error;
  },

  async getActive(campaignId: string): Promise<NumberReservation | null> {
    const { data, error } = await supabase.rpc("get_active_reservation" as never, {
      _campaign: campaignId,
    } as never);
    if (error) throw error;
    return (data as unknown as NumberReservation) ?? null;
  },

  async adminCancel(reservationId: string): Promise<void> {
    const { error } = await supabase.rpc("admin_cancel_reservation" as never, {
      _reservation_id: reservationId,
    } as never);
    if (error) throw error;
  },
};
