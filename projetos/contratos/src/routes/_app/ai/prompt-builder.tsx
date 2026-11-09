import { createFileRoute } from "@tanstack/react-router";
import { AIPromptBuilderPage } from "@/features/ai/ui/ai-prompt-builder";

export const Route = createFileRoute("/_app/ai/prompt-builder")({
  component: AIPromptBuilderPage,
});
