import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search } from "lucide-react";
import { executionService } from "@/modules/reporting/service";
import type { ExecutionLog } from "@/modules/reporting/types";

export const Route = createFileRoute("/_app/reporting/history")({
  head: () => ({ meta: [{ title: "Reporting Histórico — ServiceForge" }] }),
  component: ReportingHistoryPage,
});

const typeOptions = [
  { value: "report", label: "Relatório" },
  { value: "dashboard", label: "Dashboard" },
  { value: "dataset", label: "Dataset" },
  { value: "export", label: "Exportação" },
  { value: "print", label: "Impressão" },
  { value: "schedule", label: "Agendamento" },
];

const actionOptions = [
  { value: "created", label: "Criado" },
  { value: "updated", label: "Atualizado" },
  { value: "deleted", label: "Excluído" },
  { value: "executed", label: "Executado" },
  { value: "exported", label: "Exportado" },
  { value: "printed", label: "Impresso" },
  { value: "shared", label: "Compartilhado" },
  { value: "downloaded", label: "Baixado" },
  { value: "scheduled", label: "Agendado" },
  { value: "error", label: "Erro" },
];

const statusOptions = [
  { value: "success", label: "Sucesso" },
  { value: "error", label: "Erro" },
];

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = Math.floor(seconds / 60);
  const rem = Math.round(seconds % 60);
  return `${minutes}m ${rem}s`;
}

function ReportingHistoryPage() {
  const [filterType, setFilterType] = useState<string>("all");
  const [filterAction, setFilterAction] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchRef, setSearchRef] = useState("");

  const { data: executions = [] } = useQuery({
    queryKey: ["reporting", "history"],
    queryFn: () => executionService.list(),
  });

  const typeLabel = (type: string) => typeOptions.find((o) => o.value === type)?.label ?? type;
  const actionLabel = (action: string) => actionOptions.find((o) => o.value === action)?.label ?? action;

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      report: "bg-blue-100 text-blue-800 hover:bg-blue-100",
      dashboard: "bg-purple-100 text-purple-800 hover:bg-purple-100",
      dataset: "bg-cyan-100 text-cyan-800 hover:bg-cyan-100",
      export: "bg-amber-100 text-amber-800 hover:bg-amber-100",
      print: "bg-gray-100 text-gray-800 hover:bg-gray-100",
      schedule: "bg-green-100 text-green-800 hover:bg-green-100",
    };
    return (
      <Badge variant="secondary" className={colors[type] ?? ""}>
        {typeLabel(type)}
      </Badge>
    );
  };

  const getActionBadge = (action: string) => {
    const colors: Record<string, string> = {
      created: "bg-green-100 text-green-800 hover:bg-green-100",
      updated: "bg-blue-100 text-blue-800 hover:bg-blue-100",
      deleted: "bg-red-100 text-red-800 hover:bg-red-100",
      executed: "bg-indigo-100 text-indigo-800 hover:bg-indigo-100",
      exported: "bg-amber-100 text-amber-800 hover:bg-amber-100",
      error: "bg-destructive/10 text-destructive hover:bg-destructive/20",
    };
    return (
      <Badge variant="outline" className={colors[action] ?? ""}>
        {actionLabel(action)}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    if (status === "success") return <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">Sucesso</Badge>;
    return <Badge variant="destructive">Erro</Badge>;
  };

  const filtered = useMemo(() => {
    return executions.filter((e) => {
      if (filterType !== "all" && e.type !== filterType) return false;
      if (filterAction !== "all" && e.action !== filterAction) return false;
      if (filterStatus !== "all" && e.status !== filterStatus) return false;
      if (searchRef && !e.referenceName.toLowerCase().includes(searchRef.toLowerCase())) return false;
      return true;
    });
  }, [executions, filterType, filterAction, filterStatus, searchRef]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Histórico</h1>
        <p className="text-sm text-muted-foreground">Histórico de execuções e ações do módulo de relatórios</p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome de referência..."
            value={searchRef}
            onChange={(e) => setSearchRef(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Tipo:</span>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {typeOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Ação:</span>
          <Select value={filterAction} onValueChange={setFilterAction}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {actionOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status:</span>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {statusOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Referência</TableHead>
              <TableHead>Duração</TableHead>
              <TableHead>Usuário</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Data/Hora</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  Nenhum registro encontrado
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>{getTypeBadge(e.type)}</TableCell>
                  <TableCell>{getActionBadge(e.action)}</TableCell>
                  <TableCell>{getStatusBadge(e.status)}</TableCell>
                  <TableCell className="font-medium">{e.referenceName}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDuration(e.duration)}</TableCell>
                  <TableCell className="text-sm">{e.userName}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{e.companyName ?? "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(e.timestamp).toLocaleString("pt-BR")}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}