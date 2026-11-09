import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Edit3, Eye, Copy, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/data-table";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { metadataDashboardService, publishConfig } from "@/modules/metadata/service";
import type { MetadataDashboard, DashboardWidget } from "@/modules/metadata/types";
import { DocButton } from "@/components/doc-button";
import { WIDGET_TYPE_LABELS } from "@/modules/metadata/types";

export const Route = createFileRoute("/_app/admin/metadata/dashboards")({
  head: () => ({ meta: [{ title: "Dashboard Designer — ServiceForge" }] }),
  component: DashboardDesignerPage,
});

function DashboardDesignerPage() {
  const qc = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const { data: dashboards = [] } = useQuery({ queryKey: ["metadata", "dashboards"], queryFn: () => metadataDashboardService.list() });

  const deleteMut = useMutation({
    mutationFn: (id: string) => metadataDashboardService.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["metadata", "dashboards"] }); toast.success("Dashboard excluído"); },
  });

  const publishMut = useMutation({
    mutationFn: (id: string) => publishConfig("dashboard", id, "admin-0"),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["metadata", "dashboards"] }); toast.success("Dashboard publicado"); },
  });

  const duplicateMut = useMutation({
    mutationFn: async (id: string) => {
      const d = dashboards.find((d) => d.id === id);
      if (!d) throw new Error("Not found");
      const { id: _oldId, ...rest } = d;
      return metadataDashboardService.create({ ...rest, name: `${d.name} (cópia)`, status: "draft", version: 1, publishedVersion: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["metadata", "dashboards"] }); toast.success("Dashboard duplicado"); },
  });

  const columns: Column<MetadataDashboard>[] = [
    { key: "name", header: "Nome", sortable: true, sortFn: (a, b) => a.name.localeCompare(b.name), render: (d) => (
      <div><div className="font-medium">{d.name}</div><div className="text-xs text-muted-foreground">v{d.version}</div></div>
    )},
    { key: "widgets", header: "Widgets", render: (d) => <span className="text-sm">{d.widgets.length} widget(s)</span> },
    { key: "version", header: "Versão", render: (d) => <span className="text-sm">v{d.version}</span> },
    { key: "status", header: "Status", render: (d) => {
      const map: Record<string, "default" | "secondary" | "outline"> = { published: "default", draft: "secondary", archived: "outline" };
      return <Badge variant={map[d.status] ?? "secondary"}>{d.status}</Badge>;
    }},
    { key: "level", header: "Nível", render: (d) => <Badge variant="outline" className="capitalize">{d.level}</Badge> },
    { key: "actions", header: "Ações", render: (d) => (
      <div className="flex gap-1">
        <Button size="sm" variant="ghost" onClick={() => setPreviewId(previewId === d.id ? null : d.id)}><Eye className="h-4 w-4" /></Button>
        <Button size="sm" variant="ghost" onClick={() => duplicateMut.mutate(d.id)}><Copy className="h-4 w-4" /></Button>
        {d.status === "draft" && <Button size="sm" variant="ghost" onClick={() => publishMut.mutate(d.id)}><Send className="h-4 w-4 text-green-500" /></Button>}
        <Button size="sm" variant="ghost" onClick={() => setDeleteId(d.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard Designer</h1>
          <DocButton module="admin" page="dashboards" title="Dashboard Designer" />
        </div>
        <p className="text-sm text-muted-foreground">Designer visual de dashboards ({dashboards.length} dashboards)</p>
      </div>

      <DataTable data={dashboards} columns={columns} keyExtractor={(d) => d.id} searchKeys={["name", "description"]} initialSortColumn="name" />

      {previewId && (() => {
        const dash = dashboards.find((d) => d.id === previewId);
        if (!dash) return null;
        return (
          <Card>
            <CardHeader><CardTitle className="text-base">Preview: {dash.name}</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{dash.description || "Sem descrição"}</p>
                <div className="grid grid-cols-2 gap-2">
                  {dash.widgets.map((w) => (
                    <div key={w.id} className="border rounded-md p-3 text-sm">
                      <div className="font-medium">{w.title}</div>
                      <Badge variant="outline" className="text-[10px]">{WIDGET_TYPE_LABELS[w.type]}</Badge>
                      {w.config && Object.keys(w.config).length > 0 && <pre className="text-[10px] mt-1 bg-muted p-1 rounded truncate">{JSON.stringify(w.config).slice(0, 80)}...</pre>}
                    </div>
                  ))}
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
