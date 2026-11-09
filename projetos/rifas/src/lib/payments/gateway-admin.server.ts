import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  contextFromRow,
  createGatewayAdapter,
  isGatewayConfigured,
  type GatewaySettingsRow,
} from "./gateway-factory.server";
import {
  requireAnyGatewayAccess,
  requireGatewayManage,
  requirePermission,
} from "@/lib/iam/permissions.server";
import { GATEWAY_CREDENTIAL_FIELDS, PAYMENT_GATEWAY_VALUES } from "@/types/payment";
import type { GatewaySettingsView, PaymentEnvironment, PaymentGateway } from "@/types/payment";

const gatewaySchema = z.enum(
  PAYMENT_GATEWAY_VALUES as unknown as [PaymentGateway, ...PaymentGateway[]],
);

function toView(
  row: GatewaySettingsRow & { last_tested_at?: string | null; last_test_ok?: boolean | null },
): GatewaySettingsView {
  const fields = GATEWAY_CREDENTIAL_FIELDS[row.gateway];
  const filled = fields
    .filter((field) => {
      const value = row.credentials?.[field.key];
      return typeof value === "string" && value.trim().length > 0;
    })
    .map((field) => field.key);

  return {
    gateway: row.gateway,
    enabled: row.enabled,
    environment: row.environment,
    pixEnabled: row.pix_enabled,
    configured: isGatewayConfigured(row),
    filledCredentials: filled,
    lastTestedAt: row.last_tested_at ?? null,
    lastTestOk: row.last_test_ok ?? null,
  };
}

async function loadRowsDetailed(): Promise<
  Array<GatewaySettingsRow & { last_tested_at: string | null; last_test_ok: boolean | null }>
> {
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
    last_tested_at: row.last_tested_at,
    last_test_ok: row.last_test_ok,
  }));
}

/** Lista gateways sem expor secrets — apenas quais campos estao preenchidos. */
export const listGatewaySettingsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAnyGatewayAccess(context.userId);
    const rows = await loadRowsDetailed();

    // Garante uma linha por gateway conhecido (mesmo se ainda nao existir no banco)
    const byGateway = new Map(rows.map((row) => [row.gateway, row]));
    const views: GatewaySettingsView[] = PAYMENT_GATEWAY_VALUES.map((gateway) => {
      const existing = byGateway.get(gateway);
      if (existing) return toView(existing);
      return {
        gateway,
        enabled: false,
        environment: "SANDBOX" as PaymentEnvironment,
        pixEnabled: true,
        configured: false,
        filledCredentials: [],
        lastTestedAt: null,
        lastTestOk: null,
      };
    });

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: platform } = await supabaseAdmin
      .from("platform_settings")
      .select("default_payment_gateway")
      .limit(1)
      .maybeSingle();

    return {
      gateways: views,
      defaultGateway: (platform?.default_payment_gateway ?? null) as PaymentGateway | null,
      webhookBasePath: "/api/public/payments/webhook",
    };
  });

const saveSchema = z.object({
  gateway: gatewaySchema,
  enabled: z.boolean(),
  environment: z.enum(["SANDBOX", "PRODUCTION"]),
  pixEnabled: z.boolean(),
  /** Valores novos; string vazia em campo secret = manter o atual. */
  credentials: z.record(z.string()),
});

export const saveGatewaySettingsAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(saveSchema)
  .handler(async ({ context, data }) => {
    await requireGatewayManage(context.userId, data.gateway);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: existing } = await supabaseAdmin
      .from("payment_gateway_settings")
      .select("id, credentials")
      .eq("gateway", data.gateway)
      .maybeSingle();

    const previous = (existing?.credentials ?? {}) as Record<string, string>;
    const fields = GATEWAY_CREDENTIAL_FIELDS[data.gateway];
    const merged: Record<string, string> = { ...previous };

    for (const field of fields) {
      const incoming = data.credentials[field.key];
      if (incoming === undefined) continue;
      if (field.secret && incoming.trim() === "") {
        // Mantem secret existente
        continue;
      }
      if (incoming.trim() === "" && !field.secret) {
        delete merged[field.key];
        continue;
      }
      merged[field.key] = incoming.trim();
    }

    const payload = {
      gateway: data.gateway,
      enabled: data.enabled,
      environment: data.environment,
      pix_enabled: data.pixEnabled,
      credentials: merged,
      updated_at: new Date().toISOString(),
    };

    if (existing?.id) {
      const { error } = await supabaseAdmin
        .from("payment_gateway_settings")
        .update(payload as never)
        .eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabaseAdmin
        .from("payment_gateway_settings")
        .insert(payload as never);
      if (error) throw error;
    }

    const rows = await loadRowsDetailed();
    const row = rows.find((item) => item.gateway === data.gateway);
    return row ? toView(row) : toView({ ...payload, credentials: merged });
  });

const testSchema = z.object({
  gateway: gatewaySchema,
});

export const testGatewayConnectionAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(testSchema)
  .handler(async ({ context, data }) => {
    await requireGatewayManage(context.userId, data.gateway);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: row, error } = await supabaseAdmin
      .from("payment_gateway_settings")
      .select("gateway, enabled, environment, pix_enabled, credentials")
      .eq("gateway", data.gateway)
      .maybeSingle();
    if (error) throw error;
    if (!row) {
      return { ok: false, message: "Salve as credenciais antes de testar a conexao." };
    }

    const settings: GatewaySettingsRow = {
      gateway: row.gateway,
      enabled: row.enabled,
      environment: row.environment,
      pix_enabled: row.pix_enabled,
      credentials: (row.credentials ?? {}) as Record<string, string>,
    };

    if (!isGatewayConfigured(settings)) {
      return { ok: false, message: "Credenciais obrigatorias incompletas." };
    }

    const adapter = createGatewayAdapter(contextFromRow(settings));
    const result = await adapter.testConnection();

    await supabaseAdmin
      .from("payment_gateway_settings")
      .update({
        last_tested_at: new Date().toISOString(),
        last_test_ok: result.ok,
      } as never)
      .eq("gateway", data.gateway);

    return result;
  });

const defaultGatewaySchema = z.object({
  gateway: gatewaySchema.nullable(),
});

export const setDefaultPaymentGatewayAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(defaultGatewaySchema)
  .handler(async ({ context, data }) => {
    await requirePermission(context.userId, "payments.manage");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: platform, error: loadError } = await supabaseAdmin
      .from("platform_settings")
      .select("id")
      .limit(1)
      .maybeSingle();
    if (loadError) throw loadError;
    if (!platform?.id) throw new Error("platform_settings nao configurado");

    const { error } = await supabaseAdmin
      .from("platform_settings")
      .update({ default_payment_gateway: data.gateway } as never)
      .eq("id", platform.id);
    if (error) throw error;

    return { defaultGateway: data.gateway };
  });
