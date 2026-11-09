import { useQuery } from "@tanstack/react-query";
import { BrainCircuit, CircleCheck, Coins, Server, TriangleAlert } from "lucide-react";
import { aiProvidersService, aiExecutionsService } from "@/services/ai-data";
import { useWorkspaceStore } from "@/stores/workspace";
import { PageHeader } from "@/features/dashboard/ui/page-header";
import { StatCard, StatCardsGrid } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendente",
  running: "Em execução",
  succeeded: "Sucesso",
  failed: "Falha",
  cancelled: "Cancelada",
};

const STATUS_TONE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  running: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  succeeded: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  failed: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  cancelled: "bg-muted text-muted-foreground",
};

export function AIDashboardPage() {
  const workspace = useWorkspaceStore((s) => s.workspace);
  const workspaceId = workspace?.id;

  const { data: providers, isLoading: providersLoading } = useQuery({
    queryKey: ["ai", "providers", workspaceId],
    queryFn: () => aiProvidersService.listByWorkspace(workspaceId ?? null),
    enabled: !!workspaceId,
  });

  const { data: executions, isLoading: executionsLoading } = useQuery({
    queryKey: ["ai", "executions", workspaceId],
    queryFn: () => aiExecutionsService.list(workspaceId ?? null, 500),
    enabled: !!workspaceId,
  });

  const activeProviders = providers?.filter((p) => p.status === "active").length ?? 0;
  const today = new Date().toISOString().slice(0, 10);
  const executionsToday = executions?.filter((e) => e.created_at.startsWith(today)).length ?? 0;
  const totalTokens = executions?.reduce((sum, e) => sum + (e.total_tokens ?? 0), 0) ?? 0;
  const totalCost = executions?.reduce((sum, e) => sum + (e.cost_estimate ?? 0), 0) ?? 0;
  const lastFailed = executions?.find((e) => e.status === "failed");
  const isLoading = providersLoading || executionsLoading;

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Dashboard"
        description="Resumo da infraestrutura de inteligência do workspace."
        actions={<Badge variant="secondary">{executions?.length ?? 0} execuções</Badge>}
      />

      <StatCardsGrid isLoading={isLoading}>
        <StatCard
          label="Providers ativos"
          value={activeProviders}
          icon={Server}
          hint={providers ? `${providers.length} configurados` : "Nenhún configurado"}
        />
        <StatCard
          label="Execuções hoje"
          value={executionsToday}
          icon={BrainCircuit}
          hint={`${totalTokens.toLocaleString("pt-BR")} tokens`}
        />
        <StatCard
          label="Tokens totais"
          value={totalTokens.toLocaleString("pt-BR")}
          icon={CircleCheck}
          hint="Acumulados"
        />
        <StatCard
          label="Custo estimado"
          value={`US$ ${totalCost.toFixed(4)}`}
          icon={Coins}
          hintTone="warning"
          hint="Estimado por modelo"
        />
      </StatCardsGrid>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <BrainCircuit className="size-4 text-muted-foreground" />
            Últimas execuções de IA
          </CardTitle>
          <Badge variant="secondary">recentes {executions?.length ?? 0}</Badge>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : executions && executions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="px-3 py-2 font-medium">Modelo</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium">Tokens</th>
                    <th className="px-3 py-2 font-medium">Custo</th>
                    <th className="hidden px-3 py-2 font-medium md:table-cell">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {(executions?.slice(0, 8) ?? []).map((execution) => (
                    <tr key={execution.id}>
                      <td className="px-3 py-2.5 font-medium">{execution.model ?? "—"}</td>
                      <td className="px-3 py-2.5">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_TONE[execution.status] ?? STATUS_TONE["cancelled"]}`}
                        >
                          {STATUS_LABEL[execution.status] ?? execution.status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">
                        {(execution.total_tokens ?? 0).toLocaleString("pt-BR")}
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">
                        US$ {(execution.cost_estimate ?? 0).toFixed(4)}
                      </td>
                      <td className="hidden px-3 py-2.5 text-muted-foreground md:table-cell">
                        {format(new Date(execution.created_at), "d MMM yyyy · HH:mm", {
                          locale: ptBR,
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={BrainCircuit}
              title="Ainda não há execuções de IA"
              description="Quando configure providers e execute o playground, elas aparecerão aqui."
            />
          )}
        </CardContent>
      </Card>

      {lastFailed && (
        <Card className="border-destructive/60 shadow-none">
          <CardContent className="flex items-start gap-3 text-sm p-5">
            <TriangleAlert className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-destructive">Erro recent de IA</p>
              <p className="mt-1 text-muted-foreground">
                {lastFailed.error ?? "A execução terminou em erro."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
