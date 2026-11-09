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
import { deviceService } from "@/modules/devices/service";

export const Route = createFileRoute("/_app/service-orders/assets/export")({
  head: () => ({ meta: [{ title: "Exportar Equipamentos — ServiceForge" }] }),
  component: AssetExportPage,
});

type ExportFormat = "xlsx" | "csv" | "json" | "pdf";

const formatIcons: Record<ExportFormat, any> = { xlsx: FileSpreadsheet, csv: FileType, json: FileJson, pdf: FileText };
const formatLabels: Record<ExportFormat, string> = { xlsx: "Excel (.xlsx)", csv: "CSV (.csv)", json: "JSON (.json)", pdf: "PDF (.pdf)" };

function AssetExportPage() {
  const { t } = useTranslation();
  const [format, setFormat] = useState<ExportFormat>("xlsx");
  const [exportMode, setExportMode] = useState<"all" | "selected">("all");

  const { data: devices = [] } = useQuery({
    queryKey: ["devices"],
    queryFn: () => deviceService.list(),
  });

  const handleExport = async () => {
    toast.loading("Exportando equipamentos...");
    try {
      const data = exportMode === "all" ? devices : devices.slice(0, 10);
      let content: string;
      let mimeType: string;
      let extension: string;

      if (format === "json") {
        content = JSON.stringify(data, null, 2);
        mimeType = "application/json";
        extension = "json";
      } else if (format === "csv") {
        const headers = ["Serial", "Patrimônio", "Tipo", "IMEI", "Cor", "Status", "Cliente"];
        const rows = data.map((d) => [
          d.serialNumber ?? "", d.assetNumber ?? "", d.type ?? "", d.imei ?? "",
          d.color ?? "", d.status, d.customerId ?? "",
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
      a.download = `equipamentos-${new Date().toISOString().split("T")[0]}.${extension}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${data.length} equipamentos exportados`);
    } catch {
      toast.error("Erro ao exportar equipamentos");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Exportar Equipamentos</h1>
        <p className="text-sm text-muted-foreground">Exporte seus equipamentos para diversos formatos</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total de Equipamentos</CardTitle>
            <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{devices.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Equipamentos Ativos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{devices.filter((d) => d.status === "active").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Em Manutenção</CardTitle>
            <FileJson className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{devices.filter((d) => d.status === "in_maintenance").length}</div>
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
            <Label>Equipamentos</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="exportMode" checked={exportMode === "all"} onChange={() => setExportMode("all")} className="h-4 w-4" />
                <span className="text-sm">Todos os equipamentos ({devices.length})</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="exportMode" checked={exportMode === "selected"} onChange={() => setExportMode("selected")} className="h-4 w-4" />
                <span className="text-sm">Apenas selecionados (10)</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end">
            <Button size="lg" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />Exportar Equipamentos
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
