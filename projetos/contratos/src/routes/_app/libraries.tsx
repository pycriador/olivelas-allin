import { createFileRoute } from "@tanstack/react-router";
import { LibrariesPage } from "@/features/libraries/ui/libraries-page";

export const Route = createFileRoute("/_app/libraries")({
  component: LibrariesPage,
});
