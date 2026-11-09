import { supabase } from "@/integrations/supabase/client";
import type {
  CampaignNumber,
  CampaignNumberStatus,
  ReservationMetrics,
  ReservationResult,
} from "@/types/campaign-number";

const NUMBER_COLUMNS =
  "id, campaign_id, number, status, reserved_until, purchase_id, created_at, updated_at";

export const RESERVATION_RATE_LIMIT = 10;

/** Gera o range de números da campanha (não persiste nada — a grade é dinâmica). */
export function buildNumberRange(start: number, end: number): number[] {
  if (end < start) return [];
  const count = end - start + 1;
  const numbers = new Array<number>(count);
  for (let i = 0; i < count; i++) {
    numbers[i] = start + i;
  }
  return numbers;
}

/** Formata o número com a mesma largura do maior número da faixa (ex.: 000, 042). */
export function formatGridNumber(number: number, maxNumber: number): string {
  const width = String(maxNumber).length;
  return String(number).padStart(width, "0");
}

export const campaignNumberService = {
  /** Lista apenas números com estado (não-AVAILABLE) de uma campanha. */
  async listStates(campaignId: string): Promise<CampaignNumber[]> {
    const { data, error } = await supabase
      .from("campaign_numbers")
      .select(NUMBER_COLUMNS)
      .eq("campaign_id", campaignId)
      .order("number", { ascending: true });
    if (error) throw error;
    return (data ?? []) as unknown as CampaignNumber[];
  },

  /** Reserva um lote de números atomicamente (RPC transacional no banco). */
  async reserve(
    campaignId: string,
    numbers: number[],
    reservedBy: string,
  ): Promise<ReservationResult> {
    const { data, error } = await supabase.rpc("reserve_campaign_numbers", {
      p_campaign_id: campaignId,
      p_numbers: numbers,
      p_reserved_by: reservedBy,
    });
    if (error) throw error;
    return data as unknown as ReservationResult;
  },

  /** Libera reservas expiradas (job automático + fallback do cliente). */
  async releaseExpired(): Promise<number> {
    const { data, error } = await supabase.rpc("release_expired_campaign_reservations");
    if (error) throw error;
    return (data as number) ?? 0;
  },

  /** Cancela uma reserva pelo token (apenas do mesmo dispositivo). */
  async cancelReservation(token: string, reservedBy: string): Promise<number> {
    const { data, error } = await supabase.rpc("cancel_campaign_reservation", {
      p_token: token,
      p_reserved_by: reservedBy,
    });
    if (error) throw error;
    return (data as number) ?? 0;
  },

  /** Admin: altera o status de um numero diretamente pela grade. */
  async manageNumberStatus(
    campaignId: string,
    number: number,
    status: CampaignNumberStatus,
  ): Promise<void> {
    const { data, error } = await supabase.rpc("admin_manage_number", {
      p_campaign_id: campaignId,
      p_number: number,
      p_new_status: status,
    });
    if (error) throw error;
    const result = data as { ok: boolean; error?: string } | null;
    if (!result?.ok) throw new Error(result?.error ?? "Falha ao alterar status");
  },

  /** Obtém (ou cria) o id de visitante anônimo usado como `reserved_by`. */
  getOrCreateGuestId(): string {
    if (typeof window === "undefined") {
      return "00000000-0000-4000-8000-000000000000";
    }
    const KEY = "rafflehub_guest_id";
    const existing = window.localStorage.getItem(KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    window.localStorage.setItem(KEY, id);
    return id;
  },

  /** Métricas de reserva para o dashboard (admin via RLS). */
  async getReservationMetrics(createdBy?: string): Promise<ReservationMetrics> {
    let campaignScope: string[] | null = null;
    if (createdBy) {
      const { data: ownedCampaigns } = await supabase
        .from("campaigns")
        .select("id")
        .eq("created_by", createdBy);
      campaignScope = (ownedCampaigns ?? []).map((c) => c.id);
      if (campaignScope.length === 0) {
        return {
          activeReservations: 0,
          reservedNumbers: 0,
          pendingPaymentNumbers: 0,
          paidNumbers: 0,
          expiredReservations: 0,
          avgHoldSeconds: 0,
          byCampaign: [],
        };
      }
    }

    let numbersQuery = supabase
      .from("campaign_numbers")
      .select("campaign_id, number, status, reserved_until, created_at")
      .neq("status", "AVAILABLE");
    if (campaignScope) numbersQuery = numbersQuery.in("campaign_id", campaignScope);

    let campaignsQuery = supabase.from("campaigns").select("id, title").is("deleted_at", null);
    if (campaignScope) campaignsQuery = campaignsQuery.in("id", campaignScope);

    const [{ data: rows, error: rowsError }, { data: campaigns, error: campaignsError }] =
      await Promise.all([numbersQuery, campaignsQuery]);
    if (rowsError) throw rowsError;
    if (campaignsError) throw campaignsError;

    const titles = new Map((campaigns ?? []).map((campaign) => [campaign.id, campaign.title]));

    const now = Date.now();
    let activeReservations = 0;
    let reservedNumbers = 0;
    let pendingPaymentNumbers = 0;
    let paidNumbers = 0;
    let expiredReservations = 0;
    let holdMsTotal = 0;
    let holdCount = 0;
    const byCampaign = new Map<
      string,
      { campaign_id: string; campaign_title: string; reserved: number; expires_at: string | null }
    >();

    const rowsList = (rows ?? []) as unknown as Array<{
      campaign_id: string;
      number: number;
      status: CampaignNumberStatus;
      reserved_until: string | null;
      created_at: string | null;
    }>;

    for (const row of rowsList) {
      const entry = byCampaign.get(row.campaign_id) ?? {
        campaign_id: row.campaign_id,
        campaign_title: titles.get(row.campaign_id) ?? "Campanha",
        reserved: 0,
        expires_at: null,
      };
      if (row.status === "RESERVED" || row.status === "PENDING_PAYMENT") {
        entry.reserved++;
        const expiresAt = row.reserved_until ? new Date(row.reserved_until).getTime() : null;
        if (expiresAt != null) {
          if (expiresAt <= now) {
            expiredReservations++;
          } else {
            activeReservations++;
            if (row.created_at) {
              holdMsTotal += now - new Date(row.created_at).getTime();
              holdCount++;
            }
          }
          if (entry.expires_at == null || expiresAt < new Date(entry.expires_at).getTime()) {
            entry.expires_at = row.reserved_until;
          }
        }
      }
      if (row.status === "RESERVED") reservedNumbers++;
      if (row.status === "PENDING_PAYMENT") pendingPaymentNumbers++;
      if (row.status === "PAID") paidNumbers++;
      byCampaign.set(row.campaign_id, entry);
    }

    return {
      activeReservations,
      reservedNumbers,
      pendingPaymentNumbers,
      paidNumbers,
      expiredReservations,
      avgHoldSeconds: holdCount > 0 ? Math.round(holdMsTotal / holdCount / 1000) : 0,
      byCampaign: [...byCampaign.values()].sort((a, b) => b.reserved - a.reserved).slice(0, 10),
    };
  },
};
