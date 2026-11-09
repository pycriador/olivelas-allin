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
import { metadataFormService, metadataEntityService, metadataFieldService, publishConfig } from "@/modules/metadata/service";
import { DocButton } from "@/components/doc-button";
import type { MetadataForm, FormTab, FormSection } from "@/modules/metadata/types";

export const Route = createFileRoute("/_app/admin/metadata/forms")({
  head: () => ({ meta: [{ title: "Form Designer — ServiceForge" }] }),
  component: FormDesignerPage,
});

function FormDesignerPage() {
  const qc = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const { data: forms = [] } = useQuery({ queryKey: ["metadata", "forms"], queryFn: () => metadataFormService.list() });
  const { data: entities = [] } = useQuery({ queryKey: ["metadata", "entities"], queryFn: () => metadataEntityService.list() });
  const { data: fields = [] } = useQuery({ queryKey: ["metadata", "fields"], queryFn: () => metadataFieldService.list() });

  const deleteMut = useMutation({
    mutationFn: (id: string) => metadataFormService.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["metadata", "forms"] }); toast.success("Formulário excluído"); },
  });

  const publishMut = useMutation({
    mutationFn: (id: string) => publishConfig("form", id, "admin-0"),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["metadata", "forms"] }); toast.success("Formulário publicado"); },
  });

  const duplicateMut = useMutation({
    mutationFn: async (id: string) => {
      const f = forms.find((f) => f.id === id);
      if (!f) throw new Error("Not found");
      const { id: _oldId, ...rest } = f;
      return metadataFormService.create({ ...rest, name: `${f.name} (cópia)`, status: "draft", version: 1, publishedVersion: null, duplicatedFrom: f.id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["metadata", "forms"] }); toast.success("Formulário duplicado"); },
  });

  const getEntityName = (id: string) => entities.find((e) => e.id === id)?.name ?? id;

  const columns: Column<MetadataForm>[] = [
    { key: "name", header: "Nome", sortable: true, sortFn: (a, b) => a.name.localeCompare(b.name), render: (f) => (
      <div><div className="font-medium">{f.name}</div><div className="text-xs text-muted-foreground">{getEntityName(f.entityId)}</div></div>
    )},
    { key: "tabs", header: "Abas", render: (f) => <span className="text-sm">{f.tabs.length} aba(s)</span> },
    { key: "version", header: "Versão", render: (f) => <span className="text-sm">v{f.version}</span> },
    { key: "status", header: "Status", render: (f) => {
      const map: Record<string, "default" | "secondary" | "outline"> = { published: "default", draft: "secondary", archived: "outline" };
      return <Badge variant={map[f.status] ?? "secondary"}>{f.status}</Badge>;
    }},
    { key: "level", header: "Nível", render: (f) => <Badge variant="outline" className="capitalize">{f.level}</Badge> },
    { key: "actions", header: "Ações", render: (f) => (
      <div className="flex gap-1">
        <Button size="sm" variant="ghost" onClick={() => setPreviewId(previewId === f.id ? null : f.id)}><Eye className="h-4 w-4" /></Button>
        <Button size="sm" variant="ghost" onClick={() => duplicateMut.mutate(f.id)}><Copy className="h-4 w-4" /></Button>
        {f.status === "draft" && <Button size="sm" variant="ghost" onClick={() => publishMut.mutate(f.id)}><Send className="h-4 w-4 text-green-500" /></Button>}
        <Button size="sm" variant="ghost" onClick={() => setDeleteId(f.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Form Designer</h1>
          <DocButton module="admin" page="forms" title="Form Designer" />
        </div>
        <p className="text-sm text-muted-foreground">Designer visual de formulários ({forms.length} formulários)</p>
      </div>

      <DataTable data={forms} columns={columns} keyExtractor={(f) => f.id} searchKeys={["name", "description"]} initialSortColumn="name" />

      {previewId && (() => {
        const form = forms.find((f) => f.id === previewId);
        if (!form) return null;
        const entityFields = fields.filter((f) => f.entityId === form.entityId);
        return (
          <Card>
            <CardHeader><CardTitle className="text-base">Preview: {form.name}</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {form.tabs.sort((a, b) => a.order - b.order).map((tab) => (
                  <div key={tab.id}>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <span>{tab.label}</span>
                      <Badge variant="outline" className="text-[10px]">Aba</Badge>
                    </h4>
                    <div className="grid grid-cols-2 gap-4 pl-4 border-l-2">
                      {form.sections.filter((s) => s.tabId === tab.id).sort((a, b) => a.order - b.order).map((sec) => (
                        <div key={sec.id} className="border rounded-md p-3">
                          <div className="text-xs font-medium text-muted-foreground mb-2 capitalize">{sec.type}: {sec.label}</div>
                          <div className={`grid gap-2 ${sec.columns === 2 ? "grid-cols-2" : "grid-cols-1"}`}>
                            {sec.fieldIds.map((fid) => {
                              const ef = entityFields.find((f) => f.id === fid);
                              return ef ? <div key={fid} className="text-sm border rounded px-2 py-1 bg-muted/30">{ef.label} <Badge variant="outline" className="text-[10px]">{ef.type}</Badge></div> : null;
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })()}

      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }} onConfirm={() => { if (deleteId) { deleteMut.mutate(deleteId); setDeleteId(null); } }} />
    </div>
  );
}
