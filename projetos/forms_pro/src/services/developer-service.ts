import { supabase } from "@/integrations/supabase/client";
import type { ApiKey, Webhook, WebhookDelivery } from "@/types/org";

function fail(message?: string): never {
  throw new Error(message ?? "Erro inesperado");
}

/** SHA-256 hex digest — API keys are never stored in plain text. */
export async function hashSecret(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function randomToken(bytes = 24): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const apiKeysApi = {
  async list(organizationId: string): Promise<ApiKey[]> {
    const { data, error } = await supabase
      .from("api_keys")
      .select("id, organization_id, name, prefix, status, scopes, last_used_at, expires_at, created_at")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });
    if (error) fail(error.message);
    return (data ?? []).map((r) => ({
      id: r.id,
      organizationId: r.organization_id,
      name: r.name,
      prefix: r.prefix,
      status: r.status as ApiKey["status"],
      scopes: r.scopes ?? [],
      lastUsedAt: r.last_used_at,
      expiresAt: r.expires_at,
      createdAt: r.created_at,
    }));
  },

  /** Returns the plain key ONCE; only its hash is persisted. */
  async create(input: {
    organizationId: string;
    name: string;
    scopes?: string[];
    expiresAt?: string | null;
  }): Promise<{ key: ApiKey; plainKey: string }> {
    const { data: auth } = await supabase.auth.getUser();
    const secret = randomToken(24);
    const prefix = `ipf_${randomToken(3)}`;
    const plainKey = `${prefix}_${secret}`;
    const keyHash = await hashSecret(plainKey);

    const { data, error } = await supabase
      .from("api_keys")
      .insert({
        organization_id: input.organizationId,
        name: input.name,
        key_hash: keyHash,
        prefix,
        scopes: input.scopes ?? ["read"],
        expires_at: input.expiresAt ?? null,
        created_by: auth.user?.id ?? null,
      })
      .select("id, organization_id, name, prefix, status, scopes, last_used_at, expires_at, created_at")
      .single();
    if (error) fail(error.message);
    return {
      plainKey,
      key: {
        id: data.id,
        organizationId: data.organization_id,
        name: data.name,
        prefix: data.prefix,
        status: data.status as ApiKey["status"],
        scopes: data.scopes ?? [],
        lastUsedAt: data.last_used_at,
        expiresAt: data.expires_at,
        createdAt: data.created_at,
      },
    };
  },

  async revoke(id: string) {
    const { error } = await supabase.from("api_keys").update({ status: "revoked" }).eq("id", id);
    if (error) fail(error.message);
  },

  async remove(id: string) {
    const { error } = await supabase.from("api_keys").delete().eq("id", id);
    if (error) fail(error.message);
  },
};

export const webhooksApi = {
  async list(organizationId: string): Promise<Webhook[]> {
    const { data, error } = await supabase
      .from("webhooks")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });
    if (error) fail(error.message);
    return (data ?? []).map((r) => ({
      id: r.id,
      organizationId: r.organization_id,
      name: r.name,
      url: r.url,
      events: r.events ?? [],
      status: r.status as Webhook["status"],
      secret: r.secret,
      maxRetries: r.max_retries,
      createdAt: r.created_at,
    }));
  },

  async create(input: {
    organizationId: string;
    name: string;
    url: string;
    events: string[];
  }): Promise<Webhook> {
    const { data: auth } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("webhooks")
      .insert({
        organization_id: input.organizationId,
        name: input.name,
        url: input.url,
        events: input.events,
        created_by: auth.user?.id ?? null,
      })
      .select("*")
      .single();
    if (error) fail(error.message);
    return {
      id: data.id,
      organizationId: data.organization_id,
      name: data.name,
      url: data.url,
      events: data.events ?? [],
      status: data.status as Webhook["status"],
      secret: data.secret,
      maxRetries: data.max_retries,
      createdAt: data.created_at,
    };
  },

  async update(id: string, patch: Partial<Webhook>) {
    const update: Record<string, unknown> = {};
    if (patch.name !== undefined) update["name"] = patch.name;
    if (patch.url !== undefined) update["url"] = patch.url;
    if (patch.events !== undefined) update["events"] = patch.events;
    if (patch.status !== undefined) update["status"] = patch.status;
    if (patch.maxRetries !== undefined) update["max_retries"] = patch.maxRetries;
    const { error } = await supabase.from("webhooks").update(update as never).eq("id", id);
    if (error) fail(error.message);
  },

  async remove(id: string) {
    const { error } = await supabase.from("webhooks").delete().eq("id", id);
    if (error) fail(error.message);
  },

  async deliveries(organizationId: string, webhookId?: string): Promise<WebhookDelivery[]> {
    let query = supabase
      .from("webhook_deliveries")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (webhookId) query = query.eq("webhook_id", webhookId);
    const { data, error } = await query;
    if (error) fail(error.message);
    return (data ?? []).map((r) => ({
      id: r.id,
      webhookId: r.webhook_id,
      event: r.event,
      status: r.status as WebhookDelivery["status"],
      httpStatus: r.http_status,
      attempt: r.attempt,
      durationMs: r.duration_ms,
      responseBody: r.response_body,
      error: r.error,
      createdAt: r.created_at,
    }));
  },
};
