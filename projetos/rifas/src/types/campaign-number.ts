import type { Database, Tables } from "@/integrations/supabase/types";

export type CampaignNumberStatus = Database["public"]["Enums"]["campaign_number_status"];

export type CampaignNumber = Tables<"campaign_numbers">;

export const CAMPAIGN_NUMBER_STATUS_VALUES: readonly CampaignNumberStatus[] = [
  "AVAILABLE",
  "RESERVED",
  "PENDING_PAYMENT",
  "PAID",
  "BLOCKED",
  "CANCELLED",
  "WINNER",
];

export const CAMPAIGN_NUMBER_STATUS_LABELS: Record<CampaignNumberStatus, string> = {
  AVAILABLE: "Disponível",
  RESERVED: "Reservado",
  PENDING_PAYMENT: "Pagamento",
  PAID: "Pago",
  BLOCKED: "Bloqueado",
  CANCELLED: "Cancelado",
  WINNER: "Premiado",
};

/** Estado resolvido de um número na grade (AVAILABLE quando não há linha). */
export type NumberGridStatus = CampaignNumberStatus;

export interface NumberGridItem {
  number: number;
  status: NumberGridStatus;
  row: CampaignNumber | null;
}

export interface ReservationResult {
  ok: boolean;
  error?:
    | "CAMPAIGN_NOT_FOUND"
    | "CAMPAIGN_NOT_ACTIVE"
    | "NO_NUMBERS"
    | "RATE_LIMITED"
    | "NUMBER_OUT_OF_RANGE"
    | "MAX_NUMBERS_EXCEEDED"
    | "CONFLICT"
    | "UNKNOWN";
  message?: string;
  token?: string;
  reserved_until?: string;
  timeout_minutes?: number;
  numbers?: number[];
  count?: number;
}

export interface ActiveReservation {
  token: string;
  reservedBy: string;
  reservedUntil: string;
  timeoutMinutes: number;
  numbers: number[];
  total: number;
}

export interface ReservationMetrics {
  activeReservations: number;
  reservedNumbers: number;
  pendingPaymentNumbers: number;
  paidNumbers: number;
  expiredReservations: number;
  avgHoldSeconds: number;
  byCampaign: Array<{
    campaign_id: string;
    campaign_title: string;
    reserved: number;
    expires_at: string | null;
  }>;
}
