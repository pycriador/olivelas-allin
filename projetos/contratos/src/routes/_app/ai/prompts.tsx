import { createFileRoute } from "@tanstack/react-router";
import { AIPromptsPage } from "@/features/ai/ui/ai-prompts";

export const Route = createFileRoute("/_app/ai/prompts")({
  component: AIPromptsPage,
});
