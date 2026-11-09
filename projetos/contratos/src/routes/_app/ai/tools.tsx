import { createFileRoute } from "@tanstack/react-router";
import { AIToolsPage } from "@/features/ai/ui/ai-tools";

export const Route = createFileRoute("/_app/ai/tools")({
  component: AIToolsPage,
});
