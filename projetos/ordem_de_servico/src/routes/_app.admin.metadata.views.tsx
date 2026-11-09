import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Edit3, Eye, Copy, Send, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/data-table";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { metadataViewService, metadataEntityService, publishConfig } from "@/modules/metadata/service";
import type { MetadataView, ViewColumn } from "@/modules/metadata/types";
import { DocButton } from "@/components/doc-button";
import { VIEW_MODE_LABELS } from "@/modules/metadata/types";

export const Route = createFileRoute("/_app/admin/metadata/views")({
  head: () => ({ meta: [{ title: "View Designer — ServiceForge" }] }),
  component: ViewDesignerPage,
});

function ViewDesignerPage() {
  const qc = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const { data: views = [] } = useQuery({ queryKey: ["metadata", "views"], queryFn: () => metadataViewService.list() });
  const { data: entities = [] } = useQuery({ queryKey: ["metadata", "entities"], queryFn: () => metadataEntityService.list() });

  const deleteMut = useMutation({
    mutationFn: (id: string) => metadataViewService.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["metadata", "views"] }); toast.success("Visualização excluída"); },
  });

  const publishMut = useMutation({
    mutationFn: (id: string) => publishConfig("view", id, "admin-0"),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["metadata", "views"] }); toast.success("Visualização publicada"); },
  });

  const duplicateMut = useMutation({
    mutationFn: async (id: string) => {
      const v = views.find((v) => v.id === id);
      if (!v) throw new Error("Not found");
      const { id: _oldId, ...rest } = v;
      return metadataViewService.create({ ...rest, name: `${v.name} (cópia)`, status: "draft", version: 1, publishedVersion: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["metadata", "views"] }); toast.success("Visualização duplicada"); },
  });

  const getEntityName = (id: string) => entities.find((e) => e.id === id)?.name ?? id;

  const columns: Column<MetadataView>[] = [
    { key: "name", header: "Nome", sortable: true, sortFn: (a, b) => a.name.localeCompare(b.name), render: (v) => (
      <div><div className="font-medium">{v.name}</div><div className="text-xs text-muted-foreground">{getEntityName(v.entityId)}</div></div>
    )},
    { key: "mode", header: "Modo", render: (v) => <Badge variant="outline">{VIEW_MODE_LABELS[v.mode]}</Badge> },
    { key: "columns", header: "Colunas", render: (v) => <span className="text-sm">{v.columns.length} col.</span> },
    { key: "version", header: "Versão", render: (v) => <span className="text-sm">v{v.version}</span> },
    { key: "status", header: "Status", render: (v) => {
      const map: Record<string, "default" | "secondary" | "outline"> = { published: "default", draft: "secondary", archived: "outline" };
      return <Badge variant={map[v.status] ?? "secondary"}>{v.status}</Badge>;
    }},
    { key: "actions", header: "Ações", render: (v) => (
      <div className="flex gap-1">
        <Button size="sm" variant="ghost" onClick={() => setPreviewId(previewId === v.id ? null : v.id)}><Eye className="h-4 w-4" /></Button>
        <Button size="sm" variant="ghost" onClick={() => duplicateMut.mutate(v.id)}><Copy className="h-4 w-4" /></Button>
        {v.status === "draft" && <Button size="sm" variant="ghost" onClick={() => publishMut.mutate(v.id)}><Send className="h-4 w-4 text-green-500" /></Button>}
        <Button size="sm" variant="ghost" onClick={() => setDeleteId(v.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">View Designer</h1>
          <DocButton module="admin" page="views" title="View Designer" />
        </div>
        <p className="text-sm text-muted-foreground">Designer visual de visualizações ({views.length} views)</p>
      </div>

      <DataTable data={views} columns={columns} keyExtractor={(v) => v.id} searchKeys={["name", "description"]} initialSortColumn="name" />

      {previewId && (() => {
        const view = views.find((v) => v.id === previewId);
        if (!view) return null;
        return (
          <Card>
            <CardHeader><CardTitle className="text-base">Preview: {view.name}</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex gap-2 flex-wrap">
                  <Badge className="capitalize">Modo: {VIEW_MODE_LABELS[view.mode]}</Badge>
                  <Badge variant="outline">{view.columns.length} colunas</Badge>
                  <Badge variant="outline">{view.filters.length} filtros</Badge>
                  <Badge variant="outline">Página: {view.pageSize}</Badge>
                </div>
                <div className="text-sm text-muted-foreground mt-2 border rounded-md p-2">
                  <p>{view.description || "Sem descrição"}</p>
                  {view.columns.length > 0 && (
                    <div className="mt-2">
                      <span className="text-xs font-semibold">Colunas: </span>
                      <span className="text-xs">{view.columns.sort((a, b) => a.order - b.order).map((c) => c.label).join(", ")}</span>
                    </div>
                  )}
                  {view.defaultSort && <div className="text-xs mt-1">Ordenação: {view.defaultSort} ({view.defaultSortDir})</div>}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })()}

      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }} onConfirm={() => { if (deleteId) { deleteMut.mutate(deleteId); setDeleteId(null); } }} />
    </div>
  );
}
