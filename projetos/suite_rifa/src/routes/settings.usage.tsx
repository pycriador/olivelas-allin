import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/app/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { usePlanContext, useTenant } from "@/hooks/useTenant";
import { LIMIT_LABEL, USAGE_FOR_LIMIT, formatLimitValue } from "@/services/types";

export const Route = createFileRoute("/settings/usage")({
  head: () => ({
    meta: [
      { title: "Uso do plano — RaffleHub" },
      { name: "description", content: "Acompanhe o consumo dos limites do plano da organização." },
      { property: "og:title", content: "Uso do plano — RaffleHub" },
      { property: "og:description", content: "Acompanhe o consumo dos limites do plano da organização." },
    ],
  }),
  component: UsagePage,
});

function UsagePage() {
  const { organizationId } = useTenant();
  const plan = usePlanContext(organizationId);
  const ctx = plan.data;

  return (
    <AppShell title="Uso" description="Consumo atual comparado aos limites do plano.">
      {plan.isPending ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {Object.keys(ctx?.limits ?? {}).map((key) => {
            const limit = ctx?.limits[key] ?? 0;
            const used = ctx?.usage[USAGE_FOR_LIMIT[key] ?? key] ?? 0;
            const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
            return (
              <Card key={key}>
                <CardHeader className="pb-2">
                  <CardDescription>{LIMIT_LABEL[key] ?? key}</CardDescription>
                  <CardTitle className="font-display text-2xl">
                    {used} / {formatLimitValue(key, limit)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  <Progress value={pct} />
                  <p className="text-xs text-muted-foreground">
                    {pct >= 100 ? "Limite atingido" : `${Math.round(pct)}% utilizado`}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}