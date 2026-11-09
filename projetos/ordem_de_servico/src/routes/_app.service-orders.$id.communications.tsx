import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare, Mail, Bell, CheckCircle, Clock, AlertTriangle, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { serviceOrderService } from "@/modules/service-orders/service";

export const Route = createFileRoute("/_app/service-orders/$id/communications")({
  head: () => ({ meta: [{ title: "Comunicações — ServiceForge" }] }),
  component: CommunicationsTab,
});

function CommunicationsTab() {
  const { id } = Route.useParams();
  const { t } = useTranslation();

  const { data: so, isLoading } = useQuery({
    queryKey: ["service-order", id],
    queryFn: () => serviceOrderService.get(id),
  });

  const handleNotify = (notificationType: string) => {
    toast(`Enviar notificação: ${notificationType} (integração com Communication Platform pendente)`);
  };

  if (isLoading) return <div className="flex items-center justify-center py-12"><p className="text-sm text-muted-foreground">{t("common.loading")}</p></div>;

  const communications = so?.communications ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold">{t("so.communications")}</h2>
      </div>

      {/* Notification Buttons */}
      <Card>
        <CardHeader><CardTitle className="text-base">Enviar Notificação</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => handleNotify("Diagnóstico Concluído")}>
              <CheckCircle className="mr-1 h-4 w-4 text-green-500" />Diagnóstico Concluído
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleNotify("Aguardando Aprovação")}>
              <Clock className="mr-1 h-4 w-4 text-amber-500" />Aguardando Aprovação
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleNotify("Aguardando Peça")}>
              <AlertTriangle className="mr-1 h-4 w-4 text-orange-500" />Aguardando Peça
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleNotify("Equipamento Pronto")}>
              <Wrench className="mr-1 h-4 w-4 text-green-500" />Equipamento Pronto
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Communications List */}
      {communications.length === 0 ? (
        <Card><CardContent><p className="py-8 text-center text-sm text-muted-foreground">Nenhuma comunicação enviada.</p></CardContent></Card>
      ) : (
        <Card>
          <CardHeader><CardTitle className="text-base">Histórico de Comunicações</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {communications.map((comm) => (
                <div key={comm.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                  <div className="flex items-center gap-3">
                    {comm.channel === "email" ? <Mail className="h-4 w-4 text-blue-500" /> :
                     comm.channel === "whatsapp" ? <MessageSquare className="h-4 w-4 text-green-500" /> :
                     <Bell className="h-4 w-4 text-amber-500" />}
                    <div>
                      <p className="font-medium">{comm.subject}</p>
                      <p className="text-xs text-muted-foreground">
                        {comm.channel === "email" ? "E-mail" : comm.channel === "whatsapp" ? "WhatsApp" : "Notificação"}
                        {" · "}Para: {comm.to}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(comm.sentAt).toLocaleString("pt-BR")}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
