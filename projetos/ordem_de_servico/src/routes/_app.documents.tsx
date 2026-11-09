import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/_app/documents")({
  component: DocumentsRoute,
});

function DocumentsRoute() {

  return <Outlet />;
}
