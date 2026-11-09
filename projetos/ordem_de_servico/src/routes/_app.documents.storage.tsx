import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Eye, Archive, RotateCcw, Trash2, FileText, HardDrive, Hash, Globe, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/data-table";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { documentService, archiveDocument, restoreDocument } from "@/modules/documents/service";
import { DocButton } from "@/components/doc-button";
import type { Document } from "@/modules/documents/types";
import { TEMPLATE_CATEGORIES, TEMPLATE_CATEGORY_LABELS } from "@/modules/documents/types";

export const Route = createFileRoute("/_app/documents/storage")({
  head: () => ({ meta: [{ title: "Document Storage — ServiceForge" }] }),
  component: DocumentStoragePage,
});

function DocumentStoragePage() {
  const qc = useQueryClient();
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [archiveId, setArchiveId] = useState<string | null>(null);
  const [restoreId, setRestoreId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: documents = [] } = useQuery({
    queryKey: ["documents", "storage"],
    queryFn: () => documentService.list(),
  });

  const filtered = documents.filter((d) => {
    if (categoryFilter && d.category !== categoryFilter) return false;
    if (statusFilter === "active" && d.status === "archived") return false;
    if (statusFilter === "archived" && d.status !== "archived") return false;
    return true;
  });

  const archiveMut = useMutation({
    mutationFn: (id: string) => archiveDocument(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["documents", "storage"] }); toast.success("Documento arquivado"); },
  });

  const restoreMut = useMutation({
    mutationFn: (id: string) => restoreDocument(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["documents", "storage"] }); toast.success("Documento restaurado"); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => documentService.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["documents", "storage"] }); toast.success("Documento excluído"); },
  });

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  const columns: Column<Document>[] = [
    { key: "name", header: "Nome", sortable: true, sortFn: (a, b) => a.name.localeCompare(b.name), render: (e) => (
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => setSelectedDoc(selectedDoc?.id === e.id ? null : e)}>
        <FileText className="h-4 w-4 text-muted-foreground" />
        <div>
          <div className="font-medium">{e.name}</div>
          <div className="text-xs text-muted-foreground">{new Date(e.createdAt).toLocaleDateString()}</div>
        </div>
      </div>
    )},
    { key: "category", header: "Categoria", render: (e) => <Badge variant="outline">{TEMPLATE_CATEGORY_LABELS[e.category]}</Badge> },
    { key: "templateId", header: "Template", render: (e) => <span className="text-sm text-muted-foreground truncate max-w-[120px] inline-block">{e.templateId}</span> },
    { key: "templateVersion", header: "Versão", render: (e) => <span className="text-sm">v{e.templateVersion}</span> },
    { key: "hash", header: "Hash", render: (e) => (
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Hash className="h-3 w-3" />
        <code className="truncate max-w-[80px] inline-block">{e.hash.substring(0, 12)}...</code>
      </div>
    )},
    { key: "format", header: "Formato", render: (e) => <Badge variant="outline" className="uppercase text-[10px]">{e.format}</Badge> },
    { key: "size", header: "Tamanho", sortable: true, sortFn: (a, b) => a.size - b.size, render: (e) => (
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <HardDrive className="h-3 w-3" />
        {formatSize(e.size)}
      </div>
    )},
    { key: "status", header: "Status", render: (e) => (
      <Badge variant={e.status === "archived" ? "secondary" : "default"}>{e.status === "archived" ? "Arquivado" : "Ativo"}</Badge>
    )},
    { key: "createdAt", header: "Data", sortable: true, sortFn: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(), render: (e) => <span className="text-sm text-muted-foreground">{new Date(e.createdAt).toLocaleDateString()}</span> },
    { key: "actions", header: "Ações", render: (e) => (
      <div className="flex gap-1">
        <Button size="sm" variant="ghost" onClick={() => setSelectedDoc(e)}><Eye className="h-4 w-4" /></Button>
        {e.status !== "archived" && <Button size="sm" variant="ghost" onClick={() => setArchiveId(e.id)}><Archive className="h-4 w-4" /></Button>}
        {e.status === "archived" && <Button size="sm" variant="ghost" onClick={() => setRestoreId(e.id)}><RotateCcw className="h-4 w-4" /></Button>}
        <Button size="sm" variant="ghost" onClick={() => setDeleteId(e.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Document Storage</h1>
          <DocButton module="documents" page="storage" />
          <p className="text-sm text-muted-foreground">Gerencie documentos armazenados</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button size="sm" variant={categoryFilter === null ? "default" : "outline"} onClick={() => setCategoryFilter(null)}>Todas Categorias</Button>
        {TEMPLATE_CATEGORIES.map((cat) => (
          <Button key={cat} size="sm" variant={categoryFilter === cat ? "default" : "outline"} onClick={() => setCategoryFilter(cat)}>
            {TEMPLATE_CATEGORY_LABELS[cat]}
          </Button>
        ))}
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant={statusFilter === null ? "default" : "outline"} onClick={() => setStatusFilter(null)}>Todos</Button>
          <Button size="sm" variant={statusFilter === "active" ? "default" : "outline"} onClick={() => setStatusFilter("active")}>Ativos</Button>
          <Button size="sm" variant={statusFilter === "archived" ? "default" : "outline"} onClick={() => setStatusFilter("archived")}>Arquivados</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <DataTable
            data={filtered}
            columns={columns}
            keyExtractor={(e) => e.id}
            searchKeys={["name", "category", "hash", "format"]}
            initialSortColumn="createdAt"
          />
        </div>

        {selectedDoc && (
          <div className="xl:col-span-1">
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between border-b px-4 py-2 bg-muted/30">
                <span className="text-sm font-medium truncate">{selectedDoc.name}</span>
                <Badge variant="outline" className="text-[10px]">{selectedDoc.format}</Badge>
              </div>
              <div className="p-4 bg-white max-h-[500px] overflow-auto" dangerouslySetInnerHTML={{ __html: selectedDoc.content }} />
              <div className="border-t px-4 py-2 space-y-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-1"><Hash className="h-3 w-3" />{selectedDoc.hash.substring(0, 20)}...</div>
                <div className="flex items-center gap-1"><Globe className="h-3 w-3" />{selectedDoc.publicId}</div>
                <div className="flex items-center gap-1"><Tag className="h-3 w-3" />{TEMPLATE_CATEGORY_LABELS[selectedDoc.category]}</div>
              </div>
              <div className="border-t px-4 py-2 flex gap-2">
                {selectedDoc.status !== "archived" && <Button size="sm" variant="outline" className="flex-1" onClick={() => setArchiveId(selectedDoc.id)}><Archive className="mr-2 h-4 w-4" />Arquivar</Button>}
                {selectedDoc.status === "archived" && <Button size="sm" variant="outline" className="flex-1" onClick={() => setRestoreId(selectedDoc.id)}><RotateCcw className="mr-2 h-4 w-4" />Restaurar</Button>}
                <Button size="sm" variant="outline" className="flex-1" onClick={() => setDeleteId(selectedDoc.id)}><Trash2 className="mr-2 h-4 w-4 text-destructive" />Excluir</Button>
              </div>
            </Card>
          </div>
        )}
      </div>

      <ConfirmDialog open={!!archiveId} onOpenChange={(o) => { if (!o) setArchiveId(null); }} onConfirm={() => { if (archiveId) { archiveMut.mutate(archiveId); setArchiveId(null); } }} title="Arquivar Documento" description="Tem certeza que deseja arquivar este documento?" />
      <ConfirmDialog open={!!restoreId} onOpenChange={(o) => { if (!o) setRestoreId(null); }} onConfirm={() => { if (restoreId) { restoreMut.mutate(restoreId); setRestoreId(null); } }} title="Restaurar Documento" description="Tem certeza que deseja restaurar este documento?" />
      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }} onConfirm={() => { if (deleteId) { deleteMut.mutate(deleteId); setDeleteId(null); } }} title="Excluir Documento" description="Tem certeza que deseja excluir este documento? Esta ação não pode ser desfeita." />
    </div>
  );
}
