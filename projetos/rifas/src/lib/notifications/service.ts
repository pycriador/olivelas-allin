import type {
  NotificationChannel,
  NotificationEventType,
  NotificationInput,
  NotificationResult,
} from "./types";
import { getTemplate, renderTemplate } from "./types";

export interface NotificationLogEntry {
  id: string;
  at: string;
  eventType: NotificationEventType;
  channel: NotificationChannel;
  status: NotificationResult["status"];
  recipient: string;
  error?: string;
}

/** Log em memoria do processo (observabilidade basica ate haver tabela dedicada). */
const recentLogs: NotificationLogEntry[] = [];
const MAX_LOGS = 200;

function pushLog(entry: NotificationLogEntry): void {
  recentLogs.unshift(entry);
  if (recentLogs.length > MAX_LOGS) recentLogs.length = MAX_LOGS;
}

export function getRecentNotificationLogs(limit = 50): NotificationLogEntry[] {
  return recentLogs.slice(0, limit);
}

function siteOrigin(): string {
  return (
    process.env["PUBLIC_SITE_URL"] ??
    process.env["VITE_PUBLIC_SITE_URL"] ??
    "https://olivelas-raffle.lovable.app"
  );
}

/**
 * Envia notificacao ao comprador (server-side safe).
 * WhatsApp: gera deep link e registra (envio automatico via API quando configurada).
 * Email: tenta Edge Function send-email; fallback mailto log.
 */
export async function sendNotification(input: NotificationInput): Promise<NotificationResult[]> {
  const results: NotificationResult[] = [];

  for (const channel of input.channels) {
    try {
      const result = await sendByChannel(channel, input);
      results.push(result);
      pushLog({
        id: result.id || `${channel}-${Date.now()}`,
        at: new Date().toISOString(),
        eventType: input.eventType,
        channel,
        status: result.status,
        recipient: maskRecipient(channel, input.recipient),
        ...(result.error !== undefined ? { error: result.error } : {}),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao enviar notificacao";
      results.push({ id: "", channel, status: "FAILED", error: message });
      pushLog({
        id: `${channel}-err-${Date.now()}`,
        at: new Date().toISOString(),
        eventType: input.eventType,
        channel,
        status: "FAILED",
        recipient: maskRecipient(channel, input.recipient),
        error: message,
      });
    }
  }

  return results;
}

function maskRecipient(channel: NotificationChannel, recipient: string): string {
  if (channel === "EMAIL") {
    const [user, domain] = recipient.split("@");
    if (!domain) return "***";
    return `${user?.[0] ?? "*"}***@${domain}`;
  }
  const digits = recipient.replace(/\D/g, "");
  if (digits.length < 4) return "***";
  return `***${digits.slice(-4)}`;
}

async function sendByChannel(
  channel: NotificationChannel,
  input: NotificationInput,
): Promise<NotificationResult> {
  const template = getTemplate(input.eventType, channel);
  const content = renderTemplate(template.content, input.variables);
  const subject = channel === "EMAIL" ? renderTemplate(template.subject, input.variables) : "";

  switch (channel) {
    case "WHATSAPP":
      return sendWhatsApp(input.recipient, content);
    case "EMAIL":
      return sendEmail(input.recipient, subject, content);
    default:
      return { id: "", channel, status: "SKIPPED" };
  }
}

async function sendWhatsApp(phone: string, content: string): Promise<NotificationResult> {
  if (!phone) return { id: "", channel: "WHATSAPP", status: "SKIPPED" };

  const clean = phone.replace(/\D/g, "");
  if (clean.length < 8) return { id: "", channel: "WHATSAPP", status: "SKIPPED" };

  const deepLink = `https://wa.me/${clean}?text=${encodeURIComponent(content)}`;

  // Provider HTTP opcional (Z-API / Evolution / etc.)
  const apiUrl = process.env["WHATSAPP_API_URL"];
  const apiToken = process.env["WHATSAPP_API_TOKEN"];

  if (apiUrl && apiToken) {
    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${apiToken}`,
        },
        body: JSON.stringify({ phone: clean, message: content, link: deepLink }),
      });
      if (!response.ok) {
        const text = await response.text();
        return {
          id: "",
          channel: "WHATSAPP",
          status: "FAILED",
          error: `WhatsApp API ${response.status}: ${text.slice(0, 200)}`,
        };
      }
      return {
        id: `wa-api-${Date.now()}`,
        channel: "WHATSAPP",
        status: "SENT",
        providerMessageId: String(response.headers.get("x-message-id") ?? ""),
      };
    } catch (error) {
      return {
        id: "",
        channel: "WHATSAPP",
        status: "FAILED",
        error: error instanceof Error ? error.message : "WhatsApp API unreachable",
      };
    }
  }

  // Sem API: registra deep link (admin pode abrir / enviar manualmente)
  console.log(
    JSON.stringify({
      scope: "notifications",
      channel: "WHATSAPP",
      event: "WHATSAPP_DEEPLINK_QUEUED",
      phone: `***${clean.slice(-4)}`,
      linkBytes: deepLink.length,
    }),
  );

  return {
    id: `wa-link-${Date.now()}`,
    channel: "WHATSAPP",
    status: "PENDING",
    providerMessageId: deepLink,
  };
}

async function sendEmail(
  email: string,
  subject: string,
  html: string,
): Promise<NotificationResult> {
  if (!email || !email.includes("@")) {
    return { id: "", channel: "EMAIL", status: "SKIPPED" };
  }

  // 1) Edge Function Supabase (quando existir)
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.functions.invoke("send-email", {
      body: { to: email, subject, html },
    });
    if (!error) {
      const providerMessageId =
        typeof data === "object" && data && "id" in data
          ? String((data as { id: unknown }).id)
          : undefined;
      return {
        id: `em-fn-${Date.now()}`,
        channel: "EMAIL",
        status: "SENT",
        ...(providerMessageId !== undefined ? { providerMessageId } : {}),
      };
    }
    // Se a function nao existir, cai no SMTP/log
    console.log(
      JSON.stringify({
        scope: "notifications",
        channel: "EMAIL",
        event: "EMAIL_FUNCTION_FALLBACK",
        detail: error.message,
      }),
    );
  } catch {
    // continua
  }

  // 2) SMTP HTTP generico (Resend-like)
  const resendKey = process.env["RESEND_API_KEY"];
  const from = process.env["EMAIL_FROM"] ?? "RaffleHub <noreply@olivelas.app>";
  if (resendKey) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          authorization: `Bearer ${resendKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ from, to: [email], subject, html }),
      });
      if (!response.ok) {
        const text = await response.text();
        return {
          id: "",
          channel: "EMAIL",
          status: "FAILED",
          error: `Resend ${response.status}: ${text.slice(0, 200)}`,
        };
      }
      const body = (await response.json()) as { id?: string };
      return {
        id: `em-resend-${Date.now()}`,
        channel: "EMAIL",
        status: "SENT",
        ...(body.id !== undefined ? { providerMessageId: body.id } : {}),
      };
    } catch (error) {
      return {
        id: "",
        channel: "EMAIL",
        status: "FAILED",
        error: error instanceof Error ? error.message : "Resend unreachable",
      };
    }
  }

  console.log(
    JSON.stringify({
      scope: "notifications",
      channel: "EMAIL",
      event: "EMAIL_QUEUED_NO_PROVIDER",
      to: maskRecipient("EMAIL", email),
      subject,
    }),
  );

  return {
    id: `em-log-${Date.now()}`,
    channel: "EMAIL",
    status: "PENDING",
  };
}

