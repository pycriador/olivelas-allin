import { Badge } from "@/components/ui/badge";
import { PAYMENT_METHOD_LABELS, type PaymentMethod } from "@/types/order";

export interface PaymentBadgeProps {
  method: PaymentMethod;
}

export function PaymentBadge({ method }: PaymentBadgeProps) {
  return <Badge variant="outline">{PAYMENT_METHOD_LABELS[method]}</Badge>;
}
