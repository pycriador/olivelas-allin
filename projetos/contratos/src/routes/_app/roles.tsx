import { createFileRoute } from "@tanstack/react-router";
import { RolesPage } from "@/features/iam/ui/roles-page";

export const Route = createFileRoute("/_app/roles")({
  component: RolesPage,
});
