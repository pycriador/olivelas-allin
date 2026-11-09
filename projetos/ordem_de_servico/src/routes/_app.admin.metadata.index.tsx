import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/admin/metadata/")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/metadata/entities" });
  },
});
