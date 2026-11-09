import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Trash2, CheckCircle2, XCircle, AlertTriangle, Info, AlertOctagon, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable, type Column } from "@/components/data-table";
import { monitoringService } from "@/modules/admin/service";
import { DocButton } from "@/components/doc-button";
import type { MonitoringEntry } from "@/modules/admin/types";

const typeLabels: Record<string, string> = { metric: "Métrica", event: "Evento", alert: "Alerta", exception: "Exceção" };
const typeVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = { metric: "default", event: "secondary", alert: "destructive", exception: "outline" };
const severityLabels: Record<string, string> = { info: "Info", warning: "Atenção", critical: "Crítico" };
const severityVariants: Record<string, "secondary" | "default" | "destructive"> = { info: "secondary", warning: "default", critical: "destructive" };

export const Route = createFileRoute("/_app/admin/monitoring")({
  head: () => ({ meta: [{ title: "Admin Monitoramento — ServiceForge" }] }),
  component: AdminMonitoringPage,
});

function AdminMonitoringPage() {
  const qc = useQueryClient();
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: entries = [] } = useQuery({ queryKey: ["admin", "monitoring", "list"], queryFn: () => monitoringService.list() });

  const filtered = entries.filter((e) => {
    if (typeFilter !== "all" && e.type !== typeFilter) return false;
    if (severityFilter !== "all" && e.severity !== severityFilter) return false;
    return true;
  });

  const resolveMut = useMutation({
    mutationFn: (id: string) => monitoringService.resolve(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "monitoring"] }); toast.success("Registro resolvido"); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => monitoringService.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "monitoring"] }); toast.success("Registro excluído"); },
  });

  const total = entries.length;
  const resolved = entries.filter((e) => e.resolved).length;
  const unresolved = total - resolved;
  const critical = entries.filter((e) => e.severity === "critical").length;

  const columns: Column<MonitoringEntry>[] = [
    { key: "type", header: "Tipo", render: (e) => <Badge variant={typeVariants[e.type]}>{typeLabels[e.type]}</Badge> },
    { key: "severity", header: "Severidade", render: (e) => (
      <Badge variant={severityVariants[e.severity]} className="gap-1">
        {e.severity === "critical" ? <AlertOctagon className="h-3 w-3" /> : e.severity === "warning" ? <AlertTriangle className="h-3 w-3" /> : <Info className="h-3 w-3" />}
        {severityLabels[e.severity]}
      </Badge>
    )},
    { key: "source", header: "Fonte", render: (e) => <span className="text-sm font-medium">{e.source}</span> },
    { key: "title", header: "Título", sortable: true, sortFn: (a, b) => a.title.localeCompare(b.title), render: (e) => <span className="text-sm">{e.title}</span> },
    { key: "timestamp", header: "Data/Hora", render: (e) => <span className="text-sm text-muted-foreground">{new Date(e.timestamp).toLocaleString()}</span> },
    { key: "resolved", header: "Resolvido", render: (e) => (
      e.resolved ? <Badge variant="default" className="gap-1"><CheckCircle2 className="h-3 w-3" />Sim</Badge> : <Badge variant="secondary" className="gap-1"><XCircle className="h-3 w-3" />Não</Badge>
    )},
    { key: "actions", header: "Ações", render: (e) => (
      <div className="flex gap-1">
        {!e.resolved && (
          <Button size="sm" variant="ghost" onClick={() => resolveMut.mutate(e.id)}><CheckCircle2 className="h-4 w-4 text-green-500" /></Button>
        )}
        <Button size="sm" variant="ghost" onClick={() => setDeleteId(e.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Monitoramento</h1>
            <DocButton module="admin" page="monitoring" title="Monitoramento" />
          </div>
          <p className="text-sm text-muted-foreground">Acompanhe métricas, eventos, alertas e exceções</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => qc.invalidateQueries({ queryKey: ["admin", "monitoring"] })}>
          <RefreshCw className="mr-2 h-4 w-4" />Atualizar
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total</CardTitle></CardHeader>
          <CardContent><span className="text-2xl font-bold">{total}</span></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Resolvidos</CardTitle></CardHeader>
          <CardContent className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-green-500" /><span className="text-2xl font-bold">{resolved}</span></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Não Resolvidos</CardTitle></CardHeader>
          <CardContent><span className="text-2xl font-bold">{unresolved}</span></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Críticos</CardTitle></CardHeader>
          <CardContent className="flex items-center gap-2"><AlertOctagon className="h-5 w-5 text-destructive" /><span className="text-2xl font-bold">{critical}</span></CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Tipo:</span>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {Object.entries(typeLabels).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Severidade:</span>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {Object.entries(severityLabels).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        keyExtractor={(e) => e.id}
        searchKeys={["source", "title", "description"]}
        initialSortColumn="timestamp"
        searchPlaceholder="Pesquisar registros..."
      />

      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setDeleteId(null)}>
          <div className="bg-background rounded-lg p-6 max-w-sm shadow-lg" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-2">Confirmar Exclusão</h3>
            <p className="text-sm text-muted-foreground mb-4">Tem certeza que deseja excluir este registro?</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
              <Button variant="destructive" onClick={() => { deleteMut.mutate(deleteId); setDeleteId(null); }}>Excluir</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
