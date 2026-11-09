import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Send, Clock, AlertCircle, CalendarDays, CheckCircle2,
  Mail, MessageSquare, Bell, Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { messageService, scheduleService } from "@/modules/communication/service";
import { DocButton } from "@/components/doc-button";
import { channelService } from "@/modules/communication/service";
import { historyService } from "@/modules/communication/service";
import { MESSAGE_STATUS_LABELS, CHANNEL_TYPE_LABELS } from "@/modules/communication/types";

export const Route = createFileRoute("/_app/communication/dashboard")({
  head: () => ({ meta: [{ title: "Communication Center — ServiceForge" }] }),
  component: CommDashboardPage,
});

function CommDashboardPage() {
  const { data: messages = [] } = useQuery({
    queryKey: ["comm", "messages"],
    queryFn: () => messageService.list(),
  });
  const { data: schedules = [] } = useQuery({
    queryKey: ["comm", "schedules"],
    queryFn: () => scheduleService.list(),
  });
  const { data: channels = [] } = useQuery({
    queryKey: ["comm", "channels"],
    queryFn: () => channelService.list(),
  });
  const { data: history = [] } = useQuery({
    queryKey: ["comm", "history"],
    queryFn: () => historyService.list(),
  });

  const sent = messages.filter((m) => m.status === "sent" || m.status === "delivered" || m.status === "read").length;
  const pending = messages.filter((m) => m.status === "pending" || m.status === "processing").length;
  const failed = messages.filter((m) => m.status === "failed").length;
  const scheduled = schedules.filter((s) => s.status === "pending").length;
  const deliveryRate = messages.length > 0 ? Math.round((sent / messages.length) * 100) : 0;
  const channelUsage = channels.filter((c) => c.enabled).length;

  const activeChannels = channels.filter((c) => c.enabled);
  const lastMessages = [...messages].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Communication Center</h1>
          <DocButton module="communication" page="dashboard" />
        <p className="text-sm text-muted-foreground">Central de comunicação</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Mensagens Enviadas</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sent}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Falhas</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{failed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Agendadas</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scheduled}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Taxa de Entrega</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="text-3xl font-bold text-green-600">{deliveryRate}%</div>
              <div className="flex-1 bg-secondary rounded-full h-3">
                <div className="bg-green-600 h-3 rounded-full transition-all" style={{ width: `${deliveryRate}%` }} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">{sent} de {messages.length} mensagens entregues com sucesso</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Canais Utilizados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="text-3xl font-bold">{channelUsage}</div>
              <div className="flex gap-1 flex-wrap">
                {activeChannels.map((ch) => (
                  <Badge key={ch.channel} variant="secondary" className="gap-1">
                    {ch.channel === "email" && <Mail className="h-3 w-3" />}
                    {ch.channel === "whatsapp" && <MessageSquare className="h-3 w-3" />}
                    {ch.channel === "internal" && <Bell className="h-3 w-3" />}
                    {CHANNEL_TYPE_LABELS[ch.channel]}
                  </Badge>
                ))}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Canais ativos no sistema</p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Últimas Comunicações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lastMessages.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma comunicação encontrada</p>}
              {lastMessages.map((msg) => (
                <div key={msg.id} className="flex items-center gap-3 text-sm">
                  <Activity className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">{msg.subject}</p>
                    <p className="text-xs text-muted-foreground">{msg.clientName} — {CHANNEL_TYPE_LABELS[msg.channel]}</p>
                  </div>
                  <Badge variant={
                    msg.status === "sent" || msg.status === "delivered" || msg.status === "read" ? "default" :
                    msg.status === "failed" ? "destructive" : "outline"
                  } className="shrink-0">
                    {msg.status === "sent" || msg.status === "delivered" || msg.status === "read" ? <CheckCircle2 className="h-3 w-3 mr-1" /> :
                     msg.status === "failed" ? <AlertCircle className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
                    {MESSAGE_STATUS_LABELS[msg.status]}
                  </Badge>
                  <span className="text-xs text-muted-foreground shrink-0">{new Date(msg.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
