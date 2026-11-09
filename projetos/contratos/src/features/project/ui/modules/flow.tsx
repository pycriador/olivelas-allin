import { useQuery } from "@tanstack/react-query";
import type { Project } from "@/types";
import { flowService } from "@/services/document-engine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { Workflow } from "lucide-react";

const KIND_LABEL: Record<string, string> = {
  start: "Início",
  load_data: "Carregar dados",
  validate: "Validar",
  transform: "Transformar",
  rules: "Regras",
  build_document: "Montar documento",
  human_review: "Revisão humana",
  approval: "Aprovação",
  generate: "Gerar",
  export: "Exportar",
  end: "Fim",
};

export function FlowModule({ project }: { project: Project }) {
  const { data: flow, isLoading } = useQuery({
    queryKey: ["project-flow", project.id],
    queryFn: () => flowService.getByProject(project.id),
  });

  const nodesQuery = useQuery({
    queryKey: ["project-flow-nodes", flow?.id],
    queryFn: () => flowService.listNodes(flow!.id),
    enabled: !!flow,
  });
  const connectionsQuery = useQuery({
    queryKey: ["project-flow-connections", flow?.id],
    queryFn: () => flowService.listConnections(flow!.id),
    enabled: !!flow,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!flow) {
    return (
      <EmptyState
        icon={Workflow}
        title="Nenhum fluxo configurado"
        description="Monte o fluxo de execução com os nós disponíveis."
      />
    );
  }

  const nodes = nodesQuery.data ?? [];
  const connections = connectionsQuery.data ?? [];
  const byId = new Map(nodes.map((n) => [n.id, n]));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{flow.name}</CardTitle>
          <Badge variant={flow.is_active ? "secondary" : "outline"}>
            {flow.is_active ? "Ativo" : "Inativo"}
          </Badge>
        </CardHeader>
        <CardContent className="text-sm">
          <p className="text-muted-foreground">{flow.description || "Sem descrição."}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Nós ({nodes.length}) · Conexões ({connections.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {nodes.map((node) => {
              const outgoing = connections.filter((c) => c.from_node_id === node.id);
              const targets = outgoing
                .map((c) => byId.get(c.to_node_id)?.title ?? c.to_node_id)
                .filter(Boolean);
              return (
                <div key={node.id} className="rounded-md border p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {node.title ?? KIND_LABEL[node.kind] ?? node.kind}
                    </span>
                    <Badge variant="outline">{KIND_LABEL[node.kind] ?? node.kind}</Badge>
                  </div>
                  {targets.length > 0 && (
                    <p className="mt-2 text-xs text-muted-foreground">→ {targets.join(", ")}</p>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
