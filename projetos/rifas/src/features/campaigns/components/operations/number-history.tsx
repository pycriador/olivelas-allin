import { useQuery } from "@tanstack/react-query";

import { ActivityTimeline } from "@/components/common/activity-timeline";
import { auditService } from "@/services/audit.service";

export interface NumberHistoryProps {
  campaignNumberId: string;
}

export function NumberHistory({ campaignNumberId }: NumberHistoryProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["audit", "campaign_number", campaignNumberId],
    queryFn: () => auditService.listForEntity("campaign_number", campaignNumberId),
  });

  return <ActivityTimeline items={data ?? []} isLoading={isLoading} />;
}
