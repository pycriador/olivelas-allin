import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Edit3, Clock, CheckCircle2, XCircle } from "lucide-react";
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
import { timerService } from "@/modules/automation/service";
import type { TimerDefinition } from "@/modules/automation/types";

const timerSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  type: z.enum(["once", "recurring", "delayed"]),
  delayMs: z.coerce.number().min(0).default(0),
  intervalMs: z.coerce.number().optional(),
  maxExecutions: z.coerce.number().optional(),
});

type TimerForm = z.infer<typeof timerSchema>;

export const Route = createFileRoute("/_app/automation/timers")({
  head: () => ({ meta: [{ title: "Timers — ServiceForge" }] }),
  component: AutomationTimersPage,
});

function AutomationTimersPage() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>("");

  const { data: timers = [] } = useQuery({ queryKey: ["automation", "timers"], queryFn: () => timerService.list() });

  const filtered = filterType ? timers.filter((t) => t.type === filterType) : timers;

  const form = useForm<z.input<typeof timerSchema>, any, z.output<typeof timerSchema>>({
    resolver: zodResolver(timerSchema),
    defaultValues: { type: "once", delayMs: 0 },
  });

  const createMut = useMutation({
    mutationFn: (data: TimerForm) => {
      const now = new Date().toISOString();
      return timerService.create({
        name: data.name, description: data.description ?? "", type: data.type,
        delayMs: data.delayMs, intervalMs: data.intervalMs, maxExecutions: data.maxExecutions,
        startAt: now, enabled: true, executionCount: 0,
        triggerType: "script", triggerId: "", triggerName: "",
        tags: [], createdBy: "system", createdAt: now, updatedAt: now,
      });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["automation", "timers"] }); setDialogOpen(false); form.reset(); toast.success("Timer criado"); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: TimerForm }) => {
      return timerService.update(id, { ...data, updatedAt: new Date().toISOString() });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["automation", "timers"] }); setDialogOpen(false); setEditingId(null); form.reset(); toast.success("Timer atualizado"); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => timerService.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["automation", "timers"] }); toast.success("Timer excluído"); },
  });

  const openEdit = (id: string) => {
    const item = timers.find((t) => t.id === id);
    if (!item) return;
    setEditingId(id);
    form.reset({ name: item.name, description: item.description, type: item.type, delayMs: item.delayMs, intervalMs: item.intervalMs, maxExecutions: item.maxExecutions });
    setDialogOpen(true);
  };

  const openNew = () => {
    setEditingId(null);
    form.reset({ name: "", description: "", type: "once", delayMs: 0, intervalMs: undefined, maxExecutions: undefined });
    setDialogOpen(true);
  };

  const timerTypeBadge = (type: string) => {
    const colors: Record<string, string> = { once: "bg-blue-500", recurring: "bg-purple-500", delayed: "bg-orange-500" };
    return <Badge className={`${colors[type] ?? "bg-gray-500"} text-white`}>{type}</Badge>;
  };

  const columns: Column<TimerDefinition>[] = [
    { key: "name", header: "Nome", sortable: true, sortFn: (a, b) => a.name.localeCompare(b.name), render: (t) => (
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{t.name}</span>
      </div>
    )},
    { key: "type", header: "Tipo", render: (t) => timerTypeBadge(t.type) },
    { key: "delayMs", header: "Delay (ms)", render: (t) => <span className="text-sm">{t.delayMs}</span> },
    { key: "intervalMs", header: "Intervalo (ms)", render: (t) => <span className="text-sm">{t.intervalMs ?? "—"}</span> },
    { key: "maxExecutions", header: "Max Execuções", render: (t) => <span className="text-sm">{t.maxExecutions ?? "—"}</span> },
    { key: "executionCount", header: "Execuções", render: (t) => <span className="text-sm">{t.executionCount}</span> },
    { key: "enabled", header: "Ativo", render: (t) => (
      <Badge variant={t.enabled ? "default" : "secondary"} className="gap-1">
        {t.enabled ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
        {t.enabled ? "Sim" : "Não"}
      </Badge>
    )},
    { key: "actions", header: "Ações", render: (t) => (
      <div className="flex gap-1">
        <Button size="sm" variant="ghost" onClick={() => openEdit(t.id)}><Edit3 className="h-4 w-4" /></Button>
        <Button size="sm" variant="ghost" onClick={() => setDeleteId(t.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Timers</h1>
          <p className="text-sm text-muted-foreground">Gerencie os timers da plataforma</p>
        </div>
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />Novo Timer</Button>
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        keyExtractor={(t) => t.id}
        searchKeys={["name", "type"]}
        initialSortColumn="name"
        toolbar={
          <Select value={filterType} onValueChange={(v) => setFilterType(v === "all" ? "" : v)}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Filtrar por tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="once">Once</SelectItem>
              <SelectItem value="recurring">Recurring</SelectItem>
              <SelectItem value="delayed">Delayed</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingId ? "Editar Timer" : "Novo Timer"}</DialogTitle></DialogHeader>
          <form onSubmit={form.handleSubmit((v) => editingId ? updateMut.mutate({ id: editingId, data: v }) : createMut.mutate(v))} className="space-y-4">
            <div className="space-y-2"><Label>Nome</Label><Input {...form.register("name")} /></div>
            <div className="space-y-2"><Label>Descrição</Label><Textarea {...form.register("description")} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Tipo</Label>
                <Select value={form.watch("type")} onValueChange={(v) => form.setValue("type", v as "once" | "recurring" | "delayed")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once">Once</SelectItem>
                    <SelectItem value="recurring">Recurring</SelectItem>
                    <SelectItem value="delayed">Delayed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Delay (ms)</Label><Input type="number" {...form.register("delayMs")} /></div>
              <div className="space-y-2"><Label>Intervalo (ms)</Label><Input type="number" {...form.register("intervalMs")} /></div>
              <div className="space-y-2"><Label>Max Execuções</Label><Input type="number" {...form.register("maxExecutions")} /></div>
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
