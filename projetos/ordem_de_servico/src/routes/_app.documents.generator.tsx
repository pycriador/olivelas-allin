import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { FileText, Hash, Fingerprint, Globe, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { templateService, documentService, generateHash, generatePublicId, addHistory } from "@/modules/documents/service";
import { DocButton } from "@/components/doc-button";
import type { DocTemplate, Document } from "@/modules/documents/types";
import { TEMPLATE_CATEGORY_LABELS } from "@/modules/documents/types";

const MOCK_DATA = {
  empresa: "ServiceForge Tecnologia Ltda",
  cliente: "João da Silva",
  cpfCnpj: "123.456.789-00",
  endereco: "Rua das Flores, 123 — Centro",
  cidade: "São Paulo — SP",
  telefone: "(11) 99999-8888",
  email: "joao@email.com",
  equipamento: "Notebook Dell Inspiron 15",
  serie: "SN-2024-XYZ-789",
  defeito: "Tela trincada e teclado com falhas",
  servico: "Substituição de tela e teclado",
  valor: "R$ 580,00",
  garantia: "90 dias",
};

export const Route = createFileRoute("/_app/documents/generator")({
  head: () => ({ meta: [{ title: "Document Generator — ServiceForge" }] }),
  component: DocumentGeneratorPage,
});

function DocumentGeneratorPage() {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [docName, setDocName] = useState("");
  const [generatedDoc, setGeneratedDoc] = useState<Document | null>(null);

  const { data: templates = [] } = useQuery({
    queryKey: ["documents", "templates"],
    queryFn: () => templateService.list(),
  });

  const generateMut = useMutation({
    mutationFn: async () => {
      const tpl = templates.find((t) => t.id === selectedTemplateId);
      if (!tpl) throw new Error("Selecione um template");
      const hash = generateHash();
      const publicId = generatePublicId();
      const content = `<div style="font-family: sans-serif; padding: 40px; max-width: 800px; margin: 0 auto;">
<h1 style="text-align: center; color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">${tpl.name}</h1>
<p style="text-align: center; color: #6b7280; margin-bottom: 30px;">${tpl.description}</p>
<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
<div><strong>Empresa:</strong> ${MOCK_DATA.empresa}</div>
<div><strong>Cliente:</strong> ${MOCK_DATA.cliente}</div>
<div><strong>CPF/CNPJ:</strong> ${MOCK_DATA.cpfCnpj}</div>
<div><strong>Telefone:</strong> ${MOCK_DATA.telefone}</div>
</div>
<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
<h2 style="color: #374151; font-size: 1.1rem; margin-bottom: 10px;">Detalhes do Serviço</h2>
<table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
<tr style="background: #f9fafb;"><td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Equipamento</strong></td><td style="padding: 8px; border: 1px solid #e5e7eb;">${MOCK_DATA.equipamento}</td></tr>
<tr><td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Nº Série</strong></td><td style="padding: 8px; border: 1px solid #e5e7eb;">${MOCK_DATA.serie}</td></tr>
<tr style="background: #f9fafb;"><td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Defeito</strong></td><td style="padding: 8px; border: 1px solid #e5e7eb;">${MOCK_DATA.defeito}</td></tr>
<tr><td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Serviço</strong></td><td style="padding: 8px; border: 1px solid #e5e7eb;">${MOCK_DATA.servico}</td></tr>
</table>
<div style="display: flex; justify-content: space-between; align-items: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb;">
<div><strong>Valor:</strong> <span style="color: #2563eb; font-size: 1.3rem;">${MOCK_DATA.valor}</span></div>
<div><strong>Garantia:</strong> ${MOCK_DATA.garantia}</div>
</div>
<p style="text-align: center; color: #9ca3af; font-size: 0.75rem; margin-top: 40px;">Documento gerado em ${new Date().toLocaleString()} — ${publicId}</p>
</div>`;
      const doc = await documentService.create({
        name: docName || `Documento - ${tpl.name}`,
        category: tpl.category,
        companyId: null,
        templateId: tpl.id,
        templateVersion: tpl.version,
        entityId: null, recordId: null, version: 1,
        hash, checksum: hash, publicId,
        format: "html", size: content.length,
        content, status: "draft",
        createdBy: "current-user", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      });
      await addHistory(doc.id, "generated", "current-user", "Administrador", `Documento gerado a partir do template ${tpl.name}`);
      return doc;
    },
    onSuccess: (doc) => { setGeneratedDoc(doc); toast.success("Documento gerado com sucesso"); },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Document Generator</h1>
          <DocButton module="documents" page="generator" />
        <p className="text-sm text-muted-foreground">Gere documentos a partir de templates</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-1 space-y-4">
          <Card className="p-4 space-y-4">
            <h3 className="text-sm font-medium">Configuração</h3>
            <div className="space-y-2">
              <Label>Template</Label>
              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <SelectTrigger><SelectValue placeholder="Selecione um template..." /></SelectTrigger>
                <SelectContent>
                  {templates.map((t) => <SelectItem key={t.id} value={t.id}>{t.name} — {TEMPLATE_CATEGORY_LABELS[t.category]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nome do Documento</Label>
              <Input value={docName} onChange={(e) => setDocName(e.target.value)} placeholder="Ex: OS #12345" />
            </div>
            <Button className="w-full" onClick={() => generateMut.mutate()} disabled={!selectedTemplateId || generateMut.isPending}>
              <FileText className="mr-2 h-4 w-4" />Gerar Documento
            </Button>
          </Card>

          <Card className="p-4 space-y-3">
            <h3 className="text-sm font-medium flex items-center gap-2"><History className="h-4 w-4" />Dados de Exemplo</h3>
            {Object.entries(MOCK_DATA).map(([key, value]) => (
              <div key={key} className="flex justify-between text-sm">
                <span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                <span className="font-medium text-right max-w-[180px] truncate" title={value}>{value}</span>
              </div>
            ))}
          </Card>

          {generatedDoc && (
            <Card className="p-4 space-y-3">
              <h3 className="text-sm font-medium flex items-center gap-2"><Hash className="h-4 w-4" />Metadados</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2"><Fingerprint className="h-3 w-3 text-muted-foreground" /><span className="text-muted-foreground">Hash:</span><code className="text-xs bg-muted px-1 rounded truncate">{generatedDoc.hash}</code></div>
                <div className="flex items-center gap-2"><Hash className="h-3 w-3 text-muted-foreground" /><span className="text-muted-foreground">Checksum:</span><code className="text-xs bg-muted px-1 rounded truncate">{generatedDoc.checksum}</code></div>
                <div className="flex items-center gap-2"><Globe className="h-3 w-3 text-muted-foreground" /><span className="text-muted-foreground">Public ID:</span><code className="text-xs bg-muted px-1 rounded">{generatedDoc.publicId}</code></div>
              </div>
            </Card>
          )}
        </div>

        <div className="xl:col-span-2">
          {generatedDoc ? (
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between border-b px-4 py-2 bg-muted/30">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm font-medium">{generatedDoc.name}</span>
                  <Badge variant="outline" className="text-[10px]">{TEMPLATE_CATEGORY_LABELS[generatedDoc.category]}</Badge>
                </div>
                <Badge variant="default" className="text-[10px]">v{generatedDoc.version}</Badge>
              </div>
              <div className="p-4 bg-white" dangerouslySetInnerHTML={{ __html: generatedDoc.content }} />
            </Card>
          ) : (
            <Card className="flex items-center justify-center h-[400px] text-muted-foreground">
              <div className="text-center space-y-2">
                <FileText className="h-12 w-12 mx-auto opacity-20" />
                <p className="text-sm">Selecione um template e clique em "Gerar Documento"</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
