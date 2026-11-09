import { PAYMENT_STATUS_LABEL, PAYMENT_STATUS_TONE } from "@/services/types";
import type { PaymentStatus } from "@/services/types";
import { cn } from "@/lib/utils";

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  className?: string;
}

export function PaymentStatusBadge({ status, className }: PaymentStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        PAYMENT_STATUS_TONE[status],
        className,
      )}
    >
      {PAYMENT_STATUS_LABEL[status]}
    </span>
  );
}
