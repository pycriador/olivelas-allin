import { createFileRoute } from "@tanstack/react-router";
import { ConnectorsPage } from "@/features/connectors/ui/connectors-page";

export const Route = createFileRoute("/_app/connectors")({
  component: ConnectorsPage,
});
