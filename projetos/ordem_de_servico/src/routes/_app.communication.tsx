import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/_app/communication")({
  head: () => ({ meta: [{ title: "Communication Platform — ServiceForge" }] }),
  component: CommunicationRoute,
});

function CommunicationRoute() {

  return <Outlet />;
}
