import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/events/")({
  beforeLoad: () => {
    throw redirect({ to: "/events/monitor" });
  },
});
