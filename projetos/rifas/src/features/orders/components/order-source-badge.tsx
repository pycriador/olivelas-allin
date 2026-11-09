import { Badge } from "@/components/ui/badge";
import { ORDER_SOURCE_LABELS, type OrderSource } from "@/types/order";

export interface OrderSourceBadgeProps {
  source: OrderSource;
}

export function OrderSourceBadge({ source }: OrderSourceBadgeProps) {
  return <Badge variant="secondary">{ORDER_SOURCE_LABELS[source]}</Badge>;
}
