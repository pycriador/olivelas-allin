import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Save, Mail, HardDrive, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { exportService, executionService } from "@/modules/reporting/service";

export const Route = createFileRoute("/_app/reporting/config")({
  head: () => ({ meta: [{ title: "Reporting Configurações — ServiceForge" }] }),
  component: ReportingConfigPage,
});

const formatOptions = [
  { value: "pdf", label: "PDF" },
  { value: "excel", label: "Excel" },
  { value: "csv", label: "CSV" },
  { value: "json", label: "JSON" },
  { value: "html", label: "HTML" },
];

const pageSizeOptions = [
  { value: "A4", label: "A4" },
  { value: "A5", label: "A5" },
  { value: "letter", label: "Carta" },
  { value: "thermal", label: "Térmico" },
];

const orientationOptions = [
  { value: "portrait", label: "Retrato" },
  { value: "landscape", label: "Paisagem" },
];

const initialConfig = {
  defaultFormat: "pdf",
  defaultPageSize: "A4",
  defaultOrientation: "portrait",
  emailNotifications: true,
  webhookUrl: "",
};

function ReportingConfigPage() {
  const [config, setConfig] = useState({ ...initialConfig });
  const [saving, setSaving] = useState(false);

  const { data: exports = [] } = useQuery({
    queryKey: ["reporting", "exports"],
    queryFn: () => exportService.list(),
  });

  const { data: executions = [] } = useQuery({
    queryKey: ["reporting", "history"],
    queryFn: () => executionService.list(),
  });

  const totalExports = exports.length;
  const totalExecutions = executions.length;

  const lastCleanup = (() => {
    const dates = exports.map((e) => e.startedAt).filter(Boolean).sort().reverse();
    return dates.length > 0 ? dates[dates.length - 1] : null;
  })();

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success("Configurações salvas com sucesso");
    }, 500);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground">Configure as opções gerais do módulo de relatórios</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings2 className="h-5 w-5" />
            Configurações Gerais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Formato de Exportação Padrão</Label>
              <Select
                value={config.defaultFormat}
                onValueChange={(v) => setConfig({ ...config, defaultFormat: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {formatOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tamanho de Página Padrão</Label>
              <Select
                value={config.defaultPageSize}
                onValueChange={(v) => setConfig({ ...config, defaultPageSize: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pageSizeOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Orientação Padrão</Label>
              <Select
                value={config.defaultOrientation}
                onValueChange={(v) => setConfig({ ...config, defaultOrientation: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {orientationOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mail className="h-5 w-5" />
            Notificações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Notificações por E-mail</Label>
              <p className="text-sm text-muted-foreground">Receber notificações sobre exportações e agendamentos</p>
            </div>
            <Switch
              checked={config.emailNotifications}
              onCheckedChange={(v) => setConfig({ ...config, emailNotifications: v })}
            />
          </div>
          <Separator />
          <div className="space-y-2">
            <Label>URL do Webhook</Label>
            <Input
              placeholder="https://exemplo.com/webhook"
              value={config.webhookUrl}
              onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              URL para receber notificações via webhook quando relatórios forem exportados
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <HardDrive className="h-5 w-5" />
            Armazenamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total de Exportações</p>
              <p className="text-2xl font-bold">{totalExports}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total de Execuções</p>
              <p className="text-2xl font-bold">{totalExecutions}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Última Limpeza</p>
              <p className="text-2xl font-bold">
                {lastCleanup ? new Date(lastCleanup).toLocaleDateString("pt-BR") : "—"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </div>
    </div>
  );
}