import { useQuery } from "@tanstack/react-query";
import type { Project } from "@/types";
import { builderService } from "@/services/document-engine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { Gauge } from "lucide-react";

const KIND_LABEL: Record<string, string> = {
  section: "Seção",
  clause: "Cláusula",
  text: "Texto",
  variable: "Variável",
  conditional: "Condicional",
};

export function BuilderModule({ project }: { project: Project }) {
  const { data: builder, isLoading } = useQuery({
    queryKey: ["project-builder", project.id],
    queryFn: () => builderService.getByProject(project.id),
  });
  const blocks = useQuery({
    queryKey: ["project-builder-blocks", builder?.id],
    queryFn: () => builderService.listBlocks(builder!.id),
    enabled: !!builder,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (!builder) {
    return (
      <EmptyState
        icon={Gauge}
        title="Nenhum modelo"
        description="Monte o documento no Builder Visual arrastando blocos e cláusulas."
      />
    );
  }

  const list = blocks.data ?? [];

  return (
    <div className="space-y-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">{builder.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {list.length === 0 && (
            <p className="text-sm text-muted-foreground">
              O modelo está vazio. Adicione blocos para estruturar o documento.
            </p>
          )}
          {list.map((block) => (
            <div key={block.id} className="rounded-md border p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{block.title ?? block.kind}</span>
                <Badge variant="outline">{KIND_LABEL[block.kind] ?? block.kind}</Badge>
              </div>
              {block.content && (
                <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                  {block.content}
                </p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
