import { createFileRoute } from "@tanstack/react-router";
import { TermsPage } from "@/features/landing/ui/terms-page";

export const Route = createFileRoute("/_public/terms")({
  component: TermsPage,
});
