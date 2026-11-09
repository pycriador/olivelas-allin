import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Download, Save, FileText, History, FileJson, FileType } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { DataTable, type Column } from "@/components/data-table";
import { documentService, exportSettingsService, addHistory, generateHash } from "@/modules/documents/service";
import { DocButton } from "@/components/doc-button";
import type { Document, ExportSettings, DocFormat, DocHistory } from "@/modules/documents/types";
import { historyService } from "@/modules/documents/service";

export const Route = createFileRoute("/_app/documents/export")({
  head: () => ({ meta: [{ title: "Export Center — ServiceForge" }] }),
  component: ExportPage,
});

const FORMAT_LABELS: Record<string, string> = {
  html: "HTML", pdf: "PDF", docx: "DOCX", png: "PNG", json: "JSON",
};

function ExportPage() {
  const qc = useQueryClient();
  const [selectedDocId, setSelectedDocId] = useState<string>("");
  const [format, setFormat] = useState<DocFormat>("html");
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [includeHistory, setIncludeHistory] = useState(false);
  const [includeSignatures, setIncludeSignatures] = useState(true);
  const [dpi, setDpi] = useState(300);
  const [quality, setQuality] = useState(90);

  const { data: documents = [] } = useQuery({ queryKey: ["documents"], queryFn: () => documentService.list() });
  const { data: savedSettings } = useQuery({ queryKey: ["documents", "export-settings"], queryFn: () => exportSettingsService.get() });
  const { data: allHistory = [] } = useQuery({ queryKey: ["documents", "history-all"], queryFn: () => historyService.list() });

  const selectedDoc = documents.find((d) => d.id === selectedDocId);

  const recentExports = allHistory
    .filter((h) => h.event === "exported")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  const saveMut = useMutation({
    mutationFn: () => exportSettingsService.update({ format, includeMetadata, includeHistory, includeSignatures, dpi, quality }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["documents", "export-settings"] }); toast.success("Configurações salvas"); },
  });

  const exportMut = useMutation({
    mutationFn: async () => {
      if (!selectedDocId || !selectedDoc) throw new Error("Documento não selecionado");

      if (format === "pdf" || format === "docx" || format === "png") {
        throw new Error("coming-soon");
      }

      let content = "";
      let fileName = `${selectedDoc.name}-${generateHash().substring(0, 8)}`;

      if (format === "html") {
        content = selectedDoc.content;
        fileName += ".html";
      } else if (format === "json") {
        const exportData: Record<string, unknown> = { document: selectedDoc };
        if (includeMetadata) {
          exportData.metadata = { name: selectedDoc.name, version: selectedDoc.version, format: selectedDoc.format, createdAt: selectedDoc.createdAt };
        }
        if (includeHistory) {
          const docHistory = allHistory.filter((h) => h.documentId === selectedDocId);
          exportData.history = docHistory;
        }
        content = JSON.stringify(exportData, null, 2);
        fileName += ".json";
      }

      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);

      await addHistory(selectedDocId, "exported", "system", "Sistema", `Exportado como ${FORMAT_LABELS[format]}`);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["documents", "history-all"] }); toast.success("Exportação concluída"); },
    onError: (err) => {
      if ((err as Error).message === "coming-soon") {
        toast.info("Exportação em PDF/DOCX/PNG estará disponível em breve");
      } else {
        toast.error("Erro ao exportar");
      }
    },
  });

  const exportColumns: Column<DocHistory>[] = [
    { key: "description", header: "Descrição", render: (h) => <span className="text-sm">{h.description}</span> },
    { key: "userName", header: "Usuário", render: (h) => <span className="text-sm">{h.userName}</span> },
    { key: "createdAt", header: "Data", render: (h) => <span className="text-sm text-muted-foreground">{new Date(h.createdAt).toLocaleString()}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Central de Exportação</h1>
          <DocButton module="documents" page="export" />
          <p className="text-sm text-muted-foreground">Exporte documentos em diversos formatos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => saveMut.mutate()}>
            <Save className="mr-2 h-4 w-4" />Salvar Padrão
          </Button>
          <Button onClick={() => exportMut.mutate()} disabled={!selectedDocId}>
            <Download className="mr-2 h-4 w-4" />Exportar
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Configurações de Exportação</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Documento</Label>
              <Select value={selectedDocId} onValueChange={setSelectedDocId}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {documents.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      <span className="flex items-center gap-2"><FileText className="h-4 w-4" />{d.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Formato</Label>
              <Select value={format} onValueChange={(v) => setFormat(v as DocFormat)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(FORMAT_LABELS).map(([k, l]) => (
                    <SelectItem key={k} value={k}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>DPI</Label>
              <Input type="number" min={72} max={1200} value={dpi} onChange={(e) => setDpi(Number(e.target.value))} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Switch checked={includeMetadata} onCheckedChange={setIncludeMetadata} />
              <Label className="flex items-center gap-1"><FileJson className="h-3 w-3" />Incluir Metadados</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={includeHistory} onCheckedChange={setIncludeHistory} />
              <Label className="flex items-center gap-1"><History className="h-3 w-3" />Incluir Histórico</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={includeSignatures} onCheckedChange={setIncludeSignatures} />
              <Label className="flex items-center gap-1"><FileType className="h-3 w-3" />Incluir Assinaturas</Label>
            </div>
          </div>

          {format !== "html" && format !== "json" && (
            <div className="space-y-2">
              <Label>Qualidade ({quality}%)</Label>
              <Input type="number" min={1} max={100} value={quality} onChange={(e) => setQuality(Number(e.target.value))} />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <History className="h-4 w-4" />Exportações Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={recentExports}
            columns={exportColumns}
            keyExtractor={(h) => h.id}
            searchable={false}
            pageSize={5}
          />
        </CardContent>
      </Card>
    </div>
  );
}
