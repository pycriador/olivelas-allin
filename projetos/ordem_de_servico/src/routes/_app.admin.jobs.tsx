import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Trash2, CheckCircle2, XCircle, Clock, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable, type Column } from "@/components/data-table";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { jobService } from "@/modules/admin/service";
import { DocButton } from "@/components/doc-button";
import type { Job } from "@/modules/admin/types";

const statusLabels: Record<string, string> = { running: "Executando", completed: "Concluído", failed: "Falhou", pending: "Pendente", scheduled: "Agendado" };
const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = { running: "default", completed: "secondary", failed: "destructive", pending: "outline", scheduled: "secondary" };

export const Route = createFileRoute("/_app/admin/jobs")({
  head: () => ({ meta: [{ title: "Admin Jobs — ServiceForge" }] }),
  component: AdminJobsPage,
});

function AdminJobsPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: jobs = [] } = useQuery({
    queryKey: ["admin", "jobs", "list"],
    queryFn: () => jobService.list(),
    refetchInterval: 5000,
  });

  const filtered = statusFilter === "all" ? jobs : jobs.filter((j) => j.status === statusFilter);

  const deleteMut = useMutation({
    mutationFn: (id: string) => jobService.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "jobs"] }); toast.success("Job excluído"); },
  });

  const formatProgress = (p: number) => `${Math.round(p * 100)}%`;

  const columns: Column<Job>[] = [
    { key: "name", header: "Nome", sortable: true, sortFn: (a, b) => a.name.localeCompare(b.name), render: (j) => <span className="font-medium">{j.name}</span> },
    { key: "type", header: "Tipo", render: (j) => <span className="text-sm text-muted-foreground">{j.type}</span> },
    { key: "status", header: "Status", render: (j) => (
      <Badge variant={statusVariants[j.status]} className="gap-1">
        {j.status === "running" ? <Loader2 className="h-3 w-3 animate-spin" /> : j.status === "completed" ? <CheckCircle2 className="h-3 w-3" /> : j.status === "failed" ? <XCircle className="h-3 w-3" /> : j.status === "pending" ? <Clock className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
        {statusLabels[j.status]}
      </Badge>
    )},
    { key: "progress", header: "Progresso", render: (j) => (
      <div className="flex items-center gap-2 min-w-[120px]">
        <Progress value={j.progress * 100} className="h-2" />
        <span className="text-xs text-muted-foreground w-10 text-right">{formatProgress(j.progress)}</span>
      </div>
    )},
    { key: "startedAt", header: "Iniciado Em", render: (j) => <span className="text-sm">{new Date(j.startedAt).toLocaleString()}</span> },
    { key: "completedAt", header: "Concluído Em", render: (j) => <span className="text-sm">{j.completedAt ? new Date(j.completedAt).toLocaleString() : "—"}</span> },
    { key: "error", header: "Erro", render: (j) => j.error ? (
      <span className="text-sm text-destructive flex items-center gap-1 max-w-[200px] truncate"><AlertTriangle className="h-3 w-3 shrink-0" />{j.error}</span>
    ) : <span className="text-sm text-muted-foreground">—</span> },
    { key: "actions", header: "Ações", render: (j) => (
      <div className="flex gap-1">
        <Button size="sm" variant="ghost" onClick={() => setDeleteId(j.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Jobs</h1>
            <DocButton module="admin" page="jobs" title="Jobs" />
          </div>
          <p className="text-sm text-muted-foreground">Acompanhe a execução de jobs do sistema</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status:</span>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {Object.entries(statusLabels).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        keyExtractor={(j) => j.id}
        searchKeys={["name", "type", "error"]}
        initialSortColumn="startedAt"
        searchPlaceholder="Pesquisar jobs..."
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => { if (!o) setDeleteId(null); }}
        onConfirm={() => { if (deleteId) { deleteMut.mutate(deleteId); setDeleteId(null); } }}
      />
    </div>
  );
}
