import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { Upload, FileJson, CheckCircle2, XCircle, AlertTriangle, Eye } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DocButton } from "@/components/doc-button";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { demoEnvService } from "@/modules/demo-env/service";
import type { ExportPayload } from "@/modules/demo-env/types";

export const Route = createFileRoute("/_app/admin/demo-env/import")({
  component: DemoEnvImportPage,
});

function DemoEnvImportPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [payload, setPayload] = useState<ExportPayload | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const importMut = useMutation({
    mutationFn: () => demoEnvService.importEnvironment(payload!, "admin"),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["demo-env"] });
      toast.success(`Ambiente importado: ${result.totalRecords} registros`);
      setPayload(null);
      setFileName("");
    },
    onError: () => toast.error("Erro ao importar ambiente"),
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text) as ExportPayload;
      if (!data.metadata || !data.metadata.version) {
        toast.error("Arquivo inválido: formato de exportação não reconhecido");
        return;
      }
      setPayload(data);
      setFileName(file.name);
      toast.success("Arquivo carregado e validado com sucesso");
    } catch {
      toast.error("Arquivo inválido: não foi possível fazer o parse do JSON");
    }
  };

  const handleImport = () => {
    setConfirmOpen(true);
  };

  const confirmImport = () => {
    setConfirmOpen(false);
    importMut.mutate();
  };

  const totalImportRecords = payload
    ? payload.metadata.totalRecords
    : 0;

  const entityCounts = payload
    ? [
        { label: "Empresas", count: payload.companies.length },
        { label: "Usuários", count: payload.users.length },
        { label: "Clientes", count: payload.customers.length },
        { label: "Equipamentos", count: payload.devices.length },
        { label: "Ordens de Serviço", count: payload.serviceOrders.length },
        { label: "Retornos", count: payload.returns.length },
        { label: "Garantias", count: payload.warranties.length },
        { label: "Pagamentos", count: payload.payments.length },
        { label: "Documentos", count: payload.documents.length },
        { label: "Eventos", count: payload.events.length },
        { label: "Relatórios", count: payload.reports.length },
        { label: "Dashboards", count: payload.dashboards.length },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Importar Ambiente</h1>
            <DocButton module="demo-env" page="import" title="Importar Ambiente" />
          </div>
          <p className="text-sm text-muted-foreground">Importe um ambiente de demonstração a partir de arquivo JSON</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Selecionar Arquivo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <input ref={fileRef} type="file" accept=".json" onChange={handleFileSelect} className="hidden" />
            <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm font-medium">Clique para selecionar o arquivo JSON de exportação</p>
            <p className="text-xs text-muted-foreground mt-1">Arquivos .json gerados pela exportação do ambiente demo</p>
          </div>
        </CardContent>
      </Card>

      {payload && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileJson className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">Pré-visualização: {fileName}</CardTitle>
                </div>
                <Badge variant="outline" className="gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  Validado
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Versão: <strong className="text-foreground">{payload.metadata.version}</strong></span>
                <span>Exportado em: <strong className="text-foreground">{new Date(payload.metadata.exportedAt).toLocaleString("pt-BR")}</strong></span>
                <span>Exportado por: <strong className="text-foreground">{payload.metadata.exportedBy}</strong></span>
                <span>Total: <strong className="text-foreground">{(totalImportRecords).toLocaleString("pt-BR")}</strong></span>
              </div>

              <Separator />

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {entityCounts.map((e) => (
                  <div key={e.label} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                    <span className="text-sm">{e.label}</span>
                    <Badge variant="secondary">{(e.count).toLocaleString("pt-BR")}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setPayload(null); setFileName(""); }}>
              <XCircle className="mr-2 h-4 w-4" />Cancelar
            </Button>
            <Button onClick={handleImport} disabled={importMut.isPending}>
              <Upload className="mr-2 h-4 w-4" />{importMut.isPending ? "Importando..." : "Importar Ambiente"}
            </Button>
          </div>
        </>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Importar Ambiente"
        description={`Tem certeza que deseja importar ${(totalImportRecords).toLocaleString("pt-BR")} registros? Os dados operacionais atuais serão mesclados com os dados importados.`}
        confirmText="Importar"
        onConfirm={confirmImport}
      />
    </div>
  );
}
