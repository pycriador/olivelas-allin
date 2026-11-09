import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppLayout } from "@/layouts/AppLayout";
import { ProtectedRoute } from "@/components/protected-route";

export const Route = createFileRoute("/_app")({
  component: AppGate,
});

function AppGate() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <Outlet />
      </AppLayout>
    </ProtectedRoute>
  );
}
