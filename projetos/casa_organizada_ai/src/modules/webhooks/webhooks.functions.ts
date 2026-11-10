import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const listWebhooks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("webhooks")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createWebhook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      name: z.string().min(1).max(200),
      url: z.string().url().max(2000),
      http_method: z.enum(['GET','POST','PUT','PATCH','DELETE']).default('POST'),
      headers: z.record(z.string(), z.string()).default({}),
      auth_token: z.string().max(2000).nullable().optional(),
      events: z.array(z.string()).min(1),
      retry_count: z.number().int().min(0).max(10).default(3),
      timeout_ms: z.number().int().min(1000).max(60000).default(10000),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: webhook, error } = await context.supabase
      .from("webhooks")
      .insert({
        user_id: context.userId,
        name: data.name,
        url: data.url,
        http_method: data.http_method,
        headers: data.headers,
        auth_token: data.auth_token ?? null,
        events: data.events,
        retry_count: data.retry_count,
        timeout_ms: data.timeout_ms,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return webhook;
  });

export const updateWebhook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      id: z.string().uuid(),
      name: z.string().min(1).max(200).optional(),
      url: z.string().url().max(2000).optional(),
      http_method: z.enum(['GET','POST','PUT','PATCH','DELETE']).optional(),
      headers: z.record(z.string(), z.string()).optional(),
      auth_token: z.string().max(2000).nullable().optional(),
      events: z.array(z.string()).optional(),
      is_active: z.boolean().optional(),
      retry_count: z.number().int().min(0).max(10).optional(),
      timeout_ms: z.number().int().min(1000).max(60000).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const update: Record<string, unknown> = {};
    if (data.name !== undefined) update.name = data.name;
    if (data.url !== undefined) update.url = data.url;
    if (data.http_method !== undefined) update.http_method = data.http_method;
    if (data.headers !== undefined) update.headers = data.headers;
    if (data.auth_token !== undefined) update.auth_token = data.auth_token;
    if (data.events !== undefined) update.events = data.events;
    if (data.is_active !== undefined) update.is_active = data.is_active;
    if (data.retry_count !== undefined) update.retry_count = data.retry_count;
    if (data.timeout_ms !== undefined) update.timeout_ms = data.timeout_ms;
    const { error } = await context.supabase
      .from("webhooks")
      .update(update as never)
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteWebhook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("webhooks")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getWebhookLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ webhook_id: z.string().uuid(), limit: z.number().int().min(1).max(50).default(20) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: logs, error } = await context.supabase
      .from("webhook_logs")
      .select("*")
      .eq("webhook_id", data.webhook_id)
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (error) throw new Error(error.message);
    return logs ?? [];
  });

export const testWebhook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      url: z.string().url(),
      http_method: z.enum(['GET','POST','PUT','PATCH','DELETE']).default('POST'),
      headers: z.record(z.string(), z.string()).default({}),
      body: z.record(z.string(), z.unknown()).default({}),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const start = Date.now();
    try {
      const response = await fetch(data.url, {
        method: data.http_method,
        headers: { 'Content-Type': 'application/json', ...data.headers },
        body: data.http_method !== 'GET' ? JSON.stringify(data.body) : undefined,
      });
      const responseBody = await response.text().catch(() => '');
      return {
        success: response.ok,
        status: response.status,
        body: responseBody.slice(0, 2000),
        duration_ms: Date.now() - start,
      };
    } catch (err) {
      return { success: false, error: (err as Error).message, duration_ms: Date.now() - start };
    }
  });
