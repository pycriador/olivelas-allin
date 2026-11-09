import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Wrench, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DocButton } from "@/components/doc-button";
import { maintenanceService } from "@/modules/admin/service";
import type { MaintenanceMode } from "@/modules/admin/types";

export const Route = createFileRoute("/_app/admin/maintenance")({
  head: () => ({ meta: [{ title: "Admin Manutenção — ServiceForge" }] }),
  component: AdminMaintenancePage,
});

function AdminMaintenancePage() {
  const qc = useQueryClient();
  const [message, setMessage] = useState("");
  const [scheduledEnd, setScheduledEnd] = useState("");

  const { data: maintenance } = useQuery({ queryKey: ["admin", "maintenance"], queryFn: () => maintenanceService.get() });

  const toggleMut = useMutation({
    mutationFn: () => maintenanceService.toggle(message || undefined, scheduledEnd || undefined, "admin"),
    onSuccess: (result) => { qc.invalidateQueries({ queryKey: ["admin", "maintenance"] }); toast.success(result.active ? "Modo manutenção ativado" : "Modo manutenção desativado"); },
    onError: () => toast.error("Erro ao alterar modo manutenção"),
  });

  const handleToggle = () => {
    if (!maintenance?.active && !message) {
      toast.error("Informe uma mensagem para o modo manutenção");
      return;
    }
    toggleMut.mutate();
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Manutenção</h1>
          <DocButton module="admin" page="maintenance" title="Manutenção" />
        </div>
        <p className="text-sm text-muted-foreground">Gerencie o modo de manutenção da plataforma</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Wrench className="h-5 w-5" />Status Atual</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant={maintenance?.active ? "destructive" : "secondary"} className="gap-1 text-sm px-3 py-1">
                {maintenance?.active ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                {maintenance?.active ? "Em Manutenção" : "Operacional"}
              </Badge>
              <div className="flex items-center gap-2">
                <Label>Ativar Manutenção</Label>
                <Switch checked={maintenance?.active ?? false} onCheckedChange={handleToggle} />
              </div>
            </div>
          </div>

          {maintenance?.active && (
            <div className="space-y-3 rounded-md border p-4">
              <div className="text-sm"><span className="text-muted-foreground">Mensagem:</span><span className="ml-2 font-medium">{maintenance.message}</span></div>
              {maintenance.startedAt && (
                <div className="text-sm"><span className="text-muted-foreground">Iniciado em:</span><span className="ml-2 font-medium">{new Date(maintenance.startedAt).toLocaleString()}</span></div>
              )}
              {maintenance.scheduledEnd && (
                <div className="text-sm"><span className="text-muted-foreground">Término agendado:</span><span className="ml-2 font-medium">{new Date(maintenance.scheduledEnd).toLocaleString()}</span></div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configurar Manutenção</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Mensagem</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Sistema em manutenção programada..."
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Término Agendado</Label>
            <Input
              type="datetime-local"
              value={scheduledEnd}
              onChange={(e) => setScheduledEnd(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            A data e hora do término agendado
          </div>
          <Button onClick={handleToggle} disabled={toggleMut.isPending}>
            {maintenance?.active ? "Desativar Manutenção" : "Ativar Manutenção"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
