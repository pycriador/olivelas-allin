import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ProjectShell } from "@/features/project/ui/project-shell";
import { projectService } from "@/services/document-engine";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TriangleAlert } from "lucide-react";

export const Route = createFileRoute("/_app/projects/$projectId")({
  component: ProjectDetailComponent,
});

function ProjectDetailComponent() {
  const { projectId } = Route.useParams();

  const {
    data: project,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => projectService.getById(projectId),
    enabled: !!projectId,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <Alert variant="destructive">
        <TriangleAlert className="h-4 w-4" />
        <AlertTitle>Projeto não encontrado</AlertTitle>
        <AlertDescription>
          Não foi possível carregar este projeto. Verifique se ele existe e se você tem acesso.
        </AlertDescription>
      </Alert>
    );
  }

  return <ProjectShell project={project} />;
}
