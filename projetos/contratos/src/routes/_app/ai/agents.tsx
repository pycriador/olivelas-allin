import { createFileRoute } from "@tanstack/react-router";
import { AIAgentsPage } from "@/features/ai/ui/ai-agents";

export const Route = createFileRoute("/_app/ai/agents")({
  component: AIAgentsPage,
});
