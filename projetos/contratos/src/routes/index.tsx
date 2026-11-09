import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/features/landing/ui/landing-page";

export const Route = createFileRoute("/")({
  component: LandingPage,
});
