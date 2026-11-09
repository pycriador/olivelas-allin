import type { PaymentEnvironment, PaymentGateway, PaymentStatus } from "@/types/payment";

export interface GatewayCredentials {
  [key: string]: string | undefined;
}

export interface GatewayContext {
  gateway: PaymentGateway;
  environment: PaymentEnvironment;
  credentials: GatewayCredentials;
  webhookUrl: string;
}

export interface CreatePixInput {
  /** Identificador único da tentativa — usado como chave de idempotência. */
  idempotencyKey: string;
  orderId: string;
  paymentId: string;
  amount: number;
  currency: string;
  description: string;
  expiresInMinutes: number;
  customer: { name: string; phone: string; email: string | null };
}

export interface GatewayPixResult {
  gatewayPaymentId: string;
  gatewayOrderId: string | null;
  status: PaymentStatus;
  /** Payload Pix copia e cola (EMV). */
  pixCopyPaste: string | null;
  /** Imagem do QR Code em data URL, quando o provedor devolve pronta. */
  pixQrCodeImage: string | null;
  expiresAt: string | null;
  raw: unknown;
}

export interface GatewayStatusResult {
  status: PaymentStatus;
  paidAt: string | null;
  failureCode: string | null;
  failureMessage: string | null;
  raw: unknown;
}

export interface GatewayWebhookEvent {
  /** Identificador único do evento no provedor (idempotência). */
  eventId: string;
  eventType: string;
  gatewayPaymentId: string | null;
  status: PaymentStatus | null;
  paidAt: string | null;
  payload: unknown;
}

export interface GatewayTestResult {
  ok: boolean;
  message: string;
}

/**
 * Contrato único implementado por todos os provedores.
 * Nenhum código específico de provedor deve existir fora dos adapters.
 */
export interface PaymentGatewayAdapter {
  readonly gateway: PaymentGateway;
  createPixPayment(input: CreatePixInput): Promise<GatewayPixResult>;
  getPaymentStatus(gatewayPaymentId: string): Promise<GatewayStatusResult>;
  cancelPayment(gatewayPaymentId: string): Promise<void>;
  refundPayment(gatewayPaymentId: string, amount?: number): Promise<void>;
  testConnection(): Promise<GatewayTestResult>;
  /** Valida assinatura (quando suportada) e normaliza o evento recebido. */
  parseWebhook(request: { headers: Headers; rawBody: string }): Promise<GatewayWebhookEvent | null>;
}

/** Erro de gateway com mensagem segura para o cliente final. */
export class GatewayError extends Error {
  readonly code: string;
  readonly publicMessage: string;

  constructor(code: string, message: string, publicMessage?: string) {
    super(message);
    this.name = "GatewayError";
    this.code = code;
    this.publicMessage =
      publicMessage ??
      "O pagamento está temporariamente indisponível. Tente novamente em alguns instantes.";
  }
}

const REDACTED_KEYS = [
  "access_token",
  "client_secret",
  "api_key",
  "webhook_secret",
  "authorization",
  "token",
];

/** Remove qualquer credencial antes de registrar logs. */
export function redact(value: unknown): unknown {
  if (typeof value === "string") {
    return value.length > 500 ? `${value.slice(0, 500)}…` : value;
  }
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === "object") {
    const output: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      output[key] = REDACTED_KEYS.includes(key.toLowerCase()) ? "[REDACTED]" : redact(item);
    }
    return output;
  }
  return value;
}

export interface PaymentLogFields {
  gateway?: PaymentGateway | undefined;
  orderId?: string | undefined;
  paymentId?: string | undefined;
  campaignId?: string | undefined;
  customerId?: string | undefined;
  event: string;
  status?: string | undefined;
  errorCode?: string | undefined;
  detail?: unknown;
}

/** Log estruturado — nunca inclui segredos. */
export function logPayment(level: "info" | "error", fields: PaymentLogFields): void {
  const entry = {
    scope: "payments",
    timestamp: new Date().toISOString(),
    ...fields,
    detail: fields.detail === undefined ? undefined : redact(fields.detail),
  };
  if (level === "error") console.error(JSON.stringify(entry));
  else console.log(JSON.stringify(entry));
}

export async function gatewayFetch(
  url: string,
  init: RequestInit,
  gateway: PaymentGateway,
): Promise<{ status: number; body: unknown; text: string }> {
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch (error) {
    logPayment("error", {
      gateway,
      event: "GATEWAY_UNREACHABLE",
      errorCode: "NETWORK",
      detail: error instanceof Error ? error.message : String(error),
    });
    throw new GatewayError("GATEWAY_UNREACHABLE", "Falha de rede ao contatar o gateway.");
  }

  const text = await response.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  if (!response.ok) {
    logPayment("error", {
      gateway,
      event: "GATEWAY_HTTP_ERROR",
      status: String(response.status),
      detail: body,
    });
  }

  return { status: response.status, body, text };
}

/** Gera a imagem do QR Code a partir do payload Pix copia e cola. */
export async function pixPayloadToQrImage(payload: string): Promise<string | null> {
  try {
    const QRCode = await import("qrcode");
    return await QRCode.toDataURL(payload, { margin: 1, width: 320 });
  } catch {
    return null;
  }
}
