import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/_app/events")({
  head: () => ({ meta: [{ title: "Core Event Bus — ServiceForge" }] }),
  component: EventsRoute,
});

function EventsRoute() {

  return <Outlet />;
}
