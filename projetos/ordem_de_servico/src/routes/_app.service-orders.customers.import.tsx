import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertTriangle, Eye } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { customerService } from "@/modules/customers/service";
import type { Customer, ImportResult } from "@/modules/customers/types";

export const Route = createFileRoute("/_app/service-orders/customers/import")({
  head: () => ({ meta: [{ title: "Importar Clientes — ServiceForge" }] }),
  component: CustomerImportPage,
});

function CustomerImportPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [parsedData, setParsedData] = useState<Partial<Customer>[]>([]);
  const [fileName, setFileName] = useState("");
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const importMut = useMutation({
    mutationFn: async () => {
      let imported = 0, duplicates = 0, errors = 0;
      for (const item of parsedData) {
        try {
          await customerService.create(item as any);
          imported++;
        } catch {
          errors++;
        }
      }
      return { total: parsedData.length, imported, duplicates, errors, errorsList: [] } as ImportResult;
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      setImportResult(result);
      toast.success(`${result.imported} clientes importados`);
    },
    onError: () => toast.error("Erro ao importar clientes"),
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    try {
      const text = await file.text();
      if (file.name.endsWith(".json")) {
        const data = JSON.parse(text);
        const arr = Array.isArray(data) ? data : [data];
        setParsedData(arr);
        toast.success(`${arr.length} registros encontrados`);
      } else if (file.name.endsWith(".csv")) {
        const lines = text.split("\n").filter(Boolean);
        if (lines.length < 2) { toast.error("CSV inválido"); return; }
        const headers = lines[0].split(",").map((h) => h.trim());
        const records = lines.slice(1).map((line) => {
          const values = line.split(",").map((v) => v.trim());
          const record: any = {};
          headers.forEach((h, i) => { record[h] = values[i]; });
          return record;
        });
        setParsedData(records);
        toast.success(`${records.length} registros encontrados`);
      } else {
        toast.error("Formato de arquivo não suportado. Use CSV, Excel ou JSON.");
      }
    } catch {
      toast.error("Erro ao processar arquivo");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Importar Clientes</h1>
        <p className="text-sm text-muted-foreground">Importe clientes a partir de arquivo CSV, Excel ou JSON</p>
      </div>

      {!importResult && (
        <Card>
          <CardHeader><CardTitle className="text-base">Selecionar Arquivo</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div
              className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls,.json" onChange={handleFileSelect} className="hidden" />
              <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm font-medium">Clique para selecionar ou arraste o arquivo</p>
              <p className="text-xs text-muted-foreground mt-1">CSV, Excel (.xlsx) ou JSON</p>
            </div>
          </CardContent>
        </Card>
      )}

      {parsedData.length > 0 && !importResult && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">Pré-visualização: {fileName}</CardTitle>
                </div>
                <Badge variant="outline" className="gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  {parsedData.length} registros
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="max-h-60 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="p-2 font-medium">#</th>
                      <th className="p-2 font-medium">Nome</th>
                      <th className="p-2 font-medium">Email</th>
                      <th className="p-2 font-medium">Documento</th>
                      <th className="p-2 font-medium">Telefone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.slice(0, 10).map((item, idx) => (
                      <tr key={idx} className="border-b last:border-0">
                        <td className="p-2 text-muted-foreground">{idx + 1}</td>
                        <td className="p-2 font-medium">{item.name}</td>
                        <td className="p-2">{item.email ?? "-"}</td>
                        <td className="p-2">{item.cpf ?? item.cnpj ?? "-"}</td>
                        <td className="p-2">{item.phone ?? item.cellphone ?? "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedData.length > 10 && (
                  <p className="text-xs text-muted-foreground text-center py-2">...e mais {parsedData.length - 10} registros</p>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setParsedData([]); setFileName(""); }}>
              <XCircle className="mr-2 h-4 w-4" />Cancelar
            </Button>
            <Button onClick={() => importMut.mutate()} disabled={importMut.isPending}>
              <Upload className="mr-2 h-4 w-4" />{importMut.isPending ? "Importando..." : "Importar Clientes"}
            </Button>
          </div>
        </>
      )}

      {importResult && (
        <Card>
          <CardHeader><CardTitle className="text-base">Resultado da Importação</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3 rounded-md bg-muted/50 text-center">
                <p className="text-2xl font-bold">{importResult.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <div className="p-3 rounded-md bg-green-50 text-center">
                <p className="text-2xl font-bold text-green-600">{importResult.imported}</p>
                <p className="text-xs text-green-600">Importados</p>
              </div>
              <div className="p-3 rounded-md bg-amber-50 text-center">
                <p className="text-2xl font-bold text-amber-600">{importResult.duplicates}</p>
                <p className="text-xs text-amber-600">Duplicatas</p>
              </div>
              <div className="p-3 rounded-md bg-red-50 text-center">
                <p className="text-2xl font-bold text-red-600">{importResult.errors}</p>
                <p className="text-xs text-red-600">Erros</p>
              </div>
            </div>
            {importResult.errorsList.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Erros:</h4>
                <ul className="text-sm text-red-600 space-y-1">
                  {importResult.errorsList.map((err, i) => <li key={i}>{err}</li>)}
                </ul>
              </div>
            )}
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => { setParsedData([]); setFileName(""); setImportResult(null); }}>
                Nova Importação
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
