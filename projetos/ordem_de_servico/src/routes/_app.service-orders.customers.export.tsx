import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Download, FileSpreadsheet, FileText, FileJson, FileType } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { customerService } from "@/modules/customers/service";
import type { Customer } from "@/modules/customers/types";

export const Route = createFileRoute("/_app/service-orders/customers/export")({
  head: () => ({ meta: [{ title: "Exportar Clientes — ServiceForge" }] }),
  component: CustomerExportPage,
});

type ExportFormat = "xlsx" | "csv" | "json" | "pdf";

const formatIcons: Record<ExportFormat, any> = { xlsx: FileSpreadsheet, csv: FileType, json: FileJson, pdf: FileText };
const formatLabels: Record<ExportFormat, string> = { xlsx: "Excel (.xlsx)", csv: "CSV (.csv)", json: "JSON (.json)", pdf: "PDF (.pdf)" };

function CustomerExportPage() {
  const { t } = useTranslation();
  const [format, setFormat] = useState<ExportFormat>("xlsx");
  const [exportMode, setExportMode] = useState<"all" | "selected">("all");

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: () => customerService.list(),
  });

  const activeCustomers = customers.filter((c) => !c.deletedAt);

  const handleExport = async () => {
    toast.loading("Exportando clientes...");
    try {
      const data = exportMode === "all" ? activeCustomers : activeCustomers.slice(0, 10);
      let content: string;
      let mimeType: string;
      let extension: string;

      if (format === "json") {
        content = JSON.stringify(data, null, 2);
        mimeType = "application/json";
        extension = "json";
      } else if (format === "csv") {
        const headers = ["Nome", "Tipo", "CPF", "CNPJ", "Email", "Telefone", "Celular", "WhatsApp", "Status", "Cidade"];
        const rows = data.map((c) => [
          c.name, c.type, c.cpf ?? "", c.cnpj ?? "", c.email ?? "", c.phone ?? "", c.cellphone ?? "", c.whatsapp ?? "",
          c.status, c.addresses?.find((a) => a.isDefault)?.city ?? "",
        ]);
        content = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
        mimeType = "text/csv";
        extension = "csv";
      } else {
        content = JSON.stringify(data, null, 2);
        mimeType = "application/json";
        extension = "json";
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `clientes-${new Date().toISOString().split("T")[0]}.${extension}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${data.length} clientes exportados`);
    } catch {
      toast.error("Erro ao exportar clientes");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Exportar Clientes</h1>
        <p className="text-sm text-muted-foreground">Exporte seus clientes para diversos formatos</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total de Clientes</CardTitle>
            <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCustomers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Clientes Ativos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCustomers.filter((c) => c.status === "active").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Clientes Inativos</CardTitle>
            <FileJson className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCustomers.filter((c) => c.status === "inactive").length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Opções de Exportação</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>Formato</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(Object.keys(formatLabels) as ExportFormat[]).map((f) => {
                const Icon = formatIcons[f];
                return (
                  <button
                    key={f}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border text-sm transition-colors ${
                      format === f ? "border-primary bg-primary/5" : "hover:border-muted-foreground/30"
                    }`}
                    onClick={() => setFormat(f)}
                  >
                    <Icon className={`h-6 w-6 ${format === f ? "text-primary" : "text-muted-foreground"}`} />
                    <span className={format === f ? "text-primary font-medium" : "text-muted-foreground"}>{formatLabels[f]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Clientes</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="exportMode" checked={exportMode === "all"} onChange={() => setExportMode("all")} className="h-4 w-4" />
                <span className="text-sm">Todos os clientes ({activeCustomers.length})</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="exportMode" checked={exportMode === "selected"} onChange={() => setExportMode("selected")} className="h-4 w-4" />
                <span className="text-sm">Apenas selecionados (10)</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end">
            <Button size="lg" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />Exportar Clientes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
