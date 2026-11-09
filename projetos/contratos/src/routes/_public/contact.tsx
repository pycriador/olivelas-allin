import { createFileRoute } from "@tanstack/react-router";
import { ContactPage } from "@/features/landing/ui/contact-page";

export const Route = createFileRoute("/_public/contact")({
  component: ContactPage,
});
