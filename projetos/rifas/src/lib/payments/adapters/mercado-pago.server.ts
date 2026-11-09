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

const BASE_URL = "https://api.mercadopago.com";

function mapStatus(status: string | undefined): PaymentStatus {
  switch (status) {
    case "approved":
      return "PAID";
    case "authorized":
    case "in_process":
    case "in_mediation":
      return "PENDING";
    case "pending":
      return "WAITING_PAYMENT";
    case "rejected":
      return "FAILED";
    case "cancelled":
      return "CANCELLED";
    case "refunded":
    case "charged_back":
      return "REFUNDED";
    default:
      return "PENDING";
  }
}

export class MercadoPagoAdapter implements PaymentGatewayAdapter {
  readonly gateway = "MERCADO_PAGO" as const;

  constructor(private readonly context: GatewayContext) {}

  private token(): string {
    const token = this.context.credentials["access_token"];
    if (!token) {
      throw new GatewayError("MISSING_CREDENTIALS", "Mercado Pago access_token não configurado.");
    }
    return token;
  }

  private headers(extra: Record<string, string> = {}): Record<string, string> {
    return {
      Authorization: `Bearer ${this.token()}`,
      "Content-Type": "application/json",
      ...extra,
    };
  }

  async createPixPayment(input: CreatePixInput): Promise<GatewayPixResult> {
    const expiration = new Date(Date.now() + input.expiresInMinutes * 60_000);
    const [firstName, ...rest] = input.customer.name.trim().split(/\s+/);

    const { status, body } = await gatewayFetch(
      `${BASE_URL}/v1/payments`,
      {
        method: "POST",
        headers: this.headers({ "X-Idempotency-Key": input.idempotencyKey }),
        body: JSON.stringify({
          transaction_amount: Number(input.amount.toFixed(2)),
          description: input.description,
          payment_method_id: "pix",
          external_reference: input.paymentId,
          notification_url: this.context.webhookUrl,
          date_of_expiration: expiration.toISOString(),
          payer: {
            email: input.customer.email ?? `pix+${input.orderId}@rafflehub.app`,
            first_name: firstName ?? "Participante",
            last_name: rest.join(" ") || "RaffleHub",
          },
        }),
      },
      this.gateway,
    );

    const payload = body as {
      id?: number | string;
      status?: string;
      point_of_interaction?: {
        transaction_data?: { qr_code?: string; qr_code_base64?: string };
      };
      date_of_expiration?: string;
    } | null;

    if (status >= 400 || !payload?.id) {
      throw new GatewayError("CREATE_FAILED", `Mercado Pago respondeu ${status}.`);
    }

    const copyPaste = payload.point_of_interaction?.transaction_data?.qr_code ?? null;
    const base64 = payload.point_of_interaction?.transaction_data?.qr_code_base64;

    return {
      gatewayPaymentId: String(payload.id),
      gatewayOrderId: null,
      status: mapStatus(payload.status),
      pixCopyPaste: copyPaste,
      pixQrCodeImage: base64
        ? `data:image/png;base64,${base64}`
        : copyPaste
          ? await pixPayloadToQrImage(copyPaste)
          : null,
      expiresAt: payload.date_of_expiration ?? expiration.toISOString(),
      raw: payload,
    };
  }

  async getPaymentStatus(gatewayPaymentId: string): Promise<GatewayStatusResult> {
    const { status, body } = await gatewayFetch(
      `${BASE_URL}/v1/payments/${gatewayPaymentId}`,
      { method: "GET", headers: this.headers() },
      this.gateway,
    );
    if (status >= 400) {
      throw new GatewayError("STATUS_FAILED", `Mercado Pago respondeu ${status}.`);
    }
    const payload = body as {
      status?: string;
      status_detail?: string;
      date_approved?: string;
    } | null;

    return {
      status: mapStatus(payload?.status),
      paidAt: payload?.date_approved ?? null,
      failureCode: payload?.status === "rejected" ? (payload.status_detail ?? "rejected") : null,
      failureMessage: payload?.status === "rejected" ? "Pagamento recusado pelo emissor." : null,
      raw: payload,
    };
  }

  async cancelPayment(gatewayPaymentId: string): Promise<void> {
    await gatewayFetch(
      `${BASE_URL}/v1/payments/${gatewayPaymentId}`,
      { method: "PUT", headers: this.headers(), body: JSON.stringify({ status: "cancelled" }) },
      this.gateway,
    );
  }

  async refundPayment(gatewayPaymentId: string, amount?: number): Promise<void> {
    await gatewayFetch(
      `${BASE_URL}/v1/payments/${gatewayPaymentId}/refunds`,
      {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify(amount ? { amount } : {}),
      },
      this.gateway,
    );
  }

  async testConnection(): Promise<GatewayTestResult> {
    try {
      const { status } = await gatewayFetch(
        `${BASE_URL}/users/me`,
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
    let payload: {
      id?: string | number;
      type?: string;
      action?: string;
      data?: { id?: string | number };
    };
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return null;
    }

    const dataId = payload.data?.id ? String(payload.data.id) : null;
    const secret = this.context.credentials["webhook_secret"];

    if (secret) {
      const signature = headers.get("x-signature");
      const requestId = headers.get("x-request-id") ?? "";
      const valid = await verifyMercadoPagoSignature(signature, requestId, dataId, secret);
      if (!valid) {
        logPayment("error", { gateway: this.gateway, event: "WEBHOOK_INVALID_SIGNATURE" });
        throw new GatewayError("INVALID_SIGNATURE", "Assinatura do webhook inválida.");
      }
    }

    if (!dataId) return null;

    let status: PaymentStatus | null = null;
    let paidAt: string | null = null;
    try {
      const result = await this.getPaymentStatus(dataId);
      status = result.status;
      paidAt = result.paidAt;
    } catch {
      status = null;
    }

    return {
      eventId: `${payload.id ?? dataId}-${payload.action ?? payload.type ?? "event"}`,
      eventType: payload.action ?? payload.type ?? "payment",
      gatewayPaymentId: dataId,
      status,
      paidAt,
      payload,
    };
  }
}

async function verifyMercadoPagoSignature(
  signature: string | null,
  requestId: string,
  dataId: string | null,
  secret: string,
): Promise<boolean> {
  if (!signature || !dataId) return false;
  const parts = Object.fromEntries(
    signature.split(",").map((part) => {
      const [key, value] = part.split("=");
      return [key?.trim() ?? "", value?.trim() ?? ""];
    }),
  );
  const ts = parts["ts"];
  const v1 = parts["v1"];
  if (!ts || !v1) return false;

  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const { createHmac, timingSafeEqual } = await import("crypto");
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(v1);
  return a.length === b.length && timingSafeEqual(a, b);
}
