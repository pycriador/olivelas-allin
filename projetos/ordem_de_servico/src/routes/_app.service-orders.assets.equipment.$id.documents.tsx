import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { Plus, Trash2, Download, FileText, FileSignature, FileImage, FileSpreadsheet, Receipt, FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { deviceService } from "@/modules/devices/service";
import type { DeviceDocument } from "@/modules/devices/types";

export const Route = createFileRoute("/_app/service-orders/assets/equipment/$id/documents")({
  head: () => ({ meta: [{ title: "Documentos — ServiceForge" }] }),
  component: EquipmentDocumentsTab,
});

const typeLabels: Record<string, string> = {
  invoice: "Nota Fiscal", warranty: "Garantia", report: "Relatório",
  photo: "Foto", receipt: "Recibo", other: "Outro",
};
const typeIcons: Record<string, any> = {
  invoice: FileSpreadsheet, warranty: FileSignature, report: FileText,
  photo: FileImage, receipt: Receipt, other: FileQuestion,
};
const typeColors: Record<string, string> = {
  invoice: "bg-blue-100 text-blue-700", warranty: "bg-green-100 text-green-700",
  report: "bg-purple-100 text-purple-700", photo: "bg-amber-100 text-amber-700",
  receipt: "bg-teal-100 text-teal-700", other: "bg-gray-100 text-gray-700",
};

function EquipmentDocumentsTab() {
  const { id } = Route.useParams();
  const { t } = useTranslation();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [docType, setDocType] = useState<DeviceDocument["type"]>("other");
  const [docName, setDocName] = useState("");
  const [deleteDocId, setDeleteDocId] = useState<string | null>(null);

  const { data: device, isLoading } = useQuery({
    queryKey: ["device", id],
    queryFn: () => deviceService.get(id),
  });

  const documents = device?.deviceDocuments ?? [];

  const addDocMut = useMutation({
    mutationFn: async () => {
      const file = fileRef.current?.files?.[0];
      if (!file) throw new Error("Nenhum arquivo selecionado");
      const url = URL.createObjectURL(file);
      return deviceService.addDocument(id, {
        name: docName || file.name, type: docType, url,
        uploadedAt: new Date().toISOString(), uploadedBy: "Sistema",
      });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["device", id] }); setOpen(false); setDocName(""); setDocType("other"); if (fileRef.current) fileRef.current.value = ""; toast.success("Documento adicionado"); },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Erro ao adicionar documento"),
  });

  const removeDocMut = useMutation({
    mutationFn: () => deviceService.removeDocument(id, deleteDocId!),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["device", id] }); setDeleteDocId(null); toast.success("Documento removido"); },
    onError: () => toast.error("Erro ao remover documento"),
  });

  const handleDownload = (doc: DeviceDocument) => {
    const a = document.createElement("a");
    a.href = doc.url;
    a.download = doc.name;
    a.click();
  };

  if (isLoading) return <div className="flex items-center justify-center py-12"><p className="text-sm text-muted-foreground">Carregando...</p></div>;
  if (!device) return <div className="flex items-center justify-center py-12"><p className="text-sm text-muted-foreground">Equipamento não encontrado</p></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Documentos</h2>
          <p className="text-sm text-muted-foreground">{documents.length} documento(s) anexado(s)</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Adicionar Documento</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Adicionar Documento</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1"><Label>Nome</Label><Input value={docName} onChange={(e) => setDocName(e.target.value)} placeholder="Nome do documento" /></div>
              <div className="space-y-1"><Label>Tipo</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={docType} onChange={(e) => setDocType(e.target.value as any)}>
                  {Object.entries(typeLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                </select>
              </div>
              <div className="space-y-1"><Label>Arquivo</Label>
                <input ref={fileRef} type="file" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:bg-primary/10 file:text-primary" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={() => addDocMut.mutate()} disabled={addDocMut.isPending}>{addDocMut.isPending ? "Adicionando..." : "Adicionar"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {documents.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <FileText className="h-10 w-10" />
              <p className="text-sm">Nenhum documento anexado</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="p-3 font-medium">Nome</th>
                  <th className="p-3 font-medium">Tipo</th>
                  <th className="p-3 font-medium">Data</th>
                  <th className="p-3 font-medium w-24">Ações</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => {
                  const Icon = typeIcons[doc.type] ?? FileQuestion;
                  return (
                    <tr key={doc.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="p-3 font-medium">{doc.name}</td>
                      <td className="p-3"><Badge className={typeColors[doc.type]} variant="outline"><Icon className="h-3 w-3 mr-1 inline" />{typeLabels[doc.type]}</Badge></td>
                      <td className="p-3 text-muted-foreground">{new Date(doc.uploadedAt).toLocaleDateString("pt-BR")}</td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleDownload(doc)}><Download className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteDocId(doc.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!deleteDocId} onOpenChange={() => setDeleteDocId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirmar Remoção</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Tem certeza que deseja remover este documento?</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteDocId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => removeDocMut.mutate()}>Remover</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
