import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { DEFAULT_MODEL } from "@/modules/ai/provider";

export const getAiSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("ai_settings")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (
      data ?? {
        user_id: context.userId,
        model: DEFAULT_MODEL,
        temperature: 0.7,
        language: "pt-BR",
        system_prompt: null,
        memory_enabled: true,
        max_history: 50,
      }
    );
  });

export const saveAiSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        model: z.string().min(1).max(100),
        temperature: z.number().min(0).max(2),
        language: z.string().min(2).max(10),
        system_prompt: z.string().max(4000).nullable().optional(),
        memory_enabled: z.boolean(),
        max_history: z.number().int().min(4).max(200),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("ai_settings").upsert({
      user_id: context.userId,
      ...data,
      system_prompt: data.system_prompt ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });