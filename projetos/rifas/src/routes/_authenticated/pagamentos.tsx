import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/pagamentos")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/pagamentos" });
  },
  component: () => null,
});
