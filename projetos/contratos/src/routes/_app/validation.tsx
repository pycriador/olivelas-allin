import { createFileRoute } from "@tanstack/react-router";
import { ValidationPage } from "@/features/validation/ui/validation-page";

export const Route = createFileRoute("/_app/validation")({
  component: ValidationPage,
});
