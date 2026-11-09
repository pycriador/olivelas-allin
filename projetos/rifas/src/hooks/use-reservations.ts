import { useQuery } from "@tanstack/react-query";

import { campaignNumberService } from "@/services/campaign-number.service";

export function useReservationMetrics(createdBy?: string) {
  return useQuery({
    queryKey: ["reservation-metrics", createdBy ?? "all"],
    queryFn: () => campaignNumberService.getReservationMetrics(createdBy),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
