// Helpers compartilhados pela API pública
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { createHash, randomBytes } from "crypto";

export const API_TABLES = [
  "empresas", "plataformas", "series", "generos", "subgeneros",
  "jogos", "itens", "colecao", "lojas", "links_compra", "cupons",
] as const;
export type ApiTable = typeof API_TABLES[number];

export function isApiTable(t: string): t is ApiTable {
  return (API_TABLES as readonly string[]).includes(t);
}

export function hashToken(plain: string) {
  return createHash("sha256").update(plain).digest("hex");
}

export function generateToken() {
  const prefix = randomBytes(4).toString("hex"); // 8 chars
  const secret = randomBytes(24).toString("base64url");
  const plain = `rv_${prefix}_${secret}`;
  return { plain, prefix, hash: hashToken(plain) };
}

export async function authByToken(authHeader: string | null) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { ok: false as const, error: "Missing Bearer token" };
  }
  const token = authHeader.slice(7).trim();
  if (!token.startsWith("rv_")) return { ok: false as const, error: "Invalid token format" };
  const hash = hashToken(token);
  const { data, error } = await supabaseAdmin
    .from("api_tokens")
    .select("id, user_id, revoked_at")
    .eq("token_hash", hash)
    .maybeSingle();
  if (error || !data) return { ok: false as const, error: "Invalid token" };
  if (data.revoked_at) return { ok: false as const, error: "Token revoked" };
  // update last_used_at (fire and forget)
  void supabaseAdmin.from("api_tokens").update({ last_used_at: new Date().toISOString() }).eq("id", data.id);
  return { ok: true as const, userId: data.user_id as string };
}

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,PATCH,DELETE,OPTIONS",
      "access-control-allow-headers": "authorization,content-type",
    },
  });
}
