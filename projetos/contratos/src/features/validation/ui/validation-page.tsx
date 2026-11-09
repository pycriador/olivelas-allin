import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspaceStore } from "@/stores/workspace";
import { projectService, validationService } from "@/services/document-engine";
import { executionEngine } from "@/services/execution-engine";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ShieldCheck, LoaderCircle } from "lucide-react";
import { PageHeader } from "@/features/dashboard/ui/page-header";
import { toast } from "sonner";

const LEVEL_TONE: Record<string, string> = {
  error: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  warning: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  info: "bg-muted text-muted-foreground",
};

export function ValidationPage() {
  const workspace = useWorkspaceStore((s) => s.workspace);
  const queryClient = useQueryClient();

  const projects = useQuery({
    queryKey: ["projects", workspace?.id],
    queryFn: () => projectService.listByWorkspace(workspace!.id),
    enabled: !!workspace,
  });

  const projectIds = (projects.data ?? []).map((p) => p.id);

  const issues = useQuery({
    queryKey: ["global-validation-issues", workspace?.id],
    queryFn: async () => {
      if (projectIds.length === 0) return [];
      const res = await supabase
        .from("validation_results")
        .select("*")
        .in("project_id", projectIds)
        .order("created_at", { ascending: false })
        .limit(50);
      if (res.error) throw res.error;
      return res.data;
    },
    enabled: !!workspace && projectIds.length > 0,
  });

  const runValidation = useMutation({
    mutationFn: async (projectId: string) => {
      const project = await projectService.getById(projectId);
      if (!project) throw new Error("Projeto não encontrado");
      await validationService.clear(projectId);
      await executionEngine.validateProject(project);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["global-validation-issues", workspace?.id] });
      toast.success("Validação concluída");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Falha na validação"),
  });

  const list = issues.data ?? [];
  const issueCountByProject = new Map<string, number>();
  for (const issue of list) {
    issueCountByProject.set(issue.project_id, (issueCountByProject.get(issue.project_id) ?? 0) + 1);
  }
  const errorCountByProject = new Map<string, number>();
  for (const issue of list) {
    if (issue.level === "error") {
      errorCountByProject.set(
        issue.project_id,
        (errorCountByProject.get(issue.project_id) ?? 0) + 1,
      );
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Validação" description="Valide projetos, variáveis e regras de negócio." />

      {projects.isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : !projects.data || projects.data.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="Nenhum projeto"
          description="Crie um projeto para validar."
        />
      ) : (
        <div className="space-y-2">
          {projects.data.map((project) => (
            <Card key={project.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <Link
                    to="/projects/$projectId"
                    params={{ projectId: project.id }}
                    className="font-medium hover:underline"
                  >
                    {project.name}
                  </Link>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge
                      variant={errorCountByProject.get(project.id) ? "destructive" : "secondary"}
                    >
                      {errorCountByProject.get(project.id) ?? 0} erro(s)
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {issueCountByProject.get(project.id) ?? 0} pendências
                    </span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => runValidation.mutate(project.id)}
                  disabled={runValidation.isPending}
                >
                  {runValidation.isPending ? (
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="mr-2 h-4 w-4" />
                  )}
                  {runValidation.isPending ? "Validando..." : "Validar"}
                </Button>
              </CardContent>
            </Card>
          ))}

          {issues.data && issues.data.length > 0 && (
            <Card>
              <CardContent className="space-y-2 p-4">
                {issues.data.map((issue) => (
                  <div key={issue.id} className="flex items-start gap-3 rounded-md border p-3">
                    <Badge className={LEVEL_TONE[issue.level] ?? ""}>{issue.level}</Badge>
                    <div className="text-sm">
                      <p>{issue.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {issue.scope}
                        {issue.code ? ` · ${issue.code}` : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
