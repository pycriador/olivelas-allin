import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { customerService } from "@/modules/customers/service";
import type { Customer, CustomerDocument } from "@/modules/customers/types";

export const Route = createFileRoute("/_app/service-orders/customers/$id/documents")({
  head: () => ({ meta: [{ title: "Documentos — ServiceForge" }] }),
  component: CustomerDocumentsPage,
});

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function CustomerDocumentsPage() {
  const { id } = Route.useParams();
  const { t } = useTranslation();
  const qc = useQueryClient();

  const [open, setOpen] = useState(false);
  const [uploadName, setUploadName] = useState("");
  const [uploadType, setUploadType] = useState("");

  const { data: customer, isLoading } = useQuery({
    queryKey: ["customer", id],
    queryFn: () => customerService.get(id),
  });

  const documents = customer?.documents ?? [];

  const addDocument = () => {
    const newDoc: CustomerDocument = { id: uid(), name: uploadName, type: uploadType, uploadedAt: new Date().toISOString() };
    const updated = [...(customer!.documents ?? []), newDoc];
    return customerService.update(id, { documents: updated });
  };

  const addMut = useMutation({
    mutationFn: addDocument,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["customer", id] }); setOpen(false); setUploadName(""); setUploadType(""); toast.success("Documento adicionado"); },
    onError: () => toast.error("Erro ao adicionar documento"),
  });

  const removeDocument = (docId: string) => {
    const updated = (customer!.documents ?? []).filter((d) => d.id !== docId);
    return customerService.update(id, { documents: updated });
  };

  const removeMut = useMutation({
    mutationFn: (docId: string) => removeDocument(docId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["customer", id] }); toast.success("Documento removido"); },
  });

  if (isLoading) return <div className="flex items-center justify-center py-12"><p className="text-sm text-muted-foreground">Carregando...</p></div>;
  if (!customer) return <div className="flex items-center justify-center py-12"><p className="text-sm text-muted-foreground">Cliente não encontrado</p></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Documentos</h1>
          <p className="text-sm text-muted-foreground">Gerencie os documentos do cliente</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Adicionar Documento</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Adicionar Documento</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1"><Label>Nome do Documento</Label><Input value={uploadName} onChange={(e) => setUploadName(e.target.value)} placeholder="Ex: Contrato, RG, CPF" /></div>
              <div className="space-y-1"><Label>Tipo</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={uploadType} onChange={(e) => setUploadType(e.target.value)}>
                  <option value="">Selecione...</option>
                  <option value="contract">Contrato</option>
                  <option value="identification">Identificação</option>
                  <option value="invoice">Fatura</option>
                  <option value="receipt">Recibo</option>
                  <option value="other">Outro</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setOpen(false); setUploadName(""); setUploadType(""); }}>Cancelar</Button>
                <Button onClick={() => addMut.mutate()} disabled={!uploadName || addMut.isPending}>{addMut.isPending ? "Adicionando..." : "Adicionar"}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {documents.length === 0 ? (
        <Card><CardContent><p className="py-12 text-center text-sm text-muted-foreground">Nenhum documento cadastrado</p></CardContent></Card>
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
                {documents.map((doc) => (
                  <tr key={doc.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="p-3 font-medium">{doc.name}</td>
                    <td className="p-3"><span className="text-xs bg-muted px-2 py-1 rounded">{doc.type}</span></td>
                    <td className="p-3 text-muted-foreground">{new Date(doc.uploadedAt).toLocaleDateString("pt-BR")}</td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        {doc.fileUrl && (
                          <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
                            <a href={doc.fileUrl} download><Download className="h-3 w-3" /></a>
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeMut.mutate(doc.id)}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
