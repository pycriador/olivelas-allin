import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function sign(secret: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function deliver(
  webhook: { id: string; url: string; secret: string; organization_id: string; max_retries: number },
  event: string,
  payload: unknown,
  attempt: number,
) {
  const body = JSON.stringify({ event, data: payload, sent_at: new Date().toISOString() });
  const signature = await sign(webhook.secret, body);
  const startedAt = Date.now();
  try {
    const response = await fetch(webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Event": event,
        "X-Webhook-Signature": `sha256=${signature}`,
      },
      body,
    });
    const text = (await response.text()).slice(0, 2000);
    return {
      status: response.ok ? ("success" as const) : attempt < webhook.max_retries ? ("retrying" as const) : ("failed" as const),
      http_status: response.status,
      response_body: text,
      error: response.ok ? null : `HTTP ${response.status}`,
      duration_ms: Date.now() - startedAt,
    };
  } catch (e) {
    return {
      status: attempt < webhook.max_retries ? ("retrying" as const) : ("failed" as const),
      http_status: null,
      response_body: null,
      error: e instanceof Error ? e.message : String(e),
      duration_ms: Date.now() - startedAt,
    };
  }
}

/** Fans a platform event out to every active webhook of the organization. */
export const dispatchWebhookEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { organizationId: string; event: string; payload: unknown }) => input)
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: hooks } = await supabase
      .from("webhooks")
      .select("id, url, secret, organization_id, max_retries, events, status")
      .eq("organization_id", data.organizationId)
      .eq("status", "active");

    const targets = (hooks ?? []).filter((h) => (h.events ?? []).includes(data.event));
    let delivered = 0;
    for (const hook of targets) {
      const result = await deliver(hook, data.event, data.payload, 1);
      await supabase.from("webhook_deliveries").insert({
        webhook_id: hook.id,
        organization_id: hook.organization_id,
        event: data.event,
        payload: data.payload as never,
        attempt: 1,
        next_retry_at:
          result.status === "retrying" ? new Date(Date.now() + 60_000).toISOString() : null,
        ...result,
      });
      if (result.status === "success") delivered += 1;
    }
    return { targets: targets.length, delivered };
  });

/** Manual reprocessing of a delivery with exponential backoff bookkeeping. */
export const retryWebhookDelivery = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { deliveryId: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: delivery } = await supabase
      .from("webhook_deliveries")
      .select("*")
      .eq("id", data.deliveryId)
      .maybeSingle();
    if (!delivery) throw new Error("Entrega não encontrada");
    const { data: hook } = await supabase
      .from("webhooks")
      .select("id, url, secret, organization_id, max_retries")
      .eq("id", delivery.webhook_id)
      .maybeSingle();
    if (!hook) throw new Error("Webhook não encontrado");

    const attempt = delivery.attempt + 1;
    const result = await deliver(hook, delivery.event, delivery.payload, attempt);
    const backoffMs = Math.min(2 ** attempt * 30_000, 3_600_000);
    await supabase.from("webhook_deliveries").insert({
      webhook_id: hook.id,
      organization_id: hook.organization_id,
      event: delivery.event,
      payload: delivery.payload,
      attempt,
      next_retry_at:
        result.status === "retrying" ? new Date(Date.now() + backoffMs).toISOString() : null,
      ...result,
    });
    return { status: result.status };
  });
