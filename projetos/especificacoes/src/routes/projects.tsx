import { createFileRoute, Link } from "@tanstack/react-router";
import { Folder, Plus } from "lucide-react";
import { useState } from "react";
import { useProjects } from "@/hooks/data";
import { ListSkeleton } from "@/components/common/skeletons";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { ProjectDialog } from "@/components/dialogs/project-dialog";

export const Route = createFileRoute("/projects")({
  component: ProjectsPage,
});

function ProjectsPage() {
  const { data, isLoading } = useProjects();
  const [open, setOpen] = useState(false);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">All engineering projects across workspaces.</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-1">
          <Plus className="h-4 w-4" /> New project
        </Button>
      </div>

      {isLoading ? (
        <ListSkeleton rows={4} />
      ) : !data || data.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="Create your first project to start organizing specifications."
          action={<Button onClick={() => setOpen(true)}><Plus className="mr-1 h-4 w-4" />New project</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((p) => (
            <Link
              key={p.id}
              to="/projects/$projectId"
              params={{ projectId: p.id }}
              className="group rounded-xl border border-border/70 bg-card p-5 transition-shadow hover:shadow-md"
            >
              <div className="flex items-start gap-3">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-white"
                  style={{ backgroundColor: p.color ?? "var(--color-primary)" }}
                >
                  <Folder className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-foreground group-hover:text-primary">{p.name}</div>
                  <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{p.description}</div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between text-[11px] uppercase text-muted-foreground">
                <span>{p.status}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <ProjectDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
