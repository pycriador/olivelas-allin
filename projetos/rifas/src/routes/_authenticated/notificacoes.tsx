import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Mail, MessageCircle, Send } from "lucide-react";

import { PageHeader } from "@/components/common/page-header";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { StatCard } from "@/features/dashboard/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useOrders } from "@/features/orders/hooks/use-orders";
import { formatDateTime } from "@/lib/format";
import {
  getTemplate,
  renderTemplate,
  type NotificationEventType,
  type NotificationChannel,
} from "@/lib/notifications/types";
import { listNotificationLogsAdmin } from "@/lib/notifications/admin.server";

export const Route = createFileRoute("/_authenticated/notificacoes")({
  head: () => ({
    meta: [
      { title: "Notificacoes — RaffleHub" },
      { name: "description", content: "Central de comunicacao e notificacoes." },
    ],
  }),
  component: NotificacoesPage,
});

const EVENT_LABELS: Record<NotificationEventType, string> = {
  ORDER_CREATED: "Pedido criado",
  ORDER_WAITING_PAYMENT: "Aguardando pagamento",
  PAYMENT_CREATED: "Pagamento criado",
  PAYMENT_CONFIRMED: "Pagamento confirmado",
  PAYMENT_FAILED: "Pagamento falhou",
  PAYMENT_EXPIRED: "Pagamento expirado",
  ORDER_CANCELLED: "Pedido cancelado",
  RESERVATION_CREATED: "Reserva criada",
  RESERVATION_EXPIRING: "Reserva expirando",
  RESERVATION_EXPIRED: "Reserva expirada",
  NUMBERS_CONFIRMED: "Numeros confirmados",
};

function NotificacoesPage() {
  const { data } = useOrders({ page: 1, pageSize: 30, filters: { status: "PAID" } });
  const paidOrders = data?.items ?? [];

  const logsQuery = useQuery({
    queryKey: ["admin", "notification-logs"],
    queryFn: () => listNotificationLogsAdmin(),
    refetchInterval: 15_000,
  });

  const logs = logsQuery.data?.logs ?? [];
  const providers = logsQuery.data?.providers;
  const whatsappSent = logs.filter((l) => l.channel === "WHATSAPP" && l.status === "SENT").length;
  const emailSent = logs.filter((l) => l.channel === "EMAIL" && l.status === "SENT").length;
  const pending = logs.filter((l) => l.status === "PENDING" || l.status === "FAILED").length;

  return (
    <PermissionGuard permission="notifications.view">
      <div className="space-y-6">
        <PageHeader
          title="Notificacoes"
          description="Templates e envios automaticos apos confirmacao de pagamento (server-side)."
        />

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="WhatsApp (sessao)" value={String(whatsappSent)} icon={MessageCircle} />
          <StatCard title="E-mail (sessao)" value={String(emailSent)} icon={Mail} />
          <StatCard title="Pedidos pagos" value={String(paidOrders.length)} icon={Send} />
          <StatCard
            title="Pendentes/Falhas"
            value={String(pending)}
            hint="log em memoria do processo"
            icon={AlertTriangle}
          />
        </section>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Providers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">E-mail:</strong> Edge Function{" "}
              <code>send-email</code> ou <code>RESEND_API_KEY</code> + <code>EMAIL_FROM</code>.{" "}
              Status: {providers?.emailResend ? "Resend configurado" : "sem Resend (fallback log)"}.
            </p>
            <p>
              <strong className="text-foreground">WhatsApp:</strong> <code>WHATSAPP_API_URL</code> +{" "}
              <code>WHATSAPP_API_TOKEN</code>. Status:{" "}
              {providers?.whatsappApi ? "API configurada" : "sem API (deep link PENDING)"}.
            </p>
            <p>
              Disparo automatico em <code>applyPaymentOutcome(PAID)</code> apos webhook/confirmacao.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Envios recentes (processo)</CardTitle>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum envio nesta instancia ainda. Confirme um pagamento para gerar log.
              </p>
            ) : (
              <div className="space-y-2">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex flex-col gap-1 rounded-lg border px-3 py-2 text-xs sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium">
                        {EVENT_LABELS[log.eventType] ?? log.eventType} · {log.channel}
                      </p>
                      <p className="text-muted-foreground">
                        {log.recipient} · {formatDateTime(log.at)}
                        {log.error ? ` · ${log.error}` : ""}
                      </p>
                    </div>
                    <Badge
                      variant={
                        log.status === "SENT"
                          ? "default"
                          : log.status === "FAILED"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {log.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Preview de templates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(
                ["PAYMENT_CONFIRMED", "ORDER_CREATED", "PAYMENT_EXPIRED"] as NotificationEventType[]
              ).map((eventType) => (
                <TemplatePreviewCard key={eventType} eventType={eventType} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  );
}

function TemplatePreviewCard({ eventType }: { eventType: NotificationEventType }) {
  const sampleVars = {
    customer_name: "Maria Silva",
    campaign_name: "iPhone 17 Pro",
    product_name: "iPhone 17 Pro Max 256GB",
    order_id: "abc12345",
    numbers: "001, 015, 088, 120",
    quantity: "4",
    unit_price: "R$ 10,00",
    total: "R$ 40,00",
    paid_at: new Date().toLocaleString("pt-BR"),
    payment_status: "PAID",
    payment_method: "PIX",
    reservation_expires_at: new Date(Date.now() + 15 * 60_000).toLocaleString("pt-BR"),
    campaign_url: "https://rafflehub.app/r/iphone17",
    confirmation_url: "https://rafflehub.app/confirmation/abc12345",
    minutes_remaining: "5",
    support_phone: "(11) 99999-9999",
  };

  return (
    <div className="rounded-lg border p-4">
      <div className="mb-3 flex items-center gap-2">
        <Badge>{EVENT_LABELS[eventType] ?? eventType}</Badge>
        <span className="text-xs text-muted-foreground">Template</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <ChannelPreview channel="WHATSAPP" eventType={eventType} variables={sampleVars} />
        <ChannelPreview channel="EMAIL" eventType={eventType} variables={sampleVars} />
      </div>
    </div>
  );
}

function ChannelPreview({
  channel,
  eventType,
  variables,
}: {
  channel: NotificationChannel;
  eventType: NotificationEventType;
  variables: Record<string, string>;
}) {
  const template = getTemplate(eventType, channel);
  const content = renderTemplate(template.content, variables);
  const subject = channel === "EMAIL" ? renderTemplate(template.subject, variables) : null;

  return (
    <div className="rounded-md bg-muted/50 p-3">
      <div className="mb-2 flex items-center gap-1 text-xs font-medium text-muted-foreground">
        {channel === "WHATSAPP" ? (
          <MessageCircle className="size-3" />
        ) : (
          <Mail className="size-3" />
        )}
        {channel === "WHATSAPP" ? "WhatsApp" : "E-mail"}
      </div>
      {subject ? <p className="mb-1 text-xs font-medium">{subject}</p> : null}
      <div className="max-h-40 overflow-auto rounded bg-background p-2">
        {channel === "EMAIL" ? (
          <div className="text-xs" dangerouslySetInnerHTML={{ __html: content }} />
        ) : (
          <p className="whitespace-pre-wrap text-xs">{content}</p>
        )}
      </div>
    </div>
  );
}
