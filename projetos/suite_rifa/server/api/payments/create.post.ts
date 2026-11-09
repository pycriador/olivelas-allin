import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { PaymentGatewayProvider } from "@/services/types";

interface CreatePaymentBody {
  payment_id: string;
  gateway_id?: string;
}

export default defineEventHandler(async (event) => {
  const body = await readBody<CreatePaymentBody>(event);

  if (!body?.payment_id) {
    throw createError({ statusCode: 400, statusMessage: "payment_id is required" });
  }

  // Fetch payment record
  const { data: payment, error: payErr } = await supabaseAdmin
    .from("payments")
    .select("*, payment_gateways!payments_gateway_id_fkey(*)")
    .eq("id", body.payment_id)
    .single();

  if (payErr || !payment) {
    throw createError({ statusCode: 404, statusMessage: "Payment not found" });
  }

  if (payment.status !== "PENDING") {
    throw createError({ statusCode: 409, statusMessage: "Payment is not pending" });
  }

  // Fetch gateway config
  const gateway = (payment as Record<string, unknown>).payment_gateways as Record<string, unknown> | null;

  const provider = payment.provider as PaymentGatewayProvider;

  // TODO: Implement real provider integration per gateway
  // For now, return a stub response that simulates PIX generation
  const stubProviderPaymentId = `stub_${provider.toLowerCase()}_${Date.now()}`;
  const stubPixCode = `00020126580014br.gov.bcb.pix0136raffle-hub-${payment.id.slice(0, 8)}520400005303986540${(payment.amount ?? 0).toFixed(2)}6304`;
  const stubQrBase64 = ""; // In production, provider returns base64 QR image
  const stubExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  // Update payment with provider response
  const { error: updErr } = await supabaseAdmin.rpc("update_payment_status", {
    _payment: payment.id,
    _status: "PROCESSING",
    _provider_payment_id: stubProviderPaymentId,
    _pix_code: stubPixCode,
    _pix_qr_base64: stubQrBase64 || null,
    _gateway_response: {
      provider,
      provider_payment_id: stubProviderPaymentId,
      created_at: new Date().toISOString(),
      stub: true,
    },
  });

  if (updErr) {
    throw createError({ statusCode: 500, statusMessage: "Failed to update payment" });
  }

  return {
    ok: true,
    provider_payment_id: stubProviderPaymentId,
    pix_code: stubPixCode,
    pix_qr_base64: stubQrBase64,
    expires_at: stubExpiresAt,
  };
});
