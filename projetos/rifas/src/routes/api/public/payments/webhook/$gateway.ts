import { createFileRoute } from "@tanstack/react-router";

import { handlePaymentWebhookRequest } from "@/lib/payments/webhook.server";

/**
 * Webhook publico de pagamentos.
 * POST /api/public/payments/webhook/{gateway}
 *
 * gateways: infinitypay | mercado_pago | mercadopago | pagbank
 *
 * Sem autenticacao de sessao — a validacao e feita pela assinatura do provedor.
 */
export const Route = createFileRoute("/api/public/payments/webhook/$gateway")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        return Response.json({
          ok: true,
          service: "rafflehub-payment-webhook",
          gateway: params.gateway,
          methods: ["POST"],
        });
      },
      POST: async ({ request, params }) => {
        return handlePaymentWebhookRequest(request, params.gateway);
      },
    },
  },
});
