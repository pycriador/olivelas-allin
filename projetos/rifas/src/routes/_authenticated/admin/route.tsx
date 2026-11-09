import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ForbiddenState } from "@/components/common/status-states";
import { AdminLoadingScreen } from "@/components/admin/loading-screen";
import { AdminLayout } from "@/components/admin/admin-layout";
import { useAuth } from "@/contexts/auth-context";

const ALLOWED_ADMIN_ROLES = ["GLOBAL_ADMIN", "ADMIN"] as const;

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminRouteGuard,
});

function AdminRouteGuard() {
  const { role, isProfileLoading } = useAuth();

  if (isProfileLoading) return <AdminLoadingScreen />;

  if (!role || !(ALLOWED_ADMIN_ROLES as readonly string[]).includes(role)) {
    return <ForbiddenState />;
  }

  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
}
