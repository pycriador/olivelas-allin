import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  Eye, Copy, Archive, CheckCircle2, RotateCcw, FileText, Tag, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/data-table";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { templateService, publishTemplate, archiveTemplate, restoreTemplate, duplicateTemplate } from "@/modules/documents/service";
import { DocButton } from "@/components/doc-button";
import type { DocTemplate } from "@/modules/documents/types";
import { TEMPLATE_CATEGORIES, TEMPLATE_CATEGORY_LABELS } from "@/modules/documents/types";

export const Route = createFileRoute("/_app/documents/templates")({
  head: () => ({ meta: [{ title: "Template Library — ServiceForge" }] }),
  component: TemplateLibraryPage,
});

function TemplateLibraryPage() {
  const qc = useQueryClient();
  const [selectedTpl, setSelectedTpl] = useState<DocTemplate | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [archiveId, setArchiveId] = useState<string | null>(null);
  const [publishId, setPublishId] = useState<string | null>(null);
  const [restoreId, setRestoreId] = useState<string | null>(null);

  const { data: templates = [] } = useQuery({
    queryKey: ["documents", "templates"],
    queryFn: () => templateService.list(),
  });

  const filtered = categoryFilter
    ? templates.filter((t) => t.category === categoryFilter)
    : templates;

  const publishMut = useMutation({
    mutationFn: (id: string) => publishTemplate(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["documents", "templates"] }); toast.success("Template publicado"); },
  });

  const archiveMut = useMutation({
    mutationFn: (id: string) => archiveTemplate(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["documents", "templates"] }); toast.success("Template arquivado"); },
  });

  const restoreMut = useMutation({
    mutationFn: (id: string) => restoreTemplate(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["documents", "templates"] }); toast.success("Template restaurado"); },
  });

  const duplicateMut = useMutation({
    mutationFn: (id: string) => duplicateTemplate(id, `Cópia de ${templates.find((t) => t.id === id)?.name ?? ""}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["documents", "templates"] }); toast.success("Template duplicado"); },
  });

  const columns: Column<DocTemplate>[] = [
    { key: "name", header: "Nome", sortable: true, sortFn: (a, b) => a.name.localeCompare(b.name), render: (e) => (
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => setSelectedTpl(selectedTpl?.id === e.id ? null : e)}>
        <FileText className="h-4 w-4 text-muted-foreground" />
        <div>
          <div className="font-medium">{e.name}</div>
          <div className="text-xs text-muted-foreground">{e.description}</div>
        </div>
      </div>
    )},
    { key: "category", header: "Categoria", sortable: true, sortFn: (a, b) => a.category.localeCompare(b.category), render: (e) => <Badge variant="outline">{TEMPLATE_CATEGORY_LABELS[e.category]}</Badge> },
    { key: "version", header: "Versão", render: (e) => <span className="text-sm">v{e.version}</span> },
    { key: "status", header: "Status", render: (e) => (
      <Badge variant={e.status === "published" ? "default" : e.status === "archived" ? "secondary" : "outline"} className="gap-1">
        {e.status === "published" ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
        {e.status === "published" ? "Publicado" : e.status === "archived" ? "Arquivado" : "Rascunho"}
      </Badge>
    )},
    { key: "tags", header: "Tags", render: (e) => (
      <div className="flex gap-1 flex-wrap max-w-[200px]">
        {e.tags.slice(0, 3).map((t) => <Badge key={t} variant="outline" className="text-[10px]"><Tag className="h-3 w-3 mr-1" />{t}</Badge>)}
        {e.tags.length > 3 && <span className="text-xs text-muted-foreground">+{e.tags.length - 3}</span>}
      </div>
    )},
    { key: "actions", header: "Ações", render: (e) => (
      <div className="flex gap-1">
        <Button size="sm" variant="ghost" onClick={() => setSelectedTpl(e)}><Eye className="h-4 w-4" /></Button>
        <Button size="sm" variant="ghost" onClick={() => duplicateMut.mutate(e.id)}><Copy className="h-4 w-4" /></Button>
        {e.status !== "archived" && <Button size="sm" variant="ghost" onClick={() => setArchiveId(e.id)}><Archive className="h-4 w-4" /></Button>}
        {e.status === "draft" && <Button size="sm" variant="ghost" onClick={() => setPublishId(e.id)}><CheckCircle2 className="h-4 w-4" /></Button>}
        {e.status === "archived" && <Button size="sm" variant="ghost" onClick={() => setRestoreId(e.id)}><RotateCcw className="h-4 w-4" /></Button>}
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Template Library</h1>
          <DocButton module="documents" page="templates" />
          <p className="text-sm text-muted-foreground">Gerencie modelos de documentos</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button size="sm" variant={categoryFilter === null ? "default" : "outline"} onClick={() => setCategoryFilter(null)}>Todas</Button>
        {TEMPLATE_CATEGORIES.map((cat) => (
          <Button key={cat} size="sm" variant={categoryFilter === cat ? "default" : "outline"} onClick={() => setCategoryFilter(cat)}>
            {TEMPLATE_CATEGORY_LABELS[cat]}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <DataTable
            data={filtered}
            columns={columns}
            keyExtractor={(e) => e.id}
            searchKeys={["name", "description", "category"]}
            initialSortColumn="name"
          />
        </div>

        {selectedTpl && (
          <div className="xl:col-span-1">
            <Card className="p-4 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold flex items-center gap-2"><FileText className="h-4 w-4" />{selectedTpl.name}</h3>
                  <p className="text-xs text-muted-foreground">{selectedTpl.description}</p>
                </div>
                <Badge variant={selectedTpl.status === "published" ? "default" : "outline"}>{selectedTpl.status}</Badge>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Categoria</span><span>{TEMPLATE_CATEGORY_LABELS[selectedTpl.category]}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Versão</span><span>v{selectedTpl.version}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Componentes</span><span>{selectedTpl.content.length}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Tags</span><div className="flex gap-1 flex-wrap">{selectedTpl.tags.map((t) => <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>)}</div></div>
              </div>
              <div className="border-t pt-4 space-y-2">
                <Button size="sm" variant="outline" className="w-full" onClick={() => duplicateMut.mutate(selectedTpl.id)}><Copy className="mr-2 h-4 w-4" />Duplicar</Button>
                {selectedTpl.status !== "archived" && <Button size="sm" variant="outline" className="w-full" onClick={() => setArchiveId(selectedTpl.id)}><Archive className="mr-2 h-4 w-4" />Arquivar</Button>}
                {selectedTpl.status === "draft" && <Button size="sm" className="w-full" onClick={() => setPublishId(selectedTpl.id)}><CheckCircle2 className="mr-2 h-4 w-4" />Publicar</Button>}
                {selectedTpl.status === "archived" && <Button size="sm" variant="outline" className="w-full" onClick={() => setRestoreId(selectedTpl.id)}><RotateCcw className="mr-2 h-4 w-4" />Restaurar</Button>}
              </div>
            </Card>
          </div>
        )}
      </div>

      <ConfirmDialog open={!!archiveId} onOpenChange={(o) => { if (!o) setArchiveId(null); }} onConfirm={() => { if (archiveId) { archiveMut.mutate(archiveId); setArchiveId(null); } }} title="Arquivar Template" description="Tem certeza que deseja arquivar este template?" />
      <ConfirmDialog open={!!publishId} onOpenChange={(o) => { if (!o) setPublishId(null); }} onConfirm={() => { if (publishId) { publishMut.mutate(publishId); setPublishId(null); } }} title="Publicar Template" description="Tem certeza que deseja publicar este template?" />
      <ConfirmDialog open={!!restoreId} onOpenChange={(o) => { if (!o) setRestoreId(null); }} onConfirm={() => { if (restoreId) { restoreMut.mutate(restoreId); setRestoreId(null); } }} title="Restaurar Template" description="Tem certeza que deseja restaurar este template?" />
    </div>
  );
}
