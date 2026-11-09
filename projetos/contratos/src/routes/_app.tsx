import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppLayout } from "@/features/dashboard/ui/app-layout";

export const Route = createFileRoute("/_app")({
  component: AppRouteComponent,
});

function AppRouteComponent() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}
