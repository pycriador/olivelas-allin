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
  return sandbox ? "https://sandbox.api.pagseguro.com" : "https://api.pagseguro.com";
}

function mapStatus(status: string | undefined): PaymentStatus {
  switch (status) {
    case "PAID":
    case "AVAILABLE":
      return "PAID";
    case "WAITING":
      return "WAITING_PAYMENT";
    case "IN_ANALYSIS":
    case "AUTHORIZED":
      return "PENDING";
    case "DECLINED":
      return "FAILED";
    case "CANCELED":
    case "CANCELLED":
      return "CANCELLED";
    case "REFUNDED":
      return "REFUNDED";
    default:
      return "PENDING";
  }
}

export class PagBankAdapter implements PaymentGatewayAdapter {
  readonly gateway = "PAGBANK" as const;

  constructor(private readonly context: GatewayContext) {}

  private url(path: string): string {
    return `${baseUrl(this.context.environment === "SANDBOX")}${path}`;
  }

  private token(): string {
    const token = this.context.credentials["api_key"] ?? this.context.credentials["client_secret"];
    if (!token) {
      throw new GatewayError("MISSING_CREDENTIALS", "PagBank token não configurado.");
    }
    return token;
  }

  private headers(extra: Record<string, string> = {}): Record<string, string> {
    return {
      Authorization: `Bearer ${this.token()}`,
      "Content-Type": "application/json",
      accept: "application/json",
      ...extra,
    };
  }

  async createPixPayment(input: CreatePixInput): Promise<GatewayPixResult> {
    const expiration = new Date(Date.now() + input.expiresInMinutes * 60_000);
    const cents = Math.round(input.amount * 100);

    const { status, body } = await gatewayFetch(
      this.url("/orders"),
      {
        method: "POST",
        headers: this.headers({ "x-idempotency-key": input.idempotencyKey }),
        body: JSON.stringify({
          reference_id: input.paymentId,
          customer: {
            name: input.customer.name,
            email: input.customer.email ?? `pix+${input.orderId}@rafflehub.app`,
            phones: buildPhone(input.customer.phone),
          },
          items: [
            {
              reference_id: input.orderId,
              name: input.description.slice(0, 100),
              quantity: 1,
              unit_amount: cents,
            },
          ],
          qr_codes: [{ amount: { value: cents }, expiration_date: expiration.toISOString() }],
          notification_urls: [this.context.webhookUrl],
        }),
      },
      this.gateway,
    );

    const payload = body as {
      id?: string;
      qr_codes?: Array<{
        id?: string;
        text?: string;
        expiration_date?: string;
        links?: Array<{ rel?: string; href?: string; media?: string }>;
      }>;
    } | null;

    const qr = payload?.qr_codes?.[0];
    if (status >= 400 || !payload?.id || !qr?.text) {
      throw new GatewayError("CREATE_FAILED", `PagBank respondeu ${status}.`);
    }

    const pngLink = qr.links?.find((link) => link.media === "image/png")?.href ?? null;

    return {
      gatewayPaymentId: qr.id ?? payload.id,
      gatewayOrderId: payload.id,
      status: "WAITING_PAYMENT",
      pixCopyPaste: qr.text,
      pixQrCodeImage: pngLink ?? (await pixPayloadToQrImage(qr.text)),
      expiresAt: qr.expiration_date ?? expiration.toISOString(),
      raw: payload,
    };
  }

  async getPaymentStatus(gatewayPaymentId: string): Promise<GatewayStatusResult> {
    const { status, body } = await gatewayFetch(
      this.url(`/orders/${gatewayPaymentId}`),
      { method: "GET", headers: this.headers() },
      this.gateway,
    );
    if (status >= 400) {
      throw new GatewayError("STATUS_FAILED", `PagBank respondeu ${status}.`);
    }
    const payload = body as {
      charges?: Array<{
        status?: string;
        paid_at?: string;
        payment_response?: { message?: string };
      }>;
    } | null;
    const charge = payload?.charges?.[0];

    return {
      status: charge ? mapStatus(charge.status) : "WAITING_PAYMENT",
      paidAt: charge?.paid_at ?? null,
      failureCode: charge?.status === "DECLINED" ? "DECLINED" : null,
      failureMessage: charge?.status === "DECLINED" ? "Pagamento recusado." : null,
      raw: payload,
    };
  }

  async cancelPayment(gatewayPaymentId: string): Promise<void> {
    await gatewayFetch(
      this.url(`/orders/${gatewayPaymentId}/qr_codes/cancel`),
      { method: "POST", headers: this.headers(), body: "{}" },
      this.gateway,
    );
  }

  async refundPayment(gatewayPaymentId: string, amount?: number): Promise<void> {
    await gatewayFetch(
      this.url(`/charges/${gatewayPaymentId}/cancel`),
      {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify(amount ? { amount: { value: Math.round(amount * 100) } } : {}),
      },
      this.gateway,
    );
  }

  async testConnection(): Promise<GatewayTestResult> {
    try {
      const { status } = await gatewayFetch(
        this.url("/orders?limit=1"),
        { method: "GET", headers: this.headers() },
        this.gateway,
      );
      return status < 400 || status === 404
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
      const provided = headers.get("x-authenticity-token");
      const { createHash, timingSafeEqual } = await import("crypto");
      const expected = createHash("sha256").update(`${secret}-${rawBody}`).digest("hex");
      const a = Buffer.from(expected);
      const b = Buffer.from(provided ?? "");
      if (a.length !== b.length || !timingSafeEqual(a, b)) {
        logPayment("error", { gateway: this.gateway, event: "WEBHOOK_INVALID_SIGNATURE" });
        throw new GatewayError("INVALID_SIGNATURE", "Assinatura do webhook inválida.");
      }
    }

    let payload: {
      id?: string;
      reference_id?: string;
      charges?: Array<{ id?: string; status?: string; paid_at?: string }>;
      qr_codes?: Array<{ id?: string }>;
    };
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return null;
    }

    const charge = payload.charges?.[0];
    const gatewayPaymentId = payload.qr_codes?.[0]?.id ?? payload.id ?? null;

    return {
      eventId: `${payload.id ?? gatewayPaymentId ?? "pagbank"}-${charge?.status ?? "event"}-${charge?.id ?? ""}`,
      eventType: charge?.status ?? "order",
      gatewayPaymentId,
      status: charge ? mapStatus(charge.status) : null,
      paidAt: charge?.paid_at ?? null,
      payload,
    };
  }
}

function buildPhone(
  phone: string,
): Array<{ country: string; area: string; number: string; type: string }> {
  const digits = phone.replace(/\D/g, "");
  const local = digits.startsWith("55") ? digits.slice(2) : digits;
  if (local.length < 10) return [];
  return [
    {
      country: "55",
      area: local.slice(0, 2),
      number: local.slice(2),
      type: "MOBILE",
    },
  ];
}
