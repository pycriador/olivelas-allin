import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Activity, AlertCircle, Clock, CheckCircle2,
  BarChart3, GitBranch, Radio,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { eventBus, eventStoreService, executionService, subscriberService } from "@/modules/events/service";
import { DocButton } from "@/components/doc-button";
import { EVENT_STATUS_LABELS, EVENT_CATEGORY_LABELS } from "@/modules/events/types";

export const Route = createFileRoute("/_app/events/monitor")({
  head: () => ({ meta: [{ title: "Event Monitor — ServiceForge" }] }),
  component: MonitorPage,
});

function MonitorPage() {
  const { data: events = [] } = useQuery({ queryKey: ["evt", "events"], queryFn: () => eventBus.history() });
  const { data: stored = [] } = useQuery({ queryKey: ["evt", "store"], queryFn: () => eventStoreService.list() });
  const { data: executions = [] } = useQuery({ queryKey: ["evt", "executions"], queryFn: () => executionService.list() });
  const { data: subscribers = [] } = useQuery({ queryKey: ["evt", "subscribers"], queryFn: () => subscriberService.list() });

  const processed = events.filter((e) => e.status === "completed").length;
  const failed = events.filter((e) => e.status === "failed").length;
  const pending = events.filter((e) => e.status === "created" || e.status === "processing").length;

  const avgDuration = stored.filter((s) => s.duration != null).reduce((acc, s) => acc + (s.duration ?? 0), 0) /
    Math.max(1, stored.filter((s) => s.duration != null).length);

  const wfCounts: Record<string, number> = {};
  executions.filter((e) => e.status === "completed").forEach((e) => {
    wfCounts[e.workflowName] = (wfCounts[e.workflowName] ?? 0) + 1;
  });
  const topWf = Object.entries(wfCounts).sort((a, b) => b[1] - a[1])[0];

  const activeSubs = subscribers.filter((s) => s.active).length;

  const recentEvents = [...events].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10);
  const eventsByMinute = events.length > 0
    ? Math.round(events.length / Math.max(1, Math.ceil((Date.now() - new Date(events[events.length - 1]?.createdAt ?? Date.now()).getTime()) / 60000)))
    : 0;

  const catCounts: Record<string, number> = {};
  events.forEach((e) => { catCounts[e.category] = (catCounts[e.category] ?? 0) + 1; });
  const topCategory = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Event Monitor</h1>
          <DocButton module="events" page="monitor" />
        <p className="text-sm text-muted-foreground">Monitoramento do barramento de eventos</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Eventos por Minuto</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{eventsByMinute}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Processados</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{processed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Com Erro</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{failed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pending}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tempo Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{Math.round(avgDuration)}ms</div>
            <p className="text-xs text-muted-foreground mt-1">Tempo médio de processamento dos eventos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Workflow mais utilizado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <GitBranch className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="font-medium">{topWf?.[0] ?? "Nenhum"}</div>
                <div className="text-xs text-muted-foreground">{topWf?.[1] ?? 0} execuções concluídas</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Categoria mais frequente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="font-medium">{topCategory ? EVENT_CATEGORY_LABELS[topCategory[0] as keyof typeof EVENT_CATEGORY_LABELS] : "Nenhuma"}</div>
                <div className="text-xs text-muted-foreground">{topCategory?.[1] ?? 0} eventos</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Subscribers Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Radio className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">{activeSubs}</div>
                <div className="text-xs text-muted-foreground">de {subscribers.length} subscribers</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Eventos Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentEvents.length === 0 && <p className="text-sm text-muted-foreground">Nenhum evento encontrado</p>}
              {recentEvents.map((ev) => (
                <div key={ev.id} className="flex items-center gap-3 text-sm">
                  <Activity className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-mono text-xs font-medium">{ev.name}</p>
                    <p className="text-xs text-muted-foreground">{ev.source} — {EVENT_CATEGORY_LABELS[ev.category]}</p>
                  </div>
                  <Badge variant={
                    ev.status === "completed" ? "default" :
                    ev.status === "failed" ? "destructive" : "outline"
                  } className="shrink-0 text-[10px]">
                    {EVENT_STATUS_LABELS[ev.status]}
                  </Badge>
                  <span className="text-xs text-muted-foreground shrink-0">{new Date(ev.createdAt).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
