import { useQuery } from "@tanstack/react-query";
import { PlaySquare } from "lucide-react";
import { dashboardService } from "@/services/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDistanceToNow } from "date-fns";
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

export function RecentExecutionsTable({ workspaceId }: { workspaceId?: string | undefined }) {
  const { data: executions, isLoading } = useQuery({
    queryKey: ["dashboard", "executions", workspaceId],
    queryFn: () => dashboardService.getRecentExecutions(workspaceId!, 6),
    enabled: !!workspaceId,
  });

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <PlaySquare className="size-4 text-muted-foreground" />
          Execuções recentes
        </CardTitle>
        <Badge variant="secondary">últimas {executions?.length ?? 0}</Badge>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : executions && executions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Projeto</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="hidden px-3 py-2 font-medium md:table-cell">Executada</th>
                  <th className="px-3 py-2 font-medium">Início</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {executions.map((execution) => (
                  <tr key={execution.id}>
                    <td className="px-3 py-2.5 font-medium">
                      {execution.project?.name ?? "Projeto removido"}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_TONE[execution.status] ?? STATUS_TONE["cancelled"]}`}
                      >
                        {STATUS_LABEL[execution.status] ?? execution.status}
                      </span>
                    </td>
                    <td className="hidden px-3 py-2.5 text-muted-foreground md:table-cell">
                      {execution.started_at
                        ? formatDistanceToNow(new Date(execution.started_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })
                        : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">
                      {formatDistanceToNow(new Date(execution.created_at), {
                        addSuffix: true,
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
            title="Ainda não há execuções"
            description="Quando projetos forem executados, eles aparecerão aqui."
          />
        )}
      </CardContent>
    </Card>
  );
}
