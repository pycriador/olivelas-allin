import type { Project } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SpecificationModule({ project }: { project: Project }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Especificação do projeto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid gap-px overflow-hidden rounded-md border bg-muted text-sm sm:grid-cols-2">
            <div className="bg-background p-3 text-muted-foreground">Nome</div>
            <div className="bg-background p-3 font-medium">{project.name}</div>
            <div className="bg-background p-3 text-muted-foreground">Slug</div>
            <div className="bg-background p-3 font-medium">{project.slug}</div>
            <div className="bg-background p-3 text-muted-foreground">Status</div>
            <div className="bg-background p-3 font-medium capitalize">{project.status}</div>
            <div className="bg-background p-3 text-muted-foreground">Workspace</div>
            <div className="bg-background p-3 font-medium">{project.workspace_id}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Descrição</div>
            <p className="mt-1">{project.description || "Nenhuma descrição informada."}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
