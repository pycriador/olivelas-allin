import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Edit3, FileText, Download, Copy, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/data-table";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { metadataTemplateService, metadataEntityService } from "@/modules/metadata/service";
import type { MetadataTemplate } from "@/modules/metadata/types";
import { DocButton } from "@/components/doc-button";
import { TEMPLATE_TYPE_LABELS } from "@/modules/metadata/types";

export const Route = createFileRoute("/_app/admin/metadata/templates")({
  head: () => ({ meta: [{ title: "Template Registry — ServiceForge" }] }),
  component: TemplateRegistryPage,
});

function TemplateRegistryPage() {
  const qc = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: templates = [] } = useQuery({ queryKey: ["metadata", "templates"], queryFn: () => metadataTemplateService.list() });
  const { data: entities = [] } = useQuery({ queryKey: ["metadata", "entities"], queryFn: () => metadataEntityService.list() });

  const deleteMut = useMutation({
    mutationFn: (id: string) => metadataTemplateService.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["metadata", "templates"] }); toast.success("Template excluído"); },
  });

  const duplicateMut = useMutation({
    mutationFn: async (id: string) => {
      const t = templates.find((t) => t.id === id);
      if (!t) throw new Error("Not found");
      const { id: _oldId, ...rest } = t;
      return metadataTemplateService.create({ ...rest, name: `${t.name} (cópia)`, status: "draft", version: 1, publishedVersion: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["metadata", "templates"] }); toast.success("Template duplicado"); },
  });

  const getEntityName = (id?: string | null) => id ? entities.find((e) => e.id === id)?.name ?? id : "—";

  const columns: Column<MetadataTemplate>[] = [
    { key: "name", header: "Nome", sortable: true, sortFn: (a, b) => a.name.localeCompare(b.name), render: (t) => (
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-muted-foreground" />
        <div><div className="font-medium">{t.name}</div><div className="text-xs text-muted-foreground">{getEntityName(t.entityId)}</div></div>
      </div>
    )},
    { key: "type", header: "Tipo", render: (t) => <Badge variant="outline">{TEMPLATE_TYPE_LABELS[t.type] ?? t.type}</Badge> },
    { key: "category", header: "Categoria", render: (t) => <Badge variant="secondary">{t.category}</Badge> },
    { key: "scope", header: "Escopo", render: (t) => <Badge variant="outline" className="capitalize">{t.scope}</Badge> },
    { key: "version", header: "Versão", render: (t) => <span className="text-sm">v{t.version}</span> },
    { key: "status", header: "Status", render: (t) => {
      const map: Record<string, "default" | "secondary" | "outline"> = { published: "default", draft: "secondary", archived: "outline" };
      return <Badge variant={map[t.status] ?? "secondary"}>{t.status}</Badge>;
    }},
    { key: "actions", header: "Ações", render: (t) => (
      <div className="flex gap-1">
        <Button size="sm" variant="ghost" onClick={() => window.open(`/api/templates/${t.id}/download`, "_blank")}><Download className="h-4 w-4" /></Button>
        <Button size="sm" variant="ghost" onClick={() => duplicateMut.mutate(t.id)}><Copy className="h-4 w-4" /></Button>
        <Button size="sm" variant="ghost" onClick={() => setDeleteId(t.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Template Registry</h1>
          <DocButton module="admin" page="templates" title="Template Registry" />
        </div>
        <p className="text-sm text-muted-foreground">Registro central de templates ({templates.length} templates)</p>
      </div>

      <DataTable data={templates} columns={columns} keyExtractor={(t) => t.id} searchKeys={["name", "description", "type", "category"]} initialSortColumn="name" />

      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }} onConfirm={() => { if (deleteId) { deleteMut.mutate(deleteId); setDeleteId(null); } }} />
    </div>
  );
}
