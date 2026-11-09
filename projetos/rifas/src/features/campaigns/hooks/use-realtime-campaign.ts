import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { useEffect } from "react";

import { supabase } from "@/integrations/supabase/client";
import { campaignNumberService } from "@/services/campaign-number.service";
import type { CampaignNumber, NumberGridStatus } from "@/types/campaign-number";

export const NUMBER_STATES_KEY = "campaign-numbers";

function queryKey(campaignId: string | undefined): Array<string | undefined> {
  return [NUMBER_STATES_KEY, campaignId];
}

/** Resolve o status efetivo de um número na grade (expirado = disponível). */
export function resolveNumberStatus(row: CampaignNumber | null, now: number): NumberGridStatus {
  if (!row) return "AVAILABLE";
  if (row.status === "RESERVED" || row.status === "PENDING_PAYMENT") {
    if (row.reserved_until && new Date(row.reserved_until).getTime() <= now) return "AVAILABLE";
  }
  return row.status;
}

export function buildNumberStateMap(numbers: CampaignNumber[]): Map<number, CampaignNumber> {
  const map = new Map<number, CampaignNumber>();
  for (const row of numbers) {
    map.set(row.number, row);
  }
  return map;
}

export interface NumberCounts {
  available: number;
  reserved: number;
  pendingPayment: number;
  paid: number;
  blocked: number;
  cancelled: number;
  winner: number;
}

export function countNumberStates(
  numbers: CampaignNumber[],
  now: number,
  total: number,
): NumberCounts {
  const counts: NumberCounts = {
    available: 0,
    reserved: 0,
    pendingPayment: 0,
    paid: 0,
    blocked: 0,
    cancelled: 0,
    winner: 0,
  };
  for (const row of numbers) {
    const status = resolveNumberStatus(row, now);
    if (status === "RESERVED") counts.reserved++;
    else if (status === "PENDING_PAYMENT") counts.pendingPayment++;
    else if (status === "PAID") counts.paid++;
    else if (status === "BLOCKED") counts.blocked++;
    else if (status === "CANCELLED") counts.cancelled++;
    else if (status === "WINNER") counts.winner++;
  }
  const used =
    counts.reserved + counts.pendingPayment + counts.paid + counts.blocked + counts.winner;
  counts.available = Math.max(0, total - used);
  return counts;
}

type NumberPayload = RealtimePostgresChangesPayload<Record<string, never>>;

function applyNumberChange(rows: CampaignNumber[], payload: NumberPayload): CampaignNumber[] {
  const incoming = (payload.new ?? payload.old) as CampaignNumber | null;
  if (!incoming) return rows;
  const number = incoming.number;

  switch (payload.eventType) {
    case "INSERT":
    case "UPDATE": {
      const next = [...rows];
      const index = next.findIndex((row) => row.number === number);
      if (index >= 0) next[index] = incoming;
      else next.push(incoming);
      return next.sort((a, b) => a.number - b.number);
    }
    case "DELETE": {
      return rows.filter((row) => row.number !== number);
    }
    default:
      return rows;
  }
}

const subscribedChannels = new Set<string>();

export function useRealtimeCampaign(
  campaignId: string | undefined,
  options?: { initialData?: CampaignNumber[] },
) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKey(campaignId),
    queryFn: () => (campaignId ? campaignNumberService.listStates(campaignId) : []),
    enabled: Boolean(campaignId),
    staleTime: 10_000,
    ...(options?.initialData ? { initialData: options.initialData } : {}),
  });

  useEffect(() => {
    if (!campaignId) return;
    const name = `campaign-numbers:${campaignId}`;
    if (subscribedChannels.has(name)) return;
    subscribedChannels.add(name);

    const channel = supabase
      .channel(name)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "campaign_numbers",
          filter: `campaign_id=eq.${campaignId}`,
        },
        (payload) => {
          const key = queryKey(campaignId);
          queryClient.setQueryData<CampaignNumber[]>(key, (old) =>
            applyNumberChange(old ?? [], payload as NumberPayload),
          );
        },
      )
      .subscribe();

    return () => {
      subscribedChannels.delete(name);
      void supabase.removeChannel(channel);
    };
  }, [campaignId, queryClient]);

  return query;
}
