/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { authByToken, isApiTable, jsonResponse } from "@/server/api-auth.server";

export const Route = createFileRoute("/api/v1/$")({
  server: {
    handlers: {
      OPTIONS: async () => jsonResponse({}, 204),
      GET: async ({ request, params }) => handle("GET", request, params._splat),
      POST: async ({ request, params }) => handle("POST", request, params._splat),
      PATCH: async ({ request, params }) => handle("PATCH", request, params._splat),
      DELETE: async ({ request, params }) => handle("DELETE", request, params._splat),
    },
  },
});

async function handle(method: string, request: Request, splat: string | undefined) {
  const auth = await authByToken(request.headers.get("authorization"));
  if (!auth.ok) return jsonResponse({ error: auth.error }, 401);

  const parts = (splat ?? "").split("/").filter(Boolean);
  const [table, id] = parts;
  if (!table || !isApiTable(table)) return jsonResponse({ error: "Unknown resource" }, 404);

  const url = new URL(request.url);
  const userId = auth.userId;

  try {
    if (method === "GET" && !id) {
      const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 500);
      const offset = Number(url.searchParams.get("offset") ?? 0);
      let q = (supabaseAdmin.from as any)(table).select("*", { count: "exact" })
        .eq("user_id", userId)
        .range(offset, offset + limit - 1)
        .order("created_at", { ascending: false });
      // simple equality filters from query string (skip pagination keys)
      for (const [k, v] of url.searchParams.entries()) {
        if (k === "limit" || k === "offset") continue;
        q = q.eq(k, v);
      }
      const { data, error, count } = await q;
      if (error) return jsonResponse({ error: error.message }, 400);
      return jsonResponse({ data, count, limit, offset });
    }

    if (method === "GET" && id) {
      const { data, error } = await (supabaseAdmin.from as any)(table).select("*").eq("user_id", userId).eq("id", id).maybeSingle();
      if (error) return jsonResponse({ error: error.message }, 400);
      if (!data) return jsonResponse({ error: "Not found" }, 404);
      return jsonResponse({ data });
    }

    if (method === "POST") {
      const body = await request.json().catch(() => null);
      if (!body || typeof body !== "object") return jsonResponse({ error: "Invalid JSON body" }, 400);
      const payload = { ...(body as Record<string, unknown>), user_id: userId };
      delete (payload as { id?: unknown }).id;
      const { data, error } = await (supabaseAdmin.from as any)(table).insert(payload).select().single();
      if (error) return jsonResponse({ error: error.message }, 400);
      return jsonResponse({ data }, 201);
    }

    if (method === "PATCH" && id) {
      const body = await request.json().catch(() => null);
      if (!body || typeof body !== "object") return jsonResponse({ error: "Invalid JSON body" }, 400);
      const patch = { ...(body as Record<string, unknown>) };
      delete (patch as { user_id?: unknown }).user_id;
      delete (patch as { id?: unknown }).id;
      const { data, error } = await (supabaseAdmin.from as any)(table).update(patch).eq("user_id", userId).eq("id", id).select().single();
      if (error) return jsonResponse({ error: error.message }, 400);
      if (!data) return jsonResponse({ error: "Not found" }, 404);
      return jsonResponse({ data });
    }

    if (method === "DELETE" && id) {
      const { error } = await (supabaseAdmin.from as any)(table).delete().eq("user_id", userId).eq("id", id);
      if (error) return jsonResponse({ error: error.message }, 400);
      return jsonResponse({ ok: true });
    }

    return jsonResponse({ error: "Method not allowed for this path" }, 405);
  } catch (e) {
    return jsonResponse({ error: (e as Error).message }, 500);
  }
}
