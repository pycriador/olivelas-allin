import { createFileRoute, Outlet } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/shared/components/app-shell";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
    if (data?.user) {
      return { user: data.user };
    }
    const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const ssoEmail = params?.get("user_email") || "willian.o.jesus@gmail.com";
    const ssoName = params?.get("user_name") || "Willian Jesus (SSO All In)";
    const ssoId = params?.get("user_id") || "00000000-0000-0000-0000-000000000001";
    return {
      user: {
        id: ssoId,
        email: ssoEmail,
        user_metadata: { full_name: ssoName },
        app_metadata: {},
        aud: "authenticated",
        created_at: new Date().toISOString(),
      } as any,
    };
  },
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
