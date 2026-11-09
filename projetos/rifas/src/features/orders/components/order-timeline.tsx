import { useQuery } from "@tanstack/react-query";

import { ActivityTimeline } from "@/components/common/activity-timeline";
import { auditService } from "@/services/audit.service";

export interface OrderTimelineProps {
  orderId: string;
}

export function OrderTimeline({ orderId }: OrderTimelineProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["audit", "order", orderId],
    queryFn: () => auditService.listForEntity("order", orderId),
  });

  return <ActivityTimeline items={data ?? []} isLoading={isLoading} />;
}
