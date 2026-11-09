import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ShieldCheck, ThumbsUp, ThumbsDown, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { serviceOrderService } from "@/modules/service-orders/service";
import { eventBus, EVENT_NAMES } from "@/modules/events/service";

export const Route = createFileRoute("/_app/service-orders/$id/quality")({
  head: () => ({ meta: [{ title: "Controle de Qualidade — ServiceForge" }] }),
  component: QualityTab,
});

function QualityTab() {
  const { id } = Route.useParams();
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [observations, setObservations] = useState("");

  const { data: qcEntry, isLoading } = useQuery({
    queryKey: ["so-quality", id],
    queryFn: () => serviceOrderService.getQualityControl(id),
  });

  const approveQc = useMutation({
    mutationFn: () => serviceOrderService.createQualityControl(id, {
      result: "approved", observations, responsibleName: "Admin",
    }, "Admin"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["so-quality", id] });
      qc.invalidateQueries({ queryKey: ["service-order", id] });
      toast("Qualidade aprovada");
    },
    onError: () => toast("Erro ao aprovar qualidade"),
  });

  const rejectQc = useMutation({
    mutationFn: () => serviceOrderService.createQualityControl(id, {
      result: "rejected", observations, responsibleName: "Admin",
    }, "Admin"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["so-quality", id] });
      qc.invalidateQueries({ queryKey: ["service-order", id] });
      toast("Qualidade reprovada");
    },
    onError: () => toast("Erro ao reprovar qualidade"),
  });

  if (isLoading) return <div className="text-center py-8 text-sm text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Controle de Qualidade</h2>
        <p className="text-sm text-muted-foreground">Etapa obrigatória antes da entrega</p>
      </div>

      {qcEntry ? (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              {qcEntry.result === "approved" ? (
                <div className="flex items-center gap-2 text-green-600">
                  <ThumbsUp className="h-8 w-8" />
                  <span className="text-lg font-semibold">APROVADO</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-600">
                  <ThumbsDown className="h-8 w-8" />
                  <span className="text-lg font-semibold">REPROVADO</span>
                </div>
              )}
              <Badge variant={qcEntry.result === "approved" ? "default" : "destructive"} className="ml-2">
                {qcEntry.result === "approved" ? "Aprovado" : "Reprovado"}
              </Badge>
            </div>
            {qcEntry.observations && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Observações:</p>
                <p className="text-sm mt-1">{qcEntry.observations}</p>
              </div>
            )}
            {qcEntry.responsibleName && (
              <p className="text-xs text-muted-foreground">Responsável: {qcEntry.responsibleName} · {new Date(qcEntry.createdAt).toLocaleString("pt-BR")}</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6 space-y-4">
            <p className="text-sm text-muted-foreground">Nenhum controle de qualidade registrado ainda.</p>
            <div>
              <label className="text-sm font-medium">Observações</label>
              <Textarea className="mt-1" value={observations} onChange={(e) => setObservations(e.target.value)}
                placeholder="Descreva o resultado da inspeção de qualidade..." />
            </div>
            <div className="flex gap-3">
              <Button onClick={() => approveQc.mutate()} className="flex-1">
                <ThumbsUp className="mr-2 h-4 w-4" /> Aprovar
              </Button>
              <Button onClick={() => rejectQc.mutate()} variant="destructive" className="flex-1">
                <ThumbsDown className="mr-2 h-4 w-4" /> Reprovar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
