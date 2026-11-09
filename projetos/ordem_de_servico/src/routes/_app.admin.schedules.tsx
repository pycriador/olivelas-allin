import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Edit3, Calendar } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable, type Column } from "@/components/data-table";
import { DocButton } from "@/components/doc-button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { scheduleService } from "@/modules/admin/service";
import type { Schedule } from "@/modules/admin/types";

const scheduleSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  jobType: z.string().min(1, "Tipo de job é obrigatório"),
  cron: z.string().min(1, "Expressão cron é obrigatória").regex(/^(\S+\s+){4}\S+$/, "Expressão cron inválida (5 campos)"),
  enabled: z.boolean(),
  config: z.string().optional(),
});

type ScheduleForm = z.infer<typeof scheduleSchema>;

export const Route = createFileRoute("/_app/admin/schedules")({
  head: () => ({ meta: [{ title: "Admin Agendamentos — ServiceForge" }] }),
  component: AdminSchedulesPage,
});

function AdminSchedulesPage() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: schedules = [] } = useQuery({ queryKey: ["admin", "schedules", "list"], queryFn: () => scheduleService.list() });

  const form = useForm<ScheduleForm>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: { enabled: true },
  });

  const createMut = useMutation({
    mutationFn: (data: ScheduleForm) => {
      let config: Record<string, string> = {};
      try { config = data.config ? JSON.parse(data.config) : {}; } catch { config = {}; }
      return scheduleService.create({
        name: data.name, jobType: data.jobType, cron: data.cron, enabled: data.enabled, config,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "schedules"] }); setDialogOpen(false); form.reset(); toast.success("Agendamento criado"); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ScheduleForm }) => {
      let config: Record<string, string> = {};
      try { config = data.config ? JSON.parse(data.config) : {}; } catch { config = {}; }
      return scheduleService.update(id, { ...data, config, updatedAt: new Date().toISOString() });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "schedules"] }); setDialogOpen(false); setEditingId(null); form.reset(); toast.success("Agendamento atualizado"); },
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => scheduleService.update(id, { enabled, updatedAt: new Date().toISOString() }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "schedules"] }); toast.success("Agendamento atualizado"); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => scheduleService.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "schedules"] }); toast.success("Agendamento excluído"); },
  });

  const openEdit = (id: string) => {
    const s = schedules.find((s) => s.id === id);
    if (!s) return;
    setEditingId(id);
    form.reset({ name: s.name, jobType: s.jobType, cron: s.cron, enabled: s.enabled, config: JSON.stringify(s.config, null, 2) });
    setDialogOpen(true);
  };

  const columns: Column<Schedule>[] = [
    { key: "name", header: "Nome", sortable: true, sortFn: (a, b) => a.name.localeCompare(b.name), render: (s) => (
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{s.name}</span>
      </div>
    )},
    { key: "jobType", header: "Tipo de Job", render: (s) => <Badge variant="outline">{s.jobType}</Badge> },
    { key: "cron", header: "Cron", render: (s) => <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{s.cron}</code> },
    { key: "enabled", header: "Ativo", render: (s) => (
      <Switch
        checked={s.enabled}
        onCheckedChange={(v) => toggleMut.mutate({ id: s.id, enabled: v })}
      />
    )},
    { key: "lastRun", header: "Última Execução", render: (s) => <span className="text-sm">{s.lastRun ? new Date(s.lastRun).toLocaleString() : "—"}</span> },
    { key: "nextRun", header: "Próxima Execução", render: (s) => <span className="text-sm">{s.nextRun ? new Date(s.nextRun).toLocaleString() : "—"}</span> },
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
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Agendamentos</h1>
            <DocButton module="admin" page="schedules" title="Agendamentos" />
          </div>
          <p className="text-sm text-muted-foreground">Gerencie os jobs agendados da plataforma</p>
        </div>
        <Button onClick={() => { setEditingId(null); form.reset({ enabled: true }); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />Novo Agendamento
        </Button>
      </div>

      <DataTable
        data={schedules}
        columns={columns}
        keyExtractor={(s) => s.id}
        searchKeys={["name", "jobType", "cron"]}
        initialSortColumn="name"
        searchPlaceholder="Pesquisar agendamentos..."
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Agendamento" : "Novo Agendamento"}</DialogTitle>
            <DialogDescription>Configure o agendamento</DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit((v) => editingId ? updateMut.mutate({ id: editingId, data: v }) : createMut.mutate(v))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2"><Label>Nome</Label><Input {...form.register("name")} placeholder="Backup Diário" /></div>
              <div className="space-y-2"><Label>Tipo de Job</Label>
                <Select value={form.watch("jobType")} onValueChange={(v) => form.setValue("jobType", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="backup">Backup</SelectItem>
                    <SelectItem value="sync">Sincronização</SelectItem>
                    <SelectItem value="cleanup">Limpeza</SelectItem>
                    <SelectItem value="report">Relatório</SelectItem>
                    <SelectItem value="notification">Notificação</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Expressão Cron</Label><Input {...form.register("cron")} placeholder="0 3 * * *" /></div>
              <div className="space-y-2 col-span-2">
                <Label>Configuração (JSON)</Label>
                <Textarea {...form.register("config")} rows={4} placeholder='{"retention": 30}' />
              </div>
              <div className="space-y-2 flex items-center gap-2 pt-6">
                <Switch checked={form.watch("enabled")} onCheckedChange={(v) => form.setValue("enabled", v)} />
                <Label>Ativo</Label>
              </div>
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
