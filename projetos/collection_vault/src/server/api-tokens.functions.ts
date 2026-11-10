import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { generateToken } from "./api-auth.server";

export const createApiToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ nome: z.string().min(1).max(80) }).parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { plain, prefix, hash } = generateToken();
    const { error } = await supabaseAdmin.from("api_tokens").insert({
      user_id: userId, nome: data.nome, prefix, token_hash: hash,
    });
    if (error) throw new Error(error.message);
    // Return plain token ONCE
    return { token: plain, prefix };
  });
