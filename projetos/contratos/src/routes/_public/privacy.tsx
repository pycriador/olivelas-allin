import { createFileRoute } from "@tanstack/react-router";
import { PrivacyPage } from "@/features/landing/ui/privacy-page";

export const Route = createFileRoute("/_public/privacy")({
  component: PrivacyPage,
});
