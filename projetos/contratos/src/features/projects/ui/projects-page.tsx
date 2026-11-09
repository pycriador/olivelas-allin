import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { FolderKanban, ChevronRight } from "lucide-react";
import type { Project } from "@/types";
import { projectService } from "@/services/document-engine";
import { useWorkspaceStore } from "@/stores/workspace";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/features/dashboard/ui/page-header";

const STATUS_LABEL: Record<string, string> = {
  draft: "Rascunho",
  active: "Ativo",
  archived: "Arquivado",
};

export function ProjectsPage() {
  const workspace = useWorkspaceStore((s) => s.workspace);

  const { data, isLoading } = useQuery({
    queryKey: ["projects", workspace?.id],
    queryFn: () => projectService.listByWorkspace(workspace!.id),
    enabled: !!workspace,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projetos"
        description="Cada projeto é uma aplicação completa de geração de documentos."
        actions={
          <Button disabled>
            <FolderKanban className="mr-2 h-4 w-4" />
            Novo projeto
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-36 w-full" />
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="Nenhum projeto"
          description="Crie um projeto para começar a automatizar a geração de documentos."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((project: Project) => (
            <Card key={project.id} className="transition-colors hover:bg-muted/50">
              <CardContent className="p-5">
                <Link
                  to="/projects/$projectId"
                  params={{ projectId: project.id }}
                  className="block"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FolderKanban className="h-5 w-5 text-muted-foreground" />
                      <span className="font-semibold">{project.name}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Badge variant="secondary">
                      {STATUS_LABEL[project.status] ?? project.status}
                    </Badge>
                    {project.description && (
                      <span className="line-clamp-1 text-sm text-muted-foreground">
                        {project.description}
                      </span>
                    )}
                  </div>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
