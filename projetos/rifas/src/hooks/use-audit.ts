import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { auditService, type AuditListParams } from "@/services/audit.service";

export function useAuditLogs(params: AuditListParams) {
  return useQuery({
    queryKey: ["audit", params],
    queryFn: () => auditService.list(params),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });
}

export function useRecentActivity(limit = 8) {
  return useQuery({
    queryKey: ["audit", "recent", limit],
    queryFn: () => auditService.recent(limit),
    staleTime: 15_000,
  });
}

export function useAuditCountToday() {
  return useQuery({
    queryKey: ["audit", "count-today"],
    queryFn: () => auditService.countToday(),
  });
}
