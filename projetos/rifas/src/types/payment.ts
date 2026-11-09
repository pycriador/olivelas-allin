import type { Database, Tables } from "@/integrations/supabase/types";

export type PaymentGateway = Database["public"]["Enums"]["payment_gateway"];
export type PaymentEnvironment = Database["public"]["Enums"]["payment_environment"];
export type PaymentStatus = Database["public"]["Enums"]["payment_status"];
export type PaymentMethodType = Database["public"]["Enums"]["payment_method_type"];

export type Payment = Tables<"payments">;
export type PaymentEvent = Tables<"payment_events">;

export const PAYMENT_GATEWAY_VALUES: readonly PaymentGateway[] = [
  "INFINITYPAY",
  "MERCADO_PAGO",
  "PAGBANK",
  "ADVANCED_FEE",
] as const;

export const PAYMENT_GATEWAY_LABELS: Record<PaymentGateway, string> = {
  INFINITYPAY: "InfinityPay",
  MERCADO_PAGO: "Mercado Pago",
  PAGBANK: "PagBank",
  MANUAL: "Manual",
  ADVANCED_FEE: "Taxa Avançada",
};

export const PAYMENT_ENVIRONMENT_LABELS: Record<PaymentEnvironment, string> = {
  SANDBOX: "🟡 Sandbox",
  PRODUCTION: "🟢 Produção",
};

export const PAYMENT_STATUS_VALUES: readonly PaymentStatus[] = [
  "CREATED",
  "PENDING",
  "WAITING_PAYMENT",
  "PAID",
  "FAILED",
  "CANCELLED",
  "EXPIRED",
  "REFUNDED",
] as const;

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  CREATED: "Criado",
  PENDING: "Processando",
  WAITING_PAYMENT: "Aguardando pagamento",
  PAID: "Pago",
  FAILED: "Falhou",
  CANCELLED: "Cancelado",
  EXPIRED: "Expirado",
  REFUNDED: "Reembolsado",
};

export const PAYMENT_METHOD_TYPE_LABELS: Record<PaymentMethodType, string> = {
  PIX: "Pix",
  CREDIT_CARD: "Cartão de crédito",
  DEBIT_CARD: "Cartão de débito",
  BOLETO: "Boleto",
};

/** Métodos habilitados nesta versão. Os demais já existem no modelo. */
export const ENABLED_PAYMENT_METHODS: readonly PaymentMethodType[] = ["PIX"] as const;

export const PAYMENT_OPEN_STATUSES: readonly PaymentStatus[] = [
  "CREATED",
  "PENDING",
  "WAITING_PAYMENT",
] as const;

export function isPaymentOpen(status: PaymentStatus): boolean {
  return PAYMENT_OPEN_STATUSES.includes(status);
}

/** Visão pública/administrativa de um gateway — nunca contém segredos. */
export interface GatewaySettingsView {
  gateway: PaymentGateway;
  enabled: boolean;
  environment: PaymentEnvironment;
  pixEnabled: boolean;
  configured: boolean;
  /** Campos preenchidos (somente os nomes, nunca os valores). */
  filledCredentials: string[];
  lastTestedAt: string | null;
  lastTestOk: boolean | null;
}

export interface GatewayCredentialField {
  key: string;
  label: string;
  secret: boolean;
  required: boolean;
  placeholder?: string;
}

export const GATEWAY_CREDENTIAL_FIELDS: Record<PaymentGateway, GatewayCredentialField[]> = {
  INFINITYPAY: [
    { key: "client_id", label: "Client ID", secret: false, required: false },
    { key: "client_secret", label: "Client Secret", secret: true, required: false },
    { key: "api_key", label: "API Key", secret: true, required: true },
    { key: "webhook_secret", label: "Webhook Secret", secret: true, required: false },
  ],
  MERCADO_PAGO: [
    { key: "access_token", label: "Access Token", secret: true, required: true },
    { key: "public_key", label: "Public Key", secret: false, required: false },
    { key: "webhook_secret", label: "Webhook Secret", secret: true, required: false },
  ],
  PAGBANK: [
    { key: "client_id", label: "Client ID", secret: false, required: false },
    { key: "client_secret", label: "Client Secret", secret: true, required: false },
    { key: "api_key", label: "Token / API Key", secret: true, required: true },
    { key: "webhook_secret", label: "Webhook Secret", secret: true, required: false },
  ],
  MANUAL: [],
  ADVANCED_FEE: [],
};

/** Item do pedido exibido no checkout. */
export interface CheckoutOrderView {
  orderId: string;
  status: Database["public"]["Enums"]["order_status"];
  campaign: {
    id: string;
    slug: string;
    title: string;
    productName: string;
    coverImage: string | null;
    pricePerNumber: number;
  };
  customer: { name: string; phone: string; email: string | null } | null;
  numbers: number[];
  quantity: number;
  unitPrice: number;
  subtotal: number;
  discount: number;
  total: number;
  reservedUntil: string | null;
  createdAt: string;
  payment: PaymentView | null;
  payments: PaymentView[];
}

/** Payment sem nenhum dado sensível de gateway. */
export interface PaymentView {
  id: string;
  orderId: string;
  gateway: PaymentGateway;
  environment: PaymentEnvironment;
  method: PaymentMethodType;
  status: PaymentStatus;
  attemptNumber: number;
  amount: number;
  currency: string;
  pixQrCode: string | null;
  pixCopyPaste: string | null;
  expiresAt: string | null;
  paidAt: string | null;
  cancelledAt: string | null;
  failureMessage: string | null;
  createdAt: string;
}

/** Origem de um lançamento no ledger admin. */
export type PaymentLedgerKind = "GATEWAY" | "MANUAL";

export interface PaymentFilters {
  gateway?: PaymentGateway | "ALL" | undefined;
  status?: PaymentStatus | "ALL" | undefined;
  campaignId?: string | undefined;
  from?: string | undefined;
  to?: string | undefined;
  search?: string | undefined;
}

export interface PaymentMetrics {
  onlineSales: number;
  manualSales: number;
  pendingPayments: number;
  confirmedPayments: number;
  expiredPayments: number;
  failedPayments: number;
  receivedRevenue: number;
  pendingRevenue: number;
}
