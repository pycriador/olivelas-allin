import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Settings, Shield, Bell } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_app/portal/config")({
  head: () => ({ meta: [{ title: "Configurações do Portal — ServiceForge" }] }),
  component: PortalConfigPage,
});

function PortalConfigPage() {
  const [general, setGeneral] = useState({
    defaultLinkExpiration: "48",
    maxUploadSize: "10",
    allowedFileTypes: "pdf,jpg,png,zip",
    defaultLanguage: "pt-BR",
  });

  const [security, setSecurity] = useState({
    enableRateLimit: true,
    maxAttempts: "5",
    blockDuration: "30",
    requirePasswordForShares: false,
  });

  const [notifications, setNotifications] = useState({
    enableEmailNotifications: true,
    notifyOnUpload: true,
    notifyOnApproval: false,
    notifyOnSignature: false,
  });

  const handleSave = () => {
    toast("Configurações salvas com sucesso");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Configurações do Portal</h1>
        <p className="text-sm text-muted-foreground">Personalize o comportamento do portal público</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings className="h-4 w-4" /> Configurações Gerais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 max-w-lg">
          <div className="space-y-2">
            <Label>Expiração padrão de link (horas)</Label>
            <Input
              type="number" min="1"
              value={general.defaultLinkExpiration}
              onChange={(e) => setGeneral({ ...general, defaultLinkExpiration: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Tamanho máximo de upload (MB)</Label>
            <Input
              type="number" min="1"
              value={general.maxUploadSize}
              onChange={(e) => setGeneral({ ...general, maxUploadSize: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Tipos de arquivo permitidos (separados por vírgula)</Label>
            <Input
              value={general.allowedFileTypes}
              onChange={(e) => setGeneral({ ...general, allowedFileTypes: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Idioma padrão</Label>
            <Select
              value={general.defaultLanguage}
              onValueChange={(v) => setGeneral({ ...general, defaultLanguage: v })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pt-BR">Português (BR)</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Español</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4" /> Segurança
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 max-w-lg">
          <div className="flex items-center gap-2">
            <Switch
              checked={security.enableRateLimit}
              onCheckedChange={(v) => setSecurity({ ...security, enableRateLimit: v })}
            />
            <Label>Habilitar limite de requisições</Label>
          </div>
          <Separator />
          <div className="space-y-2">
            <Label>Tentativas máximas</Label>
            <Input
              type="number" min="1"
              value={security.maxAttempts}
              onChange={(e) => setSecurity({ ...security, maxAttempts: e.target.value })}
            />
          </div>
          <Separator />
          <div className="space-y-2">
            <Label>Tempo de bloqueio (minutos)</Label>
            <Input
              type="number" min="1"
              value={security.blockDuration}
              onChange={(e) => setSecurity({ ...security, blockDuration: e.target.value })}
            />
          </div>
          <Separator />
          <div className="flex items-center gap-2">
            <Switch
              checked={security.requirePasswordForShares}
              onCheckedChange={(v) => setSecurity({ ...security, requirePasswordForShares: v })}
            />
            <Label>Exigir senha para compartilhamentos</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-4 w-4" /> Notificações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 max-w-lg">
          <div className="flex items-center gap-2">
            <Switch
              checked={notifications.enableEmailNotifications}
              onCheckedChange={(v) => setNotifications({ ...notifications, enableEmailNotifications: v })}
            />
            <Label>Habilitar notificações por e-mail</Label>
          </div>
          <Separator />
          <div className="flex items-center gap-2">
            <Switch
              checked={notifications.notifyOnUpload}
              onCheckedChange={(v) => setNotifications({ ...notifications, notifyOnUpload: v })}
            />
            <Label>Notificar ao receber upload</Label>
          </div>
          <Separator />
          <div className="flex items-center gap-2">
            <Switch
              checked={notifications.notifyOnApproval}
              onCheckedChange={(v) => setNotifications({ ...notifications, notifyOnApproval: v })}
            />
            <Label>Notificar ao receber aprovação</Label>
          </div>
          <Separator />
          <div className="flex items-center gap-2">
            <Switch
              checked={notifications.notifyOnSignature}
              onCheckedChange={(v) => setNotifications({ ...notifications, notifyOnSignature: v })}
            />
            <Label>Notificar ao receber assinatura</Label>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>Salvar Configurações</Button>
      </div>
    </div>
  );
}
