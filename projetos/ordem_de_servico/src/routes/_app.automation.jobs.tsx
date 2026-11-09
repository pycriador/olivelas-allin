import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Edit3, Terminal, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable, type Column } from "@/components/data-table";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { jobService } from "@/modules/automation/service";
import type { JobDefinition } from "@/modules/automation/types";

const jobSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  type: z.enum(["script", "workflow", "integration", "report", "maintenance", "backup", "cleanup", "sync", "custom"]),
  maxRetries: z.coerce.number().min(0).default(0),
  retryDelayMs: z.coerce.number().min(0).default(0),
  timeoutMs: z.coerce.number().min(0).default(30000),
  priority: z.enum(["low", "medium", "high", "critical"]),
});

type JobForm = z.infer<typeof jobSchema>;

const JOB_TYPES = ["script", "workflow", "integration", "report", "maintenance", "backup", "cleanup", "sync", "custom"];

export const Route = createFileRoute("/_app/automation/jobs")({
  head: () => ({ meta: [{ title: "Jobs — ServiceForge" }] }),
  component: AutomationJobsPage,
});

function AutomationJobsPage() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>("");

  const { data: jobs = [] } = useQuery({ queryKey: ["automation", "jobs"], queryFn: () => jobService.list() });

  const filtered = filterType ? jobs.filter((j) => j.type === filterType) : jobs;

  const form = useForm<z.input<typeof jobSchema>, any, z.output<typeof jobSchema>>({
    resolver: zodResolver(jobSchema),
    defaultValues: { type: "script", maxRetries: 0, retryDelayMs: 0, timeoutMs: 30000, priority: "medium" },
  });

  const createMut = useMutation({
    mutationFn: (data: JobForm) => {
      const now = new Date().toISOString();
      return jobService.create({
        name: data.name, description: data.description ?? "", type: data.type,
        config: {}, maxRetries: data.maxRetries, retryDelayMs: data.retryDelayMs,
        timeoutMs: data.timeoutMs, priority: data.priority, enabled: true,
        tags: [], isGlobal: false, createdBy: "system", createdAt: now, updatedAt: now,
      });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["automation", "jobs"] }); setDialogOpen(false); form.reset(); toast.success("Job criado"); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: JobForm }) => {
      return jobService.update(id, { ...data, updatedAt: new Date().toISOString() });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["automation", "jobs"] }); setDialogOpen(false); setEditingId(null); form.reset(); toast.success("Job atualizado"); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => jobService.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["automation", "jobs"] }); toast.success("Job excluído"); },
  });

  const openEdit = (id: string) => {
    const item = jobs.find((j) => j.id === id);
    if (!item) return;
    setEditingId(id);
    form.reset({ name: item.name, description: item.description, type: item.type, maxRetries: item.maxRetries, retryDelayMs: item.retryDelayMs, timeoutMs: item.timeoutMs, priority: item.priority });
    setDialogOpen(true);
  };

  const openNew = () => {
    setEditingId(null);
    form.reset({ name: "", description: "", type: "script", maxRetries: 0, retryDelayMs: 0, timeoutMs: 30000, priority: "medium" });
    setDialogOpen(true);
  };

  const priorityBadge = (p: string) => {
    const colors: Record<string, string> = { low: "bg-gray-500", medium: "bg-blue-500", high: "bg-orange-500", critical: "bg-red-500" };
    return <Badge className={`${colors[p] ?? "bg-gray-500"} text-white`}>{p}</Badge>;
  };

  const columns: Column<JobDefinition>[] = [
    { key: "name", header: "Nome", sortable: true, sortFn: (a, b) => a.name.localeCompare(b.name), render: (j) => (
      <div className="flex items-center gap-2">
        <Terminal className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{j.name}</span>
      </div>
    )},
    { key: "type", header: "Tipo", render: (j) => <Badge variant="secondary">{j.type}</Badge> },
    { key: "priority", header: "Prioridade", render: (j) => priorityBadge(j.priority) },
    { key: "maxRetries", header: "Max Tentativas", render: (j) => <span className="text-sm">{j.maxRetries}</span> },
    { key: "timeoutMs", header: "Timeout (ms)", render: (j) => <span className="text-sm">{j.timeoutMs}</span> },
    { key: "enabled", header: "Ativo", render: (j) => (
      <Badge variant={j.enabled ? "default" : "secondary"} className="gap-1">
        {j.enabled ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
        {j.enabled ? "Sim" : "Não"}
      </Badge>
    )},
    { key: "actions", header: "Ações", render: (j) => (
      <div className="flex gap-1">
        <Button size="sm" variant="ghost" onClick={() => openEdit(j.id)}><Edit3 className="h-4 w-4" /></Button>
        <Button size="sm" variant="ghost" onClick={() => setDeleteId(j.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Jobs</h1>
          <p className="text-sm text-muted-foreground">Gerencie os jobs da plataforma</p>
        </div>
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />Novo Job</Button>
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        keyExtractor={(j) => j.id}
        searchKeys={["name", "type"]}
        initialSortColumn="name"
        toolbar={
          <Select value={filterType} onValueChange={(v) => setFilterType(v === "all" ? "" : v)}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Filtrar por tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {JOB_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        }
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingId ? "Editar Job" : "Novo Job"}</DialogTitle></DialogHeader>
          <form onSubmit={form.handleSubmit((v) => editingId ? updateMut.mutate({ id: editingId, data: v }) : createMut.mutate(v))} className="space-y-4">
            <div className="space-y-2"><Label>Nome</Label><Input {...form.register("name")} /></div>
            <div className="space-y-2"><Label>Descrição</Label><Textarea {...form.register("description")} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Tipo</Label>
                <Select value={form.watch("type")} onValueChange={(v) => form.setValue("type", v as JobForm["type"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {JOB_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Prioridade</Label>
                <Select value={form.watch("priority")} onValueChange={(v) => form.setValue("priority", v as "low" | "medium" | "high" | "critical")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="critical">Crítica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Max Tentativas</Label><Input type="number" {...form.register("maxRetries")} /></div>
              <div className="space-y-2"><Label>Delay Tentativas (ms)</Label><Input type="number" {...form.register("retryDelayMs")} /></div>
              <div className="space-y-2"><Label>Timeout (ms)</Label><Input type="number" {...form.register("timeoutMs")} /></div>
            </div>
            <DialogFooter>
              <Button variant="ghost" type="button" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => { if (!o) setDeleteId(null); }}
        onConfirm={() => { if (deleteId) { deleteMut.mutate(deleteId); setDeleteId(null); } }}
      />
    </div>
  );
}
