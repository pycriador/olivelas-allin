import { useQuery } from "@tanstack/react-query";
import type { Project } from "@/types";
import { ruleService } from "@/services/document-engine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { GitBranch } from "lucide-react";

const SEVERITY_TONE: Record<string, string> = {
  error: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  warning: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  info: "bg-muted text-muted-foreground",
};

export function RulesModule({ project }: { project: Project }) {
  const { data, isLoading } = useQuery({
    queryKey: ["project-rules", project.id],
    queryFn: () => ruleService.listByProject(project.id),
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon={GitBranch}
        title="Nenhuma regra"
        description="Defina regras de negócio para validar e transformar os dados."
      />
    );
  }

  return (
    <div className="space-y-3">
      {data.map((rule) => (
        <Card key={rule.id}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{rule.name}</CardTitle>
            <div className="flex items-center gap-2">
              <Badge className={SEVERITY_TONE[rule.severity] ?? ""}>
                {rule.severity ?? "warning"}
              </Badge>
              {!rule.is_active && <Badge variant="outline">Inativa</Badge>}
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {rule.description && <p className="text-muted-foreground">{rule.description}</p>}
            {rule.message && <p>{rule.message}</p>}
            <pre className="overflow-x-auto rounded-md bg-muted p-2 text-xs">
              {JSON.stringify(rule.expression, null, 1)}
            </pre>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
