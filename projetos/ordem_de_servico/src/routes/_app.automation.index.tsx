import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/automation/")({
  loader: () => {
    throw redirect({ to: "/automation/designer" });
  },
});
