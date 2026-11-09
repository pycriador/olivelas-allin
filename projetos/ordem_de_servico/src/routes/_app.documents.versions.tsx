import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Eye, FileText, Hash, User, Calendar, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { DataTable, type Column } from "@/components/data-table";
import { documentService, versionService, generateHash, addHistory } from "@/modules/documents/service";
import { DocButton } from "@/components/doc-button";
import type { Document, DocVersion } from "@/modules/documents/types";

export const Route = createFileRoute("/_app/documents/versions")({
  head: () => ({ meta: [{ title: "Document Versions — ServiceForge" }] }),
  component: DocumentVersionsPage,
});

function DocumentVersionsPage() {
  const qc = useQueryClient();
  const [selectedDocId, setSelectedDocId] = useState<string>("");
  const [previewVersion, setPreviewVersion] = useState<DocVersion | null>(null);

  const { data: documents = [] } = useQuery({ queryKey: ["documents"], queryFn: () => documentService.list() });
  const { data: versions = [] } = useQuery({
    queryKey: ["documents", "versions", selectedDocId],
    queryFn: () => versionService.list(selectedDocId || undefined),
    enabled: !!selectedDocId,
  });

  const selectedDoc = documents.find((d) => d.id === selectedDocId);

  const newVersionMut = useMutation({
    mutationFn: async () => {
      if (!selectedDoc) throw new Error("Documento não selecionado");
      const content = selectedDoc.content;
      const hash = generateHash();
      const size = new Blob([content]).size;
      await versionService.create({
        documentId: selectedDoc.id,
        version: selectedDoc.version + 1,
        content,
        hash,
        size,
        createdBy: "system",
        createdAt: new Date().toISOString(),
        description: `Versão ${selectedDoc.version + 1}`,
      });
      await documentService.update(selectedDoc.id, { version: selectedDoc.version + 1, hash, size });
      await addHistory(selectedDoc.id, "edited", "system", "Sistema", `Nova versão v${selectedDoc.version + 1}`);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["documents"] }); toast.success("Nova versão criada"); },
    onError: () => toast.error("Erro ao criar versão"),
  });

  const columns: Column<DocVersion>[] = [
    { key: "version", header: "Versão", sortable: true, sortFn: (a, b) => b.version - a.version, render: (v) => (
      <div className="flex items-center gap-2">
        <span className="font-mono font-medium">v{v.version}</span>
        {selectedDoc && v.version === selectedDoc.version && (
          <Badge variant="default" className="text-[10px] h-5"><BadgeCheck className="h-3 w-3 mr-1" />Atual</Badge>
        )}
      </div>
    )},
    { key: "hash", header: "Hash", render: (v) => (
      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{v.hash.substring(0, 12)}...</code>
    )},
    { key: "size", header: "Tamanho", render: (v) => {
      const kb = (v.size / 1024).toFixed(1);
      return <span className="text-sm">{kb} KB</span>;
    }},
    { key: "createdBy", header: "Criado por", render: (v) => (
      <span className="flex items-center gap-1 text-sm"><User className="h-3 w-3" />{v.createdBy}</span>
    )},
    { key: "createdAt", header: "Data", sortable: true, sortFn: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(), render: (v) => (
      <span className="flex items-center gap-1 text-sm text-muted-foreground"><Calendar className="h-3 w-3" />{new Date(v.createdAt).toLocaleString()}</span>
    )},
    { key: "description", header: "Descrição", render: (v) => <span className="text-sm">{v.description}</span> },
    { key: "actions", header: "", render: (v) => (
      <Button size="sm" variant="ghost" onClick={() => setPreviewVersion(v)}><Eye className="h-4 w-4" /></Button>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Versões de Documentos</h1>
          <DocButton module="documents" page="versions" />
          <p className="text-sm text-muted-foreground">Gerencie as versões dos documentos</p>
        </div>
        <Button disabled={!selectedDocId} onClick={() => newVersionMut.mutate()}>
          <Plus className="mr-2 h-4 w-4" />Nova Versão
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-80">
          <Select value={selectedDocId} onValueChange={setSelectedDocId}>
            <SelectTrigger><SelectValue placeholder="Selecione um documento" /></SelectTrigger>
            <SelectContent>
              {documents.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  <span className="flex items-center gap-2"><FileText className="h-4 w-4" />{d.name}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {selectedDoc && <Badge variant="outline">v{selectedDoc.version}</Badge>}
      </div>

      <DataTable
        data={versions}
        columns={columns}
        keyExtractor={(v) => v.id}
        searchKeys={["description", "createdBy", "hash"]}
        initialSortColumn="version"
      />

      <Dialog open={!!previewVersion} onOpenChange={(o) => { if (!o) setPreviewVersion(null); }}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Preview — v{previewVersion?.version}</DialogTitle>
          </DialogHeader>
          {previewVersion && (
            <div className="border rounded-md p-4 bg-white overflow-auto max-h-[60vh]">
              <div dangerouslySetInnerHTML={{ __html: previewVersion.content }} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
