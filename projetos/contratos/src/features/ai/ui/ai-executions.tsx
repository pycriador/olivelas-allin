import { useQuery } from "@tanstack/react-query";
import { PlaySquare } from "lucide-react";
import { aiExecutionsService } from "@/services/ai-data";
import { useWorkspaceStore } from "@/stores/workspace";
import { PageHeader } from "@/features/dashboard/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const STATUS_TONE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  running: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  succeeded: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  failed: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  cancelled: "bg-muted text-muted-foreground",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendente",
  running: "Em execução",
  succeeded: "Sucesso",
  failed: "Falha",
  cancelled: "Cancelada",
};

export function AIExecutionsPage() {
  const workspace = useWorkspaceStore((s) => s.workspace);
  const workspaceId = workspace?.id;

  const { data: executions, isLoading } = useQuery({
    queryKey: ["ai", "executions", workspaceId],
    queryFn: () => aiExecutionsService.list(workspaceId ?? null, 200),
    enabled: !!workspaceId,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Executions"
        description="Registro técnico de cada invocación de IA del workspace."
        actions={<Badge variant="secondary">{executions?.length ?? 0} execuções</Badge>}
      />

      <Card className="shadow-sm">
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : executions && executions.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Modelo</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Tokens</th>
                  <th className="hidden px-3 py-2 font-medium md:table-cell">Custo</th>
                  <th className="hidden px-3 py-2 font-medium md:table-cell">Latência</th>
                  <th className="px-3 py-2 font-medium">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {executions.map((execution) => (
                  <tr key={execution.id}>
                    <td className="px-3 py-2.5 font-medium">
                      <PlaySquare
                        className="mr-2 inline size-4 text-muted-foreground"
                        aria-hidden
                      />
                      {execution.model ?? "—"}
                    </td>
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
                    <td className="hidden px-3 py-2.5 text-muted-foreground md:table-cell">
                      US$ {(execution.cost_estimate ?? 0).toFixed(4)}
                    </td>
                    <td className="hidden px-3 py-2.5 text-muted-foreground md:table-cell">
                      {execution.latency_ms ? `${execution.latency_ms} ms` : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">
                      {format(new Date(execution.created_at), "d MMM yyyy · HH:mm", {
                        locale: ptBR,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState
              icon={PlaySquare}
              title="Ainda não há execuções de IA"
              description="Quando configure providers e execute o playground, elas aparecerão aqui."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
