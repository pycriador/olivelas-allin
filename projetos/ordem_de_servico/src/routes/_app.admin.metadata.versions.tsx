import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { RotateCcw, CheckCircle2, Eye, GitCompareArrows } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/data-table";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { metadataVersionService } from "@/modules/metadata/service";
import { DocButton } from "@/components/doc-button";
import type { MetadataVersion } from "@/modules/metadata/types";

export const Route = createFileRoute("/_app/admin/metadata/versions")({
  head: () => ({ meta: [{ title: "Version Manager — ServiceForge" }] }),
  component: VersionManagerPage,
});

const ENTITY_TYPE_LABELS: Record<string, string> = {
  entity: "Entidade", field: "Campo", form: "Formulário", view: "Visualização",
  dashboard: "Dashboard", template: "Template",
};

function VersionManagerPage() {
  const qc = useQueryClient();
  const [compareId, setCompareId] = useState<string | null>(null);
  const [revertId, setRevertId] = useState<string | null>(null);

  const { data: versions = [] } = useQuery({ queryKey: ["metadata", "versions"], queryFn: () => metadataVersionService.list() });

  const revertMut = useMutation({
    mutationFn: async (id: string) => {
      const ver = versions.find((v) => v.id === id);
      if (!ver) throw new Error("Not found");
      const newVer = await metadataVersionService.create({
        entityType: ver.entityType, entityId: ver.entityId,
        version: ver.version + 1, status: "draft",
        data: ver.data, comparison: "", createdBy: "admin-0", createdAt: new Date().toISOString(),
        description: `Revertido para v${ver.version}`,
      });
      toast.success(`Revertido para v${ver.version} → v${newVer.version}`);
      return newVer;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["metadata", "versions"] }); },
  });

  const columns: Column<MetadataVersion>[] = [
    { key: "entity", header: "Entidade", sortable: true, render: (v) => (
      <div><div className="font-medium text-sm">{ENTITY_TYPE_LABELS[v.entityType] ?? v.entityType}</div><div className="text-xs text-muted-foreground">{v.entityId.slice(0, 12)}...</div></div>
    )},
    { key: "version", header: "Versão", render: (v) => <Badge variant="outline">v{v.version}</Badge> },
    { key: "status", header: "Status", render: (v) => {
      const map: Record<string, "default" | "secondary" | "outline"> = { published: "default", draft: "secondary", archived: "outline" };
      return <Badge variant={map[v.status] ?? "secondary"}>{v.status}</Badge>;
    }},
    { key: "description", header: "Descrição", render: (v) => <span className="text-xs text-muted-foreground">{v.description || "—"}</span> },
    { key: "author", header: "Autor", render: (v) => <span className="text-sm text-muted-foreground">{v.createdBy}</span> },
    { key: "date", header: "Data", render: (v) => <span className="text-sm text-muted-foreground">{new Date(v.createdAt).toLocaleString("pt-BR")}</span> },
    { key: "actions", header: "Ações", render: (v) => (
      <div className="flex gap-1">
        <Button size="sm" variant="ghost" onClick={() => setCompareId(compareId === v.id ? null : v.id)}>
          <Eye className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setRevertId(v.id)}>
          <RotateCcw className="h-4 w-4 text-amber-500" />
        </Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Version Manager</h1>
          <DocButton module="admin" page="versions" title="Version Manager" />
        </div>
        <p className="text-sm text-muted-foreground">Gerencie versões de metadados ({versions.length} versões)</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Histórico de Versões</CardTitle><CardDescription>Todas as versões de todas as entidades de metadados</CardDescription></CardHeader>
        <CardContent>
          <DataTable data={versions} columns={columns} keyExtractor={(v) => v.id} searchKeys={["entityType", "entityId", "createdBy"]} initialSortColumn="version" />
        </CardContent>
      </Card>

      {compareId && (() => {
        const ver = versions.find((v) => v.id === compareId);
        if (!ver) return null;
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <GitCompareArrows className="h-4 w-4" />
                Detalhes: {ENTITY_TYPE_LABELS[ver.entityType]} v{ver.version}
              </CardTitle>
              <CardDescription>Dados da versão {ver.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <div className="text-xs font-semibold text-muted-foreground mb-2">Dados da Versão</div>
                <pre className="text-xs bg-muted p-3 rounded-md max-h-60 overflow-auto">{JSON.stringify(ver.data, null, 2)}</pre>
              </div>
            </CardContent>
          </Card>
        );
      })()}

      <ConfirmDialog
        open={!!revertId}
        onOpenChange={(o) => { if (!o) setRevertId(null); }}
        title="Reverter Versão"
        description="Uma nova versão draft será criada com os dados desta versão. Deseja continuar?"
        onConfirm={() => { if (revertId) { revertMut.mutate(revertId); setRevertId(null); } }}
      />
    </div>
  );
}
