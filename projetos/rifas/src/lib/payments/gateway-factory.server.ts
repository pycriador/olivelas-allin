import { InfinityPayAdapter } from "./adapters/infinity-pay.server";
import { MercadoPagoAdapter } from "./adapters/mercado-pago.server";
import { PagBankAdapter } from "./adapters/pagbank.server";
import { GatewayError, type GatewayContext, type PaymentGatewayAdapter } from "./gateway.server";
import {
  GATEWAY_CREDENTIAL_FIELDS,
  type PaymentEnvironment,
  type PaymentGateway,
} from "@/types/payment";

export interface GatewaySettingsRow {
  gateway: PaymentGateway;
  enabled: boolean;
  environment: PaymentEnvironment;
  pix_enabled: boolean;
  credentials: Record<string, string>;
}

function siteOrigin(): string {
  return (
    process.env["PUBLIC_SITE_URL"] ??
    process.env["VITE_PUBLIC_SITE_URL"] ??
    "https://olivelas-raffle.lovable.app"
  );
}

export function webhookUrlFor(gateway: PaymentGateway): string {
  return `${siteOrigin().replace(/\/$/, "")}/api/public/payments/webhook/${gateway.toLowerCase()}`;
}

/** Cria o adapter correto. Adicionar um novo gateway = adicionar um case aqui. */
export function createGatewayAdapter(context: GatewayContext): PaymentGatewayAdapter {
  switch (context.gateway) {
    case "INFINITYPAY":
      return new InfinityPayAdapter(context);
    case "MERCADO_PAGO":
      return new MercadoPagoAdapter(context);
    case "PAGBANK":
      return new PagBankAdapter(context);
    default:
      throw new GatewayError("UNKNOWN_GATEWAY", `Gateway não suportado: ${context.gateway}`);
  }
}

export function contextFromRow(row: GatewaySettingsRow): GatewayContext {
  return {
    gateway: row.gateway,
    environment: row.environment,
    credentials: row.credentials ?? {},
    webhookUrl: webhookUrlFor(row.gateway),
  };
}

export function isGatewayConfigured(row: GatewaySettingsRow): boolean {
  const required = GATEWAY_CREDENTIAL_FIELDS[row.gateway].filter((field) => field.required);
  return required.every((field) => {
    const value = row.credentials?.[field.key];
    return typeof value === "string" && value.trim().length > 0;
  });
}

/** Carrega a configuração de um gateway usando a service role (nunca no cliente). */
export async function loadGatewaySettings(
  gateway: PaymentGateway,
): Promise<GatewaySettingsRow | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("payment_gateway_settings")
    .select("gateway, enabled, environment, pix_enabled, credentials")
    .eq("gateway", gateway)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    gateway: data.gateway,
    enabled: data.enabled,
    environment: data.environment,
    pix_enabled: data.pix_enabled,
    credentials: (data.credentials ?? {}) as Record<string, string>,
  };
}

export async function loadAllGatewaySettings(): Promise<GatewaySettingsRow[]> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("payment_gateway_settings")
    .select("gateway, enabled, environment, pix_enabled, credentials, last_tested_at, last_test_ok")
    .order("gateway");
  if (error) throw error;
  return (data ?? []).map((row) => ({
    gateway: row.gateway,
    enabled: row.enabled,
    environment: row.environment,
    pix_enabled: row.pix_enabled,
    credentials: (row.credentials ?? {}) as Record<string, string>,
  }));
}

/**
 * Hierarquia de resolução: campanha → configuração global → primeiro gateway
 * habilitado e configurado.
 */
export async function resolveGatewayForCampaign(campaignId: string): Promise<GatewaySettingsRow> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const [settingsRes, platformRes] = await Promise.all([
    supabaseAdmin
      .from("campaign_settings")
      .select("payment_gateway, enable_pix")
      .eq("campaign_id", campaignId)
      .maybeSingle(),
    supabaseAdmin
      .from("platform_settings")
      .select("default_payment_gateway")
      .limit(1)
      .maybeSingle(),
  ]);

  const candidates: PaymentGateway[] = [];
  if (settingsRes.data?.payment_gateway) candidates.push(settingsRes.data.payment_gateway);
  if (platformRes.data?.default_payment_gateway) {
    candidates.push(platformRes.data.default_payment_gateway);
  }

  for (const gateway of candidates) {
    const row = await loadGatewaySettings(gateway);
    if (row && row.enabled && row.pix_enabled && isGatewayConfigured(row)) return row;
  }

  const all = await loadAllGatewaySettings();
  const fallback = all.find((row) => row.enabled && row.pix_enabled && isGatewayConfigured(row));
  if (!fallback) {
    throw new GatewayError(
      "NO_GATEWAY",
      "Nenhum gateway habilitado e configurado para esta campanha.",
      "O pagamento está temporariamente indisponível. Tente novamente em alguns instantes.",
    );
  }
  return fallback;
}
