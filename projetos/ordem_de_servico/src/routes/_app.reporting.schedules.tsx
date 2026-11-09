import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2, Edit3, ToggleLeft, ToggleRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { subscriptionService } from "@/modules/reporting/service";
import type { Subscription } from "@/modules/reporting/types";

export const Route = createFileRoute("/_app/reporting/schedules")({
  head: () => ({ meta: [{ title: "Reporting Agendamentos — ServiceForge" }] }),
  component: ReportingSchedulesPage,
});

const typeOptions = [
  { value: "email", label: "E-mail" },
  { value: "notification", label: "Notificação" },
  { value: "webhook", label: "Webhook" },
];

const scheduleTypeOptions = [
  { value: "daily", label: "Diário" },
  { value: "weekly", label: "Semanal" },
  { value: "monthly", label: "Mensal" },
  { value: "manual", label: "Manual" },
  { value: "cron", label: "Cron" },
];

function ReportingSchedulesPage() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState("email");
  const [formScheduleType, setFormScheduleType] = useState("daily");
  const [formTime, setFormTime] = useState("08:00");

  const { data: subscriptions = [] } = useQuery({
    queryKey: ["reporting", "schedules"],
    queryFn: () => subscriptionService.list(),
  });

  const defaultSchedule = (type: string, time: string) => ({
    id: `${Date.now()}`,
    name: formName || "Agendamento",
    type: type as "daily" | "weekly" | "monthly" | "manual" | "cron",
    time,
    enabled: true,
    formats: [],
    recipients: [],
    dayOfWeek: type === "weekly" ? [1] : undefined,
    dayOfMonth: type === "monthly" ? 1 : undefined,
  });

  const createMut = useMutation({
    mutationFn: () =>
      subscriptionService.create({
        name: formName,
        type: formType as "email" | "notification" | "webhook",
        schedule: defaultSchedule(formScheduleType, formTime) as any,
        enabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reporting", "schedules"] });
      setDialogOpen(false);
      resetForm();
      toast.success("Agendamento criado com sucesso");
    },
    onError: () => toast.error("Erro ao criar agendamento"),
  });

  const updateMut = useMutation({
    mutationFn: () =>
      subscriptionService.update(editingId!, {
        name: formName,
        type: formType as "email" | "notification" | "webhook",
        schedule: defaultSchedule(formScheduleType, formTime) as any,
        updatedAt: new Date().toISOString(),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reporting", "schedules"] });
      setDialogOpen(false);
      setEditingId(null);
      resetForm();
      toast.success("Agendamento atualizado com sucesso");
    },
    onError: () => toast.error("Erro ao atualizar agendamento"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => subscriptionService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reporting", "schedules"] });
      toast.success("Agendamento excluído com sucesso");
    },
    onError: () => toast.error("Erro ao excluir agendamento"),
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      subscriptionService.update(id, { enabled, updatedAt: new Date().toISOString() }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["reporting", "schedules"] });
      toast.success(vars.enabled ? "Agendamento ativado" : "Agendamento desativado");
    },
    onError: () => toast.error("Erro ao alterar status"),
  });

  const resetForm = () => {
    setFormName("");
    setFormType("email");
    setFormScheduleType("daily");
    setFormTime("08:00");
  };

  const openEdit = (id: string) => {
    const s = subscriptions.find((sub) => sub.id === id);
    if (!s) return;
    setEditingId(id);
    setFormName(s.name);
    setFormType(s.type);
    setFormScheduleType(s.schedule.type === "manual" ? "daily" : s.schedule.type);
    setFormTime(s.schedule.time || "08:00");
    setDialogOpen(true);
  };

  const typeLabel = (type: string) => typeOptions.find((o) => o.value === type)?.label ?? type;
  const scheduleTypeLabel = (type: string) => scheduleTypeOptions.find((o) => o.value === type)?.label ?? type;

  const columns: Column<Subscription>[] = [
    {
      key: "name",
      header: "Nome",
      sortable: true,
      sortFn: (a, b) => a.name.localeCompare(b.name),
      render: (s) => <span className="font-medium">{s.name}</span>,
    },
    {
      key: "type",
      header: "Tipo",
      render: (s) => <Badge variant="secondary">{typeLabel(s.type)}</Badge>,
    },
    {
      key: "scheduleType",
      header: "Frequência",
      render: (s) => <Badge variant="outline">{scheduleTypeLabel(s.schedule.type)}</Badge>,
    },
    { key: "time", header: "Horário", render: (s) => <span className="text-sm">{s.schedule.time || "—"}</span> },
    {
      key: "enabled",
      header: "Ativo",
      render: (s) =>
        s.enabled ? (
          <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
            Sim
          </Badge>
        ) : (
          <Badge variant="outline">Não</Badge>
        ),
    },
    {
      key: "lastSent",
      header: "Último Envio",
      render: (s) =>
        s.lastSent ? (
          <span className="text-sm text-muted-foreground">{new Date(s.lastSent).toLocaleString("pt-BR")}</span>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        ),
    },
    {
      key: "actions",
      header: "Ações",
      render: (s) => (
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => toggleMut.mutate({ id: s.id, enabled: !s.enabled })}
            title={s.enabled ? "Desativar" : "Ativar"}
          >
            {s.enabled ? <ToggleRight className="h-4 w-4 text-green-500" /> : <ToggleLeft className="h-4 w-4 text-muted-foreground" />}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => openEdit(s.id)}>
            <Edit3 className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setDeleteId(s.id)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Agendamentos</h1>
          <p className="text-sm text-muted-foreground">Gerencie os agendamentos de relatórios</p>
        </div>
        <Button
          onClick={() => {
            setEditingId(null);
            resetForm();
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />Novo Agendamento
        </Button>
      </div>

      <DataTable
        data={subscriptions}
        columns={columns}
        keyExtractor={(s) => s.id}
        searchKeys={["name"]}
        initialSortColumn="name"
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Agendamento" : "Novo Agendamento"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>Nome</Label>
                <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Nome do agendamento" />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={formType} onValueChange={setFormType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {typeOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Frequência</Label>
                <Select value={formScheduleType} onValueChange={setFormScheduleType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {scheduleTypeOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Horário</Label>
                <Input type="time" value={formTime} onChange={(e) => setFormTime(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" type="button" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={() => (editingId ? updateMut.mutate() : createMut.mutate())}
                disabled={!formName}
              >
                {editingId ? "Atualizar" : "Criar"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => {
          if (!o) setDeleteId(null);
        }}
        onConfirm={() => {
          if (deleteId) {
            deleteMut.mutate(deleteId);
            setDeleteId(null);
          }
        }}
        title="Excluir Agendamento"
        description="Tem certeza que deseja excluir este agendamento? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
      />
    </div>
  );
}