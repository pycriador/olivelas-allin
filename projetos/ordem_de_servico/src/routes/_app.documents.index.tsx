import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/documents/")({
  beforeLoad: () => {
    throw redirect({ to: "/documents/templates" });
  },
});
