import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  CalendarDays, Clock, XCircle, CheckCircle2,
  Mail, MessageSquare, Bell, Repeat,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/data-table";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { scheduleService, addAuditEvent } from "@/modules/communication/service";
import { DocButton } from "@/components/doc-button";
import type { Schedule, ScheduleStatus } from "@/modules/communication/types";
import { CHANNEL_TYPE_LABELS, RECURRENCE_LABELS } from "@/modules/communication/types";

export const Route = createFileRoute("/_app/communication/schedules")({
  head: () => ({ meta: [{ title: "Schedules — ServiceForge" }] }),
  component: SchedulesPage,
});

function SchedulesPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<ScheduleStatus | null>(null);
  const [selectedSched, setSelectedSched] = useState<Schedule | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);

  const { data: schedules = [] } = useQuery({
    queryKey: ["comm", "schedules"],
    queryFn: () => scheduleService.list(),
  });

  const filtered = statusFilter ? schedules.filter((s) => s.status === statusFilter) : schedules;

  const cancelMut = useMutation({
    mutationFn: async (id: string) => {
      const sched = await scheduleService.get(id);
      if (!sched) throw new Error("Agendamento não encontrado");
      const updated = await scheduleService.update(id, { status: "cancelled" });
      await addAuditEvent("schedule-cancelled", "admin", "Admin", `Agendamento cancelado: ${sched.subject}`, id, "schedule");
      return updated;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["comm", "schedules"] }); toast.success("Agendamento cancelado"); },
  });

  const columns: Column<Schedule>[] = [
    { key: "subject", header: "Mensagem", sortable: true, sortFn: (a, b) => a.subject.localeCompare(b.subject), render: (e) => (
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => setSelectedSched(selectedSched?.id === e.id ? null : e)}>
        <CalendarDays className="h-4 w-4 text-muted-foreground" />
        <div>
          <div className="font-medium">{e.subject}</div>
          <div className="text-xs text-muted-foreground">{e.clientName}</div>
        </div>
      </div>
    )},
    { key: "channel", header: "Canal", render: (e) => (
      <Badge variant="outline">
        {e.channel === "email" ? <Mail className="h-3 w-3 mr-1" /> : e.channel === "whatsapp" ? <MessageSquare className="h-3 w-3 mr-1" /> : <Bell className="h-3 w-3 mr-1" />}
        {CHANNEL_TYPE_LABELS[e.channel]}
      </Badge>
    )},
    { key: "recurrence", header: "Recorrência", render: (e) => (
      <div className="flex items-center gap-1">
        {e.recurrence !== "none" && <Repeat className="h-3 w-3 text-muted-foreground" />}
        <span className="text-sm">{RECURRENCE_LABELS[e.recurrence]}</span>
      </div>
    )},
    { key: "status", header: "Status", render: (e) => (
      <Badge variant={e.status === "sent" ? "default" : e.status === "cancelled" ? "secondary" : "outline"} className="gap-1">
        {e.status === "sent" ? <CheckCircle2 className="h-3 w-3" /> : e.status === "cancelled" ? <XCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
        {e.status === "sent" ? "Enviado" : e.status === "cancelled" ? "Cancelado" : "Pendente"}
      </Badge>
    )},
    { key: "scheduledAt", header: "Agendado para", sortable: true, render: (e) => (
      <div className="text-sm">
        <div>{new Date(e.scheduledAt).toLocaleDateString()}</div>
        <div className="text-xs text-muted-foreground">{new Date(e.scheduledAt).toLocaleTimeString()}</div>
      </div>
    )},
    { key: "actions", header: "", render: (e) => (
      <div className="flex gap-1">
        {e.status === "pending" && <Button size="sm" variant="ghost" onClick={() => setCancelId(e.id)}><XCircle className="h-4 w-4" /></Button>}
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Schedules</h1>
          <DocButton module="communication" page="schedules" />
        <p className="text-sm text-muted-foreground">Mensagens agendadas</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button size="sm" variant={statusFilter === null ? "default" : "outline"} onClick={() => setStatusFilter(null)}>Todos</Button>
        {(["pending", "sent", "cancelled"] as ScheduleStatus[]).map((s) => (
          <Button key={s} size="sm" variant={statusFilter === s ? "default" : "outline"} onClick={() => setStatusFilter(s)}>
            {s === "pending" ? "Pendentes" : s === "sent" ? "Enviados" : "Cancelados"}
          </Button>
        ))}
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        keyExtractor={(e) => e.id}
        searchKeys={["subject", "clientName", "content"]}
        initialSortColumn="scheduledAt"
      />

      {selectedSched && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setSelectedSched(null)}>
          <div className="bg-background rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] overflow-y-auto p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{selectedSched.subject}</h3>
                <p className="text-xs text-muted-foreground">{selectedSched.clientName}</p>
              </div>
              <Badge>{selectedSched.status === "pending" ? "Pendente" : selectedSched.status === "sent" ? "Enviado" : "Cancelado"}</Badge>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Canal</span><span>{CHANNEL_TYPE_LABELS[selectedSched.channel]}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Recorrência</span><span>{RECURRENCE_LABELS[selectedSched.recurrence]}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Agendado para</span><span>{new Date(selectedSched.scheduledAt).toLocaleString()}</span></div>
            </div>
            <div className="border-t pt-2">
              <p className="text-sm font-medium mb-1">Conteúdo</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedSched.content}</p>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog open={!!cancelId} onOpenChange={(o) => { if (!o) setCancelId(null); }} onConfirm={() => { if (cancelId) { cancelMut.mutate(cancelId); setCancelId(null); } }} title="Cancelar Agendamento" description="Tem certeza que deseja cancelar este agendamento?" />
    </div>
  );
}
