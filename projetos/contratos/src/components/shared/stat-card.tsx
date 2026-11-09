import type { ReactNode } from "react";
import { type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  hint?: string;
  hintTone?: "default" | "warning" | "danger";
}

export function StatCard({ label, value, icon: Icon, hint, hintTone = "default" }: StatCardProps) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-3xl font-semibold tracking-tight">{value}</p>
            {hint && (
              <p
                className={cn(
                  "text-xs",
                  hintTone === "warning" && "text-amber-600 dark:text-amber-400",
                  hintTone === "danger" && "text-destructive",
                  hintTone === "default" && "text-muted-foreground",
                )}
              >
                {hint}
              </p>
            )}
          </div>
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-4.5" aria-hidden />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function StatCardsGrid({
  children,
  isLoading,
  skeletonCount = 4,
}: {
  children: ReactNode;
  isLoading?: boolean;
  skeletonCount?: number;
}) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <div key={i}>
            <Card className="shadow-sm">
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="mt-3 h-8 w-16" />
                <Skeleton className="mt-2 h-3 w-28" />
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    );
  }
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}
