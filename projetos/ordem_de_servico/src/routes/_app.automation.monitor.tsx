import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { executionService, workflowService } from "@/modules/automation/service";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Activity, PlayCircle, CheckCircle2, XCircle, Clock } from "lucide-react";

export const Route = createFileRoute("/_app/automation/monitor")({
  head: () => ({ meta: [{ title: "Monitor de Execuções — ServiceForge" }] }),
  component: AutomationMonitorPage,
});

const statusColors: Record<string, string> = {
  pending: "bg-gray-500",
  running: "bg-blue-500",
  completed: "bg-green-500",
  failed: "bg-red-500",
  cancelled: "bg-amber-500",
  retrying: "bg-orange-500",
};

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}min ${Math.floor((ms % 60000) / 1000)}s`;
}

function AutomationMonitorPage() {
  const { data: executions = [] } = useQuery({
    queryKey: ["automation", "history"],
    queryFn: () => executionService.list(),
  });

  const { data: workflows = [] } = useQuery({
    queryKey: ["automation", "workflows"],
    queryFn: () => workflowService.list(),
  });

  const stats = useMemo(() => {
    const total = executions.length;
    const running = executions.filter((e) => e.status === "running").length;
    const completed = executions.filter((e) => e.status === "completed").length;
    const failed = executions.filter((e) => e.status === "failed").length;
    return { total, running, completed, failed };
  }, [executions]);

  const avgDuration = useMemo(() => {
    const completedExecs = executions.filter((e) => e.status === "completed" && e.durationMs > 0);
    if (completedExecs.length === 0) return 0;
    return completedExecs.reduce((acc, e) => acc + e.durationMs, 0) / completedExecs.length;
  }, [executions]);

  const recentExecutions = useMemo(() => {
    return [...executions]
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
      .slice(0, 20);
  }, [executions]);

  const summaryCards = [
    { title: "Total de Execuções", value: stats.total, icon: Activity, color: "text-blue-600" },
    { title: "Em Andamento", value: stats.running, icon: PlayCircle, color: "text-blue-500" },
    { title: "Concluídas", value: stats.completed, icon: CheckCircle2, color: "text-green-500" },
    { title: "Com Falha", value: stats.failed, icon: XCircle, color: "text-red-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Monitor de Execuções</h1>
          <p className="text-sm text-muted-foreground">Acompanhe o status das execuções em tempo real</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Últimas Execuções</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Workflow</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Duração</TableHead>
                <TableHead>Iniciado em</TableHead>
                <TableHead>Acionado por</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentExecutions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhuma execução registrada
                  </TableCell>
                </TableRow>
              ) : (
                recentExecutions.map((exec) => (
                  <TableRow key={exec.id}>
                    <TableCell className="font-medium">{exec.workflowName}</TableCell>
                    <TableCell>
                      <Badge className={`${statusColors[exec.status]} text-white`}>
                        {exec.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDuration(exec.durationMs)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(exec.startedAt).toLocaleString()}
                    </TableCell>
                    <TableCell>{exec.triggeredBy}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Duração Média</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <span className="text-2xl font-bold">{formatDuration(Math.round(avgDuration))}</span>
            <span className="text-sm text-muted-foreground">(execuções concluídas)</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
