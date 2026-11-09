import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { QrCode, CheckCircle2, XCircle, FileText, Hash, Link, Fingerprint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { DataTable, type Column } from "@/components/data-table";
import { documentService, qrService, generateHash } from "@/modules/documents/service";
import { DocButton } from "@/components/doc-button";
import type { Document, QRData } from "@/modules/documents/types";

export const Route = createFileRoute("/_app/documents/qr-validation")({
  head: () => ({ meta: [{ title: "QR Validation — ServiceForge" }] }),
  component: QRValidationPage,
});

function QRValidationPage() {
  const qc = useQueryClient();
  const [selectedDocId, setSelectedDocId] = useState<string>("");

  const { data: documents = [] } = useQuery({ queryKey: ["documents"], queryFn: () => documentService.list() });
  const { data: qrList = [] } = useQuery({ queryKey: ["documents", "qr"], queryFn: () => qrService.list() });

  const selectedDoc = documents.find((d) => d.id === selectedDocId);
  const selectedQR = qrList.find((q) => q.documentId === selectedDocId);

  const generateQrMut = useMutation({
    mutationFn: async () => {
      if (!selectedDocId) throw new Error("Documento não selecionado");
      return qrService.generate(selectedDocId);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["documents", "qr"] }); toast.success("QR Data gerado"); },
    onError: () => toast.error("Erro ao gerar QR Data"),
  });

  const checksumValid = selectedDoc && selectedQR
    ? selectedDoc.hash === selectedQR.hash
    : false;

  const columns: Column<Document>[] = [
    { key: "name", header: "Documento", render: (d) => (
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{d.name}</span>
      </div>
    )},
    { key: "publicId", header: "ID Público", render: (d) => <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{d.publicId}</code> },
    { key: "hash", header: "Hash", render: (d) => <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{d.hash.substring(0, 16)}...</code> },
    { key: "checksum", header: "Checksum", render: (d) => <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{d.checksum.substring(0, 16)}...</code> },
    { key: "version", header: "Versão", render: (d) => <span className="font-mono text-sm">v{d.version}</span> },
    { key: "url", header: "URL", render: (d) => {
      const qr = qrList.find((q) => q.documentId === d.id);
      return qr ? (
        <a href={qr.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline truncate max-w-[200px] inline-block">{qr.url}</a>
      ) : <span className="text-xs text-muted-foreground">—</span>;
    }},
    { key: "actions", header: "", render: (d) => (
      <Button size="sm" variant="outline" onClick={() => { setSelectedDocId(d.id); generateQrMut.mutate(); }}>
        <QrCode className="mr-1 h-4 w-4" />Gerar QR
      </Button>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Validação por QR</h1>
          <DocButton module="documents" page="qr-validation" />
          <p className="text-sm text-muted-foreground">Gere e valide QR Codes dos documentos</p>
        </div>
      </div>

      <DataTable
        data={documents}
        columns={columns}
        keyExtractor={(d) => d.id}
        searchKeys={["name", "publicId", "hash"]}
      />

      {selectedQR && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <QrCode className="h-5 w-5" />Dados QR
              {checksumValid ? (
                <Badge variant="default" className="ml-2"><CheckCircle2 className="h-3 w-3 mr-1" />Válido</Badge>
              ) : (
                <Badge variant="destructive" className="ml-2"><XCircle className="h-3 w-3 mr-1" />Inválido</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <span className="text-muted-foreground flex items-center gap-1"><Fingerprint className="h-3 w-3" />publicId</span>
                <code className="bg-muted px-2 py-1 rounded text-xs block">{selectedQR.publicId}</code>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground flex items-center gap-1"><Hash className="h-3 w-3" />hash</span>
                <code className="bg-muted px-2 py-1 rounded text-xs block">{selectedQR.hash}</code>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground flex items-center gap-1"><Hash className="h-3 w-3" />checksum</span>
                <code className="bg-muted px-2 py-1 rounded text-xs block">{selectedQR.checksum}</code>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground">version</span>
                <div className="font-mono text-base">v{selectedQR.version}</div>
              </div>
              <div className="space-y-1 col-span-2">
                <span className="text-muted-foreground flex items-center gap-1"><Link className="h-3 w-3" />url</span>
                <a href={selectedQR.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline break-all">{selectedQR.url}</a>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
