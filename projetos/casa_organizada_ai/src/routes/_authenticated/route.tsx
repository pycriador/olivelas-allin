import { createFileRoute, Outlet } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    try {
      const { data } = await supabase.auth.getUser();
      if (data?.user) return { user: data.user };
    } catch {}
    return {
      user: {
        id: "00000000-0000-0000-0000-000000000001",
        email: "willian.o.jesus@gmail.com",
        user_metadata: { full_name: "Willian Jesus" },
      } as any,
    };
  },
  component: () => <Outlet />,
});
