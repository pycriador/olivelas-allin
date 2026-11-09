import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/communication/")({
  beforeLoad: () => {
    throw redirect({ to: "/communication/dashboard" });
  },
});
