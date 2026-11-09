import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/customers")({
  beforeLoad: () => {
    throw redirect({ to: "/service-orders/customers/list" });
  },
});
