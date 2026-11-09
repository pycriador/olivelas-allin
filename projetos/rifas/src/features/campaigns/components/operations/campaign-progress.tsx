import { cn } from "@/lib/utils";

export interface CampaignProgressProps {
  label: string;
  value: number;
  max: number;
  className?: string;
}

export function CampaignProgress({ label, value, max, className }: CampaignProgressProps) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums text-muted-foreground">{pct}%</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            pct >= 80
              ? "bg-success"
              : pct >= 50
                ? "bg-primary"
                : pct >= 25
                  ? "bg-warning"
                  : "bg-muted-foreground",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs tabular-nums text-muted-foreground">
        {value} de {max}
      </p>
    </div>
  );
}