/**
 * Dispara notificacao de pagamento confirmado (server-side).
 * Nao lanca erro para o caller — falhas ficam no log.
 */
export async function notifyPaymentConfirmed(input: {
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  campaignName: string;
  productName: string;
  orderId: string;
  numbers: string;
  total: string;
  paidAt: string;
  confirmationUrl?: string;
}): Promise<NotificationResult[]> {
  const channels: NotificationChannel[] = [];
  if (input.customerPhone) channels.push("WHATSAPP");
  if (input.customerEmail) channels.push("EMAIL");
  if (channels.length === 0) return [];

  const confirmationUrl =
    input.confirmationUrl ?? `${siteOrigin().replace(/\/$/, "")}/confirmation/${input.orderId}`;

  const baseVariables = {
    customer_name: input.customerName,
    campaign_name: input.campaignName,
    product_name: input.productName,
    order_id: input.orderId.slice(0, 8),
    numbers: input.numbers,
    total: input.total,
    paid_at: input.paidAt,
    confirmation_url: confirmationUrl,
  };

  const results: NotificationResult[] = [];

  // WhatsApp usa telefone como recipient
  if (input.customerPhone) {
    const wa = await sendNotification({
      eventType: "PAYMENT_CONFIRMED",
      channels: ["WHATSAPP"],
      recipient: input.customerPhone,
      recipientName: input.customerName,
      orderId: input.orderId,
      variables: baseVariables,
    });
    results.push(...wa);
  }

  if (input.customerEmail) {
    const em = await sendNotification({
      eventType: "PAYMENT_CONFIRMED",
      channels: ["EMAIL"],
      recipient: input.customerEmail,
      recipientName: input.customerName,
      orderId: input.orderId,
      variables: baseVariables,
    });
    results.push(...em);
  }

  return results;
}

/** Carrega dados do pagamento e notifica o comprador apos PAID. */
export async function notifyPaymentConfirmedByPaymentId(paymentId: string): Promise<void> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: payment } = await supabaseAdmin
      .from("payments")
      .select("id, order_id, campaign_id, customer_id, amount, paid_at, status")
      .eq("id", paymentId)
      .maybeSingle();
    if (!payment || payment.status !== "PAID") return;

    const [orderRes, campaignRes, customerRes, itemsRes] = await Promise.all([
      supabaseAdmin.from("orders").select("id, total").eq("id", payment.order_id).maybeSingle(),
      supabaseAdmin
        .from("campaigns")
        .select("title, product_name")
        .eq("id", payment.campaign_id)
        .maybeSingle(),
      payment.customer_id
        ? supabaseAdmin
            .from("customers")
            .select("full_name, phone, email")
            .eq("id", payment.customer_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      supabaseAdmin.from("order_items").select("number").eq("order_id", payment.order_id),
    ]);

    const customer = customerRes.data;
    if (!customer?.phone && !customer?.email) return;

    const numbers = (itemsRes.data ?? [])
      .map((item) => String(item.number).padStart(3, "0"))
      .join(", ");

    await notifyPaymentConfirmed({
      customerName: customer?.full_name ?? "Participante",
      customerPhone: customer?.phone ?? "",
      customerEmail: customer?.email ?? null,
      campaignName: campaignRes.data?.title ?? "Campanha",
      productName: campaignRes.data?.product_name ?? "",
      orderId: payment.order_id,
      numbers,
      total: new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
        Number(orderRes.data?.total ?? payment.amount),
      ),
      paidAt: payment.paid_at
        ? new Date(payment.paid_at).toLocaleString("pt-BR")
        : new Date().toLocaleString("pt-BR"),
    });
  } catch (error) {
    console.error(
      JSON.stringify({
        scope: "notifications",
        event: "NOTIFY_PAYMENT_FAILED",
        paymentId,
        detail: error instanceof Error ? error.message : String(error),
      }),
    );
  }
}
