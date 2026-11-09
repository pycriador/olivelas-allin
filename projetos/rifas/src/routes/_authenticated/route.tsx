import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useRouterState } from "@tanstack/react-router";

import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/layout/app-shell";
import { AdminLoadingScreen } from "@/components/admin/loading-screen";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });

    const { data: profile } = await supabase
      .from("profiles")
      .select("status")
      .eq("id", data.user.id)
      .maybeSingle();

    if (!profile) throw redirect({ to: "/auth" });

    const status = profile.status as string;
    if (status !== "ACTIVE") {
      if (status === "SUSPENDED") {
        throw redirect({ to: "/auth", search: { reason: "suspended" } });
      }
      if (status === "INACTIVE") {
        throw redirect({ to: "/auth", search: { reason: "inactive" } });
      }
      throw redirect({ to: "/auth", search: { reason: "pending" } });
    }

    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { location, isLoading } = useRouterState({
    select: (s) => ({ location: s.location, isLoading: s.isLoading }),
  });
  const pathname = location.pathname;
  const isEnteringAdmin = pathname.startsWith("/admin");

  if (isEnteringAdmin) {
    if (isLoading) return <AdminLoadingScreen />;
    return <Outlet />;
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
