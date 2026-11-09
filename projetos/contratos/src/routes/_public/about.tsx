import { createFileRoute } from "@tanstack/react-router";
import { AboutPage } from "@/features/landing/ui/about-page";

export const Route = createFileRoute("/_public/about")({
  component: AboutPage,
});
