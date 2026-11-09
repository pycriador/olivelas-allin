import { useQuery } from "@tanstack/react-query";
import { Coins } from "lucide-react";
import { aiExecutionsService } from "@/services/ai-data";
import { useWorkspaceStore } from "@/stores/workspace";
import { PageHeader } from "@/features/dashboard/ui/page-header";
import { StatCard, StatCardsGrid } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";

export function AICostsPage() {
  const workspace = useWorkspaceStore((s) => s.workspace);
  const workspaceId = workspace?.id;

  const { data: executions, isLoading } = useQuery({
    queryKey: ["ai", "costs", workspaceId],
    queryFn: () => aiExecutionsService.list(workspaceId ?? null, 500),
    enabled: !!workspaceId,
  });

  const byModel = new Map<string, number>();
  const byProvider = new Map<string, number>();
  let totalCost = 0;
  let totalTokens = 0;
  executions?.forEach((e) => {
    const cost = e.cost_estimate ?? 0;
    totalCost += cost;
    totalTokens += e.total_tokens ?? 0;
    if (e.model) byModel.set(e.model, (byModel.get(e.model) ?? 0) + cost);
    if (e.provider_id) byProvider.set(e.provider_id, (byProvider.get(e.provider_id) ?? 0) + cost);
  });

  const topModels = Array.from(byModel.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const mostExpensive = [...(executions ?? [])]
    .filter((e) => e.cost_estimate)
    .sort((a, b) => (b.cost_estimate ?? 0) - (a.cost_estimate ?? 0))
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Costs"
        description="Evolución y distribución del gasto estimado en IA."
      />

      <StatCardsGrid isLoading={isLoading}>
        <StatCard
          label="Custo total"
          value={`US$ ${totalCost.toFixed(4)}`}
          icon={Coins}
          hintTone="warning"
          hint="Estimado"
        />
        <StatCard
          label="Tokens totales"
          value={totalTokens.toLocaleString("pt-BR")}
          icon={Coins}
          hint="Acumulados"
        />
        <StatCard
          label="Providers usados"
          value={byProvider.size}
          icon={Coins}
          hint={`${executions?.length ?? 0} execuções`}
        />
        <StatCard
          label="Modelos distintos"
          value={byModel.size}
          icon={Coins}
          hint="En el histórico"
        />
      </StatCardsGrid>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Costo por modelo</CardTitle>
          </CardHeader>
          <CardContent>
            {topModels.length > 0 ? (
              <div className="space-y-3">
                {topModels.map(([model, cost]) => {
                  const pct = totalCost > 0 ? (cost / totalCost) * 100 : 0;
                  return (
                    <div key={model} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{model}</span>
                        <span className="text-muted-foreground">
                          US$ {cost.toFixed(4)} · {pct.toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-primary/20">
                        <div
                          className="h-2 rounded-full bg-primary"
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Não hay dados de custo ainda.</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Execuções más caras</CardTitle>
          </CardHeader>
          <CardContent>
            {mostExpensive.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground">
                      <th className="px-3 py-2 font-medium">Modelo</th>
                      <th className="px-3 py-2 font-medium">Tokens</th>
                      <th className="px-3 py-2 font-medium">Custo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {mostExpensive.map((e) => (
                      <tr key={e.id}>
                        <td className="px-3 py-2.5 font-medium">{e.model ?? "—"}</td>
                        <td className="px-3 py-2.5 text-muted-foreground">
                          {(e.total_tokens ?? 0).toLocaleString("pt-BR")}
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground">
                          US$ {(e.cost_estimate ?? 0).toFixed(4)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                icon={Coins}
                title="Não hay execuções costosas"
                description="Os valores estimados aparecerán conforme se execute IA."
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
