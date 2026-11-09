import { useQuery } from "@tanstack/react-query";
import { Blocks, Cog, Wrench } from "lucide-react";
import { aiToolsService } from "@/services/ai-data";
import { PageHeader } from "@/features/dashboard/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";

export function AIToolsPage() {
  const { data: tools, isLoading } = useQuery({
    queryKey: ["ai", "tools"],
    queryFn: () => aiToolsService.list(),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Tools"
        description="Catálogo de ferramentas que os agentes de IA podem utilizar."
        actions={<Badge variant="secondary">{tools?.length ?? 0} ferramentas</Badge>}
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : tools && tools.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {tools.map((tool) => (
            <Card key={tool.id} className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Wrench className="size-4 text-muted-foreground" />
                  {tool.name}
                </CardTitle>
                <Badge variant="outline" className="capitalize">
                  {tool.engine === "native" ? "Nativa" : "LLM"}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {tool.description ?? "Sem descrição"}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">
                    <Cog className="mr-1 size-3.5" />
                    {tool.key}
                  </Badge>
                  {tool.is_system && (
                    <Badge variant="secondary">
                      <Blocks className="mr-1 size-3.5" />
                      Sistema
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Wrench}
          title="Não hay ferramentas no catálogo"
          description="El catálogo de herramientas se alimenta via seed en las migrations."
        />
      )}
    </div>
  );
}
