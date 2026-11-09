import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Play, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable } from "@/components/data-table";
import type { Column } from "@/components/data-table";
import { executionService, processEngine } from "@/modules/automation/service";
import type { ExecutionLog, ExecutionStatus } from "@/modules/automation/types";
import { AUTOMATION_CONSTANTS } from "@/modules/automation/types";

export const Route = createFileRoute("/_app/automation/process")({
  head: () => ({ meta: [{ title: "Process Engine — ServiceForge" }] }),
  component: ProcessPage,
});

const statusConfig: Record<ExecutionStatus, { label: string; className: string }> = {
  pending: { label: "Pendente", className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100" },
  running: { label: "Em Execução", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100" },
  completed: { label: "Concluído", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" },
  failed: { label: "Falhou", className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100" },
  cancelled: { label: "Cancelado", className: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100" },
  retrying: { label: "Re-tentando", className: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100" },
};

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${m}m ${s}s`;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString("pt-BR");
}

function ProcessPage() {
  const qc = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [search, setSearch] = useState("");

  const { data: executions = [] } = useQuery({
    queryKey: ["automation", "executions"],
    queryFn: () => executionService.list(),
  });

  const executeMut = useMutation({
    mutationFn: (workflowId: string) => processEngine.execute(workflowId, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["automation", "executions"] });
      toast.success("Workflow executado com sucesso");
    },
    onError: () => toast.error("Erro ao executar workflow"),
  });

  const filtered = executions.filter((e) => {
    if (filterStatus !== "all" && e.status !== filterStatus) return false;
    if (search && !e.workflowName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const columns: Column<ExecutionLog>[] = [
    {
      key: "workflowName",
      header: "Workflow",
      sortable: true,
      sortFn: (a, b) => a.workflowName.localeCompare(b.workflowName),
      render: (e) => <span className="font-medium">{e.workflowName}</span>,
    },
    {
      key: "workflowVersion",
      header: "Versão",
      render: (e) => <span className="text-muted-foreground">v{e.workflowVersion}</span>,
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      sortFn: (a, b) => a.status.localeCompare(b.status),
      render: (e) => (
        <Badge className={`text-xs ${statusConfig[e.status].className}`}>
          {statusConfig[e.status].label}
        </Badge>
      ),
    },
    {
      key: "durationMs",
      header: "Duração",
      sortable: true,
      sortFn: (a, b) => a.durationMs - b.durationMs,
      render: (e) => <span>{formatDuration(e.durationMs)}</span>,
    },
    {
      key: "startedAt",
      header: "Iniciado Em",
      sortable: true,
      sortFn: (a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime(),
      render: (e) => <span className="text-muted-foreground">{formatDate(e.startedAt)}</span>,
    },
    {
      key: "completedAt",
      header: "Concluído Em",
      render: (e) => <span className="text-muted-foreground">{formatDate(e.completedAt)}</span>,
    },
    {
      key: "triggeredBy",
      header: "Acionado Por",
      render: (e) => <span className="text-muted-foreground">{e.triggeredBy}</span>,
    },
    {
      key: "actions",
      header: "Ações",
      render: (e) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => executeMut.mutate(e.workflowId)}
          disabled={e.status === "running"}
        >
          <Play className="h-3.5 w-3.5 mr-1" /> Executar
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Process Engine</h1>
          <p className="text-sm text-muted-foreground">
            {executions.length} execuções registradas
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar por workflow..."
              className="pl-8 w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {Object.entries(statusConfig).map(([key, cfg]) => (
                <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        keyExtractor={(e) => e.id}
        searchable={false}
        emptyMessage="Nenhuma execução encontrada"
      />
    </div>
  );
}
