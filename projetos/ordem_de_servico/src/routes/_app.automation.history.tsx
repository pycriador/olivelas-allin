import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { executionService } from "@/modules/automation/service";
import type { ExecutionLog, ExecutionStatus } from "@/modules/automation/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, RotateCcw } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/automation/history")({
  head: () => ({ meta: [{ title: "Histórico de Execuções — ServiceForge" }] }),
  component: AutomationHistoryPage,
});

const statusColors: Record<ExecutionStatus, string> = {
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

function AutomationHistoryPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ExecutionStatus | "all">("all");

  const { data: executions = [] } = useQuery({
    queryKey: ["automation", "history"],
    queryFn: () => executionService.list(),
  });

  const filtered = useMemo(() => {
    return executions.filter((e) => {
      const matchSearch = e.workflowName.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || e.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [executions, search, statusFilter]);

  const statuses: (ExecutionStatus | "all")[] = ["all", "pending", "running", "completed", "failed", "cancelled", "retrying"];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Histórico de Execuções</h1>
          <p className="text-sm text-muted-foreground">Visualize todas as execuções dos workflows</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome do workflow..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {statuses.map((s) => (
            <Button
              key={s}
              variant={statusFilter === s ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(s)}
              className="capitalize"
            >
              {s === "all" ? "Todos" : s}
            </Button>
          ))}
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Workflow</TableHead>
              <TableHead>Versão</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Duração</TableHead>
              <TableHead>Iniciado em</TableHead>
              <TableHead>Concluído em</TableHead>
              <TableHead>Acionado por</TableHead>
              <TableHead>Tentativas</TableHead>
              <TableHead>Tags</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  Nenhuma execução encontrada
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((exec) => (
                <TableRow key={exec.id}>
                  <TableCell className="font-medium">{exec.workflowName}</TableCell>
                  <TableCell>v{exec.workflowVersion}</TableCell>
                  <TableCell>
                    <Badge className={`${statusColors[exec.status]} text-white`}>
                      {exec.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDuration(exec.durationMs)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(exec.startedAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {exec.completedAt ? new Date(exec.completedAt).toLocaleString() : "-"}
                  </TableCell>
                  <TableCell>{exec.triggeredBy}</TableCell>
                  <TableCell>{exec.retryCount}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {exec.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
