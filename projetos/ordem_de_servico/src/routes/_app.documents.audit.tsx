import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Download, FileText, Filter, User, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { DataTable, type Column } from "@/components/data-table";
import { documentService, historyService } from "@/modules/documents/service";
import { DocButton } from "@/components/doc-button";
import type { DocHistory, DocEventType } from "@/modules/documents/types";
import { DOC_EVENT_LABELS } from "@/modules/documents/types";

export const Route = createFileRoute("/_app/documents/audit")({
  head: () => ({ meta: [{ title: "Document Audit — ServiceForge" }] }),
  component: AuditPage,
});

const EVENT_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  created: "default", edited: "default", exported: "secondary", printed: "secondary",
  signed: "default", archived: "destructive", deleted: "destructive", restored: "outline",
  viewed: "outline", shared: "outline", duplicated: "secondary", generated: "default",
};

function AuditPage() {
  const [eventFilter, setEventFilter] = useState<string>("all");
  const [docFilter, setDocFilter] = useState<string>("all");
  const [page, setPage] = useState(0);

  const { data: documents = [] } = useQuery({ queryKey: ["documents"], queryFn: () => documentService.list() });
  const { data: allHistory = [] } = useQuery({ queryKey: ["documents", "history-all"], queryFn: () => historyService.list() });

  const filtered = allHistory.filter((h) => {
    if (eventFilter !== "all" && h.event !== eventFilter) return false;
    if (docFilter !== "all" && h.documentId !== docFilter) return false;
    return true;
  });

  const pageSize = 15;
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice(page * pageSize, (page + 1) * pageSize);

  const handleExportCsv = () => {
    const headers = ["Evento", "Documento", "Usuário", "Descrição", "Data"];
    const rows = filtered.map((h) => [
      DOC_EVENT_LABELS[h.event] || h.event,
      documents.find((d) => d.id === h.documentId)?.name || h.documentId,
      h.userName,
      h.description,
      new Date(h.createdAt).toISOString(),
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `document-audit-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado");
  };

  const columns: Column<DocHistory>[] = [
    { key: "event", header: "Evento", sortable: true, sortFn: (a, b) => a.event.localeCompare(b.event), render: (h) => (
      <Badge variant={EVENT_COLORS[h.event] || "outline"}>{DOC_EVENT_LABELS[h.event] || h.event}</Badge>
    )},
    { key: "documentId", header: "Documento", render: (h) => {
      const doc = documents.find((d) => d.id === h.documentId);
      return (
        <span className="flex items-center gap-1 text-sm">
          <FileText className="h-3 w-3 text-muted-foreground" />
          {doc?.name || h.documentId}
        </span>
      );
    }},
    { key: "userName", header: "Usuário", render: (h) => (
      <span className="flex items-center gap-1 text-sm"><User className="h-3 w-3" />{h.userName}</span>
    )},
    { key: "description", header: "Descrição", render: (h) => <span className="text-sm">{h.description}</span> },
    { key: "createdAt", header: "Data", sortable: true, sortFn: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(), render: (h) => (
      <span className="flex items-center gap-1 text-sm text-muted-foreground"><Calendar className="h-3 w-3" />{new Date(h.createdAt).toLocaleString()}</span>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Auditoria de Documentos</h1>
          <DocButton module="documents" page="audit" />
          <p className="text-sm text-muted-foreground">Visualize todos os eventos dos documentos</p>
        </div>
        <Button variant="outline" onClick={handleExportCsv} disabled={filtered.length === 0}>
          <Download className="mr-2 h-4 w-4" />Exportar CSV
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Filter className="h-4 w-4" />Filtros</CardTitle></CardHeader>
        <CardContent className="flex gap-4">
          <div className="w-56">
            <Select value={eventFilter} onValueChange={(v) => { setEventFilter(v); setPage(0); }}>
              <SelectTrigger><SelectValue placeholder="Tipo de evento" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os eventos</SelectItem>
                {Object.entries(DOC_EVENT_LABELS).map(([k, l]) => (
                  <SelectItem key={k} value={k}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-56">
            <Select value={docFilter} onValueChange={(v) => { setDocFilter(v); setPage(0); }}>
              <SelectTrigger><SelectValue placeholder="Documento" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os documentos</SelectItem>
                {documents.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            {filtered.length} registro(s)
          </div>
        </CardContent>
      </Card>

      <DataTable
        data={paginated}
        columns={columns}
        keyExtractor={(h) => h.id}
        searchKeys={["description", "userName"]}
        initialSortColumn="createdAt"
      />

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>Anterior</Button>
          <span className="text-sm text-muted-foreground">
            Página {page + 1} de {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>Próxima</Button>
        </div>
      )}
    </div>
  );
}
