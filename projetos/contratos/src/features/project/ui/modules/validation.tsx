import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Project } from "@/types";
import { validationService } from "@/services/document-engine";
import { executionEngine } from "@/services/execution-engine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ShieldCheck, CircleCheck, LoaderCircle, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

const LEVEL_TONE: Record<string, string> = {
  error: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  warning: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  info: "bg-muted text-muted-foreground",
};

export function ValidationModule({ project }: { project: Project }) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["project-validations", project.id],
    queryFn: () => validationService.listByProject(project.id),
  });

  const runValidation = useMutation({
    mutationFn: async () => {
      await validationService.clear(project.id);
      return executionEngine.validateProject(project);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-validations", project.id] });
      toast.success("Validação concluída");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Falha na validação"),
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    );
  }

  const issues = data ?? [];
  const errors = issues.filter((i) => i.level === "error").length;
  const warnings = issues.filter((i) => i.level === "warning").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button onClick={() => runValidation.mutate()} disabled={runValidation.isPending}>
          {runValidation.isPending ? (
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <TriangleAlert className="mr-2 h-4 w-4" />
          )}
          {runValidation.isPending ? "Validando..." : "Rodar validação"}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-semibold">{issues.length}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-semibold text-red-600">{errors}</div>
            <div className="text-sm text-muted-foreground">Erros</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-semibold text-amber-600">{warnings}</div>
            <div className="text-sm text-muted-foreground">Avisos</div>
          </CardContent>
        </Card>
      </div>

      {issues.length === 0 ? (
        <EmptyState
          icon={CircleCheck}
          title="Nenhuma pendência"
          description="Rode a validação para confirmar que o projeto está pronto."
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Resultados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {issues.map((issue) => (
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
  );
}
