import { createFileRoute } from "@tanstack/react-router";
import { ExecutionsPage } from "@/features/executions/ui/executions-page";

export const Route = createFileRoute("/_app/executions")({
  component: ExecutionsPage,
});
