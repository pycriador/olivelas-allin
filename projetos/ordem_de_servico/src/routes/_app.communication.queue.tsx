import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  Send, XCircle, RefreshCw, AlertCircle, CheckCircle2,
  Clock, Eye, MessageSquare, Mail, Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/data-table";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { messageService, cancelMessage, retryMessage, addAuditEvent } from "@/modules/communication/service";
import { DocButton } from "@/components/doc-button";
import type { Message, MessageStatus, ChannelType } from "@/modules/communication/types";
import { MESSAGE_STATUS_LABELS, CHANNEL_TYPE_LABELS } from "@/modules/communication/types";

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Clock className="h-3 w-3" />,
  processing: <RefreshCw className="h-3 w-3" />,
  sent: <Send className="h-3 w-3" />,
  delivered: <CheckCircle2 className="h-3 w-3" />,
  read: <Eye className="h-3 w-3" />,
  failed: <AlertCircle className="h-3 w-3" />,
  cancelled: <XCircle className="h-3 w-3" />,
};

export const Route = createFileRoute("/_app/communication/queue")({
  head: () => ({ meta: [{ title: "Message Queue — ServiceForge" }] }),
  component: QueuePage,
});

function QueuePage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<MessageStatus | null>(null);
  const [selectedMsg, setSelectedMsg] = useState<Message | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [retryId, setRetryId] = useState<string | null>(null);

  const { data: messages = [] } = useQuery({
    queryKey: ["comm", "messages"],
    queryFn: () => messageService.list(),
  });

  const filtered = statusFilter ? messages.filter((m) => m.status === statusFilter) : messages;

  const cancelMut = useMutation({
    mutationFn: (id: string) => cancelMessage(id, "admin"),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["comm", "messages"] }); toast.success("Mensagem cancelada"); },
  });

  const retryMut = useMutation({
    mutationFn: (id: string) => retryMessage(id, "admin"),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["comm", "messages"] }); toast.success("Reenvio realizado"); },
  });

  const columns: Column<Message>[] = [
    { key: "subject", header: "Mensagem", sortable: true, sortFn: (a, b) => a.subject.localeCompare(b.subject), render: (e) => (
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => setSelectedMsg(selectedMsg?.id === e.id ? null : e)}>
        {e.channel === "email" ? <Mail className="h-4 w-4 text-muted-foreground" /> :
         e.channel === "whatsapp" ? <MessageSquare className="h-4 w-4 text-muted-foreground" /> :
         <Bell className="h-4 w-4 text-muted-foreground" />}
        <div>
          <div className="font-medium">{e.subject}</div>
          <div className="text-xs text-muted-foreground">{e.clientName}</div>
        </div>
      </div>
    )},
    { key: "channel", header: "Canal", render: (e) => <Badge variant="outline">{CHANNEL_TYPE_LABELS[e.channel]}</Badge> },
    { key: "status", header: "Status", render: (e) => (
      <Badge variant={
        e.status === "sent" || e.status === "delivered" || e.status === "read" ? "default" :
        e.status === "failed" ? "destructive" : e.status === "cancelled" ? "secondary" : "outline"
      } className="gap-1">
        {STATUS_ICONS[e.status]}
        {MESSAGE_STATUS_LABELS[e.status]}
      </Badge>
    )},
    { key: "attempts", header: "Tentativas", render: (e) => <span className="text-sm">{e.attempts}/{e.maxAttempts}</span> },
    { key: "createdAt", header: "Data", render: (e) => <span className="text-sm text-muted-foreground">{new Date(e.createdAt).toLocaleDateString()}</span> },
    { key: "actions", header: "", render: (e) => (
      <div className="flex gap-1">
        {e.status === "failed" && <Button size="sm" variant="ghost" onClick={() => setRetryId(e.id)}><RefreshCw className="h-4 w-4" /></Button>}
        {(e.status === "pending" || e.status === "processing") && <Button size="sm" variant="ghost" onClick={() => setCancelId(e.id)}><XCircle className="h-4 w-4" /></Button>}
      </div>
    )},
  ];

  const stats = [
    { label: "Enviadas", value: messages.filter((m) => ["sent", "delivered", "read"].includes(m.status)).length, color: "text-green-600" },
    { label: "Pendentes", value: messages.filter((m) => ["pending", "processing"].includes(m.status)).length, color: "text-yellow-600" },
    { label: "Falhas", value: messages.filter((m) => m.status === "failed").length, color: "text-red-600" },
    { label: "Canceladas", value: messages.filter((m) => m.status === "cancelled").length, color: "text-muted-foreground" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Message Queue</h1>
          <DocButton module="communication" page="queue" />
        <p className="text-sm text-muted-foreground">Fila de mensagens</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{s.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button size="sm" variant={statusFilter === null ? "default" : "outline"} onClick={() => setStatusFilter(null)}>Todos</Button>
        {(["pending", "processing", "sent", "delivered", "read", "failed", "cancelled"] as MessageStatus[]).map((s) => (
          <Button key={s} size="sm" variant={statusFilter === s ? "default" : "outline"} onClick={() => setStatusFilter(s)}>
            {MESSAGE_STATUS_LABELS[s]}
          </Button>
        ))}
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        keyExtractor={(e) => e.id}
        searchKeys={["subject", "clientName", "content"]}
        initialSortColumn="createdAt"
      />

      {selectedMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setSelectedMsg(null)}>
          <div className="bg-background rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] overflow-y-auto p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{selectedMsg.subject}</h3>
                <p className="text-xs text-muted-foreground">{selectedMsg.clientName} — {CHANNEL_TYPE_LABELS[selectedMsg.channel]}</p>
              </div>
              <Badge variant={
                selectedMsg.status === "sent" || selectedMsg.status === "delivered" || selectedMsg.status === "read" ? "default" :
                selectedMsg.status === "failed" ? "destructive" : "outline"
              }>{MESSAGE_STATUS_LABELS[selectedMsg.status]}</Badge>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Contato</span><span>{selectedMsg.clientContact}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Tentativas</span><span>{selectedMsg.attempts}/{selectedMsg.maxAttempts}</span></div>
              {selectedMsg.error && <div className="flex justify-between"><span className="text-muted-foreground">Erro</span><span className="text-destructive">{selectedMsg.error}</span></div>}
              <div className="flex justify-between"><span className="text-muted-foreground">Criado em</span><span>{new Date(selectedMsg.createdAt).toLocaleString()}</span></div>
              {selectedMsg.sentAt && <div className="flex justify-between"><span className="text-muted-foreground">Enviado em</span><span>{new Date(selectedMsg.sentAt).toLocaleString()}</span></div>}
            </div>
            <div className="border-t pt-2">
              <p className="text-sm font-medium mb-1">Conteúdo</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedMsg.content}</p>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog open={!!cancelId} onOpenChange={(o) => { if (!o) setCancelId(null); }} onConfirm={() => { if (cancelId) { cancelMut.mutate(cancelId); setCancelId(null); } }} title="Cancelar Envio" description="Tem certeza que deseja cancelar o envio desta mensagem?" />
      <ConfirmDialog open={!!retryId} onOpenChange={(o) => { if (!o) setRetryId(null); }} onConfirm={() => { if (retryId) { retryMut.mutate(retryId); setRetryId(null); } }} title="Reenviar Mensagem" description="Tem certeza que deseja tentar reenviar esta mensagem?" />
    </div>
  );
}
