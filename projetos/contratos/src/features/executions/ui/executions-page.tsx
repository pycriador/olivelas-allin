import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspaceStore } from "@/stores/workspace";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { PlaySquare } from "lucide-react";
import { PageHeader } from "@/features/dashboard/ui/page-header";

const STATUS_TONE: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  running: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  succeeded: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  failed: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  cancelled: "bg-muted text-muted-foreground",
};

export function ExecutionsPage() {
  const workspace = useWorkspaceStore((s) => s.workspace);

  const { data, isLoading } = useQuery({
    queryKey: ["global-executions", workspace?.id],
    queryFn: async () => {
      const res = await supabase
        .from("executions")
        .select(`*, project:projects(id, name)`)
        .eq("workspace_id", workspace!.id)
        .order("created_at", { ascending: false })
        .limit(30);
      if (res.error) throw res.error;
      return res.data;
    },
    enabled: !!workspace,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Execuções"
        description="Acompanhe e controle a execução dos projetos de geração de documentos."
      />

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={PlaySquare}
          title="Nenhuma execução"
          description="Ainda não há execuções neste workspace."
        />
      ) : (
        <div className="space-y-2">
          {data.map((execution) => {
            const project = (execution as { project?: { id: string; name: string } }).project;
            return (
              <Card key={execution.id}>
                <CardContent className="flex items-center justify-between p-4 text-sm">
                  <div>
                    <div className="font-medium capitalize">{execution.status}</div>
                    <div className="text-xs text-muted-foreground">
                      {project ? project.name : "Projeto"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(execution.created_at).toLocaleString("pt-BR")}
                    </div>
                    {execution.error && (
                      <div className="mt-1 text-xs text-red-600">{execution.error}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={STATUS_TONE[execution.status] ?? ""}>
                      {execution.status}
                    </Badge>
                    {project && (
                      <Link
                        to="/projects/$projectId"
                        params={{ projectId: project.id }}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        Abrir
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
