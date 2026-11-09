import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Pencil, Trash2, Rocket, Package } from "lucide-react";
import { useProject, useProjectDetail, useSetDeliveryStatus, useDeleteDelivery, useDeleteSprint } from "@/hooks/data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SpecList } from "@/components/specs/spec-list";
import { ProjectDialog } from "@/components/dialogs/project-dialog";
import { SprintDialog } from "@/components/dialogs/sprint-dialog";
import { DeliveryDialog } from "@/components/dialogs/delivery-dialog";
import { SpecDialog } from "@/components/dialogs/spec-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { ListSkeleton } from "@/components/common/skeletons";
import { DeliveryStatus, type Delivery } from "@/types/domain";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/projects/$projectId")({
  component: ProjectDetailPage,
});

const STATUS_LABELS: Record<DeliveryStatus, string> = {
  todo: "To do",
  doing: "Doing",
  done: "Done",
  blocked: "Blocked",
};

const STATUS_ORDER: DeliveryStatus[] = [
  DeliveryStatus.Todo,
  DeliveryStatus.Doing,
  DeliveryStatus.Blocked,
  DeliveryStatus.Done,
];

function ProjectDetailPage() {
  const { projectId } = Route.useParams();
  const project = useProject(projectId);
  const detail = useProjectDetail(projectId);
  const setStatus = useSetDeliveryStatus();
  const delDelivery = useDeleteDelivery();
  const delSprint = useDeleteSprint();

  const [editOpen, setEditOpen] = useState(false);
  const [sprintOpen, setSprintOpen] = useState(false);
  const [deliveryOpenFor, setDeliveryOpenFor] = useState<string | null>(null);
  const [specOpenFor, setSpecOpenFor] = useState<string | null>(null);

  if (project.isLoading) return <div className="p-6"><ListSkeleton rows={5} /></div>;
  if (!project.data) return <div className="p-6"><EmptyState title="Project not found" /></div>;

  const { sprints = [], deliveries = [], specs = [] } = detail.data ?? {};

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span
            className="mt-1 flex h-10 w-10 items-center justify-center rounded-lg text-white"
            style={{ backgroundColor: project.data.color ?? "var(--color-primary)" }}
          >
            <Package className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{project.data.name}</h1>
            <p className="text-sm text-muted-foreground">{project.data.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="uppercase">{project.data.status}</Badge>
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)} className="gap-1">
            <Pencil className="h-3.5 w-3.5" /> Edit
          </Button>
        </div>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Rocket className="h-4 w-4" /> Sprints & Deliveries
          </h2>
          <Button size="sm" variant="outline" className="gap-1" onClick={() => setSprintOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> New sprint
          </Button>
        </div>

        {sprints.length === 0 ? (
          <EmptyState title="No sprints yet" description="Create a sprint to start planning deliveries." />
        ) : (
          <div className="space-y-4">
            {sprints.map((sp) => {
              const spDeliveries = deliveries.filter((d) => d.sprintId === sp.id);
              return (
                <div key={sp.id} className="rounded-xl border border-border/70 bg-card">
                  <div className="flex items-center justify-between border-b border-border/60 p-3">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{sp.title}</span>
                      <Badge variant="outline" className="text-[10px] uppercase">{sp.status}</Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" onClick={() => setDeliveryOpenFor(sp.id)} className="h-7 gap-1 text-xs">
                        <Plus className="h-3.5 w-3.5" /> Delivery
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => delSprint.mutate(sp.id)} aria-label="Delete sprint">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid gap-3 p-3 md:grid-cols-4">
                    {STATUS_ORDER.map((st) => (
                      <div key={st} className="rounded-lg bg-muted/30 p-2">
                        <div className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                          {STATUS_LABELS[st]} · {spDeliveries.filter((d) => d.status === st).length}
                        </div>
                        <div className="space-y-1.5">
                          {spDeliveries.filter((d) => d.status === st).map((d) => (
                            <DeliveryCard
                              key={d.id}
                              delivery={d}
                              onStatus={(s) => setStatus.mutate({ id: d.id, status: s })}
                              onDelete={() => delDelivery.mutate(d.id)}
                              onNewSpec={() => setSpecOpenFor(d.id)}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Specifications</h2>
        <SpecList specs={specs} isLoading={detail.isLoading} emptyTitle="No specs for this project yet" />
      </section>

      <ProjectDialog open={editOpen} onOpenChange={setEditOpen} project={project.data} />
      <SprintDialog open={sprintOpen} onOpenChange={setSprintOpen} projectId={projectId} />
      <DeliveryDialog
        open={!!deliveryOpenFor}
        onOpenChange={(v) => !v && setDeliveryOpenFor(null)}
        sprintId={deliveryOpenFor ?? ""}
      />
      <SpecDialog
        open={!!specOpenFor}
        onOpenChange={(v) => !v && setSpecOpenFor(null)}
        defaultDeliveryId={specOpenFor ?? undefined}
      />
    </div>
  );
}

function DeliveryCard({
  delivery, onStatus, onDelete, onNewSpec,
}: {
  delivery: Delivery;
  onStatus: (s: DeliveryStatus) => void;
  onDelete: () => void;
  onNewSpec: () => void;
}) {
  return (
    <div className="rounded-md border border-border/60 bg-background p-2 text-xs">
      <div className="mb-1 line-clamp-2 font-medium text-foreground">{delivery.title}</div>
      <div className="flex items-center justify-between">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="text-[10px] uppercase tracking-wide text-muted-foreground hover:text-foreground">
              Move →
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {STATUS_ORDER.map((s) => (
              <DropdownMenuItem key={s} onClick={() => onStatus(s)}>{STATUS_LABELS[s]}</DropdownMenuItem>
            ))}
            <DropdownMenuItem onClick={onNewSpec}>+ New spec</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={onDelete}>Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
