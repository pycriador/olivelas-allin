import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_public")({
  component: PublicGroup,
});

function PublicGroup() {
  return <Outlet />;
}
