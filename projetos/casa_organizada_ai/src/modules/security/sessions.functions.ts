import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const listUserSessions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("user_sessions")
      .select("*")
      .eq("user_id", context.userId)
      .order("last_active_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const revokeSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("user_sessions")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .neq("is_current", true);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const revokeAllSessions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase
      .from("user_sessions")
      .delete()
      .eq("user_id", context.userId)
      .neq("is_current", true);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
