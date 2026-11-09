import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  delta?: number;
  hint?: string;
  icon: LucideIcon;
}

export function StatCard({ title, value, delta, hint, icon: Icon }: StatCardProps) {
  const positive = (delta ?? 0) >= 0;
  const DeltaIcon = positive ? ArrowUpRight : ArrowDownRight;

  return (
    <Card className="transition-shadow duration-200 hover:shadow-elevated">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <span className="flex size-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <Icon aria-hidden="true" className="size-4" />
        </span>
      </CardHeader>
      <CardContent className="space-y-1">
        <p className="text-2xl font-semibold tracking-tight">{value}</p>
        <div className="flex items-center gap-1.5 text-xs">
          {delta !== undefined ? (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 font-medium",
                positive ? "text-success" : "text-destructive",
              )}
            >
              <DeltaIcon aria-hidden="true" className="size-3" />
              {Math.abs(delta).toFixed(1)}%
            </span>
          ) : null}
          {hint ? <span className="text-muted-foreground">{hint}</span> : null}
        </div>
      </CardContent>
    </Card>
  );
}
