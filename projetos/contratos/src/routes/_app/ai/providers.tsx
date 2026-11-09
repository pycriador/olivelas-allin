import { createFileRoute } from "@tanstack/react-router";
import { AIProvidersPage } from "@/features/ai/ui/ai-providers";

export const Route = createFileRoute("/_app/ai/providers")({
  component: AIProvidersPage,
});
