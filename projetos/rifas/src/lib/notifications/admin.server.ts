import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getRecentNotificationLogs } from "./service";

async function assertGlobalAdmin(userId: string): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "GLOBAL_ADMIN")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Forbidden: apenas GLOBAL_ADMIN");
}

export const listNotificationLogsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertGlobalAdmin(context.userId);
    return {
      logs: getRecentNotificationLogs(40),
      providers: {
        emailResend: Boolean(process.env["RESEND_API_KEY"]),
        emailFrom: process.env["EMAIL_FROM"] ?? null,
        whatsappApi: Boolean(process.env["WHATSAPP_API_URL"] && process.env["WHATSAPP_API_TOKEN"]),
      },
    };
  });
