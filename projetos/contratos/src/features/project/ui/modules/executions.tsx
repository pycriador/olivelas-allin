import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import type { Project } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { executionEngine } from "@/services/execution-engine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { SquarePlay, Play, LoaderCircle } from "lucide-react";
import { toast } from "sonner";

const STATUS_TONE: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  running: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  succeeded: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  failed: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  cancelled: "bg-muted text-muted-foreground",
};

export function ExecutionsModule({ project }: { project: Project }) {
  const queryClient = useQueryClient();

  const executions = useQuery({
    queryKey: ["project-executions", project.id],
    queryFn: async () => {
      const res = await supabase
        .from("executions")
        .select("*")
        .eq("project_id", project.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (res.error) throw res.error;
      return res.data;
    },
  });

  const run = useMutation({
    mutationFn: () => executionEngine.run({ project, format: "pdf" }),
    onSuccess: () => {
      toast.success("Execução concluída");
      queryClient.invalidateQueries({ queryKey: ["project-executions", project.id] });
      queryClient.invalidateQueries({ queryKey: ["project-documents", project.id] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Falha na execução"),
  });

  if (executions.isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    );
  }

  const list = executions.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Execute o fluxo para gerar o documento com os dados reais.
        </p>
        <Button onClick={() => run.mutate()} disabled={run.isPending}>
          {run.isPending ? (
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Play className="mr-2 h-4 w-4" />
          )}
          {run.isPending ? "Executando..." : "Executar"}
        </Button>
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={SquarePlay}
          title="Nenhuma execução"
          description="Clique em Executar para processar o fluxo do projeto."
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Histórico</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {list.map((execution) => (
              <div
                key={execution.id}
                className="flex items-center justify-between rounded-md border p-3 text-sm"
              >
                <div>
                  <div className="font-medium capitalize">{execution.status}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(execution.created_at).toLocaleString("pt-BR")}
                  </div>
                  {execution.error && (
                    <div className="mt-1 text-xs text-red-600">{execution.error}</div>
                  )}
                </div>
                <Badge className={STATUS_TONE[execution.status] ?? ""}>{execution.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
