import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/_app/records")({
  component: RecordsRoute,
});

function RecordsRoute() {

  return <Outlet />;
}
