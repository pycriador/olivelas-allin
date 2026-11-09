import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/shared/components/placeholder-page";

export const Route = createFileRoute("/_authenticated/usuarios")({
  component: () => <PlaceholderPage titleKey="nav.users" />,
});
