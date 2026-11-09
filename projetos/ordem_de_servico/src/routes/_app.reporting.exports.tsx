import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Trash2, FileText, FileSpreadsheet, File, FileJson, FileImage } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable, type Column } from "@/components/data-table";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { exportService } from "@/modules/reporting/service";
import type { ExportJob } from "@/modules/reporting/types";

export const Route = createFileRoute("/_app/reporting/exports")({
  head: () => ({ meta: [{ title: "Reporting Exportações — ServiceForge" }] }),
  component: ReportingExportsPage,
});

const formatOptions = [
  { value: "pdf", label: "PDF", icon: FileText },
  { value: "excel", label: "Excel", icon: FileSpreadsheet },
  { value: "csv", label: "CSV", icon: File },
  { value: "json", label: "JSON", icon: FileJson },
  { value: "xml", label: "XML", icon: File },
  { value: "html", label: "HTML", icon: File },
  { value: "markdown", label: "Markdown", icon: File },
  { value: "png", label: "PNG", icon: FileImage },
  { value: "svg", label: "SVG", icon: FileImage },
  { value: "pptx", label: "PPTX", icon: File },
];

const statusOptions = [
  { value: "completed", label: "Concluído" },
  { value: "failed", label: "Falhou" },
  { value: "processing", label: "Processando" },
  { value: "pending", label: "Pendente" },
];

function formatFileSize(bytes?: number): string {
  if (bytes == null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function ReportingExportsPage() {
  const qc = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterFormat, setFilterFormat] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const { data: exports = [] } = useQuery({
    queryKey: ["reporting", "exports"],
    queryFn: () => exportService.list(),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => exportService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reporting", "exports"] });
      toast.success("Exportação excluída com sucesso");
    },
    onError: () => toast.error("Erro ao excluir exportação"),
  });

  const getStatusBadge = (status: string) => {
    const map: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      completed: { variant: "default", label: "Concluído" },
      failed: { variant: "destructive", label: "Falhou" },
      processing: { variant: "secondary", label: "Processando" },
      pending: { variant: "outline", label: "Pendente" },
    };
    const m = map[status] ?? map.pending;
    return <Badge variant={m.variant}>{m.label}</Badge>;
  };

  const formatLabel = (fmt: string) => formatOptions.find((o) => o.value === fmt)?.label ?? fmt;

  const filtered = exports.filter((e) => {
    if (filterFormat !== "all" && e.format !== filterFormat) return false;
    if (filterStatus !== "all" && e.status !== filterStatus) return false;
    return true;
  });

  const columns: Column<ExportJob>[] = [
    {
      key: "reportName",
      header: "Relatório",
      sortable: true,
      sortFn: (a, b) => a.reportName.localeCompare(b.reportName),
      render: (e) => <span className="font-medium">{e.reportName}</span>,
    },
    {
      key: "format",
      header: "Formato",
      render: (e) => {
        const opt = formatOptions.find((o) => o.value === e.format);
        const Icon = opt?.icon ?? File;
        return (
          <div className="flex items-center gap-1.5">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className="uppercase text-xs font-mono">{formatLabel(e.format)}</span>
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (e) => getStatusBadge(e.status),
    },
    {
      key: "fileSize",
      header: "Tamanho",
      render: (e) => <span className="text-sm text-muted-foreground">{formatFileSize(e.fileSize)}</span>,
    },
    {
      key: "startedAt",
      header: "Iniciado Em",
      render: (e) => <span className="text-sm text-muted-foreground">{new Date(e.startedAt).toLocaleString("pt-BR")}</span>,
    },
    {
      key: "completedAt",
      header: "Concluído Em",
      render: (e) => (e.completedAt ? <span className="text-sm text-muted-foreground">{new Date(e.completedAt).toLocaleString("pt-BR")}</span> : <span className="text-sm text-muted-foreground">—</span>),
    },
    {
      key: "createdBy",
      header: "Criado Por",
      render: (e) => <span className="text-sm text-muted-foreground">{e.createdBy}</span>,
    },
    {
      key: "actions",
      header: "Ações",
      render: (e) => (
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={() => setDeleteId(e.id)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Exportações</h1>
          <p className="text-sm text-muted-foreground">Histórico de exportações de relatórios</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Formato:</span>
          <Select value={filterFormat} onValueChange={setFilterFormat}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {formatOptions.map((o) => (
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
            <SelectTrigger className="w-40">
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

      <DataTable
        data={filtered}
        columns={columns}
        keyExtractor={(e) => e.id}
        searchKeys={["reportName"]}
        initialSortColumn="startedAt"
        initialSortDirection="desc"
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => {
          if (!o) setDeleteId(null);
        }}
        onConfirm={() => {
          if (deleteId) {
            deleteMut.mutate(deleteId);
            setDeleteId(null);
          }
        }}
        title="Excluir Exportação"
        description="Tem certeza que deseja excluir este registro de exportação? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
      />
    </div>
  );
}