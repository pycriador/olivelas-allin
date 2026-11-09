import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/app/AppShell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePlanContext, useTenant } from "@/hooks/useTenant";
import { FEATURE_LABEL, LIMIT_LABEL, formatLimitValue } from "@/services/types";

export const Route = createFileRoute("/settings/plan")({
  head: () => ({
    meta: [
      { title: "Plano — RaffleHub" },
      { name: "description", content: "Veja o plano, recursos e limites da sua organização." },
      { property: "og:title", content: "Plano — RaffleHub" },
      { property: "og:description", content: "Veja o plano, recursos e limites da sua organização." },
    ],
  }),
  component: PlanPage,
});

function PlanPage() {
  const { organizationId } = useTenant();
  const ctx = usePlanContext(organizationId).data;

  return (
    <AppShell title="Plano" description="Recursos e limites incluídos na assinatura atual.">
      <Card>
        <CardHeader>
          <CardDescription>Assinatura</CardDescription>
          <CardTitle className="font-display text-2xl">
            {ctx?.subscription?.plan?.name ?? "—"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <p className="text-sm font-medium">Recursos</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(ctx?.features ?? {}).map(([key, enabled]) => (
                <Badge key={key} variant={enabled ? "secondary" : "outline"}>
                  {FEATURE_LABEL[key] ?? key}
                </Badge>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Limites</p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {Object.entries(ctx?.limits ?? {}).map(([key, value]) => (
                <li key={key}>
                  {LIMIT_LABEL[key] ?? key}: {formatLimitValue(key, value)}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
