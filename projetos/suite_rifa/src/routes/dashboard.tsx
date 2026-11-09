import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";

import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser, usePlanContext, useTenant } from "@/hooks/useTenant";
import { LIMIT_LABEL, USAGE_FOR_LIMIT, formatLimitValue } from "@/services/types";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — RaffleHub" },
      { name: "description", content: "Visão geral de uso, plano e equipe da sua organização." },
      { property: "og:title", content: "Dashboard — RaffleHub" },
      { property: "og:description", content: "Visão geral de uso, plano e equipe da sua organização." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const { user, isPending: authPending } = useCurrentUser();
  const { organization, organizationId, isPending, memberships } = useTenant();
  const plan = usePlanContext(organizationId);

  useEffect(() => {
    if (!authPending && !user) void navigate({ to: "/auth", replace: true });
  }, [authPending, user, navigate]);

  useEffect(() => {
    if (!isPending && user && memberships.length === 0) {
      void navigate({ to: "/onboarding", replace: true });
    }
  }, [isPending, user, memberships.length, navigate]);

  if (isPending || !organization) {
    return (
      <div className="space-y-4 p-8">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const ctx = plan.data;
  const limitKeys = Object.keys(ctx?.limits ?? {});

  return (
    <AppShell
      title={`Olá, ${organization.name}`}
      description="Resumo do plano, limites e consumo atual desta organização."
      actions={
        <Button asChild variant="outline">
          <Link to="/settings/users">Convidar usuário</Link>
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Plano atual</CardDescription>
            <CardTitle className="font-display text-2xl">
              {ctx?.subscription?.plan?.name ?? "—"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {ctx?.subscription ? "Assinatura ativa nesta organização." : "Carregando assinatura…"}
          </CardContent>
        </Card>

        {limitKeys.map((key) => {
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
              <CardContent>
                <Progress value={pct} />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </AppShell>
  );
}
