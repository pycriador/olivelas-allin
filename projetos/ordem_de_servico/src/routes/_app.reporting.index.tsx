import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/reporting/")({
  beforeLoad: () => { throw redirect({ to: "/reporting/dashboard" }); },
});
