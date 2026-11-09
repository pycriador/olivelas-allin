import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/types/order";
import { cn } from "@/lib/utils";

const STATUS_CLASSES: Record<OrderStatus, string> = {
  OPEN: "border-transparent bg-secondary text-secondary-foreground",
  WAITING_CONTACT: "border-transparent bg-warning text-warning-foreground",
  WAITING_PAYMENT: "border-transparent bg-primary text-primary-foreground",
  PAID: "border-transparent bg-success text-success-foreground",
  CANCELLED: "text-muted-foreground",
  EXPIRED: "text-muted-foreground",
  REFUNDED: "border-transparent bg-muted text-muted-foreground",
};

export interface OrderStatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  return (
    <Badge className={cn(STATUS_CLASSES[status], className)}>{ORDER_STATUS_LABELS[status]}</Badge>
  );
}
