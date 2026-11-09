export type NotificationChannel = "WHATSAPP" | "EMAIL";
export type NotificationEventType =
  | "ORDER_CREATED"
  | "ORDER_WAITING_PAYMENT"
  | "PAYMENT_CREATED"
  | "PAYMENT_CONFIRMED"
  | "PAYMENT_FAILED"
  | "PAYMENT_EXPIRED"
  | "ORDER_CANCELLED"
  | "RESERVATION_CREATED"
  | "RESERVATION_EXPIRING"
  | "RESERVATION_EXPIRED"
  | "NUMBERS_CONFIRMED";
export type NotificationStatus =
  "PENDING" | "PROCESSING" | "SENT" | "DELIVERED" | "FAILED" | "CANCELLED" | "SKIPPED";

export interface NotificationTemplate {
  eventType: NotificationEventType;
  channel: NotificationChannel;
  subject: string;
  content: string;
}

export interface NotificationInput {
  customerId?: string;
  campaignId?: string;
  orderId?: string;
  paymentId?: string;
  eventType: NotificationEventType;
  channels: NotificationChannel[];
  variables: Record<string, string>;
  recipient: string;
  recipientName?: string;
}

export interface NotificationResult {
  id: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  providerMessageId?: string;
  error?: string;
}

// =============================================================================
// Templates padrao por tipo de evento e canal
// =============================================================================
const DEFAULT_TEMPLATES: Record<string, NotificationTemplate> = {
  "PAYMENT_CONFIRMED:WHATSAPP": {
    eventType: "PAYMENT_CONFIRMED",
    channel: "WHATSAPP",
    subject: "",
    content: `🎉 Pagamento confirmado!\n\n{{customer_name}}, seu pedido #{{order_id}} na campanha {{campaign_name}} foi confirmado.\n\n📦 {{product_name}}\n🔢 Numeros: {{numbers}}\n💰 Valor: {{total}}\n\n📅 Pago em: {{paid_at}}\n📄 Comprovante: {{confirmation_url}}`,
  },
  "PAYMENT_CONFIRMED:EMAIL": {
    eventType: "PAYMENT_CONFIRMED",
    channel: "EMAIL",
    subject: "Pagamento confirmado — {{campaign_name}}",
    content: `<h2>Pagamento confirmado!</h2><p>Ola {{customer_name}},</p><p>Seu pedido #{{order_id}} para <strong>{{campaign_name}}</strong> foi confirmado.</p><table><tr><td>Produto</td><td>{{product_name}}</td></tr><tr><td>Numeros</td><td>{{numbers}}</td></tr><tr><td>Valor</td><td>{{total}}</td></tr></table><p><a href="{{confirmation_url}}">Ver comprovante</a></p>`,
  },
  "ORDER_CREATED:WHATSAPP": {
    eventType: "ORDER_CREATED",
    channel: "WHATSAPP",
    subject: "",
    content: `📋 Pedido criado!\n\n{{customer_name}}, seu pedido #{{order_id}} foi registrado.\n\n📦 {{product_name}}\n🔢 Numeros: {{numbers}}\n💰 Total: {{total}}\n⏰ Prazo: {{reservation_expires_at}}`,
  },
  "ORDER_CREATED:EMAIL": {
    eventType: "ORDER_CREATED",
    channel: "EMAIL",
    subject: "Pedido criado — {{campaign_name}}",
    content: `<h2>Pedido criado</h2><p>Ola {{customer_name}}, seu pedido para {{campaign_name}} foi registrado.</p><p>Numeros: {{numbers}}<br>Total: {{total}}<br>Prazo: {{reservation_expires_at}}</p>`,
  },
  "PAYMENT_FAILED:WHATSAPP": {
    eventType: "PAYMENT_FAILED",
    channel: "WHATSAPP",
    subject: "",
    content: `❌ Pagamento nao processado\n\n{{customer_name}}, seu pagamento para {{campaign_name}} nao foi concluido.\n\nVoce pode tentar novamente: {{campaign_url}}`,
  },
  "PAYMENT_EXPIRED:WHATSAPP": {
    eventType: "PAYMENT_EXPIRED",
    channel: "WHATSAPP",
    subject: "",
    content: `⏰ Prazo expirado\n\n{{customer_name}}, o prazo para pagamento do pedido #{{order_id}} expirou.\n\nOs numeros {{numbers}} foram liberados. Faca uma nova reserva: {{campaign_url}}`,
  },
  "RESERVATION_EXPIRING:WHATSAPP": {
    eventType: "RESERVATION_EXPIRING",
    channel: "WHATSAPP",
    subject: "",
    content: `⚠️ Sua reserva expira em breve!\n\n{{customer_name}}, faltam {{minutes_remaining}} minutos para sua reserva expirar.\n\n📦 {{campaign_name}}\n🔢 Numeros: {{numbers}}\n💰 Total: {{total}}\n\nPague agora: {{campaign_url}}`,
  },
};

export function getTemplate(
  eventType: NotificationEventType,
  channel: NotificationChannel,
): NotificationTemplate {
  const key = `${eventType}:${channel}`;
  const custom = DEFAULT_TEMPLATES[key];
  if (custom) return custom;

  return {
    eventType,
    channel,
    subject: channel === "EMAIL" ? `Notificacao — ${eventType}` : "",
    content: `Notificacao: ${eventType}`,
  };
}

/**
 * Substitui {{variaveis}} no texto do template.
 * Seguro: apenas substituicao de texto, sem interpretacao de codigo.
 */
export function renderTemplate(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    const value = variables[key];
    return value !== undefined ? value : match;
  });
}
