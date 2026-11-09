import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import { runMetadataSeeds } from "@/modules/metadata/seeds";

export const Route = createFileRoute("/_app/admin/metadata")({
  component: MetadataRoute,
});

function MetadataRoute() {
  useEffect(() => { runMetadataSeeds(); }, []);

  return <Outlet />;
}
