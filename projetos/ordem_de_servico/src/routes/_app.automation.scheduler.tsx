import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Edit3, Calendar, CheckCircle2, XCircle } from "lucide-react";
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
import { scheduleService } from "@/modules/automation/service";
import type { ScheduleDefinition } from "@/modules/automation/types";

const scheduleSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  scheduleType: z.enum(["manual", "daily", "weekly", "monthly", "cron", "event"]),
  time: z.string().optional(),
  triggerType: z.enum(["workflow", "job", "script", "report"]),
  triggerName: z.string().min(1, "Nome do gatilho é obrigatório"),
});

type ScheduleForm = z.infer<typeof scheduleSchema>;

export const Route = createFileRoute("/_app/automation/scheduler")({
  head: () => ({ meta: [{ title: "Agendamentos — ServiceForge" }] }),
  component: AutomationSchedulerPage,
});

function AutomationSchedulerPage() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: schedules = [] } = useQuery({ queryKey: ["automation", "schedules"], queryFn: () => scheduleService.list() });

  const form = useForm<ScheduleForm>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: { scheduleType: "daily", triggerType: "workflow" },
  });

  const createMut = useMutation({
    mutationFn: (data: ScheduleForm) => {
      const now = new Date().toISOString();
      return scheduleService.create({
        name: data.name, description: data.description ?? "", scheduleType: data.scheduleType,
        time: data.time, triggerType: data.triggerType, triggerId: "",
        triggerName: data.triggerName, enabled: true, tags: [],
        createdBy: "system", createdAt: now, updatedAt: now,
      });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["automation", "schedules"] }); setDialogOpen(false); form.reset(); toast.success("Agendamento criado"); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ScheduleForm }) => {
      return scheduleService.update(id, { ...data, updatedAt: new Date().toISOString() });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["automation", "schedules"] }); setDialogOpen(false); setEditingId(null); form.reset(); toast.success("Agendamento atualizado"); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => scheduleService.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["automation", "schedules"] }); toast.success("Agendamento excluído"); },
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => scheduleService.update(id, { enabled }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["automation", "schedules"] }); toast.success("Status atualizado"); },
  });

  const openEdit = (id: string) => {
    const item = schedules.find((s) => s.id === id);
    if (!item) return;
    setEditingId(id);
    form.reset({ name: item.name, description: item.description, scheduleType: item.scheduleType, time: item.time ?? "", triggerType: item.triggerType, triggerName: item.triggerName });
    setDialogOpen(true);
  };

  const openNew = () => {
    setEditingId(null);
    form.reset({ name: "", description: "", scheduleType: "daily", time: "", triggerType: "workflow", triggerName: "" });
    setDialogOpen(true);
  };

  const scheduleTypeBadge = (type: string) => {
    const colors: Record<string, string> = { daily: "bg-blue-500", weekly: "bg-purple-500", monthly: "bg-orange-500", cron: "bg-red-500", manual: "bg-gray-500", event: "bg-green-500" };
    return <Badge className={`${colors[type] ?? "bg-gray-500"} text-white`}>{type}</Badge>;
  };

  const columns: Column<ScheduleDefinition>[] = [
    { key: "name", header: "Nome", sortable: true, sortFn: (a, b) => a.name.localeCompare(b.name), render: (s) => (
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{s.name}</span>
      </div>
    )},
    { key: "scheduleType", header: "Tipo", render: (s) => scheduleTypeBadge(s.scheduleType) },
    { key: "time", header: "Horário", render: (s) => <span className="text-sm">{s.time || "—"}</span> },
    { key: "triggerType", header: "Tipo Gatilho", render: (s) => <Badge variant="secondary">{s.triggerType}</Badge> },
    { key: "triggerName", header: "Gatilho", render: (s) => <span className="text-sm">{s.triggerName}</span> },
    { key: "enabled", header: "Ativo", render: (s) => (
      <Badge variant={s.enabled ? "default" : "secondary"} className="gap-1 cursor-pointer" onClick={() => toggleMut.mutate({ id: s.id, enabled: !s.enabled })}>
        {s.enabled ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
        {s.enabled ? "Sim" : "Não"}
      </Badge>
    )},
    { key: "lastRunAt", header: "Última Execução", render: (s) => <span className="text-sm">{s.lastRunAt ? new Date(s.lastRunAt).toLocaleDateString() : "—"}</span> },
    { key: "nextRunAt", header: "Próxima Execução", render: (s) => <span className="text-sm">{s.nextRunAt ? new Date(s.nextRunAt).toLocaleDateString() : "—"}</span> },
    { key: "actions", header: "Ações", render: (s) => (
      <div className="flex gap-1">
        <Button size="sm" variant="ghost" onClick={() => openEdit(s.id)}><Edit3 className="h-4 w-4" /></Button>
        <Button size="sm" variant="ghost" onClick={() => setDeleteId(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Agendamentos</h1>
          <p className="text-sm text-muted-foreground">Gerencie os agendamentos da plataforma</p>
        </div>
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />Novo Agendamento</Button>
      </div>

      <DataTable
        data={schedules}
        columns={columns}
        keyExtractor={(s) => s.id}
        searchKeys={["name", "triggerName"]}
        initialSortColumn="name"
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingId ? "Editar Agendamento" : "Novo Agendamento"}</DialogTitle></DialogHeader>
          <form onSubmit={form.handleSubmit((v) => editingId ? updateMut.mutate({ id: editingId, data: v }) : createMut.mutate(v))} className="space-y-4">
            <div className="space-y-2"><Label>Nome</Label><Input {...form.register("name")} /></div>
            <div className="space-y-2"><Label>Descrição</Label><Textarea {...form.register("description")} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Tipo de Agendamento</Label>
                <Select value={form.watch("scheduleType")} onValueChange={(v) => form.setValue("scheduleType", v as "daily" | "weekly" | "monthly" | "cron" | "manual" | "event")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Diário</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="monthly">Mensal</SelectItem>
                    <SelectItem value="cron">Cron</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="event">Evento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Horário</Label><Input type="time" {...form.register("time")} /></div>
              <div className="space-y-2"><Label>Tipo de Gatilho</Label>
                <Select value={form.watch("triggerType")} onValueChange={(v) => form.setValue("triggerType", v as "workflow" | "job" | "script" | "report")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="workflow">Workflow</SelectItem>
                    <SelectItem value="job">Job</SelectItem>
                    <SelectItem value="script">Script</SelectItem>
                    <SelectItem value="report">Relatório</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Nome do Gatilho</Label><Input {...form.register("triggerName")} /></div>
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
