import { Timer } from "lucide-react";

import { useCountdown } from "../../hooks/use-countdown";
import { cn } from "@/lib/utils";

export interface ReservationTimerProps {
  until: string;
  onExpire?: () => void;
  className?: string;
}

export function ReservationTimer({ until, onExpire, className }: ReservationTimerProps) {
  const countdown = useCountdown(until, onExpire ? { onExpire } : undefined);
  const low = countdown.remainingSeconds <= 120;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-semibold tabular-nums",
        low ? "border-red-500/50 bg-red-500/10 text-red-700" : "border-border bg-muted/50",
        className,
      )}
      role="timer"
      aria-live="polite"
    >
      <Timer aria-hidden="true" className="size-4" />
      {countdown.formatted}
    </div>
  );
}
