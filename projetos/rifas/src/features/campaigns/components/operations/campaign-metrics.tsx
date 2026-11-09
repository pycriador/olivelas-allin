import { Check, Clock, Lock, MinusCircle, ShieldAlert, Ticket, Trophy } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { NumberCounts } from "@/features/campaigns/hooks/use-realtime-campaign";
import { cn } from "@/lib/utils";

const CONFIG: Array<{
  key: keyof NumberCounts;
  label: string;
  icon: LucideIcon;
  className: string;
}> = [
  { key: "available", label: "Disponíveis", icon: Check, className: "text-success" },
  { key: "reserved", label: "Reservados", icon: Clock, className: "text-warning" },
  { key: "pendingPayment", label: "Pendentes", icon: ShieldAlert, className: "text-blue-500" },
  { key: "paid", label: "Pagos", icon: Ticket, className: "text-primary" },
  { key: "blocked", label: "Bloqueados", icon: Lock, className: "text-muted-foreground" },
  { key: "cancelled", label: "Cancelados", icon: MinusCircle, className: "text-destructive" },
  { key: "winner", label: "Premiados", icon: Trophy, className: "text-amber-500" },
];

export interface CampaignMetricsProps {
  counts: NumberCounts;
  className?: string;
}

export function CampaignMetrics({ counts, className }: CampaignMetricsProps) {
  return (
    <div className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {CONFIG.map(({ key, label, icon: Icon, className: colorClass }) => (
        <Card key={key}>
          <CardContent className="flex items-center gap-3 p-4">
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted",
                colorClass,
              )}
            >
              <Icon aria-hidden="true" className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-lg font-semibold tabular-nums">{counts[key]}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
