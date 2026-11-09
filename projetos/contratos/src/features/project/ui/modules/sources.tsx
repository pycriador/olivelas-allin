import { useQuery } from "@tanstack/react-query";
import type { Project } from "@/types";
import { dataSourceService } from "@/services/document-engine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { Database } from "lucide-react";

export function SourcesModule({ project }: { project: Project }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["project-sources", project.id],
    queryFn: () => dataSourceService.listLinked(project.id),
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (error) {
    return <EmptyState title="Erro" description="Falha ao carregar as fontes de dados." />;
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon={Database}
        title="Nenhuma fonte vinculada"
        description="Vincule uma fonte de dados ao projeto para alimentar as variáveis."
      />
    );
  }

  return (
    <div className="space-y-3">
      {data.map((link) => (
        <Card key={link.id}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{link.data_source.name}</CardTitle>
            <div className="flex items-center gap-2">
              {link.data_source.workspace_id ? (
                <Badge variant="secondary">Global</Badge>
              ) : (
                <Badge variant="outline">Do projeto</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {link.data_source.description && (
              <p className="text-muted-foreground">{link.data_source.description}</p>
            )}
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>Alias:</span>
              <span className="font-medium">{link.alias || "—"}</span>
              <span className="ml-2">Tipo:</span>
              <span className="font-medium capitalize">{link.data_source.kind || "—"}</span>
            </div>
            <p className="truncate rounded-md bg-muted p-2 font-mono text-xs">
              {(() => {
                const cfg = link.data_source.config as Record<string, unknown> | null;
                const records = cfg && Array.isArray(cfg["records"]) ? cfg["records"] : [];
                return `${records.length} registro(s)`;
              })()}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
