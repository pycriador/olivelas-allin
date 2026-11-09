import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Download, FileText, Image, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { customerService } from "@/modules/customers/service";
import type { Customer, CustomerAttachment } from "@/modules/customers/types";

export const Route = createFileRoute("/_app/service-orders/customers/$id/attachments")({
  head: () => ({ meta: [{ title: "Anexos — ServiceForge" }] }),
  component: CustomerAttachmentsPage,
});

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

const fileIcons: Record<string, any> = {
  pdf: FileText, image: Image, spreadsheet: FileSpreadsheet, document: FileText, other: FileText,
};
const fileColors: Record<string, string> = {
  pdf: "text-red-500 bg-red-100", image: "text-purple-500 bg-purple-100",
  spreadsheet: "text-green-500 bg-green-100", document: "text-blue-500 bg-blue-100", other: "text-gray-500 bg-gray-100",
};

function formatSize(bytes?: number): string {
  if (!bytes) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function CustomerAttachmentsPage() {
  const { id } = Route.useParams();
  const { t } = useTranslation();
  const qc = useQueryClient();

  const [open, setOpen] = useState(false);
  const [uploadName, setUploadName] = useState("");
  const [uploadType, setUploadType] = useState("other");
  const [uploadSize, setUploadSize] = useState(0);

  const { data: customer, isLoading } = useQuery({
    queryKey: ["customer", id],
    queryFn: () => customerService.get(id),
  });

  const attachments = customer?.attachments ?? [];

  const uploadMut = useMutation({
    mutationFn: () => {
      const newAtt: CustomerAttachment = {
        id: uid(), name: uploadName, type: uploadType, fileUrl: "#",
        fileSize: uploadSize, uploadedAt: new Date().toISOString(),
        uploadedBy: "system", uploadedByName: "Admin",
      };
      return customerService.update(id, { attachments: [...attachments, newAtt] });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["customer", id] }); setOpen(false); setUploadName(""); setUploadType("other"); setUploadSize(0); toast.success("Anexo adicionado"); },
    onError: () => toast.error("Erro ao adicionar anexo"),
  });

  if (isLoading) return <div className="flex items-center justify-center py-12"><p className="text-sm text-muted-foreground">Carregando...</p></div>;
  if (!customer) return <div className="flex items-center justify-center py-12"><p className="text-sm text-muted-foreground">Cliente não encontrado</p></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Anexos</h1>
          <p className="text-sm text-muted-foreground">Arquivos anexados ao cliente</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Adicionar Anexo</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Adicionar Anexo</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1"><Label>Nome do Arquivo</Label><Input value={uploadName} onChange={(e) => setUploadName(e.target.value)} placeholder="Ex: Contrato_assinado.pdf" /></div>
              <div className="space-y-1"><Label>Tipo</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={uploadType} onChange={(e) => setUploadType(e.target.value)}>
                  <option value="document">Documento</option>
                  <option value="pdf">PDF</option>
                  <option value="image">Imagem</option>
                  <option value="spreadsheet">Planilha</option>
                  <option value="other">Outro</option>
                </select>
              </div>
              <div className="space-y-1"><Label>Tamanho (bytes)</Label><Input type="number" value={uploadSize || ""} onChange={(e) => setUploadSize(Number(e.target.value))} placeholder="Opcional" /></div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setOpen(false); setUploadName(""); setUploadType("other"); setUploadSize(0); }}>Cancelar</Button>
                <Button onClick={() => uploadMut.mutate()} disabled={!uploadName || uploadMut.isPending}>{uploadMut.isPending ? "Adicionando..." : "Adicionar"}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {attachments.length === 0 ? (
        <Card><CardContent><p className="py-12 text-center text-sm text-muted-foreground">Nenhum anexo cadastrado</p></CardContent></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {attachments.map((att) => {
            const Icon = fileIcons[att.type] || FileText;
            const colorClass = fileColors[att.type] || fileColors.other;
            return (
              <Card key={att.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className={`h-10 w-10 rounded-lg ${colorClass} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{att.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">{att.type}</Badge>
                        <span className="text-xs text-muted-foreground">{formatSize(att.fileSize)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{att.uploadedByName}</span>
                    <span>{new Date(att.uploadedAt).toLocaleDateString("pt-BR")}</span>
                  </div>
                  {att.fileUrl && att.fileUrl !== "#" && (
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <a href={att.fileUrl} download><Download className="mr-2 h-3 w-3" />Download</a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
