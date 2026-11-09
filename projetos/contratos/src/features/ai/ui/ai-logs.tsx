import { useQuery } from "@tanstack/react-query";
import { ScrollText, TriangleAlert } from "lucide-react";
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

export function AILogsPage() {
  const workspace = useWorkspaceStore((s) => s.workspace);
  const workspaceId = workspace?.id;

  const { data: executions, isLoading } = useQuery({
    queryKey: ["ai", "logs", workspaceId],
    queryFn: () => aiExecutionsService.list(workspaceId ?? null, 200),
    enabled: !!workspaceId,
  });

  const errorCount = executions?.filter((e) => e.status === "failed").length ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Logs"
        description="Trilha de execución de IA com foco en errores e detalles técnicos."
        actions={
          <Badge variant={errorCount > 0 ? "destructive" : "secondary"}>{errorCount} errores</Badge>
        }
      />

      <Card className="shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : executions && executions.length > 0 ? (
            <div className="divide-y divide-border/60">
              {executions.map((execution) => (
                <div key={execution.id} className="flex items-start gap-4 px-6 py-3.5">
                  <div
                    className={`mt-1 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted ${execution.status === "failed" ? "text-destructive" : "text-muted-foreground"}`}
                  >
                    {execution.status === "failed" ? (
                      <TriangleAlert className="size-4" aria-hidden />
                    ) : (
                      <ScrollText className="size-4" aria-hidden />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_TONE[execution.status] ?? STATUS_TONE["cancelled"]}`}
                      >
                        {STATUS_LABEL[execution.status] ?? execution.status}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {execution.model ?? "—"}
                        {execution.provider_id
                          ? ` · provider ${execution.provider_id.slice(0, 8)}`
                          : ""}
                      </span>
                    </div>
                    {execution.error ? (
                      <p className="mt-1 text-sm font-medium text-destructive">{execution.error}</p>
                    ) : (
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                        {(execution.output as { text?: string } | null)?.text ??
                          "Sem detalhes de salida."}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {format(new Date(execution.created_at), "d MMM yyyy · HH:mm", {
                      locale: ptBR,
                    })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={ScrollText}
              title="Ainda não há logs de IA"
              description="As execuções aparecerão aquí conforme aconteçam."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
