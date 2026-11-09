import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/portal/")({
  component: () => <Navigate to="/portal/home" />,
});
