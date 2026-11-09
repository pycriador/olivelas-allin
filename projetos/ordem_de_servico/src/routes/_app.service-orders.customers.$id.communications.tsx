import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Mail, MessageCircle, MessageSquare, Send, Bell, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { customerService } from "@/modules/customers/service";

export const Route = createFileRoute("/_app/service-orders/customers/$id/communications")({
  head: () => ({ meta: [{ title: "Comunicações — ServiceForge" }] }),
  component: CustomerCommunicationsPage,
});

const channelIcons: Record<string, any> = {
  email: Mail, whatsapp: MessageCircle, sms: MessageSquare, telegram: Send, notification: Bell,
};
const channelLabels: Record<string, string> = {
  email: "Email", whatsapp: "WhatsApp", sms: "SMS", telegram: "Telegram", notification: "Notificação",
};
const channelColors: Record<string, string> = {
  email: "text-blue-500 bg-blue-100", whatsapp: "text-green-500 bg-green-100",
  sms: "text-purple-500 bg-purple-100", telegram: "text-sky-500 bg-sky-100", notification: "text-amber-500 bg-amber-100",
};
const statusLabels: Record<string, string> = { sent: "Enviada", failed: "Falhou", read: "Lida" };
const statusColors: Record<string, string> = {
  sent: "bg-blue-100 text-blue-700", failed: "bg-red-100 text-red-700", read: "bg-green-100 text-green-700",
};

function CustomerCommunicationsPage() {
  const { id } = Route.useParams();
  const { t } = useTranslation();

  const { data: customer, isLoading } = useQuery({
    queryKey: ["customer", id],
    queryFn: () => customerService.get(id),
  });

  const communications = customer?.communications ?? [];

  if (isLoading) return <div className="flex items-center justify-center py-12"><p className="text-sm text-muted-foreground">Carregando...</p></div>;
  if (!customer) return <div className="flex items-center justify-center py-12"><p className="text-sm text-muted-foreground">Cliente não encontrado</p></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Comunicações</h1>
        <p className="text-sm text-muted-foreground">Histórico de comunicações com o cliente</p>
      </div>

      {communications.length === 0 ? (
        <Card><CardContent><p className="py-12 text-center text-sm text-muted-foreground">Nenhuma comunicação registrada</p></CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="p-3 font-medium">Canal</th>
                  <th className="p-3 font-medium">Assunto</th>
                  <th className="p-3 font-medium">Data</th>
                  <th className="p-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {communications.map((c) => {
                  const Icon = channelIcons[c.channel] || Phone;
                  const channelColor = channelColors[c.channel] || "text-gray-500 bg-gray-100";
                  return (
                    <tr key={c.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className={`h-7 w-7 rounded-full ${channelColor} flex items-center justify-center`}>
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <span>{channelLabels[c.channel] || c.channel}</span>
                        </div>
                      </td>
                      <td className="p-3 font-medium">{c.subject}</td>
                      <td className="p-3 text-muted-foreground">{new Date(c.sentAt).toLocaleString("pt-BR")}</td>
                      <td className="p-3">
                        <Badge className={statusColors[c.status]} variant="outline">{statusLabels[c.status]}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
