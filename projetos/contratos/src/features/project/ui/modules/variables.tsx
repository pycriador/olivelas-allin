import { useQuery } from "@tanstack/react-query";
import type { Project } from "@/types";
import { variableService } from "@/services/document-engine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { Braces } from "lucide-react";

const TYPE_LABEL: Record<string, string> = {
  text: "Texto",
  number: "Número",
  currency: "Moeda",
  email: "E-mail",
  date: "Data",
  boolean: "Booleano",
};

export function VariablesModule({ project }: { project: Project }) {
  const variables = useQuery({
    queryKey: ["project-variables", project.id],
    queryFn: () => variableService.listByProject(project.id),
  });
  const mappings = useQuery({
    queryKey: ["project-variable-mappings", project.id],
    queryFn: () => variableService.listMappings(project.id),
  });

  if (variables.isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (!variables.data || variables.data.length === 0) {
    return (
      <EmptyState
        icon={Braces}
        title="Nenhuma variável"
        description="Defina variáveis para preencher os campos do documento."
      />
    );
  }

  const mappingByVariable = new Map((mappings.data ?? []).map((m) => [m.variable_id, m]));

  return (
    <div className="space-y-3">
      {variables.data.map((variable) => {
        const mapping = mappingByVariable.get(variable.id);
        return (
          <Card key={variable.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-mono text-sm">
                {`.{{`}${variable.key}
                {`}}`}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {TYPE_LABEL[variable.data_type] ?? variable.data_type}
                </Badge>
                {variable.is_required && <Badge>Obrigatória</Badge>}
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {variable.label && <p className="text-muted-foreground">{variable.label}</p>}
              <div className="flex items-center gap-2 text-muted-foreground">
                <span>Mapeada de:</span>
                <span className="font-medium">{mapping?.source_id ? "fonte vinculada" : "—"}</span>
                <span className="ml-2">Campo:</span>
                <span className="font-mono text-xs">
                  {mapping?.field_path ? `.${mapping.field_path}` : "—"}
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
