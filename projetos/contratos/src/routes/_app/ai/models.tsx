import { createFileRoute } from "@tanstack/react-router";
import { AIModelsPage } from "@/features/ai/ui/ai-models";

export const Route = createFileRoute("/_app/ai/models")({
  component: AIModelsPage,
});
