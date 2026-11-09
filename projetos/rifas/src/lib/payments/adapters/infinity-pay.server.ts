import {
  GatewayError,
  gatewayFetch,
  logPayment,
  pixPayloadToQrImage,
  type CreatePixInput,
  type GatewayContext,
  type GatewayPixResult,
  type GatewayStatusResult,
  type GatewayTestResult,
  type GatewayWebhookEvent,
  type PaymentGatewayAdapter,
} from "../gateway.server";
import type { PaymentStatus } from "@/types/payment";

function baseUrl(sandbox: boolean): string {
  return sandbox ? "https://api.sandbox.infinitepay.io" : "https://api.infinitepay.io";
}

function mapStatus(status: string | undefined): PaymentStatus {
  switch ((status ?? "").toLowerCase()) {
    case "paid":
    case "approved":
    case "succeeded":
      return "PAID";
    case "pending":
    case "waiting_payment":
    case "created":
      return "WAITING_PAYMENT";
    case "processing":
      return "PENDING";
    case "failed":
    case "rejected":
      return "FAILED";
    case "canceled":
    case "cancelled":
      return "CANCELLED";
    case "expired":
      return "EXPIRED";
    case "refunded":
      return "REFUNDED";
    default:
      return "PENDING";
  }
}

export class InfinityPayAdapter implements PaymentGatewayAdapter {
  readonly gateway = "INFINITYPAY" as const;

  constructor(private readonly context: GatewayContext) {}

  private url(path: string): string {
    return `${baseUrl(this.context.environment === "SANDBOX")}${path}`;
  }

  private apiKey(): string {
    const key = this.context.credentials["api_key"] ?? this.context.credentials["client_secret"];
    if (!key) {
      throw new GatewayError("MISSING_CREDENTIALS", "InfinityPay API key não configurada.");
    }
    return key;
  }

  private headers(extra: Record<string, string> = {}): Record<string, string> {
    const clientId = this.context.credentials["client_id"];
    return {
      Authorization: `Bearer ${this.apiKey()}`,
      "Content-Type": "application/json",
      accept: "application/json",
      ...(clientId ? { "X-Client-Id": clientId } : {}),
      ...extra,
    };
  }

  async createPixPayment(input: CreatePixInput): Promise<GatewayPixResult> {
    const expiration = new Date(Date.now() + input.expiresInMinutes * 60_000);

    const { status, body } = await gatewayFetch(
      this.url("/v2/pix/charges"),
      {
        method: "POST",
        headers: this.headers({ "X-Idempotency-Key": input.idempotencyKey }),
        body: JSON.stringify({
          amount: Math.round(input.amount * 100),
          currency: input.currency,
          description: input.description,
          external_reference: input.paymentId,
          expires_in: input.expiresInMinutes * 60,
          callback_url: this.context.webhookUrl,
          customer: {
            name: input.customer.name,
            phone: input.customer.phone.replace(/\D/g, ""),
            ...(input.customer.email ? { email: input.customer.email } : {}),
          },
        }),
      },
      this.gateway,
    );

    const payload = body as {
      id?: string;
      order_id?: string;
      status?: string;
      qr_code?: string;
      qr_code_text?: string;
      pix?: { qr_code?: string; qr_code_image?: string; expires_at?: string };
      expires_at?: string;
    } | null;

    const copyPaste = payload?.pix?.qr_code ?? payload?.qr_code_text ?? payload?.qr_code ?? null;

    if (status >= 400 || !payload?.id || !copyPaste) {
      throw new GatewayError("CREATE_FAILED", `InfinityPay respondeu ${status}.`);
    }

    return {
      gatewayPaymentId: String(payload.id),
      gatewayOrderId: payload.order_id ?? null,
      status:
        mapStatus(payload.status) === "PENDING" ? "WAITING_PAYMENT" : mapStatus(payload.status),
      pixCopyPaste: copyPaste,
      pixQrCodeImage: payload.pix?.qr_code_image ?? (await pixPayloadToQrImage(copyPaste)),
      expiresAt: payload.pix?.expires_at ?? payload.expires_at ?? expiration.toISOString(),
      raw: payload,
    };
  }

  async getPaymentStatus(gatewayPaymentId: string): Promise<GatewayStatusResult> {
    const { status, body } = await gatewayFetch(
      this.url(`/v2/pix/charges/${gatewayPaymentId}`),
      { method: "GET", headers: this.headers() },
      this.gateway,
    );
    if (status >= 400) {
      throw new GatewayError("STATUS_FAILED", `InfinityPay respondeu ${status}.`);
    }
    const payload = body as { status?: string; paid_at?: string; failure_reason?: string } | null;

    const mapped = mapStatus(payload?.status);
    return {
      status: mapped,
      paidAt: payload?.paid_at ?? null,
      failureCode: mapped === "FAILED" ? "REJECTED" : null,
      failureMessage: mapped === "FAILED" ? "Pagamento recusado pelo emissor." : null,
      raw: payload,
    };
  }

  async cancelPayment(gatewayPaymentId: string): Promise<void> {
    await gatewayFetch(
      this.url(`/v2/pix/charges/${gatewayPaymentId}/cancel`),
      { method: "POST", headers: this.headers(), body: "{}" },
      this.gateway,
    );
  }

  async refundPayment(gatewayPaymentId: string, amount?: number): Promise<void> {
    await gatewayFetch(
      this.url(`/v2/pix/charges/${gatewayPaymentId}/refund`),
      {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify(amount ? { amount: Math.round(amount * 100) } : {}),
      },
      this.gateway,
    );
  }

  async testConnection(): Promise<GatewayTestResult> {
    try {
      const { status } = await gatewayFetch(
        this.url("/v2/merchants/me"),
        { method: "GET", headers: this.headers() },
        this.gateway,
      );
      return status < 400
        ? { ok: true, message: "Conexão realizada com sucesso" }
        : { ok: false, message: "Não foi possível conectar — credenciais recusadas." };
    } catch {
      return { ok: false, message: "Não foi possível conectar" };
    }
  }

  async parseWebhook({
    headers,
    rawBody,
  }: {
    headers: Headers;
    rawBody: string;
  }): Promise<GatewayWebhookEvent | null> {
    const secret = this.context.credentials["webhook_secret"];
    if (secret) {
      const provided = headers.get("x-infinitepay-signature") ?? headers.get("x-signature") ?? "";
      const { createHmac, timingSafeEqual } = await import("crypto");
      const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
      const a = Buffer.from(expected);
      const b = Buffer.from(provided.replace(/^sha256=/, ""));
      if (a.length !== b.length || !timingSafeEqual(a, b)) {
        logPayment("error", { gateway: this.gateway, event: "WEBHOOK_INVALID_SIGNATURE" });
        throw new GatewayError("INVALID_SIGNATURE", "Assinatura do webhook inválida.");
      }
    }

    let payload: {
      id?: string;
      event?: string;
      type?: string;
      data?: { id?: string; status?: string; paid_at?: string };
      charge?: { id?: string; status?: string; paid_at?: string };
    };
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return null;
    }

    const charge = payload.data ?? payload.charge ?? null;
    const gatewayPaymentId = charge?.id ?? null;

    return {
      eventId: payload.id ?? `${gatewayPaymentId ?? "infinitypay"}-${charge?.status ?? "event"}`,
      eventType: payload.event ?? payload.type ?? "charge",
      gatewayPaymentId,
      status: charge?.status ? mapStatus(charge.status) : null,
      paidAt: charge?.paid_at ?? null,
      payload,
    };
  }
}
