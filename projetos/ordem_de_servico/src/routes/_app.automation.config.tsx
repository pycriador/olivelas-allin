import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Save, Clock, Bell, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/automation/config")({
  head: () => ({ meta: [{ title: "Configurações — ServiceForge" }] }),
  component: AutomationConfigPage,
});

function AutomationConfigPage() {
  const [defaultTimeout, setDefaultTimeout] = useState("30000");
  const [maxRetries, setMaxRetries] = useState("3");
  const [executionMode, setExecutionMode] = useState("async");
  const [notifyFailures, setNotifyFailures] = useState(true);
  const [notifySuccess, setNotifySuccess] = useState(false);
  const [autoCleanup, setAutoCleanup] = useState(false);
  const [retentionDays, setRetentionDays] = useState("30");
  const lastCleanup = "12/07/2026 03:00";

  const handleSave = () => {
    toast.success("Configurações salvas com sucesso");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Configurações</h1>
          <p className="text-sm text-muted-foreground">Gerencie as configurações globais de automação</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Configurações Gerais</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="timeout">Timeout Padrão (ms)</Label>
            <Input
              id="timeout"
              type="number"
              value={defaultTimeout}
              onChange={(e) => setDefaultTimeout(e.target.value)}
              placeholder="30000"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="retries">Máximo de Tentativas</Label>
            <Input
              id="retries"
              type="number"
              value={maxRetries}
              onChange={(e) => setMaxRetries(e.target.value)}
              placeholder="3"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="mode">Modo de Execução</Label>
            <Select value={executionMode} onValueChange={setExecutionMode}>
              <SelectTrigger id="mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sync">Síncrono</SelectItem>
                <SelectItem value="async">Assíncrono</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Notificações</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="notify-failures">Notificar falhas</Label>
              <p className="text-sm text-muted-foreground">Enviar notificação por e-mail quando uma execução falhar</p>
            </div>
            <Switch
              id="notify-failures"
              checked={notifyFailures}
              onCheckedChange={setNotifyFailures}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="notify-success">Notificar sucessos</Label>
              <p className="text-sm text-muted-foreground">Enviar notificação por e-mail quando uma execução for concluída com sucesso</p>
            </div>
            <Switch
              id="notify-success"
              checked={notifySuccess}
              onCheckedChange={setNotifySuccess}
            />
          </div>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Limpeza</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-cleanup">Limpeza automática</Label>
              <p className="text-sm text-muted-foreground">Remover automaticamente execuções antigas</p>
            </div>
            <Switch
              id="auto-cleanup"
              checked={autoCleanup}
              onCheckedChange={setAutoCleanup}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="retention">Dias de Retenção</Label>
            <Input
              id="retention"
              type="number"
              value={retentionDays}
              onChange={(e) => setRetentionDays(e.target.value)}
              disabled={!autoCleanup}
              placeholder="30"
            />
          </div>

          <div className="text-sm text-muted-foreground">
            Última limpeza: {lastCleanup}
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave}>
        <Save className="mr-2 h-4 w-4" />
        Salvar Configurações
      </Button>
    </div>
  );
}
