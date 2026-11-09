import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Play, Pause, CheckCircle, XCircle, Clock, MessageCircle, Plus, ListTodo } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { serviceOrderService } from "@/modules/service-orders/service";
import type { SOExecutionActivity, SOTimeTracking } from "@/modules/service-orders/types";

export const Route = createFileRoute("/_app/service-orders/$id/execution")({
  head: () => ({ meta: [{ title: "Execução — ServiceForge" }] }),
  component: ExecutionTab,
});

const statusColors: Record<string, string> = {
  pending: "bg-gray-100 text-gray-700",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  in_progress: "Em Andamento",
  completed: "Concluída",
  cancelled: "Cancelada",
};

function ExecutionTab() {
  const { id } = Route.useParams();
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    name: "", description: "", responsibleName: "", date: new Date().toISOString().split("T")[0],
    time: "", status: "pending" as "pending" | "in_progress" | "completed" | "cancelled",
  });

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["so-activities", id],
    queryFn: () => serviceOrderService.getExecutionActivities(id),
  });

  const { data: timeTracking = [] } = useQuery({
    queryKey: ["so-timetracking", id],
    queryFn: () => serviceOrderService.getTimeTracking(id),
  });

  const createActivity = useMutation({
    mutationFn: () => serviceOrderService.createExecutionActivity(id, { ...form, timeSpent: 0, notes: "", attachments: [], photos: [] }, "Admin"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["so-activities", id] });
      qc.invalidateQueries({ queryKey: ["service-order", id] });
      setOpen(false);
      setForm({ name: "", description: "", responsibleName: "", date: new Date().toISOString().split("T")[0], time: "", status: "pending" });
      toast("Atividade criada");
    },
    onError: () => toast("Erro ao criar atividade"),
  });

  const updateActivity = useMutation({
    mutationFn: ({ activityId, patch }: { activityId: string; patch: Partial<SOExecutionActivity> }) =>
      serviceOrderService.updateExecutionActivity(id, activityId, patch, "Admin"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["so-activities", id] });
      qc.invalidateQueries({ queryKey: ["service-order", id] });
      toast("Atividade atualizada");
    },
  });

  const addComment = useMutation({
    mutationFn: ({ activityId, text }: { activityId: string; text: string }) =>
      serviceOrderService.addExecutionComment(id, activityId, text, "Admin", "admin"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["so-activities", id] });
      toast("Comentário adicionado");
    },
  });

  const nextStatus = (current: string): string | null => {
    const flow: Record<string, string> = { pending: "in_progress", in_progress: "completed", completed: "cancelled" };
    return flow[current] ?? null;
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="h-3 w-3" />;
      case "in_progress": return <Play className="h-3 w-3" />;
      case "completed": return <CheckCircle className="h-3 w-3" />;
      case "cancelled": return <XCircle className="h-3 w-3" />;
      default: return null;
    }
  };

  if (isLoading) return <div className="flex items-center justify-center py-12"><p className="text-sm text-muted-foreground">{t("common.loading")}</p></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListTodo className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Execução</h2>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="mr-1 h-4 w-4" />Nova Atividade</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova Atividade</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Descrição</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div><Label>Responsável</Label><Input value={form.responsibleName} onChange={(e) => setForm({ ...form, responsibleName: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Data</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
                <div><Label>Hora</Label><Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></div>
              </div>
              <div><Label>Status</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })}>
                  <option value="pending">Pendente</option>
                  <option value="in_progress">Em Andamento</option>
                  <option value="completed">Concluída</option>
                  <option value="cancelled">Cancelada</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button>
                <Button onClick={() => createActivity.mutate()} disabled={!form.name}>{t("common.save")}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Time Tracking */}
      {timeTracking.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4" />Apontamento de Horas</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {timeTracking.map((tt) => (
                <div key={tt.id} className="flex items-center justify-between text-sm border-b pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{tt.technicianName ?? "Técnico"}</span>
                    <span className="text-muted-foreground">{new Date(tt.startTime).toLocaleString("pt-BR")}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    {tt.totalTime != null && <span>Total: {tt.totalTime}min</span>}
                    {tt.productiveTime != null && <span>Produtivo: {tt.productiveTime}min</span>}
                    {tt.pauseTime && <Badge variant="outline" className="text-xs">Pausado</Badge>}
                    {tt.completionTime && <Badge variant="outline" className="text-xs bg-green-100">Concluído</Badge>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activities.length === 0 ? (
        <Card><CardContent><p className="py-8 text-center text-sm text-muted-foreground">Nenhuma atividade registrada.</p></CardContent></Card>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <Card key={activity.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{activity.name}</CardTitle>
                    {activity.description && <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={statusColors[activity.status] ?? ""} variant="outline">
                      {statusIcon(activity.status)}<span className="ml-1">{statusLabels[activity.status]}</span>
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {activity.responsibleName && <span>Responsável: {activity.responsibleName}</span>}
                  {activity.date && <span>Data: {activity.date}</span>}
                  {activity.time && <span>Hora: {activity.time}</span>}
                  {activity.timeSpent > 0 && <span>Tempo: {activity.timeSpent}min</span>}
                  <span><MessageCircle className="h-3 w-3 inline mr-1" />{activity.comments.length}</span>
                </div>

                {nextStatus(activity.status) && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => updateActivity.mutate({ activityId: activity.id, patch: { status: nextStatus(activity.status) as any } })}>
                      {activity.status === "pending" ? <><Play className="mr-1 h-3 w-3" />Iniciar</> : activity.status === "in_progress" ? <><CheckCircle className="mr-1 h-3 w-3" />Concluir</> : "Reabrir"}
                    </Button>
                    {activity.status !== "cancelled" && activity.status !== "completed" && (
                      <Button size="sm" variant="outline" className="text-red-500" onClick={() => updateActivity.mutate({ activityId: activity.id, patch: { status: "cancelled" } })}>
                        <XCircle className="mr-1 h-3 w-3" />Cancelar
                      </Button>
                    )}
                  </div>
                )}

                {/* Comments */}
                {activity.comments.length > 0 && (
                  <div className="space-y-2 border-t pt-2">
                    <p className="text-xs font-medium text-muted-foreground">Comentários</p>
                    {activity.comments.map((c) => (
                      <div key={c.id} className="flex items-start gap-2 text-xs">
                        <Badge variant="secondary" className="text-xs">{c.author}</Badge>
                        <span className="flex-1">{c.text}</span>
                        <span className="text-muted-foreground">{new Date(c.createdAt).toLocaleString("pt-BR")}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 border-t pt-2">
                  <Input placeholder="Adicionar comentário..." value={commentInputs[activity.id] ?? ""} onChange={(e) => setCommentInputs({ ...commentInputs, [activity.id]: e.target.value })} />
                  <Button size="sm" disabled={!commentInputs[activity.id]} onClick={() => {
                    addComment.mutate({ activityId: activity.id, text: commentInputs[activity.id] ?? "" });
                    setCommentInputs({ ...commentInputs, [activity.id]: "" });
                  }}>Enviar</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
