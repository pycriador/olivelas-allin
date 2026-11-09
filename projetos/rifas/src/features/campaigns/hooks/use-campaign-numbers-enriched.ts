import { useMemo } from "react";

import {
  useRealtimeCampaign,
  countNumberStates,
  type NumberCounts,
} from "@/features/campaigns/hooks/use-realtime-campaign";
import { useOrders } from "@/features/orders/hooks/use-orders";
import type { Campaign } from "@/types/campaign";
import { numberRowToEnriched, type EnrichedNumber } from "../components/operations/number-types";

export interface CampaignStats {
  enrichedNumbers: EnrichedNumber[];
  numbersLoading: boolean;
  numbersError: boolean;
  refetchNumbers: () => void;
  counts: NumberCounts;
}

export function useCampaignNumbersEnriched(campaign: Campaign, now: number): CampaignStats {
  const numbersQuery = useRealtimeCampaign(campaign.id);
  const totalNumbers = campaign.number_end - campaign.number_start + 1;

  const { data: ordersData } = useOrders({
    page: 1,
    pageSize: 500,
    filters: { campaignId: campaign.id },
  });

  const orderMap = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        source: string;
        status: string;
        payment_method: string | null;
        total: number;
        notes: string | null;
        item_count: number;
        customer: { id: string; full_name: string; phone: string } | null;
      }
    >();
    for (const order of ordersData?.items ?? []) {
      map.set(order.id, {
        id: order.id,
        source: order.source,
        status: order.status,
        payment_method: order.payment_method,
        total: order.total,
        notes: order.notes,
        item_count: order.items.length,
        customer: order.customer
          ? {
              id: order.customer.id,
              full_name: order.customer.full_name,
              phone: order.customer.phone,
            }
          : null,
      });
    }
    return map;
  }, [ordersData]);

  const enrichedNumbers = useMemo(() => {
    const numbersData = numbersQuery.data ?? [];
    return numbersData.map((row) => numberRowToEnriched(row, now, orderMap));
  }, [numbersQuery.data, now, orderMap]);

  const counts = useMemo(
    () => countNumberStates(numbersQuery.data ?? [], now, totalNumbers),
    [numbersQuery.data, now, totalNumbers],
  );

  return {
    enrichedNumbers,
    numbersLoading: numbersQuery.isLoading,
    numbersError: numbersQuery.isError,
    refetchNumbers: numbersQuery.refetch,
    counts,
  };
}
